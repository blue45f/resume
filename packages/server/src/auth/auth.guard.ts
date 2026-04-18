import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Reflector } from '@nestjs/core';
import { PrismaService } from '../prisma/prisma.service';

export const IS_PUBLIC_KEY = 'isPublic';
import { SetMetadata } from '@nestjs/common';
export const Public = () => SetMetadata(IS_PUBLIC_KEY, true);

// In-memory suspended-user cache to avoid a DB round-trip per request.
// TTL keeps the cost of admin suspension actions near-instant, while limiting load.
const SUSPENDED_CACHE_TTL_MS = 30 * 1000; // 30s
type SuspendedEntry = { suspended: boolean; expiresAt: number };
const suspendedCache = new Map<string, SuspendedEntry>();

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

      // Suspended check (cached)
      const suspended = await this.isSuspended(userId);
      if (suspended) {
        throw new ForbiddenException('정지된 계정입니다. 관리자에게 문의하세요');
      }
    } catch (err) {
      if (err instanceof ForbiddenException) throw err;
      request.user = null;
    }

    return true;
  }

  private async isSuspended(userId: string): Promise<boolean> {
    const now = Date.now();
    const cached = suspendedCache.get(userId);
    if (cached && cached.expiresAt > now) return cached.suspended;
    try {
      const u = await this.prisma.user.findUnique({
        where: { id: userId },
        select: { isSuspended: true },
      });
      const suspended = !!u?.isSuspended;
      suspendedCache.set(userId, { suspended, expiresAt: now + SUSPENDED_CACHE_TTL_MS });
      return suspended;
    } catch {
      return false;
    }
  }

  private extractToken(request: any): string | null {
    const auth = request.headers.authorization;
    if (auth && typeof auth === 'string') {
      const parts = auth.split(/\s+/);
      if (parts.length === 2 && parts[0] === 'Bearer' && parts[1]) return parts[1];
    }
    // Fallback: httpOnly cookie
    return request.cookies?.token || null;
  }
}
