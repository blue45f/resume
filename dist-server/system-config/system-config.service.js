"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.SystemConfigService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
let SystemConfigService = class SystemConfigService {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    async getAll() {
        return this.prisma.systemConfig.findMany({ orderBy: { key: 'asc' } });
    }
    async get(key) {
        const config = await this.prisma.systemConfig.findUnique({ where: { key } });
        return config?.value ?? null;
    }
    async getBoolean(key, defaultValue = false) {
        const val = await this.get(key);
        if (val === null)
            return defaultValue;
        return val === 'true';
    }
    async getNumber(key, defaultValue = 0) {
        const val = await this.get(key);
        if (val === null)
            return defaultValue;
        const n = parseInt(val, 10);
        return isNaN(n) ? defaultValue : n;
    }
    async set(key, value) {
        return this.prisma.systemConfig.upsert({
            where: { key },
            update: { value },
            create: { key, value },
        });
    }
    async setMany(configs) {
        return Promise.all(configs.map(c => this.set(c.key, c.value)));
    }
    async getPublicConfig() {
        const keys = ['site_name', 'site_description', 'monetization_enabled', 'maintenance_mode', 'allow_signup'];
        const configs = await this.prisma.systemConfig.findMany({ where: { key: { in: keys } } });
        return Object.fromEntries(configs.map(c => [c.key, c.value]));
    }
};
exports.SystemConfigService = SystemConfigService;
exports.SystemConfigService = SystemConfigService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], SystemConfigService);
