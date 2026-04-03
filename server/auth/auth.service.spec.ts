import { AuthService } from './auth.service';
import { UnauthorizedException } from '@nestjs/common';

// ──────────────────────────────────────────────────
// OAuth State (HMAC)
// ──────────────────────────────────────────────────
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

// ──────────────────────────────────────────────────
// Admin (setUserRole / getAllUsers)
// ──────────────────────────────────────────────────
describe('AuthService - Admin (setUserRole / getAllUsers)', () => {
  let service: AuthService;
  let mockPrisma: any;

  beforeEach(() => {
    mockPrisma = {
      user: {
        findUnique: jest.fn(),
        findFirst: jest.fn(),
        findMany: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
        delete: jest.fn(),
      },
      resume: { count: jest.fn().mockResolvedValue(0) },
      follow: { count: jest.fn().mockResolvedValue(0) },
    };

    service = Object.create(AuthService.prototype);
    (service as any).prisma = mockPrisma;
    (service as any).logger = { warn: jest.fn() };
  });

  describe('setUserRole', () => {
    it('admin이 다른 사용자 역할 변경 성공', async () => {
      mockPrisma.user.findUnique.mockResolvedValue({ id: 'admin-1', role: 'superadmin' });
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
      mockPrisma.user.findUnique.mockResolvedValue({ id: 'admin-1', role: 'superadmin' });

      await expect(service.setUserRole('admin-1', 'user-1', 'invalid_role')).rejects.toThrow(
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
      expect(mockPrisma.user.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ orderBy: { createdAt: 'desc' } }),
      );
    });

    it('사용자 없으면 빈 배열', async () => {
      mockPrisma.user.findMany.mockResolvedValue([]);

      const result = await service.getAllUsers();
      expect(result).toEqual([]);
    });
  });
});

// ──────────────────────────────────────────────────
// Register
// ──────────────────────────────────────────────────
describe('AuthService - register', () => {
  let service: AuthService;
  let mockPrisma: any;
  let mockJwt: any;

  beforeEach(() => {
    mockPrisma = {
      user: {
        findUnique: jest.fn(),
        findFirst: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
      },
    };
    mockJwt = {
      sign: jest.fn().mockReturnValue('mock-jwt-token'),
    };

    service = Object.create(AuthService.prototype);
    (service as any).prisma = mockPrisma;
    (service as any).jwt = mockJwt;
    (service as any).logger = { warn: jest.fn() };
  });

  it('유효한 자격증명으로 회원가입 성공 → JWT 토큰 반환', async () => {
    mockPrisma.user.findUnique.mockResolvedValue(null); // 중복 없음
    mockPrisma.user.create.mockResolvedValue({
      id: 'new-user-1', email: 'new@test.com', name: '신규유저', role: 'user',
    });

    const token = await service.register('new@test.com', 'password123', '신규유저');
    expect(token).toBe('mock-jwt-token');
    expect(mockPrisma.user.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          email: 'new@test.com',
          name: '신규유저',
          provider: 'local',
          userType: 'personal',
        }),
      }),
    );
  });

  it('중복 이메일 → UnauthorizedException', async () => {
    mockPrisma.user.findUnique.mockResolvedValue({ id: 'existing', email: 'dup@test.com' });

    await expect(service.register('dup@test.com', 'password123', '중복유저'))
      .rejects.toThrow('이미 가입된 이메일입니다');
  });

  it('이메일 미입력 → UnauthorizedException', async () => {
    await expect(service.register('', 'password123', '이름'))
      .rejects.toThrow('이메일, 비밀번호, 이름은 필수입니다');
  });

  it('비밀번호 미입력 → UnauthorizedException', async () => {
    await expect(service.register('test@test.com', '', '이름'))
      .rejects.toThrow('이메일, 비밀번호, 이름은 필수입니다');
  });

  it('비밀번호 8자 미만 → UnauthorizedException', async () => {
    await expect(service.register('test@test.com', 'short', '이름'))
      .rejects.toThrow('비밀번호는 8자 이상이어야 합니다');
  });

  it('이름 미입력 → UnauthorizedException', async () => {
    await expect(service.register('test@test.com', 'password123', ''))
      .rejects.toThrow('이메일, 비밀번호, 이름은 필수입니다');
  });

  it('userType=recruiter 로 가입 가능', async () => {
    mockPrisma.user.findUnique.mockResolvedValue(null);
    mockPrisma.user.create.mockResolvedValue({
      id: 'recruiter-1', email: 'rec@test.com', name: '리크루터', role: 'user',
    });

    await service.register('rec@test.com', 'password123', '리크루터', 'recruiter');
    expect(mockPrisma.user.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ userType: 'recruiter' }),
      }),
    );
  });

  it('userType=company 시 companyName 필수', async () => {
    await expect(service.register('co@test.com', 'password123', '기업', 'company'))
      .rejects.toThrow('기업 계정은 회사명이 필수입니다');
  });

  it('유효하지 않은 userType은 personal로 기본값 설정', async () => {
    mockPrisma.user.findUnique.mockResolvedValue(null);
    mockPrisma.user.create.mockResolvedValue({
      id: 'u1', email: 'x@test.com', name: 'x', role: 'user',
    });

    await service.register('x@test.com', 'password123', 'x', 'invalid_type');
    expect(mockPrisma.user.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ userType: 'personal' }),
      }),
    );
  });
});

