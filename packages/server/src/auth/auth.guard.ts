import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Reflector } from '@nestjs/core';
import { PrismaService } from '../prisma/prisma.service';
import type { AuthenticatedRequest } from '../common/request.types';

export const IS_PUBLIC_KEY = 'isPublic';
import { SetMetadata } from '@nestjs/common';
export const Public = () => SetMetadata(IS_PUBLIC_KEY, true);

// In-memory auth-status cache (suspended flag + current role) to avoid a DB round-trip
// per request. A single 30s-TTL query backs both the suspension check and a fresh role
// read, so admin demotion/suspension takes effect within 30s instead of waiting for the
// (7-day) JWT to expire — without adding any extra query to the hot path.
const AUTH_STATUS_CACHE_TTL_MS = 30 * 1000; // 30s
type AuthStatusEntry = { suspended: boolean; role: string | null; expiresAt: number };
const authStatusCache = new Map<string, AuthStatusEntry>();

@Injectable()
export class AuthGuard implements CanActivate {
  constructor(
    private jwt: JwtService,
    private reflector: Reflector,
    private prisma: PrismaService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    // @Public() 데코레이터가 있으면 인증 스킵
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (isPublic) return true;

    const request = context.switchToHttp().getRequest();
    const token = this.extractToken(request);

    // 토큰이 없으면 비로그인 사용자로 처리 (userId = null)
    if (!token) {
      request.user = null;
      return true;
    }

    try {
      const payload = this.jwt.verify(token);
      const userId = payload.sub as string;
      request.user = { id: userId, role: payload.role || 'user' };

      // 정지 여부 + 최신 role 을 DB 기준으로 확인 (30s 캐시, 단일 쿼리).
      const status = await this.getAuthStatus(userId);
      if (status.suspended) {
        throw new ForbiddenException('정지된 계정입니다. 관리자에게 문의하세요');
      }
      // DB 의 최신 role 반영 — 강등/승격이 토큰(7일) 만료 전에 즉시 적용 (stale-claim 권한 방지).
      if (status.role) request.user.role = status.role;
    } catch (err) {
      if (err instanceof ForbiddenException) throw err;
      request.user = null;
    }

    return true;
  }

  private async getAuthStatus(
    userId: string,
  ): Promise<{ suspended: boolean; role: string | null }> {
    const now = Date.now();
    const cached = authStatusCache.get(userId);
    if (cached && cached.expiresAt > now) return cached;
    try {
      const u = await this.prisma.user.findUnique({
        where: { id: userId },
        select: { isSuspended: true, role: true },
      });
      const entry: AuthStatusEntry = {
        suspended: !!u?.isSuspended,
        role: u?.role ?? null,
        expiresAt: now + AUTH_STATUS_CACHE_TTL_MS,
      };
      authStatusCache.set(userId, entry);
      return entry;
    } catch {
      return { suspended: false, role: null };
    }
  }

  private extractToken(request: AuthenticatedRequest): string | null {
    const auth = request.headers?.authorization;
    if (auth && typeof auth === 'string') {
      const parts = auth.split(/\s+/);
      if (parts.length === 2 && parts[0] === 'Bearer' && parts[1]) return parts[1];
    }
    // Fallback: httpOnly cookie
    return request.cookies?.token || null;
  }
}
