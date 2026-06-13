import { UnauthorizedException } from '@nestjs/common';
import type { Request } from 'express';

export type AuthenticatedUser = {
  id?: string;
  role?: string;
  email?: string;
  userType?: string;
};

export type AuthenticatedRequest = Partial<Request> & {
  user?: AuthenticatedUser | null;
  cookies?: Record<string, string | undefined>;
  headers?: Request['headers'];
};

export type UploadedFile = Express.Multer.File;

export const requestUserId = (req: AuthenticatedRequest): string | undefined => req.user?.id;

export const requestUserRole = (req: AuthenticatedRequest): string | undefined => req.user?.role;

export const requestUserType = (req: AuthenticatedRequest): string | undefined =>
  req.user?.userType;

export const requireRequestUserId = (req: AuthenticatedRequest): string => {
  const userId = requestUserId(req);
  if (!userId) throw new UnauthorizedException('로그인이 필요합니다');
  return userId;
};