// ──────────────────────────────────────────────────
// Login
// ──────────────────────────────────────────────────
describe('AuthService - login', () => {
  let service: AuthService;
  let mockPrisma: any;
  let mockJwt: any;

  beforeEach(() => {
    mockPrisma = {
      user: {
        findUnique: jest.fn(),
      },
    };
    mockJwt = {
      sign: jest.fn().mockReturnValue('mock-jwt-token'),
    };

    service = Object.create(AuthService.prototype);
    (service as any).prisma = mockPrisma;
    (service as any).jwt = mockJwt;
    (service as any).logger = { warn: jest.fn() };
  });

  it('올바른 이메일/비밀번호 → JWT 토큰 반환', async () => {
    const bcrypt = require('bcryptjs');
    const hash = await bcrypt.hash('correctpassword', 10);
    mockPrisma.user.findUnique.mockResolvedValue({
      id: 'user-1', email: 'test@test.com', passwordHash: hash, role: 'user',
    });

    const token = await service.login('test@test.com', 'correctpassword');
    expect(token).toBe('mock-jwt-token');
    expect(mockJwt.sign).toHaveBeenCalledWith({ sub: 'user-1', role: 'user' });
  });

  it('잘못된 비밀번호 → UnauthorizedException', async () => {
    const bcrypt = require('bcryptjs');
    const hash = await bcrypt.hash('correctpassword', 10);
    mockPrisma.user.findUnique.mockResolvedValue({
      id: 'user-1', email: 'test@test.com', passwordHash: hash, role: 'user',
    });

    await expect(service.login('test@test.com', 'wrongpassword'))
      .rejects.toThrow('이메일 또는 비밀번호가 올바르지 않습니다');
  });

  it('존재하지 않는 이메일 → UnauthorizedException', async () => {
    mockPrisma.user.findUnique.mockResolvedValue(null);

    await expect(service.login('no@test.com', 'password'))
      .rejects.toThrow('이메일 또는 비밀번호가 올바르지 않습니다');
  });

  it('passwordHash 없는 소셜 계정 → UnauthorizedException', async () => {
    mockPrisma.user.findUnique.mockResolvedValue({
      id: 'user-1', email: 'social@test.com', passwordHash: null, role: 'user',
    });

    await expect(service.login('social@test.com', 'anypassword'))
      .rejects.toThrow('이메일 또는 비밀번호가 올바르지 않습니다');
  });

  it('이메일 미입력 → UnauthorizedException', async () => {
    await expect(service.login('', 'password'))
      .rejects.toThrow('이메일과 비밀번호를 입력해주세요');
  });

  it('비밀번호 미입력 → UnauthorizedException', async () => {
    await expect(service.login('test@test.com', ''))
      .rejects.toThrow('이메일과 비밀번호를 입력해주세요');
  });
});

