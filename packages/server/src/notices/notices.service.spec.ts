import { Test, TestingModule } from '@nestjs/testing';
import { ForbiddenException, NotFoundException } from '@nestjs/common';
import { NoticesService } from './notices.service';
import { PrismaService } from '../prisma/prisma.service';

const mockPrisma: any = {
  notice: {
    findMany: jest.fn(),
    findUnique: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
    count: jest.fn(),
  },
  noticeHistory: {
    create: jest.fn(),
    findMany: jest.fn(),
  },
  noticeComment: {
    findUnique: jest.fn(),
    create: jest.fn(),
    delete: jest.fn(),
  },
};

describe('NoticesService', () => {
  let service: NoticesService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [NoticesService, { provide: PrismaService, useValue: mockPrisma }],
    }).compile();
    service = module.get(NoticesService);
    jest.clearAllMocks();
  });

  describe('getAll', () => {
    it('타입 필터 + 페이지네이션 계산 (page=2, limit=5 → skip=5)', async () => {
      mockPrisma.notice.findMany.mockResolvedValueOnce([]);
      mockPrisma.notice.count.mockResolvedValueOnce(12);
      const res = await service.getAll('GENERAL', 2, 5);
      expect(mockPrisma.notice.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { type: 'GENERAL' },
          skip: 5,
          take: 5,
        }),
      );
      expect(res.totalPages).toBe(3);
    });

    it('isPinned 우선 정렬', async () => {
      mockPrisma.notice.findMany.mockResolvedValueOnce([]);
      mockPrisma.notice.count.mockResolvedValueOnce(0);
      await service.getAll();
      expect(mockPrisma.notice.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          orderBy: [{ isPinned: 'desc' }, { createdAt: 'desc' }],
        }),
      );
    });
  });

  describe('getPopup', () => {
    it('isPopup=true + 유효기간 조건 쿼리', async () => {
      mockPrisma.notice.findMany.mockResolvedValueOnce([{ id: 'n1' }]);
      await service.getPopup();
      const call = mockPrisma.notice.findMany.mock.calls[0][0];
      expect(call.where.isPopup).toBe(true);
      expect(call.take).toBe(3);
    });
  });

  describe('getOne', () => {
    it('존재하지 않으면 NotFound', async () => {
      mockPrisma.notice.findUnique.mockResolvedValueOnce(null);
      await expect(service.getOne('n1')).rejects.toThrow(NotFoundException);
    });

    it('조회 시 viewCount 증가', async () => {
      mockPrisma.notice.findUnique.mockResolvedValueOnce({ id: 'n1', title: 'T' });
      await service.getOne('n1');
      expect(mockPrisma.notice.update).toHaveBeenCalledWith({
        where: { id: 'n1' },
        data: { viewCount: { increment: 1 } },
      });
    });
  });

  describe('update', () => {
    it('존재하지 않으면 NotFound', async () => {
      mockPrisma.notice.findUnique.mockResolvedValueOnce(null);
      await expect(service.update('n1', { title: 'new' })).rejects.toThrow(NotFoundException);
    });

    it('editorId 있으면 이력 먼저 저장', async () => {
      mockPrisma.notice.findUnique.mockResolvedValueOnce({
        id: 'n1',
        title: 'old',
        content: 'oldC',
        type: 'GENERAL',
      });
      mockPrisma.notice.update.mockResolvedValueOnce({ id: 'n1' });
      await service.update('n1', { title: 'new' }, 'editor-1', '오타 수정');
      expect(mockPrisma.noticeHistory.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          noticeId: 'n1',
          editorId: 'editor-1',
          prevTitle: 'old',
          prevContent: 'oldC',
          prevType: 'GENERAL',
          reason: '오타 수정',
        }),
      });
    });

    it('editorId 없으면 이력 저장 안 함', async () => {
      mockPrisma.notice.findUnique.mockResolvedValueOnce({
        id: 'n1',
        title: 'old',
        content: 'oldC',
        type: 'GENERAL',
      });
      mockPrisma.notice.update.mockResolvedValueOnce({ id: 'n1' });
      await service.update('n1', { title: 'new' });
      expect(mockPrisma.noticeHistory.create).not.toHaveBeenCalled();
    });
  });

  describe('addComment', () => {
    it('공지 없으면 NotFound', async () => {
      mockPrisma.notice.findUnique.mockResolvedValueOnce(null);
      await expect(service.addComment('n1', 'u1', 'hi')).rejects.toThrow(NotFoundException);
    });

    it('allowComments=false → Forbidden', async () => {
      mockPrisma.notice.findUnique.mockResolvedValueOnce({ id: 'n1', allowComments: false });
      await expect(service.addComment('n1', 'u1', 'hi')).rejects.toThrow(ForbiddenException);
    });

    it('허용된 공지 + 로그인 유저 → 생성', async () => {
      mockPrisma.notice.findUnique.mockResolvedValueOnce({ id: 'n1', allowComments: true });
      mockPrisma.noticeComment.create.mockResolvedValueOnce({ id: 'c1' });
      const res = await service.addComment('n1', 'u1', '좋아요');
      expect(res).toEqual({ id: 'c1' });
      expect(mockPrisma.noticeComment.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: { noticeId: 'n1', userId: 'u1', content: '좋아요' },
        }),
      );
    });
  });

  describe('deleteComment', () => {
    it('댓글 없으면 NotFound', async () => {
      mockPrisma.noticeComment.findUnique.mockResolvedValueOnce(null);
      await expect(service.deleteComment('c1', 'u1', 'user')).rejects.toThrow(NotFoundException);
    });

    it('타인 댓글 + 일반 유저 → Forbidden', async () => {
      mockPrisma.noticeComment.findUnique.mockResolvedValueOnce({ id: 'c1', userId: 'other' });
      await expect(service.deleteComment('c1', 'u1', 'user')).rejects.toThrow(ForbiddenException);
    });

    it('admin 역할은 타인 댓글 삭제 가능', async () => {
      mockPrisma.noticeComment.findUnique.mockResolvedValueOnce({ id: 'c1', userId: 'other' });
      mockPrisma.noticeComment.delete.mockResolvedValueOnce({});
      await expect(service.deleteComment('c1', 'admin-u', 'admin')).resolves.toBeDefined();
    });

    it('superadmin 역할도 타인 댓글 삭제 가능', async () => {
      mockPrisma.noticeComment.findUnique.mockResolvedValueOnce({ id: 'c1', userId: 'other' });
      mockPrisma.noticeComment.delete.mockResolvedValueOnce({});
      await expect(service.deleteComment('c1', 'su', 'superadmin')).resolves.toBeDefined();
    });

    it('작성자 본인은 삭제 가능', async () => {
      mockPrisma.noticeComment.findUnique.mockResolvedValueOnce({ id: 'c1', userId: 'u1' });
      mockPrisma.noticeComment.delete.mockResolvedValueOnce({});
      await expect(service.deleteComment('c1', 'u1', 'user')).resolves.toBeDefined();
    });
  });

  describe('toggleComments', () => {
    it('allowComments 값 업데이트', async () => {
      await service.toggleComments('n1', false);
      expect(mockPrisma.notice.update).toHaveBeenCalledWith({
        where: { id: 'n1' },
        data: { allowComments: false },
      });
    });
  });
});
