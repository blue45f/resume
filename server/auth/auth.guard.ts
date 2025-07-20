import { Injectable, CanActivate, ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Reflector } from '@nestjs/core';

export const IS_PUBLIC_KEY = 'isPublic';
import { SetMetadata } from '@nestjs/common';
export const Public = () => SetMetadata(IS_PUBLIC_KEY, true);

@Injectable()
export class AuthGuard implements CanActivate {
  constructor(
    private jwt: JwtService,
    private reflector: Reflector,
  ) {}

  canActivate(context: ExecutionContext): boolean {
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
      request.user = { id: payload.sub, role: payload.role || 'user' };
    } catch {
      request.user = null;
    }

    return true;
  }

  private extractToken(request: any): string | null {
    const auth = request.headers.authorization;
    if (!auth || typeof auth !== 'string') return null;
    const parts = auth.split(/\s+/);
    if (parts.length !== 2 || parts[0] !== 'Bearer' || !parts[1]) return null;
    return parts[1];
  }
}
