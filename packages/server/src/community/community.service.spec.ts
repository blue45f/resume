import { Test, TestingModule } from '@nestjs/testing';
import { CommunityService } from './community.service';
import { PrismaService } from '../prisma/prisma.service';
import { NotificationsService } from '../notifications/notifications.service';
import { ForbiddenWordsService } from '../forbidden-words/forbidden-words.service';
import { SystemConfigService } from '../system-config/system-config.service';

const mockSystemConfig = {
  getReportThreshold: jest.fn().mockResolvedValue(5),
  assertFeatureEnabled: jest.fn().mockResolvedValue(undefined),
};

const mockPrisma = {
  communityPost: {
    findMany: jest.fn(),
    findUnique: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
    count: jest.fn(),
  },
  communityComment: {
    findMany: jest.fn(),
    create: jest.fn(),
    findUnique: jest.fn(),
    delete: jest.fn(),
  },
  communityLike: {
    findUnique: jest.fn(),
    create: jest.fn(),
    delete: jest.fn(),
  },
};

const mockNotifications = { create: jest.fn().mockResolvedValue({}) };
const mockForbiddenWords = { validateOrThrow: jest.fn().mockResolvedValue({ blocked: false }) };

describe('CommunityService', () => {
  let service: CommunityService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CommunityService,
        { provide: PrismaService, useValue: mockPrisma },
        { provide: NotificationsService, useValue: mockNotifications },
        { provide: ForbiddenWordsService, useValue: mockForbiddenWords },
        { provide: SystemConfigService, useValue: mockSystemConfig },
      ],
    }).compile();
    service = module.get(CommunityService);
    jest.clearAllMocks();
    // 기본: update/findUnique 가 항상 Promise 반환하도록 보장 (.catch chain 등 호출 안전)
    mockPrisma.communityPost.update.mockResolvedValue({});
    mockPrisma.communityLike.findUnique.mockResolvedValue(null);
  });

  describe('getPosts', () => {
    it('기본 조회 (최신순)', async () => {
      mockPrisma.communityPost.findMany.mockResolvedValue([]);
      mockPrisma.communityPost.count.mockResolvedValue(0);
      const result = await service.getPosts();
      expect(result.items).toEqual([]);
      expect(result.total).toBe(0);
    });

    it('카테고리 필터', async () => {
      mockPrisma.communityPost.findMany.mockResolvedValue([]);
      mockPrisma.communityPost.count.mockResolvedValue(0);
      await service.getPosts('tips');
      expect(mockPrisma.communityPost.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ where: expect.objectContaining({ category: 'tips' }) }),
      );
    });

    it('검색', async () => {
      mockPrisma.communityPost.findMany.mockResolvedValue([]);
      mockPrisma.communityPost.count.mockResolvedValue(0);
      await service.getPosts(undefined, '테스트');
      expect(mockPrisma.communityPost.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ where: expect.objectContaining({ OR: expect.any(Array) }) }),
      );
    });
  });

  // ─────────────────────────────────────────────
  // getPost — viewCount race / 404 viewCount 부풀림 (P1-6)
  // ─────────────────────────────────────────────
  describe('getPost', () => {
    it('존재하지 않는 글 → null + update 호출 안함', async () => {
      mockPrisma.communityPost.findUnique.mockResolvedValueOnce(null);
      const result = await service.getPost('ghost');
      expect(result).toBeNull();
      expect(mockPrisma.communityPost.update).not.toHaveBeenCalled();
    });

    it('본인 글 조회 → viewCount 증가 안함', async () => {
      mockPrisma.communityPost.findUnique.mockResolvedValueOnce({
        id: 'p1',
        userId: 'u1',
        viewCount: 5,
      });
      await service.getPost('p1', 'u1');
      expect(mockPrisma.communityPost.update).not.toHaveBeenCalled();
    });

    it('타인 글 첫 조회 → viewCount 1 증가', async () => {
      mockPrisma.communityPost.findUnique.mockResolvedValueOnce({
        id: 'p-first',
        userId: 'author',
        viewCount: 5,
      });
      const result = await service.getPost('p-first', 'viewer');
      expect(mockPrisma.communityPost.update).toHaveBeenCalledTimes(1);
      expect(result!.viewCount).toBe(6);
    });

    it('같은 viewer 가 5분 내 재조회 → dedup, viewCount 증가 안함', async () => {
      // 1st call — increments
      mockPrisma.communityPost.findUnique.mockResolvedValueOnce({
        id: 'p-dedup',
        userId: 'author',
        viewCount: 5,
      });
      await service.getPost('p-dedup', 'viewer');

      // 2nd call — should skip update
      mockPrisma.communityPost.findUnique.mockResolvedValueOnce({
        id: 'p-dedup',
        userId: 'author',
        viewCount: 6,
      });
      await service.getPost('p-dedup', 'viewer');
      expect(mockPrisma.communityPost.update).toHaveBeenCalledTimes(1);
    });

    it('익명(anon) 조회도 dedup 적용', async () => {
      mockPrisma.communityPost.findUnique.mockResolvedValueOnce({
        id: 'p-anon',
        userId: 'author',
        viewCount: 0,
      });
      await service.getPost('p-anon');
      mockPrisma.communityPost.findUnique.mockResolvedValueOnce({
        id: 'p-anon',
        userId: 'author',
        viewCount: 1,
      });
      await service.getPost('p-anon');
      expect(mockPrisma.communityPost.update).toHaveBeenCalledTimes(1);
    });
  });

  describe('createPost', () => {
    it('게시글 생성', async () => {
      const mockPost = {
        id: 'p1',
        title: '테스트',
        content: '내용',
        category: 'free',
        userId: 'u1',
      };
      mockPrisma.communityPost.create.mockResolvedValue(mockPost);
      const result = await service.createPost('u1', {
        title: '테스트',
        content: '내용',
        category: 'free',
      });
      expect(result.title).toBe('테스트');
      expect(mockForbiddenWords.validateOrThrow).toHaveBeenCalledWith('테스트', '내용');
    });
  });

  describe('toggleLike', () => {
    it('좋아요 추가', async () => {
      mockPrisma.communityLike.findUnique.mockResolvedValue(null);
      mockPrisma.communityLike.create.mockResolvedValue({});
      mockPrisma.communityPost.update.mockResolvedValue({});
      const result = await service.toggleLike('p1', 'u1');
      expect(result.liked).toBe(true);
    });

    it('좋아요 취소', async () => {
      mockPrisma.communityLike.findUnique.mockResolvedValue({ id: 'l1' });
      mockPrisma.communityLike.delete.mockResolvedValue({});
      mockPrisma.communityPost.update.mockResolvedValue({});
      const result = await service.toggleLike('p1', 'u1');
      expect(result.liked).toBe(false);
    });
  });

  describe('addComment', () => {
    it('댓글 추가 + 금칙어 검증', async () => {
      const mockComment = { id: 'c1', postId: 'p1', content: '댓글 내용' };
      mockPrisma.communityComment.create.mockResolvedValue(mockComment);
      mockPrisma.communityPost.findUnique.mockResolvedValue({ userId: 'u2', title: '제목' });
      const result = await service.addComment('p1', 'u1', '댓글 내용');
      expect(result.content).toBe('댓글 내용');
      expect(mockForbiddenWords.validateOrThrow).toHaveBeenCalledWith('댓글 내용');
    });
  });

  describe('deletePost', () => {
    it('작성자가 삭제', async () => {
      mockPrisma.communityPost.findUnique.mockResolvedValue({ id: 'p1', userId: 'u1' });
      mockPrisma.communityPost.delete.mockResolvedValue({});
      await service.deletePost('p1', 'u1', 'user');
      expect(mockPrisma.communityPost.delete).toHaveBeenCalled();
    });

    it('다른 사용자 → Error', async () => {
      mockPrisma.communityPost.findUnique.mockResolvedValue({ id: 'p1', userId: 'u1' });
      await expect(service.deletePost('p1', 'u2', 'user')).rejects.toThrow('Forbidden');
    });

    it('관리자는 삭제 가능', async () => {
      mockPrisma.communityPost.findUnique.mockResolvedValue({ id: 'p1', userId: 'u1' });
      mockPrisma.communityPost.delete.mockResolvedValue({});
      await service.deletePost('p1', 'u2', 'admin');
      expect(mockPrisma.communityPost.delete).toHaveBeenCalled();
    });
  });
});
