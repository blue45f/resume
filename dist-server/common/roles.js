/**
 * 역할 계층:
 * - superadmin: 모든 권한 (사용자 역할 변경, 요금제 설정, 시스템 설정)
 * - admin: 콘텐츠 관리 (이력서/댓글 삭제, 사용자 목록 조회)
 * - user: 일반 사용자
 */ "use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
function _export(target, all) {
    for(var name in all)Object.defineProperty(target, name, {
        enumerable: true,
        get: Object.getOwnPropertyDescriptor(all, name).get
    });
}
_export(exports, {
    get VALID_ROLES () {
        return VALID_ROLES;
    },
    get isAdmin () {
        return isAdmin;
    },
    get isSuperAdmin () {
        return isSuperAdmin;
    }
});
function isAdmin(role) {
    return role === 'admin' || role === 'superadmin';
}
function isSuperAdmin(role) {
    return role === 'superadmin';
}
const VALID_ROLES = [
    'user',
    'admin',
    'superadmin'
];
