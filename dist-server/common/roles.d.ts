export type Role = 'superadmin' | 'admin' | 'user';
export declare function isAdmin(role?: string): boolean;
export declare function isSuperAdmin(role?: string): boolean;
export declare const VALID_ROLES: Role[];
