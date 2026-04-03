"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const roles_1 = require("./roles");
describe('roles utility', () => {
    describe('isAdmin', () => {
        it('admin 역할 → true', () => {
            expect((0, roles_1.isAdmin)('admin')).toBe(true);
        });
        it('superadmin 역할 → true', () => {
            expect((0, roles_1.isAdmin)('superadmin')).toBe(true);
        });
        it('user 역할 → false', () => {
            expect((0, roles_1.isAdmin)('user')).toBe(false);
        });
        it('undefined → false', () => {
            expect((0, roles_1.isAdmin)(undefined)).toBe(false);
        });
        it('빈 문자열 → false', () => {
            expect((0, roles_1.isAdmin)('')).toBe(false);
        });
        it('임의 문자열 → false', () => {
            expect((0, roles_1.isAdmin)('manager')).toBe(false);
        });
    });
    describe('isSuperAdmin', () => {
        it('superadmin 역할 → true', () => {
            expect((0, roles_1.isSuperAdmin)('superadmin')).toBe(true);
        });
        it('admin 역할 → false', () => {
            expect((0, roles_1.isSuperAdmin)('admin')).toBe(false);
        });
        it('user 역할 → false', () => {
            expect((0, roles_1.isSuperAdmin)('user')).toBe(false);
        });
        it('undefined → false', () => {
            expect((0, roles_1.isSuperAdmin)(undefined)).toBe(false);
        });
        it('빈 문자열 → false', () => {
            expect((0, roles_1.isSuperAdmin)('')).toBe(false);
        });
    });
    describe('VALID_ROLES', () => {
        it('user, admin, superadmin 포함', () => {
            expect(roles_1.VALID_ROLES).toEqual(['user', 'admin', 'superadmin']);
        });
        it('3개 역할만 존재', () => {
            expect(roles_1.VALID_ROLES).toHaveLength(3);
        });
    });
});
