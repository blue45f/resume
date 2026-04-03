"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.VALID_ROLES = void 0;
exports.isAdmin = isAdmin;
exports.isSuperAdmin = isSuperAdmin;
function isAdmin(role) {
    return role === 'admin' || role === 'superadmin';
}
function isSuperAdmin(role) {
    return role === 'superadmin';
}
exports.VALID_ROLES = ['user', 'admin', 'superadmin'];
