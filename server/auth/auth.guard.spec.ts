import { AuthGuard } from './auth.guard';
import { Reflector } from '@nestjs/core';
import { JwtService } from '@nestjs/jwt';
import { ExecutionContext } from '@nestjs/common';

describe('AuthGuard', () => {
  let guard: AuthGuard;
  let jwtService: JwtService;
  let reflector: Reflector;

  beforeEach(() => {
    jwtService = { verify: jest.fn() } as any;
    reflector = { getAllAndOverride: jest.fn() } as any;
    guard = new AuthGuard(jwtService, reflector);
  });

  function createContext(headers: Record<string, string> = {}): ExecutionContext {
    const request = { headers, user: undefined as any };
    return {
      switchToHttp: () => ({ getRequest: () => request }),
      getHandler: () => ({}),
      getClass: () => ({}),
    } as any;
  }

  it('@Public() 데코레이터 → 인증 스킵', () => {
    (reflector.getAllAndOverride as jest.Mock).mockReturnValue(true);
    const ctx = createContext();
    expect(guard.canActivate(ctx)).toBe(true);
  });

  it('토큰 없음 → user = null, 통과', () => {
    (reflector.getAllAndOverride as jest.Mock).mockReturnValue(false);
    const ctx = createContext();
    expect(guard.canActivate(ctx)).toBe(true);
    expect((ctx.switchToHttp().getRequest() as any).user).toBeNull();
  });

  it('유효한 JWT → user.id 설정', () => {
    (reflector.getAllAndOverride as jest.Mock).mockReturnValue(false);
    (jwtService.verify as jest.Mock).mockReturnValue({ sub: 'user-123' });
    const ctx = createContext({ authorization: 'Bearer valid-token' });
    expect(guard.canActivate(ctx)).toBe(true);
    expect((ctx.switchToHttp().getRequest() as any).user).toEqual({ id: 'user-123' });
  });

  it('잘못된 JWT → user = null, 통과 (soft auth)', () => {
    (reflector.getAllAndOverride as jest.Mock).mockReturnValue(false);
    (jwtService.verify as jest.Mock).mockImplementation(() => { throw new Error('invalid'); });
    const ctx = createContext({ authorization: 'Bearer bad-token' });
    expect(guard.canActivate(ctx)).toBe(true);
    expect((ctx.switchToHttp().getRequest() as any).user).toBeNull();
  });

  it('Bearer가 아닌 인증 헤더 → 토큰 없음 처리', () => {
    (reflector.getAllAndOverride as jest.Mock).mockReturnValue(false);
    const ctx = createContext({ authorization: 'Basic abc123' });
    expect(guard.canActivate(ctx)).toBe(true);
    expect((ctx.switchToHttp().getRequest() as any).user).toBeNull();
  });
});
