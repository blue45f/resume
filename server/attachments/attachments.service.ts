import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { randomUUID } from 'crypto';
import { extname } from 'path';

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB (DB 저장이므로 축소)
const MAX_TOTAL_SIZE_PER_RESUME = 50 * 1024 * 1024; // 50MB per resume
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
      throw new BadRequestException(`이력서의 총 파일 크기가 50MB를 초과할 수 없습니다`);
    }

    if (file.size > MAX_FILE_SIZE) {
      throw new BadRequestException('파일 크기는 5MB 이하여야 합니다');
    }
    if (!ALLOWED_TYPES.includes(file.mimetype)) {
      throw new BadRequestException('허용되지 않는 파일 형식입니다');
    }

    const ext = extname(file.originalname).toLowerCase();
    if (!ALLOWED_EXTENSIONS.includes(ext)) {
      throw new BadRequestException('허용되지 않는 파일 확장자입니다');
    }

    // DB에 base64로 저장 (Render 무료 플랜 호환)
    const data = file.buffer.toString('base64');
    const filename = `${randomUUID()}${ext}`;

    const attachment = await this.prisma.attachment.create({
      data: {
        resumeId,
        filename,
        originalName: file.originalname,
        mimeType: file.mimetype,
        size: file.size,
        data,
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
      select: {
        id: true, resumeId: true, filename: true, originalName: true,
        mimeType: true, size: true, category: true, description: true, createdAt: true,
      },
    });
    return attachments.map(a => this.format(a));
  }

  async getFileData(id: string, userId?: string) {
    const attachment = await this.prisma.attachment.findUnique({
      where: { id },
      include: { resume: { select: { userId: true, visibility: true } } },
    });
    if (!attachment) throw new NotFoundException('파일을 찾을 수 없습니다');

    if (attachment.resume.visibility === 'private' && attachment.resume.userId && attachment.resume.userId !== userId) {
      throw new NotFoundException('파일을 찾을 수 없습니다');
    }

    return {
      data: attachment.data ? Buffer.from(attachment.data, 'base64') : null,
      originalName: attachment.originalName,
      mimeType: attachment.mimeType,
    };
  }

  async remove(id: string) {
    const attachment = await this.prisma.attachment.findUnique({ where: { id } });
    if (!attachment) throw new NotFoundException('파일을 찾을 수 없습니다');

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
      createdAt: a.createdAt?.toISOString?.() || a.createdAt,
    };
  }
}
