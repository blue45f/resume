"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
Object.defineProperty(exports, "SystemConfigService", {
    enumerable: true,
    get: function() {
        return SystemConfigService;
    }
});
const _common = require("@nestjs/common");
const _prismaservice = require("../prisma/prisma.service");
function _ts_decorate(decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for(var i = decorators.length - 1; i >= 0; i--)if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
}
function _ts_metadata(k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
}
let SystemConfigService = class SystemConfigService {
    async getAll() {
        return this.prisma.systemConfig.findMany({
            orderBy: {
                key: 'asc'
            }
        });
    }
    async get(key) {
        const config = await this.prisma.systemConfig.findUnique({
            where: {
                key
            }
        });
        return config?.value ?? null;
    }
    async getBoolean(key, defaultValue = false) {
        const val = await this.get(key);
        if (val === null) return defaultValue;
        return val === 'true';
    }
    async getNumber(key, defaultValue = 0) {
        const val = await this.get(key);
        if (val === null) return defaultValue;
        const n = parseInt(val, 10);
        return isNaN(n) ? defaultValue : n;
    }
    async set(key, value) {
        return this.prisma.systemConfig.upsert({
            where: {
                key
            },
            update: {
                value
            },
            create: {
                key,
                value
            }
        });
    }
    async setMany(configs) {
        return Promise.all(configs.map((c)=>this.set(c.key, c.value)));
    }
    async getPublicConfig() {
        const keys = [
            'site_name',
            'site_description',
            'monetization_enabled',
            'maintenance_mode',
            'allow_signup'
        ];
        const configs = await this.prisma.systemConfig.findMany({
            where: {
                key: {
                    in: keys
                }
            }
        });
        return Object.fromEntries(configs.map((c)=>[
                c.key,
                c.value
            ]));
    }
    async getPermissions() {
        const keys = Object.keys(SystemConfigService.PERMISSION_DEFAULTS);
        const configs = await this.prisma.systemConfig.findMany({
            where: {
                key: {
                    in: keys
                }
            }
        });
        const stored = Object.fromEntries(configs.map((c)=>[
                c.key,
                c.value
            ]));
        return {
            ...SystemConfigService.PERMISSION_DEFAULTS,
            ...stored
        };
    }
    async setPermissions(perms) {
        const validKeys = new Set(Object.keys(SystemConfigService.PERMISSION_DEFAULTS));
        const configs = Object.entries(perms).filter(([k])=>validKeys.has(k)).map(([key, value])=>({
                key,
                value
            }));
        await this.setMany(configs);
        return this.getPermissions();
    }
    async checkPermission(permKey, user, authorId) {
        const perms = await this.getPermissions();
        const allowed = (perms[permKey] || 'admin').split(',').map((r)=>r.trim());
        if (allowed.includes('all')) return true;
        if (!user) return false;
        const isAdmin = user.role === 'admin' || user.role === 'superadmin';
        const isRecruiter = user.userType === 'recruiter' || user.userType === 'company';
        const isAuthor = authorId ? user.id === authorId : false;
        if (allowed.includes('admin') && isAdmin) return true;
        if (allowed.includes('recruiter') && isRecruiter) return true;
        if (allowed.includes('author') && isAuthor) return true;
        if (allowed.includes('user') && user.id) return true;
        return false;
    }
    constructor(prisma){
        this.prisma = prisma;
    }
};
// ── Content Permissions ─────────────────────────────────────────────
SystemConfigService.PERMISSION_DEFAULTS = {
    'perm.curatedJobs.create': 'admin,recruiter',
    'perm.curatedJobs.edit': 'admin,recruiter,author',
    'perm.curatedJobs.delete': 'admin,author',
    'perm.externalLinks.create': 'admin',
    'perm.externalLinks.edit': 'admin',
    'perm.externalLinks.delete': 'admin',
    'perm.jobPosts.create': 'admin,recruiter',
    'perm.jobPosts.edit': 'admin,recruiter,author',
    'perm.jobPosts.delete': 'admin,author',
    'perm.notices.create': 'admin',
    'perm.notices.edit': 'admin',
    'perm.notices.delete': 'admin',
    'perm.community.create': 'all',
    'perm.community.edit': 'admin,author',
    'perm.community.delete': 'admin,author',
    'perm.banners.create': 'admin',
    'perm.banners.edit': 'admin',
    'perm.banners.delete': 'admin'
};
SystemConfigService = _ts_decorate([
    (0, _common.Injectable)(),
    _ts_metadata("design:type", Function),
    _ts_metadata("design:paramtypes", [
        typeof _prismaservice.PrismaService === "undefined" ? Object : _prismaservice.PrismaService
    ])
], SystemConfigService);
