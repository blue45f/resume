"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
const _roles = require("./roles");
describe('roles utility', ()=>{
    describe('isAdmin', ()=>{
        it('admin 역할 → true', ()=>{
            expect((0, _roles.isAdmin)('admin')).toBe(true);
        });
        it('superadmin 역할 → true', ()=>{
            expect((0, _roles.isAdmin)('superadmin')).toBe(true);
        });
        it('user 역할 → false', ()=>{
            expect((0, _roles.isAdmin)('user')).toBe(false);
        });
        it('undefined → false', ()=>{
            expect((0, _roles.isAdmin)(undefined)).toBe(false);
        });
        it('빈 문자열 → false', ()=>{
            expect((0, _roles.isAdmin)('')).toBe(false);
        });
        it('임의 문자열 → false', ()=>{
            expect((0, _roles.isAdmin)('manager')).toBe(false);
        });
    });
    describe('isSuperAdmin', ()=>{
        it('superadmin 역할 → true', ()=>{
            expect((0, _roles.isSuperAdmin)('superadmin')).toBe(true);
        });
        it('admin 역할 → false', ()=>{
            expect((0, _roles.isSuperAdmin)('admin')).toBe(false);
        });
        it('user 역할 → false', ()=>{
            expect((0, _roles.isSuperAdmin)('user')).toBe(false);
        });
        it('undefined → false', ()=>{
            expect((0, _roles.isSuperAdmin)(undefined)).toBe(false);
        });
        it('빈 문자열 → false', ()=>{
            expect((0, _roles.isSuperAdmin)('')).toBe(false);
        });
    });
    describe('VALID_ROLES', ()=>{
        it('user, admin, superadmin 포함', ()=>{
            expect(_roles.VALID_ROLES).toEqual([
                'user',
                'admin',
                'superadmin'
            ]);
        });
        it('3개 역할만 존재', ()=>{
            expect(_roles.VALID_ROLES).toHaveLength(3);
        });
    });
});
