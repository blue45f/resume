import { AuthService } from './auth.service';

describe('AuthService - OAuth State (HMAC)', () => {
  let service: AuthService;

  beforeEach(async () => {
    service = Object.create(AuthService.prototype);
    (service as any).stateSecret = 'test-secret-key';
    (service as any).STATE_TTL_MS = 10 * 60 * 1000;
    (service as any).logger = { warn: jest.fn() };
  });

  describe('generateOAuthState', () => {
    it('유니크한 state 값 생성', () => {
      const state1 = service.generateOAuthState();
      const state2 = service.generateOAuthState();
      expect(state1).not.toBe(state2);
    });

    it('timestamp.nonce.hmac 형식', () => {
      const state = service.generateOAuthState();
      const parts = state.split('.');
      expect(parts).toHaveLength(3);
    });
  });

  describe('validateOAuthState', () => {
    it('유효한 state → true', () => {
      const state = service.generateOAuthState();
      expect(service.validateOAuthState(state)).toBe(true);
    });

    it('HMAC 서명이므로 재사용 가능 (stateless)', () => {
      const state = service.generateOAuthState();
      expect(service.validateOAuthState(state)).toBe(true);
      expect(service.validateOAuthState(state)).toBe(true); // 재사용 OK
    });

    it('변조된 state → false', () => {
      const state = service.generateOAuthState();
      const tampered = state.slice(0, -1) + 'x';
      expect(service.validateOAuthState(tampered)).toBe(false);
    });

    it('잘못된 형식 → false', () => {
      expect(service.validateOAuthState('invalid')).toBe(false);
      expect(service.validateOAuthState('')).toBe(false);
      expect(service.validateOAuthState(undefined)).toBe(false);
    });

    it('만료된 state → false', () => {
      // 11분 전 timestamp 생성
      const oldTimestamp = (Date.now() - 11 * 60 * 1000).toString(36);
      const { createHmac } = require('crypto');
      const nonce = 'deadbeef01234567';
      const payload = `${oldTimestamp}.${nonce}`;
      const hmac = createHmac('sha256', 'test-secret-key').update(payload).digest('hex').slice(0, 16);
      const state = `${payload}.${hmac}`;
      expect(service.validateOAuthState(state)).toBe(false);
    });
  });
});

describe('AuthService - Admin (setUserRole / getAllUsers)', () => {
  let service: AuthService;
  let mockPrisma: any;

  beforeEach(() => {
    mockPrisma = {
      user: {
        findUnique: jest.fn(),
        findMany: jest.fn(),
        update: jest.fn(),
      },
    };

    service = Object.create(AuthService.prototype);
    (service as any).prisma = mockPrisma;
    (service as any).logger = { warn: jest.fn() };
  });

  describe('setUserRole', () => {
    it('admin이 다른 사용자 역할 변경 성공', async () => {
      mockPrisma.user.findUnique.mockResolvedValue({ id: 'admin-1', role: 'admin' });
      mockPrisma.user.update.mockResolvedValue({ id: 'user-1', role: 'admin' });

      const result = await service.setUserRole('admin-1', 'user-1', 'admin');
      expect(result).toEqual({ success: true, userId: 'user-1', role: 'admin' });
      expect(mockPrisma.user.update).toHaveBeenCalledWith({
        where: { id: 'user-1' },
        data: { role: 'admin' },
      });
    });

    it('일반 사용자가 역할 변경 시도 → UnauthorizedException', async () => {
      mockPrisma.user.findUnique.mockResolvedValue({ id: 'user-1', role: 'user' });

      await expect(service.setUserRole('user-1', 'user-2', 'admin')).rejects.toThrow(
        '관리자만 역할을 변경할 수 있습니다',
      );
      expect(mockPrisma.user.update).not.toHaveBeenCalled();
    });

    it('유효하지 않은 역할 → UnauthorizedException', async () => {
      mockPrisma.user.findUnique.mockResolvedValue({ id: 'admin-1', role: 'admin' });

      await expect(service.setUserRole('admin-1', 'user-1', 'superadmin')).rejects.toThrow(
        '유효하지 않은 역할입니다',
      );
      expect(mockPrisma.user.update).not.toHaveBeenCalled();
    });

    it('존재하지 않는 관리자 → UnauthorizedException', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(null);

      await expect(service.setUserRole('nonexistent', 'user-1', 'admin')).rejects.toThrow(
        '관리자만 역할을 변경할 수 있습니다',
      );
    });
  });

  describe('getAllUsers', () => {
    it('전체 사용자 목록 반환', async () => {
      const mockUsers = [
        { id: '1', name: '홍길동', email: 'hong@test.com', provider: 'local', role: 'admin', createdAt: new Date() },
        { id: '2', name: '김철수', email: 'kim@test.com', provider: 'google', role: 'user', createdAt: new Date() },
      ];
      mockPrisma.user.findMany.mockResolvedValue(mockUsers);

      const result = await service.getAllUsers();
      expect(result).toEqual(mockUsers);
      expect(mockPrisma.user.findMany).toHaveBeenCalledWith({
        select: { id: true, name: true, email: true, provider: true, role: true, createdAt: true },
        orderBy: { createdAt: 'desc' },
      });
    });

    it('사용자 없으면 빈 배열', async () => {
      mockPrisma.user.findMany.mockResolvedValue([]);

      const result = await service.getAllUsers();
      expect(result).toEqual([]);
    });
  });
});
