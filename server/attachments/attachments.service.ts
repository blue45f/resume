import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { randomUUID } from 'crypto';
import { writeFile, unlink, mkdir } from 'fs/promises';
import { join, resolve, extname } from 'path';
import { existsSync } from 'fs';

// Render persistent disk: /opt/render/project/src/data
// 로컬: ./uploads
const UPLOAD_DIR = process.env.NODE_ENV === 'production'
  ? join(process.cwd(), 'data', 'uploads')
  : join(process.cwd(), 'uploads');
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
const MAX_TOTAL_SIZE_PER_RESUME = 100 * 1024 * 1024; // 100MB per resume
const MAX_FILES_PER_RESUME = 20;
const ALLOWED_TYPES = [
  'application/pdf',
  'image/jpeg', 'image/png', 'image/gif', 'image/webp',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'application/vnd.ms-powerpoint',
  'application/vnd.openxmlformats-officedocument.presentationml.presentation',
  'text/plain',
];
const ALLOWED_EXTENSIONS = [
  '.pdf', '.jpg', '.jpeg', '.png', '.gif', '.webp',
  '.doc', '.docx', '.xls', '.xlsx', '.ppt', '.pptx', '.txt',
];

@Injectable()
export class AttachmentsService {
  constructor(private prisma: PrismaService) {}

  async upload(
    resumeId: string,
    file: Express.Multer.File,
    category: string,
    description: string,
  ) {
    // Validate resume exists + check cumulative limits
    const resume = await this.prisma.resume.findUnique({
      where: { id: resumeId },
      include: { attachments: { select: { size: true } } },
    });
    if (!resume) throw new NotFoundException('이력서를 찾을 수 없습니다');

    if (resume.attachments.length >= MAX_FILES_PER_RESUME) {
      throw new BadRequestException(`이력서당 최대 ${MAX_FILES_PER_RESUME}개의 파일만 업로드할 수 있습니다`);
    }
    const totalSize = resume.attachments.reduce((sum, a) => sum + a.size, 0);
    if (totalSize + file.size > MAX_TOTAL_SIZE_PER_RESUME) {
      throw new BadRequestException(`이력서의 총 파일 크기가 100MB를 초과할 수 없습니다 (현재: ${Math.round(totalSize / 1024 / 1024)}MB)`);
    }

    // Validate file
    if (file.size > MAX_FILE_SIZE) {
      throw new BadRequestException('파일 크기는 10MB 이하여야 합니다');
    }
    if (!ALLOWED_TYPES.includes(file.mimetype)) {
      throw new BadRequestException('허용되지 않는 파일 형식입니다');
    }

    // 확장자 이중 검증 (mime type spoofing 방지)
    const ext = extname(file.originalname).toLowerCase();
    if (!ALLOWED_EXTENSIONS.includes(ext)) {
      throw new BadRequestException('허용되지 않는 파일 확장자입니다');
    }

    // Ensure upload dir exists
    if (!existsSync(UPLOAD_DIR)) {
      await mkdir(UPLOAD_DIR, { recursive: true });
    }

    // Save file with safe filename (UUID + validated extension)
    const filename = `${randomUUID()}${ext}`;
    const filePath = resolve(UPLOAD_DIR, filename);
    // Path traversal 방지
    if (!filePath.startsWith(resolve(UPLOAD_DIR))) {
      throw new BadRequestException('잘못된 파일 경로입니다');
    }
    await writeFile(filePath, file.buffer);

    // Save to DB
    const attachment = await this.prisma.attachment.create({
      data: {
        resumeId,
        filename,
        originalName: file.originalname,
        mimeType: file.mimetype,
        size: file.size,
        category: category || 'document',
        description: description || '',
      },
    });

    return this.format(attachment);
  }

  async findAll(resumeId: string) {
    const attachments = await this.prisma.attachment.findMany({
      where: { resumeId },
      orderBy: { createdAt: 'desc' },
    });
    return attachments.map(a => this.format(a));
  }

  async getFilePath(id: string, userId?: string) {
    const attachment = await this.prisma.attachment.findUnique({
      where: { id },
      include: { resume: { select: { userId: true, visibility: true } } },
    });
    if (!attachment) throw new NotFoundException('파일을 찾을 수 없습니다');

    // 비공개 이력서 첨부파일은 소유자만 다운로드 가능
    if (attachment.resume.visibility === 'private' && attachment.resume.userId && attachment.resume.userId !== userId) {
      throw new NotFoundException('파일을 찾을 수 없습니다');
    }

    return {
      path: join(UPLOAD_DIR, attachment.filename),
      originalName: attachment.originalName,
      mimeType: attachment.mimeType,
    };
  }

  async remove(id: string) {
    const attachment = await this.prisma.attachment.findUnique({ where: { id } });
    if (!attachment) throw new NotFoundException('파일을 찾을 수 없습니다');

    // Delete file
    const filePath = join(UPLOAD_DIR, attachment.filename);
    try { await unlink(filePath); } catch { /* file may not exist */ }

    // Delete DB record
    await this.prisma.attachment.delete({ where: { id } });
    return { success: true };
  }

  private format(a: any) {
    return {
      id: a.id,
      resumeId: a.resumeId,
      originalName: a.originalName,
      mimeType: a.mimeType,
      size: a.size,
      category: a.category,
      description: a.description,
      downloadUrl: `/api/attachments/${a.id}/download`,
      createdAt: a.createdAt.toISOString(),
    };
  }
}
