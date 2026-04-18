import { Test, TestingModule } from '@nestjs/testing';
import { SystemConfigService } from './system-config.service';
import { PrismaService } from '../prisma/prisma.service';

const mockPrisma: any = {
  systemConfig: {
    findMany: jest.fn(),
    findUnique: jest.fn(),
    upsert: jest.fn(),
  },
};

describe('SystemConfigService', () => {
  let service: SystemConfigService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [SystemConfigService, { provide: PrismaService, useValue: mockPrisma }],
    }).compile();
    service = module.get(SystemConfigService);
    jest.clearAllMocks();
  });

  describe('get / getBoolean / getNumber', () => {
    it('get: 값 없으면 null', async () => {
      mockPrisma.systemConfig.findUnique.mockResolvedValueOnce(null);
      await expect(service.get('missing')).resolves.toBeNull();
    });

    it('get: value 반환', async () => {
      mockPrisma.systemConfig.findUnique.mockResolvedValueOnce({ value: 'hello' });
      await expect(service.get('k')).resolves.toBe('hello');
    });

    it('getBoolean: null 이면 기본값', async () => {
      mockPrisma.systemConfig.findUnique.mockResolvedValueOnce(null);
      await expect(service.getBoolean('k', true)).resolves.toBe(true);
    });

    it('getBoolean: "true" 문자열은 true', async () => {
      mockPrisma.systemConfig.findUnique.mockResolvedValueOnce({ value: 'true' });
      await expect(service.getBoolean('k')).resolves.toBe(true);
    });

    it('getBoolean: "false" 문자열은 false', async () => {
      mockPrisma.systemConfig.findUnique.mockResolvedValueOnce({ value: 'false' });
      await expect(service.getBoolean('k')).resolves.toBe(false);
    });

    it('getNumber: null 이면 기본값', async () => {
      mockPrisma.systemConfig.findUnique.mockResolvedValueOnce(null);
      await expect(service.getNumber('k', 42)).resolves.toBe(42);
    });

    it('getNumber: 정수 파싱', async () => {
      mockPrisma.systemConfig.findUnique.mockResolvedValueOnce({ value: '100' });
      await expect(service.getNumber('k')).resolves.toBe(100);
    });

    it('getNumber: 파싱 실패 시 기본값 fallback', async () => {
      mockPrisma.systemConfig.findUnique.mockResolvedValueOnce({ value: 'abc' });
      await expect(service.getNumber('k', 7)).resolves.toBe(7);
    });
  });

  describe('set / setMany', () => {
    it('set: upsert 호출', async () => {
      mockPrisma.systemConfig.upsert.mockResolvedValueOnce({});
      await service.set('k', 'v');
      expect(mockPrisma.systemConfig.upsert).toHaveBeenCalledWith({
        where: { key: 'k' },
        update: { value: 'v' },
        create: { key: 'k', value: 'v' },
      });
    });

    it('setMany: 각 항목마다 upsert', async () => {
      mockPrisma.systemConfig.upsert.mockResolvedValue({});
      await service.setMany([
        { key: 'a', value: '1' },
        { key: 'b', value: '2' },
      ]);
      expect(mockPrisma.systemConfig.upsert).toHaveBeenCalledTimes(2);
    });
  });

  describe('getPublicConfig', () => {
    it('화이트리스트 키만 조회', async () => {
      mockPrisma.systemConfig.findMany.mockResolvedValueOnce([
        { key: 'site_name', value: '이력서공방' },
        { key: 'maintenance_mode', value: 'false' },
      ]);
      const res = await service.getPublicConfig();
      expect(res).toEqual({ site_name: '이력서공방', maintenance_mode: 'false' });
      const call = mockPrisma.systemConfig.findMany.mock.calls[0][0];
      expect(call.where.key.in).toEqual(
        expect.arrayContaining(['site_name', 'monetization_enabled', 'maintenance_mode']),
      );
    });
  });

  describe('getPermissions', () => {
    it('저장된 값이 없으면 DEFAULT 반환', async () => {
      mockPrisma.systemConfig.findMany.mockResolvedValueOnce([]);
      const perms = await service.getPermissions();
      expect(perms['perm.curatedJobs.create']).toBe('admin,recruiter');
      expect(perms['perm.community.create']).toBe('all');
    });

    it('저장된 값이 있으면 DEFAULT 를 override', async () => {
      mockPrisma.systemConfig.findMany.mockResolvedValueOnce([
        { key: 'perm.community.create', value: 'admin' },
      ]);
      const perms = await service.getPermissions();
      expect(perms['perm.community.create']).toBe('admin');
      // 다른 키는 기본값 유지
      expect(perms['perm.curatedJobs.create']).toBe('admin,recruiter');
    });
  });

  describe('setPermissions', () => {
    it('화이트리스트에 없는 키는 저장 안 됨', async () => {
      mockPrisma.systemConfig.upsert.mockResolvedValue({});
      mockPrisma.systemConfig.findMany.mockResolvedValue([]);
      await service.setPermissions({
        'perm.community.create': 'admin',
        'evil.injection': 'admin',
      } as any);
      // 허용 키 1건만 upsert
      expect(mockPrisma.systemConfig.upsert).toHaveBeenCalledTimes(1);
      expect(mockPrisma.systemConfig.upsert).toHaveBeenCalledWith(
        expect.objectContaining({ where: { key: 'perm.community.create' } }),
      );
    });
  });

  describe('checkPermission', () => {
    beforeEach(() => {
      mockPrisma.systemConfig.findMany.mockResolvedValue([]);
    });

    it('all 포함 시 비로그인도 허용', async () => {
      await expect(service.checkPermission('perm.community.create', null)).resolves.toBe(true);
    });

    it('비로그인 + admin 전용 → 거부', async () => {
      await expect(service.checkPermission('perm.banners.create', null)).resolves.toBe(false);
    });

    it('admin 역할은 admin 전용 허용', async () => {
      await expect(
        service.checkPermission('perm.banners.create', { id: 'u1', role: 'admin' }),
      ).resolves.toBe(true);
    });

    it('superadmin 도 admin 전용 허용', async () => {
      await expect(
        service.checkPermission('perm.banners.create', { id: 'u1', role: 'superadmin' }),
      ).resolves.toBe(true);
    });

    it('recruiter userType 은 recruiter 허용 리소스 통과', async () => {
      await expect(
        service.checkPermission('perm.jobPosts.create', {
          id: 'u1',
          role: 'user',
          userType: 'recruiter',
        }),
      ).resolves.toBe(true);
    });

    it('company userType 도 recruiter 규칙으로 허용', async () => {
      await expect(
        service.checkPermission('perm.jobPosts.create', {
          id: 'u1',
          role: 'user',
          userType: 'company',
        }),
      ).resolves.toBe(true);
    });

    it('author 규칙: authorId와 user.id 일치 시 허용', async () => {
      await expect(
        service.checkPermission('perm.community.edit', { id: 'u1' }, 'u1'),
      ).resolves.toBe(true);
    });

    it('author 규칙: 다른 사람 글은 거부', async () => {
      await expect(
        service.checkPermission('perm.community.edit', { id: 'u1' }, 'other-user'),
      ).resolves.toBe(false);
    });

    it('일반 유저는 admin 전용 리소스 거부', async () => {
      await expect(
        service.checkPermission('perm.banners.create', { id: 'u1', role: 'user' }),
      ).resolves.toBe(false);
    });

    it('저장된 권한 override 도 반영', async () => {
      mockPrisma.systemConfig.findMany.mockResolvedValue([
        { key: 'perm.community.create', value: 'admin' },
      ]);
      // 기본값은 'all' 이지만 override 로 admin 만 허용
      await expect(
        service.checkPermission('perm.community.create', { id: 'u1', role: 'user' }),
      ).resolves.toBe(false);
      await expect(
        service.checkPermission('perm.community.create', { id: 'u1', role: 'admin' }),
      ).resolves.toBe(true);
    });
  });
});
