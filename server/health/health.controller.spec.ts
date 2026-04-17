import { Test, TestingModule } from '@nestjs/testing';
import { UnauthorizedException, ForbiddenException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { HealthController } from './health.controller';
import { PrismaService } from '../prisma/prisma.service';
import { AdminStatsService } from './admin-stats.service';
import { UsageService } from './usage.service';

const mockPrisma = {
  $queryRaw: jest.fn(),
  resume: {
    count: jest.fn(),
    aggregate: jest.fn(),
  },
  user: {
    count: jest.fn(),
  },
  template: {
    count: jest.fn(),
  },
  communityPost: {
    count: jest.fn().mockResolvedValue(0),
  },
  communityComment: {
    count: jest.fn().mockResolvedValue(0),
  },
  curatedJob: {
    count: jest.fn().mockResolvedValue(0),
  },
  systemConfig: {
    findFirst: jest.fn().mockResolvedValue(null),
  },
  draft: {
    findUnique: jest.fn().mockResolvedValue(null),
    upsert: jest.fn(),
    deleteMany: jest.fn(),
  },
};

const mockConfig = {
  get: jest.fn(),
};

const mockStatsService = {
  getStats: jest.fn(),
};

const mockUsageService = {
  getUsage: jest.fn(),
};

describe('HealthController', () => {
  let controller: HealthController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [HealthController],
      providers: [
        { provide: PrismaService, useValue: mockPrisma },
        { provide: ConfigService, useValue: mockConfig },
        { provide: AdminStatsService, useValue: mockStatsService },
        { provide: UsageService, useValue: mockUsageService },
      ],
    }).compile();
    controller = module.get(HealthController);
    jest.clearAllMocks();
  });

  // ──────────────────────────────────────────────────
  // GET /api/health — 서버 상태 간단 확인
  // ──────────────────────────────────────────────────
  describe('ping (GET /health)', () => {
    it('ok 상태 + 타임스탬프 + 버전 반환', () => {
      const result = controller.ping();
      expect(result.status).toBe('ok');
      expect(result.timestamp).toBeDefined();
      expect(typeof result.timestamp).toBe('string');
      expect(result.version).toBeDefined();
    });

    it('ISO 형식의 타임스탬프 반환', () => {
      const result = controller.ping();
      // ISO 8601 형식 검증
      expect(() => new Date(result.timestamp)).not.toThrow();
      expect(new Date(result.timestamp).toISOString()).toBe(result.timestamp);
    });
  });

  // ──────────────────────────────────────────────────
  // GET /api/health/detailed — 서버 상태 상세 확인
  // ──────────────────────────────────────────────────
  describe('check (GET /health/detailed)', () => {
    it('DB 정상 → status ok, 통계 포함', async () => {
      mockPrisma.$queryRaw.mockResolvedValue([{ '?column?': 1 }]);
      mockPrisma.resume.count.mockResolvedValue(42);
      mockPrisma.user.count.mockResolvedValue(10);
      mockConfig.get.mockImplementation((key: string) => {
        if (key === 'GOOGLE_CLIENT_ID') return 'google-id';
        if (key === 'GITHUB_CLIENT_ID') return 'github-id';
        return undefined;
      });

      const result = await controller.check();
      expect(result.status).toBe('ok');
      expect(result.database).toBe('ok');
      expect(result.stats).toEqual({ resumes: 42, users: 10 });
      expect(result.providers.google).toBe(true);
      expect(result.providers.github).toBe(true);
      expect(result.providers.kakao).toBe(false);
      expect(result.memory).toBeDefined();
      expect(result.memory.rss).toBeGreaterThan(0);
    });

    it('DB 오류 → status degraded', async () => {
      mockPrisma.$queryRaw.mockRejectedValue(new Error('DB connection failed'));

      const result = await controller.check();
      expect(result.status).toBe('degraded');
      expect(result.database).toBe('error');
    });
  });

  // ──────────────────────────────────────────────────
  // GET /api/health/stats — 공개 사이트 통계
  // ──────────────────────────────────────────────────
  describe('publicStats (GET /health/stats)', () => {
    it('사용자수, 이력서수, 조회수, 템플릿수, 커뮤니티, 채용 반환', async () => {
      mockPrisma.user.count.mockResolvedValue(100);
      mockPrisma.resume.count.mockResolvedValue(250);
      mockPrisma.resume.aggregate.mockResolvedValue({ _sum: { viewCount: 5000 } });
      mockPrisma.template.count.mockResolvedValue(26);

      const result = await controller.publicStats();
      expect(result.users.total).toBe(100);
      expect(result.resumes.total).toBe(250);
      expect(result.activity.totalViews).toBe(5000);
      expect(result.content.templates).toBe(26);
      expect(result.community).toBeDefined();
      expect(result.jobs).toBeDefined();
    });

    it('조회수 null → 0으로 기본값 처리', async () => {
      mockPrisma.user.count.mockResolvedValue(0);
      mockPrisma.resume.count.mockResolvedValue(0);
      mockPrisma.resume.aggregate.mockResolvedValue({ _sum: { viewCount: null } });
      mockPrisma.template.count.mockResolvedValue(0);

      const result = await controller.publicStats();
      expect(result.activity.totalViews).toBe(0);
    });
  });

  // ──────────────────────────────────────────────────
  // GET /api/health/admin/stats — 관리자 통계
  // ──────────────────────────────────────────────────
  describe('adminStats (GET /health/admin/stats)', () => {
    it('admin 사용자 → 관리자 통계 반환', async () => {
      const stats = { totalUsers: 100, totalResumes: 250, newUsersToday: 5 };
      mockStatsService.getStats.mockResolvedValue(stats);

      const result = await controller.adminStats({ user: { id: 'admin1', role: 'admin' } });
      expect(result).toEqual(stats);
      expect(mockStatsService.getStats).toHaveBeenCalled();
    });

    it('superadmin 사용자 → 관리자 통계 반환', async () => {
      const stats = { totalUsers: 200 };
      mockStatsService.getStats.mockResolvedValue(stats);

      const result = await controller.adminStats({ user: { id: 'sa1', role: 'superadmin' } });
      expect(result).toEqual(stats);
    });

    it('일반 사용자 → ForbiddenException', async () => {
      await expect(
        controller.adminStats({ user: { id: 'u1', role: 'user' } }),
      ).rejects.toThrow(ForbiddenException);
      expect(mockStatsService.getStats).not.toHaveBeenCalled();
    });

    it('비로그인 → UnauthorizedException', async () => {
      await expect(
        controller.adminStats({ user: null }),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('user.id 없음 → UnauthorizedException', async () => {
      await expect(
        controller.adminStats({ user: {} }),
      ).rejects.toThrow(UnauthorizedException);
    });
  });

  // ──────────────────────────────────────────────────
  // GET /api/health/usage — 내 사용량 조회
  // ──────────────────────────────────────────────────
  describe('getUsage (GET /health/usage)', () => {
    it('로그인 사용자 → 사용량 반환', async () => {
      const usage = { ai_transform: { used: 3, limit: 5, remaining: 2 } };
      mockUsageService.getUsage.mockResolvedValue(usage);

      const result = await controller.getUsage({ user: { id: 'u1' } });
      expect(result).toEqual(usage);
      expect(mockUsageService.getUsage).toHaveBeenCalledWith('u1');
    });

    it('비로그인 → UnauthorizedException', async () => {
      await expect(
        controller.getUsage({ user: null }),
      ).rejects.toThrow(UnauthorizedException);
    });
  });

  // ──────────────────────────────────────────────────
  // /health 반환값 상세 검증
  // ──────────────────────────────────────────────────
  describe('ping 반환값 상세', () => {
    it('status 필드가 정확히 "ok" 문자열', () => {
      const result = controller.ping();
      expect(result.status).toStrictEqual('ok');
    });

    it('version이 semver 형식 (x.y.z)', () => {
      const result = controller.ping();
      expect(result.version).toMatch(/^\d+\.\d+\.\d+/);
    });

    it('반환 객체에 필수 필드 포함', () => {
      const result = controller.ping();
      const keys = Object.keys(result);
      expect(keys).toContain('status');
      expect(keys).toContain('timestamp');
      expect(keys).toContain('version');
      expect(keys).toContain('uptime');
      expect(keys).toContain('env');
      expect(keys).toHaveLength(5);
    });
  });

  // ──────────────────────────────────────────────────
  // /health/stats 공개 데이터만 반환 확인
  // ──────────────────────────────────────────────────
  describe('publicStats 공개 데이터만 반환', () => {
    beforeEach(() => {
      mockPrisma.user.count.mockResolvedValue(50);
      mockPrisma.resume.count.mockResolvedValue(120);
      mockPrisma.resume.aggregate.mockResolvedValue({ _sum: { viewCount: 3000 } });
      mockPrisma.template.count.mockResolvedValue(26);
    });

    it('민감 정보(이메일, 비밀번호 등)를 포함하지 않음', async () => {
      const result = await controller.publicStats();
      const json = JSON.stringify(result);
      expect(json).not.toContain('email');
      expect(json).not.toContain('password');
      expect(json).not.toContain('token');
      expect(json).not.toContain('secret');
    });

    it('반환 구조에 users, resumes, activity, content, community, jobs 포함', async () => {
      const result = await controller.publicStats();
      expect(result).toHaveProperty('users');
      expect(result).toHaveProperty('resumes');
      expect(result).toHaveProperty('activity');
      expect(result).toHaveProperty('content');
      expect(result).toHaveProperty('community');
      expect(result).toHaveProperty('jobs');
    });

    it('각 값이 숫자형', async () => {
      const result = await controller.publicStats();
      expect(typeof result.users.total).toBe('number');
      expect(typeof result.resumes.total).toBe('number');
      expect(typeof result.activity.totalViews).toBe('number');
      expect(typeof result.content.templates).toBe('number');
    });

    it('음수가 아닌 값 반환', async () => {
      const result = await controller.publicStats();
      expect(result.users.total).toBeGreaterThanOrEqual(0);
      expect(result.resumes.total).toBeGreaterThanOrEqual(0);
      expect(result.activity.totalViews).toBeGreaterThanOrEqual(0);
      expect(result.content.templates).toBeGreaterThanOrEqual(0);
    });
  });

  // ──────────────────────────────────────────────────
  // /health/admin/stats 인증 요구 상세
  // ──────────────────────────────────────────────────
  describe('adminStats 인증 요구 상세', () => {
    it('req 객체에 user 프로퍼티 자체가 없음 → UnauthorizedException', async () => {
      await expect(
        controller.adminStats({}),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('user.role이 undefined → ForbiddenException', async () => {
      await expect(
        controller.adminStats({ user: { id: 'u1', role: undefined } }),
      ).rejects.toThrow(ForbiddenException);
    });

    it('user.role이 빈 문자열 → ForbiddenException', async () => {
      await expect(
        controller.adminStats({ user: { id: 'u1', role: '' } }),
      ).rejects.toThrow(ForbiddenException);
    });

    it('admin → 서비스 호출 1번만 발생', async () => {
      mockStatsService.getStats.mockResolvedValue({ totalUsers: 10 });
      await controller.adminStats({ user: { id: 'a1', role: 'admin' } });
      expect(mockStatsService.getStats).toHaveBeenCalledTimes(1);
    });

    it('서비스 에러 → 그대로 전파됨', async () => {
      mockStatsService.getStats.mockRejectedValue(new Error('DB error'));
      await expect(
        controller.adminStats({ user: { id: 'a1', role: 'admin' } }),
      ).rejects.toThrow('DB error');
    });
  });

  // ──────────────────────────────────────────────────
  // /health/detailed 추가 검증
  // ──────────────────────────────────────────────────
  describe('check 추가 검증', () => {
    it('환경 정보 포함', async () => {
      mockPrisma.$queryRaw.mockResolvedValue([{ '?column?': 1 }]);
      mockPrisma.resume.count.mockResolvedValue(0);
      mockPrisma.user.count.mockResolvedValue(0);
      mockConfig.get.mockReturnValue(undefined);

      const result = await controller.check();
      expect(result.environment).toBeDefined();
      expect(result.uptime).toBeGreaterThanOrEqual(0);
    });

    it('storage 필드가 cloudinary 또는 database', async () => {
      mockPrisma.$queryRaw.mockResolvedValue([{ '?column?': 1 }]);
      mockPrisma.resume.count.mockResolvedValue(0);
      mockPrisma.user.count.mockResolvedValue(0);
      mockConfig.get.mockReturnValue(undefined);

      const result = await controller.check();
      expect(['cloudinary', 'database']).toContain(result.storage);
    });

    it('메모리 사용량이 MB 단위 양수', async () => {
      mockPrisma.$queryRaw.mockResolvedValue([{ '?column?': 1 }]);
      mockPrisma.resume.count.mockResolvedValue(0);
      mockPrisma.user.count.mockResolvedValue(0);
      mockConfig.get.mockReturnValue(undefined);

      const result = await controller.check();
      expect(result.memory.rss).toBeGreaterThan(0);
      expect(result.memory.heapUsed).toBeGreaterThan(0);
      // MB 단위이므로 정수
      expect(Number.isInteger(result.memory.rss)).toBe(true);
      expect(Number.isInteger(result.memory.heapUsed)).toBe(true);
    });

    it('프로바이더 미설정 시 모두 false', async () => {
      mockPrisma.$queryRaw.mockResolvedValue([{ '?column?': 1 }]);
      mockPrisma.resume.count.mockResolvedValue(0);
      mockPrisma.user.count.mockResolvedValue(0);
      mockConfig.get.mockReturnValue(undefined);

      const result = await controller.check();
      expect(result.providers.google).toBe(false);
      expect(result.providers.github).toBe(false);
      expect(result.providers.kakao).toBe(false);
    });
  });

  // ──────────────────────────────────────────────────
  // Draft API 테스트
  // ──────────────────────────────────────────────────
  describe('Draft API', () => {
    const mockReq = { user: { id: 'test-user' }, params: { type: 'community_post' } };

    it('임시저장 조회 (없으면 null)', async () => {
      mockPrisma.draft.findUnique.mockResolvedValue(null);
      const result = await controller.getDraft('community_post', mockReq);
      expect(result).toBeNull();
    });

    it('임시저장 조회 (JSON 파싱)', async () => {
      mockPrisma.draft.findUnique.mockResolvedValue({ content: '{"title":"테스트"}' });
      const result = await controller.getDraft('community_post', mockReq);
      expect(result).toEqual({ title: '테스트' });
    });

    it('임시저장 저장', async () => {
      mockPrisma.draft.upsert.mockResolvedValue({});
      const result = await controller.saveDraft('community_post', { title: '임시' }, mockReq);
      expect(result.success).toBe(true);
    });

    it('임시저장 삭제', async () => {
      mockPrisma.draft.deleteMany.mockResolvedValue({ count: 1 });
      const result = await controller.deleteDraft('community_post', mockReq);
      expect(result.success).toBe(true);
    });
  });
});
