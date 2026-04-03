import { isAdmin, isSuperAdmin, VALID_ROLES } from './roles';

describe('roles utility', () => {
  describe('isAdmin', () => {
    it('admin 역할 → true', () => {
      expect(isAdmin('admin')).toBe(true);
    });

    it('superadmin 역할 → true', () => {
      expect(isAdmin('superadmin')).toBe(true);
    });

    it('user 역할 → false', () => {
      expect(isAdmin('user')).toBe(false);
    });

    it('undefined → false', () => {
      expect(isAdmin(undefined)).toBe(false);
    });

    it('빈 문자열 → false', () => {
      expect(isAdmin('')).toBe(false);
    });

    it('임의 문자열 → false', () => {
      expect(isAdmin('manager')).toBe(false);
    });
  });

  describe('isSuperAdmin', () => {
    it('superadmin 역할 → true', () => {
      expect(isSuperAdmin('superadmin')).toBe(true);
    });

    it('admin 역할 → false', () => {
      expect(isSuperAdmin('admin')).toBe(false);
    });

    it('user 역할 → false', () => {
      expect(isSuperAdmin('user')).toBe(false);
    });

    it('undefined → false', () => {
      expect(isSuperAdmin(undefined)).toBe(false);
    });

    it('빈 문자열 → false', () => {
      expect(isSuperAdmin('')).toBe(false);
    });
  });

  describe('VALID_ROLES', () => {
    it('user, admin, superadmin 포함', () => {
      expect(VALID_ROLES).toEqual(['user', 'admin', 'superadmin']);
    });

    it('3개 역할만 존재', () => {
      expect(VALID_ROLES).toHaveLength(3);
    });
  });
});
