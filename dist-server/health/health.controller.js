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
exports.HealthController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const config_1 = require("@nestjs/config");
const auth_guard_1 = require("../auth/auth.guard");
const cache_interceptor_1 = require("../common/interceptors/cache.interceptor");
const prisma_service_1 = require("../prisma/prisma.service");
const pkg = require('../../package.json');
let HealthController = class HealthController {
    prisma;
    config;
    constructor(prisma, config) {
        this.prisma = prisma;
        this.config = config;
    }
    async check() {
        let dbStatus = 'ok';
        let resumeCount = 0;
        let userCount = 0;
        try {
            await this.prisma.$queryRaw `SELECT 1`;
            [resumeCount, userCount] = await Promise.all([
                this.prisma.resume.count(),
                this.prisma.user.count(),
            ]);
        }
        catch {
            dbStatus = 'error';
        }
        const providers = {
            google: !!this.config.get('GOOGLE_CLIENT_ID'),
            github: !!this.config.get('GITHUB_CLIENT_ID'),
            kakao: !!this.config.get('KAKAO_CLIENT_ID'),
        };
        return {
            status: dbStatus === 'ok' ? 'ok' : 'degraded',
            version: pkg.version,
            environment: process.env.NODE_ENV || 'development',
            timestamp: new Date().toISOString(),
            uptime: process.uptime(),
            database: dbStatus,
            memory: {
                rss: Math.round(process.memoryUsage().rss / 1024 / 1024),
                heapUsed: Math.round(process.memoryUsage().heapUsed / 1024 / 1024),
            },
            stats: { resumes: resumeCount, users: userCount },
            providers,
        };
    }
};
exports.HealthController = HealthController;
__decorate([
    (0, common_1.Get)(),
    (0, auth_guard_1.Public)(),
    (0, cache_interceptor_1.CacheTTL)(10),
    (0, swagger_1.ApiOperation)({ summary: '서버 상태 확인' }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], HealthController.prototype, "check", null);
exports.HealthController = HealthController = __decorate([
    (0, swagger_1.ApiTags)('health'),
    (0, common_1.Controller)('health'),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        config_1.ConfigService])
], HealthController);
