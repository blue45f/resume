import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { ConfigService } from '@nestjs/config';
import { randomUUID } from 'crypto';
import { extname } from 'path';
import { v2 as cloudinary } from 'cloudinary';

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
const MAX_TOTAL_SIZE_PER_RESUME = 100 * 1024 * 1024; // 100MB
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
  private useCloudinary: boolean;

  constructor(
    private prisma: PrismaService,
    private config: ConfigService,
  ) {
    // Cloudinary 설정 (환경변수가 있으면 사용)
    const cloudName = this.config.get('CLOUDINARY_CLOUD_NAME');
    const apiKey = this.config.get('CLOUDINARY_API_KEY');
    const apiSecret = this.config.get('CLOUDINARY_API_SECRET');

    this.useCloudinary = !!(cloudName && apiKey && apiSecret);

    if (this.useCloudinary) {
      cloudinary.config({
        cloud_name: cloudName,
        api_key: apiKey,
        api_secret: apiSecret,
        secure: true,
      });
    }
  }

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
      throw new BadRequestException('이력서의 총 파일 크기가 100MB를 초과할 수 없습니다');
    }

    if (file.size > MAX_FILE_SIZE) {
      throw new BadRequestException('파일 크기는 10MB 이하여야 합니다');
    }
    if (!ALLOWED_TYPES.includes(file.mimetype)) {
      throw new BadRequestException('허용되지 않는 파일 형식입니다');
    }

    const ext = extname(file.originalname).toLowerCase();
    if (!ALLOWED_EXTENSIONS.includes(ext)) {
      throw new BadRequestException('허용되지 않는 파일 확장자입니다');
    }

    // Multer는 파일명을 Latin1로 인코딩 → UTF-8로 복원
    const originalName = Buffer.from(file.originalname, 'latin1').toString('utf8');
    const filename = `${randomUUID()}${ext}`;
    let data: string | null = null;
    let cloudinaryUrl: string | null = null;

    if (this.useCloudinary) {
      // Cloudinary에 업로드 (raw 타입으로 문서도 지원)
      const result = await new Promise<any>((resolve, reject) => {
        const stream = cloudinary.uploader.upload_stream(
          {
            resource_type: 'raw',
            folder: `resume-attachments/${resumeId}`,
            public_id: filename,
          },
          (error, result) => {
            if (error) reject(error);
            else resolve(result);
          },
        );
        stream.end(file.buffer);
      });
      cloudinaryUrl = result.secure_url;
    } else {
      // Cloudinary 미설정: DB base64 저장 (폴백)
      data = file.buffer.toString('base64');
    }

    const attachment = await this.prisma.attachment.create({
      data: {
        resumeId,
        filename: cloudinaryUrl || filename,
        originalName,
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

    // Cloudinary URL인 경우 리다이렉트
    if (attachment.filename.startsWith('http')) {
      return { redirectUrl: attachment.filename, originalName: attachment.originalName, mimeType: attachment.mimeType };
    }

    // DB base64 데이터
    return {
      data: attachment.data ? Buffer.from(attachment.data, 'base64') : null,
      originalName: attachment.originalName,
      mimeType: attachment.mimeType,
    };
  }

  async remove(id: string) {
    const attachment = await this.prisma.attachment.findUnique({ where: { id } });
    if (!attachment) throw new NotFoundException('파일을 찾을 수 없습니다');

    await this.deleteFromCloudinary(attachment.filename);
    await this.prisma.attachment.delete({ where: { id } });
    return { success: true };
  }

  /** 이력서 삭제 시 모든 첨부파일을 Cloudinary에서도 삭제 */
  async removeAllByResume(resumeId: string) {
    if (!this.useCloudinary) return;
    const attachments = await this.prisma.attachment.findMany({
      where: { resumeId },
      select: { filename: true },
    });
    for (const att of attachments) {
      await this.deleteFromCloudinary(att.filename);
    }
  }

  private async deleteFromCloudinary(filename: string) {
    if (!this.useCloudinary || !filename.startsWith('http')) return;
    try {
      const parts = filename.split('/upload/');
      if (parts[1]) {
        const publicId = parts[1].replace(/^v\d+\//, '').replace(/\.[^.]+$/, '');
        const result = await cloudinary.uploader.destroy(publicId, { resource_type: 'raw' });
        if (result.result !== 'ok') {
          // 확장자 포함해서 재시도
          const publicIdWithExt = parts[1].replace(/^v\d+\//, '');
          await cloudinary.uploader.destroy(publicIdWithExt, { resource_type: 'raw' });
        }
      }
    } catch { /* 로깅만 하고 계속 진행 */ }
  }

  private format(a: any) {
    const isCloudinary = a.filename?.startsWith('http');
    return {
      id: a.id,
      resumeId: a.resumeId,
      originalName: a.originalName,
      mimeType: a.mimeType,
      size: a.size,
      category: a.category,
      description: a.description,
      downloadUrl: isCloudinary ? a.filename : `/api/attachments/${a.id}/download`,
      createdAt: a.createdAt?.toISOString?.() || a.createdAt,
    };
  }
}
