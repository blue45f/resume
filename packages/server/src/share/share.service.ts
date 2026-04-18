import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { randomBytes } from 'crypto';
import * as bcrypt from 'bcryptjs';

const BCRYPT_ROUNDS = 10;

@Injectable()
export class ShareService {
  constructor(private prisma: PrismaService) {}

  async createLink(resumeId: string, options?: { expiresInHours?: number; password?: string }) {
    const resume = await this.prisma.resume.findUnique({
      where: { id: resumeId },
    });
    if (!resume) throw new NotFoundException('이력서를 찾을 수 없습니다');

    const token = randomBytes(32).toString('hex');
    const passwordHash = options?.password
      ? await bcrypt.hash(options.password, BCRYPT_ROUNDS)
      : null;
    const expiresAt = options?.expiresInHours
      ? new Date(Date.now() + options.expiresInHours * 60 * 60 * 1000)
      : null;

    const link = await this.prisma.shareLink.create({
      data: { resumeId, token, passwordHash, expiresAt },
    });

    return {
      id: link.id,
      token: link.token,
      url: `/shared/${link.token}`,
      expiresAt: link.expiresAt?.toISOString() ?? null,
      hasPassword: !!link.passwordHash,
      createdAt: link.createdAt.toISOString(),
    };
  }

  async getByToken(token: string, password?: string) {
    const link = await this.prisma.shareLink.findUnique({
      where: { token },
      include: {
        resume: {
          include: {
            personalInfo: true,
            experiences: { orderBy: { sortOrder: 'asc' } },
            educations: { orderBy: { sortOrder: 'asc' } },
            skills: { orderBy: { sortOrder: 'asc' } },
            projects: { orderBy: { sortOrder: 'asc' } },
          },
        },
      },
    });

    // Generic error message to prevent information disclosure
    if (!link) throw new ForbiddenException('공유 링크에 접근할 수 없습니다');

    if (link.expiresAt && link.expiresAt < new Date()) {
      throw new ForbiddenException('공유 링크에 접근할 수 없습니다');
    }

    if (link.passwordHash) {
      if (!password) throw new ForbiddenException('비밀번호가 필요합니다');
      const isValid = await bcrypt.compare(password, link.passwordHash);
      if (!isValid) throw new ForbiddenException('공유 링크에 접근할 수 없습니다');
    }

    return link.resume;
  }

  async getLinksForResume(resumeId: string) {
    const links = await this.prisma.shareLink.findMany({
      where: { resumeId },
      orderBy: { createdAt: 'desc' },
    });
    return links.map((l) => ({
      id: l.id,
      token: l.token,
      url: `/shared/${l.token}`,
      expiresAt: l.expiresAt?.toISOString() ?? null,
      hasPassword: !!l.passwordHash,
      isExpired: l.expiresAt ? l.expiresAt < new Date() : false,
      createdAt: l.createdAt.toISOString(),
    }));
  }

  async removeLink(id: string, userId?: string, role?: string) {
    const existing = await this.prisma.shareLink.findUnique({
      where: { id },
      include: { resume: { select: { userId: true } } },
    });
    if (!existing) throw new NotFoundException('공유 링크를 찾을 수 없습니다');

    // 소유권 검증: 이력서 소유자 또는 관리자만 삭제 가능
    const isAdmin = role === 'admin' || role === 'superadmin';
    if (!isAdmin && existing.resume?.userId && existing.resume.userId !== userId) {
      throw new ForbiddenException('이 공유 링크를 삭제할 권한이 없습니다');
    }
    await this.prisma.shareLink.delete({ where: { id } });
    return { success: true };
  }
}
