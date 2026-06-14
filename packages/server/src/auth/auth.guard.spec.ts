import { ExecutionContext } from '@nestjs/common'
import { Reflector } from '@nestjs/core'
import { JwtService } from '@nestjs/jwt'

import { PrismaService } from '../prisma/prisma.service'

import { AuthGuard } from './auth.guard'

import type { AuthenticatedRequest } from '../common/request.types'

type MockJwtService = {
  verify: jest.Mock
}

type MockReflector = {
  getAllAndOverride: jest.Mock
}

type MockPrismaService = {
  user: {
    findUnique: jest.Mock
  }
}

describe('AuthGuard', () => {
  let guard: AuthGuard
  let jwtService: MockJwtService
  let reflector: MockReflector
  let prisma: MockPrismaService

  beforeEach(() => {
    jwtService = { verify: jest.fn() }
    reflector = { getAllAndOverride: jest.fn() }
    prisma = {
      user: { findUnique: jest.fn().mockResolvedValue({ isSuspended: false }) },
    }
    guard = new AuthGuard(
      jwtService as unknown as JwtService,
      reflector as unknown as Reflector,
      prisma as unknown as PrismaService
    )
  })

  function createContext(
    headers: Record<string, string> = {},
    cookies: Record<string, string> = {}
  ): ExecutionContext {
    const request = { headers, cookies, user: undefined } as AuthenticatedRequest
    return {
      switchToHttp: () => ({ getRequest: () => request }),
      getHandler: () => ({}),
      getClass: () => ({}),
    } as unknown as ExecutionContext
  }

  const getRequest = (ctx: ExecutionContext) =>
    ctx.switchToHttp().getRequest<AuthenticatedRequest>()

  // --- Public 데코레이터 ---

  it('@Public() 데코레이터 → 인증 스킵', async () => {
    ;(reflector.getAllAndOverride as jest.Mock).mockReturnValue(true)
    const ctx = createContext()
    await expect(guard.canActivate(ctx)).resolves.toBe(true)
  })

  it('@Public() 데코레이터 → user 설정하지 않음', async () => {
    ;(reflector.getAllAndOverride as jest.Mock).mockReturnValue(true)
    const ctx = createContext({ authorization: 'Bearer some-token' })
    await expect(guard.canActivate(ctx)).resolves.toBe(true)
    // Public 라우트에서는 토큰 검증 자체를 하지 않음
    expect(jwtService.verify).not.toHaveBeenCalled()
  })

  // --- 토큰 없음 ---

  it('토큰 없음 → user = null, 통과', async () => {
    ;(reflector.getAllAndOverride as jest.Mock).mockReturnValue(false)
    const ctx = createContext()
    await expect(guard.canActivate(ctx)).resolves.toBe(true)
    expect(getRequest(ctx).user).toBeNull()
  })

  // --- 유효한 JWT ---

  it('유효한 JWT → user.id + role 설정', async () => {
    ;(reflector.getAllAndOverride as jest.Mock).mockReturnValue(false)
    ;(jwtService.verify as jest.Mock).mockReturnValue({ sub: 'user-123', role: 'admin' })
    const ctx = createContext({ authorization: 'Bearer valid-token' })
    await expect(guard.canActivate(ctx)).resolves.toBe(true)
    expect(getRequest(ctx).user).toEqual({
      id: 'user-123',
      role: 'admin',
    })
  })

  it('DB 의 최신 role 을 반영 — 토큰이 admin 이어도 강등되었으면 user (stale-claim 권한 차단)', async () => {
    ;(reflector.getAllAndOverride as jest.Mock).mockReturnValue(false)
    ;(jwtService.verify as jest.Mock).mockReturnValue({ sub: 'demoted-9', role: 'admin' })
    ;(prisma.user.findUnique as jest.Mock).mockResolvedValueOnce({
      isSuspended: false,
      role: 'user',
    })
    const ctx = createContext({ authorization: 'Bearer valid-token' })
    await expect(guard.canActivate(ctx)).resolves.toBe(true)
    expect(getRequest(ctx).user?.role).toBe('user')
  })

  it('role이 없는 JWT → 기본 role "user" 설정', async () => {
    ;(reflector.getAllAndOverride as jest.Mock).mockReturnValue(false)
    ;(jwtService.verify as jest.Mock).mockReturnValue({ sub: 'user-456' })
    const ctx = createContext({ authorization: 'Bearer valid-token' })
    await expect(guard.canActivate(ctx)).resolves.toBe(true)
    expect(getRequest(ctx).user).toEqual({ id: 'user-456', role: 'user' })
  })

  // --- 만료된/잘못된 JWT ---

  it('만료된 JWT → user = null, 통과 (soft auth)', async () => {
    ;(reflector.getAllAndOverride as jest.Mock).mockReturnValue(false)
    ;(jwtService.verify as jest.Mock).mockImplementation(() => {
      throw new Error('jwt expired')
    })
    const ctx = createContext({ authorization: 'Bearer expired-token' })
    await expect(guard.canActivate(ctx)).resolves.toBe(true)
    expect(getRequest(ctx).user).toBeNull()
  })

  it('잘못된 JWT → user = null, 통과 (soft auth)', async () => {
    ;(reflector.getAllAndOverride as jest.Mock).mockReturnValue(false)
    ;(jwtService.verify as jest.Mock).mockImplementation(() => {
      throw new Error('invalid signature')
    })
    const ctx = createContext({ authorization: 'Bearer bad-token' })
    await expect(guard.canActivate(ctx)).resolves.toBe(true)
    expect(getRequest(ctx).user).toBeNull()
  })

  it('malformed JWT (jwt malformed) → user = null', async () => {
    ;(reflector.getAllAndOverride as jest.Mock).mockReturnValue(false)
    ;(jwtService.verify as jest.Mock).mockImplementation(() => {
      throw new Error('jwt malformed')
    })
    const ctx = createContext({ authorization: 'Bearer not.a.jwt' })
    await expect(guard.canActivate(ctx)).resolves.toBe(true)
    expect(getRequest(ctx).user).toBeNull()
  })

  // --- 잘못된 토큰 형식 ---

  it('Bearer가 아닌 인증 헤더 → 토큰 없음 처리', async () => {
    ;(reflector.getAllAndOverride as jest.Mock).mockReturnValue(false)
    const ctx = createContext({ authorization: 'Basic abc123' })
    await expect(guard.canActivate(ctx)).resolves.toBe(true)
    expect(getRequest(ctx).user).toBeNull()
  })

  it('Bearer만 있고 토큰이 없는 경우 → 토큰 없음 처리', async () => {
    ;(reflector.getAllAndOverride as jest.Mock).mockReturnValue(false)
    const ctx = createContext({ authorization: 'Bearer ' })
    await expect(guard.canActivate(ctx)).resolves.toBe(true)
    expect(getRequest(ctx).user).toBeNull()
  })

  it('authorization 헤더가 빈 문자열 → 토큰 없음 처리', async () => {
    ;(reflector.getAllAndOverride as jest.Mock).mockReturnValue(false)
    const ctx = createContext({ authorization: '' })
    await expect(guard.canActivate(ctx)).resolves.toBe(true)
    expect(getRequest(ctx).user).toBeNull()
  })

  it('토큰에 공백이 여러 개 → split(/\\s+/)로 정상 파싱', async () => {
    ;(reflector.getAllAndOverride as jest.Mock).mockReturnValue(false)
    ;(jwtService.verify as jest.Mock).mockReturnValue({ sub: 'user-789', role: 'user' })
    const ctx = createContext({ authorization: 'Bearer   valid-token' })
    // split(/\s+/)는 연속 공백을 하나로 처리하므로 정상 추출
    await expect(guard.canActivate(ctx)).resolves.toBe(true)
    expect(getRequest(ctx).user).toEqual({ id: 'user-789', role: 'user' })
  })

  // --- Cookie 기반 인증 ---

  it('Cookie에서 토큰 추출', async () => {
    ;(reflector.getAllAndOverride as jest.Mock).mockReturnValue(false)
    ;(jwtService.verify as jest.Mock).mockReturnValue({ sub: 'cookie-user', role: 'user' })
    const ctx = createContext({}, { token: 'cookie-jwt-token' })
    await expect(guard.canActivate(ctx)).resolves.toBe(true)
    expect(getRequest(ctx).user).toEqual({
      id: 'cookie-user',
      role: 'user',
    })
  })

  it('Authorization 헤더가 우선, Cookie는 fallback', async () => {
    ;(reflector.getAllAndOverride as jest.Mock).mockReturnValue(false)
    ;(jwtService.verify as jest.Mock).mockReturnValue({ sub: 'header-user', role: 'admin' })
    const ctx = createContext({ authorization: 'Bearer header-token' }, { token: 'cookie-token' })
    await expect(guard.canActivate(ctx)).resolves.toBe(true)
    expect(jwtService.verify).toHaveBeenCalledWith('header-token')
    expect(getRequest(ctx).user).toEqual({
      id: 'header-user',
      role: 'admin',
    })
  })

  it('정지된 계정 → ForbiddenException', async () => {
    ;(reflector.getAllAndOverride as jest.Mock).mockReturnValue(false)
    ;(jwtService.verify as jest.Mock).mockReturnValue({ sub: 'suspended-user', role: 'user' })
    ;(prisma.user.findUnique as jest.Mock).mockResolvedValueOnce({ isSuspended: true })
    const ctx = createContext({ authorization: 'Bearer valid-token' })
    await expect(guard.canActivate(ctx)).rejects.toThrow('정지된 계정입니다')
  })
})