// ──────────────────────────────────────────────────
// getProfile
// ──────────────────────────────────────────────────
describe('AuthService - getProfile', () => {
  let service: AuthService;
  let mockPrisma: any;

  beforeEach(() => {
    mockPrisma = {
      user: { findUnique: jest.fn() },
      resume: { count: jest.fn().mockResolvedValue(3) },
      follow: { count: jest.fn() },
    };

    service = Object.create(AuthService.prototype);
    (service as any).prisma = mockPrisma;
    (service as any).logger = { warn: jest.fn() };
  });

  it('유효한 사용자 → passwordHash 제외한 프로필 반환', async () => {
    mockPrisma.user.findUnique.mockResolvedValue({
      id: 'user-1', email: 'test@test.com', name: '홍길동', avatar: 'https://avatar.url',
      provider: 'local', role: 'user', plan: 'free', passwordHash: 'SECRET_HASH',
      userType: 'personal', companyName: null, companyTitle: null,
    });
    mockPrisma.resume.count.mockResolvedValue(5);
    mockPrisma.follow.count
      .mockResolvedValueOnce(10)  // followerCount
      .mockResolvedValueOnce(3);  // followingCount

    const result = await service.getProfile('user-1');
    expect(result.id).toBe('user-1');
    expect(result.email).toBe('test@test.com');
    expect(result.name).toBe('홍길동');
    expect(result.resumeCount).toBe(5);
    expect(result.followerCount).toBe(10);
    expect(result.followingCount).toBe(3);
    // passwordHash가 반환값에 포함되지 않아야 함
    expect((result as any).passwordHash).toBeUndefined();
  });

  it('존재하지 않는 사용자 → UnauthorizedException', async () => {
    mockPrisma.user.findUnique.mockResolvedValue(null);

    await expect(service.getProfile('nonexistent')).rejects.toThrow(UnauthorizedException);
  });

  it('role/plan 기본값 처리', async () => {
    mockPrisma.user.findUnique.mockResolvedValue({
      id: 'u1', email: 'e@t.com', name: 'n', avatar: '',
      provider: 'google', role: null, plan: null, passwordHash: null,
      userType: null, companyName: null, companyTitle: null,
    });
    mockPrisma.follow.count.mockResolvedValue(0);

    const result = await service.getProfile('u1');
    expect(result.role).toBe('user');
    expect(result.plan).toBe('free');
    expect(result.userType).toBe('personal');
  });
});

// ──────────────────────────────────────────────────
// updateProfile
// ──────────────────────────────────────────────────
describe('AuthService - updateProfile', () => {
  let service: AuthService;
  let mockPrisma: any;

  beforeEach(() => {
    mockPrisma = {
      user: {
        findUnique: jest.fn(),
        update: jest.fn(),
      },
    };

    service = Object.create(AuthService.prototype);
    (service as any).prisma = mockPrisma;
    (service as any).logger = { warn: jest.fn() };
  });

  it('userType을 recruiter로 변경', async () => {
    const user = {
      id: 'u1', email: 'e@t.com', name: '홍길동', avatar: '',
      provider: 'local', role: 'user', plan: 'free',
      userType: 'personal', companyName: null, companyTitle: null,
    };
    mockPrisma.user.findUnique.mockResolvedValue(user);
    mockPrisma.user.update.mockResolvedValue({ ...user, userType: 'recruiter' });

    const result = await service.updateProfile('u1', { userType: 'recruiter' });
    expect(result.userType).toBe('recruiter');
    expect(mockPrisma.user.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ userType: 'recruiter' }),
      }),
    );
  });

  it('유효하지 않은 userType → UnauthorizedException', async () => {
    mockPrisma.user.findUnique.mockResolvedValue({
      id: 'u1', email: 'e@t.com', name: 'n',
    });

    await expect(service.updateProfile('u1', { userType: 'hacker' }))
      .rejects.toThrow('유효하지 않은 사용자 유형입니다');
  });

  it('personal, recruiter, company 모두 유효한 userType', async () => {
    const user = {
      id: 'u1', email: 'e@t.com', name: 'n', avatar: '',
      provider: 'local', role: 'user', plan: 'free',
      userType: 'personal', companyName: '', companyTitle: '',
    };

    for (const validType of ['personal', 'recruiter', 'company']) {
      mockPrisma.user.findUnique.mockResolvedValue(user);
      mockPrisma.user.update.mockResolvedValue({ ...user, userType: validType });

      const result = await service.updateProfile('u1', { userType: validType });
      expect(result.userType).toBe(validType);
    }
  });

  it('존재하지 않는 사용자 → UnauthorizedException', async () => {
    mockPrisma.user.findUnique.mockResolvedValue(null);

    await expect(service.updateProfile('nonexistent', { name: 'new' }))
      .rejects.toThrow('사용자를 찾을 수 없습니다');
  });

  it('이름 변경', async () => {
    const user = {
      id: 'u1', email: 'e@t.com', name: '기존이름', avatar: '',
      provider: 'local', role: 'user', plan: 'free',
      userType: 'personal', companyName: '', companyTitle: '',
    };
    mockPrisma.user.findUnique.mockResolvedValue(user);
    mockPrisma.user.update.mockResolvedValue({ ...user, name: '새이름' });

    const result = await service.updateProfile('u1', { name: '새이름' });
    expect(result.name).toBe('새이름');
  });
});
