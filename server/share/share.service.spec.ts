import { Test, TestingModule } from '@nestjs/testing';
import { ShareService } from './share.service';
import { PrismaService } from '../prisma/prisma.service';
import { NotFoundException, ForbiddenException } from '@nestjs/common';

const mockPrisma = {
  resume: { findUnique: jest.fn() },
  shareLink: {
    create: jest.fn(),
    findUnique: jest.fn(),
    findMany: jest.fn(),
    delete: jest.fn(),
  },
};

describe('ShareService', () => {
  let service: ShareService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ShareService,
        { provide: PrismaService, useValue: mockPrisma },
      ],
    }).compile();
    service = module.get(ShareService);
    jest.clearAllMocks();
  });

  describe('createLink', () => {
    it('존재하지 않는 이력서 → NotFoundException', async () => {
      mockPrisma.resume.findUnique.mockResolvedValue(null);
      await expect(service.createLink('fake')).rejects.toThrow(NotFoundException);
    });

    it('토큰과 URL 생성', async () => {
      mockPrisma.resume.findUnique.mockResolvedValue({ id: 'r1' });
      mockPrisma.shareLink.create.mockResolvedValue({
        id: 'sl1', token: 'abc123', passwordHash: null,
        expiresAt: null, createdAt: new Date(),
      });
      const result = await service.createLink('r1');
      expect(result.token).toBe('abc123');
      expect(result.url).toBe('/shared/abc123');
      expect(result.hasPassword).toBe(false);
    });
  });

  describe('getByToken', () => {
    it('존재하지 않는 토큰 → ForbiddenException (정보 미노출)', async () => {
      mockPrisma.shareLink.findUnique.mockResolvedValue(null);
      await expect(service.getByToken('fake')).rejects.toThrow(ForbiddenException);
    });

    it('만료된 링크 → ForbiddenException', async () => {
      mockPrisma.shareLink.findUnique.mockResolvedValue({
        token: 'abc',
        expiresAt: new Date(Date.now() - 1000),
        passwordHash: null,
        resume: { id: 'r1' },
      });
      await expect(service.getByToken('abc')).rejects.toThrow(ForbiddenException);
    });

    it('비밀번호 보호 - 비밀번호 미제공 → ForbiddenException', async () => {
      mockPrisma.shareLink.findUnique.mockResolvedValue({
        token: 'abc',
        expiresAt: null,
        passwordHash: '$2a$10$somehash',
        resume: { id: 'r1' },
      });
      await expect(service.getByToken('abc')).rejects.toThrow(ForbiddenException);
    });
  });

  describe('removeLink', () => {
    it('존재하지 않는 링크 → NotFoundException', async () => {
      mockPrisma.shareLink.findUnique.mockResolvedValue(null);
      await expect(service.removeLink('fake')).rejects.toThrow(NotFoundException);
    });

    it('삭제 성공', async () => {
      mockPrisma.shareLink.findUnique.mockResolvedValue({ id: 'sl1' });
      mockPrisma.shareLink.delete.mockResolvedValue({});
      const result = await service.removeLink('sl1');
      expect(result).toEqual({ success: true });
    });
  });
});
