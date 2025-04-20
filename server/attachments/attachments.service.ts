import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { randomUUID } from 'crypto';
import { writeFile, unlink, mkdir } from 'fs/promises';
import { join } from 'path';
import { existsSync } from 'fs';

const UPLOAD_DIR = join(process.cwd(), 'uploads');
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
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

@Injectable()
export class AttachmentsService {
  constructor(private prisma: PrismaService) {}

  async upload(
    resumeId: string,
    file: Express.Multer.File,
    category: string,
    description: string,
  ) {
    // Validate resume exists
    const resume = await this.prisma.resume.findUnique({ where: { id: resumeId } });
    if (!resume) throw new NotFoundException('이력서를 찾을 수 없습니다');

    // Validate file
    if (file.size > MAX_FILE_SIZE) {
      throw new Error('파일 크기는 10MB 이하여야 합니다');
    }
    if (!ALLOWED_TYPES.includes(file.mimetype)) {
      throw new Error('허용되지 않는 파일 형식입니다');
    }

    // Ensure upload dir exists
    if (!existsSync(UPLOAD_DIR)) {
      await mkdir(UPLOAD_DIR, { recursive: true });
    }

    // Save file
    const ext = file.originalname.split('.').pop() || '';
    const filename = `${randomUUID()}.${ext}`;
    await writeFile(join(UPLOAD_DIR, filename), file.buffer);

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

  async getFilePath(id: string) {
    const attachment = await this.prisma.attachment.findUnique({ where: { id } });
    if (!attachment) throw new NotFoundException('파일을 찾을 수 없습니다');
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
