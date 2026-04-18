/**
 * 역할 계층:
 * - superadmin: 모든 권한 (사용자 역할 변경, 요금제 설정, 시스템 설정)
 * - admin: 콘텐츠 관리 (이력서/댓글 삭제, 사용자 목록 조회)
 * - user: 일반 사용자
 */
export type Role = 'superadmin' | 'admin' | 'user';

export function isAdmin(role?: string): boolean {
  return role === 'admin' || role === 'superadmin';
}

export function isSuperAdmin(role?: string): boolean {
  return role === 'superadmin';
}

export const VALID_ROLES: Role[] = ['user', 'admin', 'superadmin'];
