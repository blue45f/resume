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
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.HealthController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const config_1 = require("@nestjs/config");
const auth_guard_1 = require("../auth/auth.guard");
const cache_interceptor_1 = require("../common/interceptors/cache.interceptor");
const prisma_service_1 = require("../prisma/prisma.service");
const admin_stats_service_1 = require("./admin-stats.service");
const usage_service_1 = require("./usage.service");
const pkg = require('../../package.json');
let HealthController = class HealthController {
    prisma;
    config;
    statsService;
    usageService;
    constructor(prisma, config, statsService, usageService) {
        this.prisma = prisma;
        this.config = config;
        this.statsService = statsService;
        this.usageService = usageService;
    }
    ping() {
        return {
            status: 'ok',
            timestamp: new Date().toISOString(),
            version: pkg.version,
        };
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
        const cloudinaryConfigured = !!(process.env.CLOUDINARY_CLOUD_NAME && process.env.CLOUDINARY_API_KEY);
        return {
            status: dbStatus === 'ok' ? 'ok' : 'degraded',
            version: pkg.version,
            environment: process.env.NODE_ENV || 'development',
            timestamp: new Date().toISOString(),
            uptime: process.uptime(),
            database: dbStatus,
            storage: cloudinaryConfigured ? 'cloudinary' : 'database',
            memory: {
                rss: Math.round(process.memoryUsage().rss / 1024 / 1024),
                heapUsed: Math.round(process.memoryUsage().heapUsed / 1024 / 1024),
            },
            stats: { resumes: resumeCount, users: userCount },
            providers,
        };
    }
    async getUsage(req) {
        if (!req.user?.id)
            throw new common_1.UnauthorizedException('로그인이 필요합니다');
        return this.usageService.getUsage(req.user.id);
    }
    async publicStats() {
        const [users, resumes, views, templates] = await Promise.all([
            this.prisma.user.count(),
            this.prisma.resume.count(),
            this.prisma.resume.aggregate({ _sum: { viewCount: true } }),
            this.prisma.template.count(),
        ]);
        return {
            users: { total: users },
            resumes: { total: resumes },
            activity: { totalViews: views._sum.viewCount || 0 },
            content: { templates },
        };
    }
    async adminStats(req) {
        if (!req.user?.id)
            throw new common_1.UnauthorizedException('로그인이 필요합니다');
        if (req.user.role !== 'admin' && req.user.role !== 'superadmin') {
            throw new common_1.ForbiddenException('관리자 권한이 필요합니다');
        }
        return this.statsService.getStats();
    }
    async sitemapXml(res) {
        const BASE = process.env.FRONTEND_URL || 'https://resume-silk-three.vercel.app';
        const now = new Date().toISOString().split('T')[0];
        const [publicResumes, communityPosts] = await Promise.all([
            this.prisma.resume.findMany({
                where: { visibility: 'public', slug: { not: '' } },
                select: { slug: true, userId: true, updatedAt: true, personalInfo: { select: { name: true } } },
                orderBy: { updatedAt: 'desc' },
                take: 1000,
            }),
            this.prisma.communityPost.findMany({
                where: { isHidden: false },
                select: { id: true, updatedAt: true },
                orderBy: { updatedAt: 'desc' },
                take: 500,
            }),
        ]);
        const userIds = [...new Set(publicResumes.map(r => r.userId).filter(Boolean))];
        const users = userIds.length
            ? await this.prisma.user.findMany({ where: { id: { in: userIds } }, select: { id: true, username: true } })
            : [];
        const userMap = new Map(users.map(u => [u.id, u.username]));
        const staticUrls = [
            { loc: `${BASE}/`, priority: '1.0', changefreq: 'daily' },
            { loc: `${BASE}/explore`, priority: '0.9', changefreq: 'daily' },
            { loc: `${BASE}/jobs`, priority: '0.9', changefreq: 'daily' },
            { loc: `${BASE}/templates`, priority: '0.8', changefreq: 'weekly' },
            { loc: `${BASE}/community`, priority: '0.8', changefreq: 'daily' },
            { loc: `${BASE}/interview-prep`, priority: '0.7', changefreq: 'weekly' },
            { loc: `${BASE}/about`, priority: '0.6', changefreq: 'monthly' },
            { loc: `${BASE}/tutorial`, priority: '0.6', changefreq: 'monthly' },
            { loc: `${BASE}/pricing`, priority: '0.6', changefreq: 'weekly' },
            { loc: `${BASE}/notices`, priority: '0.5', changefreq: 'weekly' },
            { loc: `${BASE}/terms`, priority: '0.3', changefreq: 'monthly' },
        ];
        const resumeUrls = publicResumes
            .filter(r => r.slug && r.userId && userMap.get(r.userId))
            .map(r => ({
            loc: `${BASE}/@${encodeURIComponent(userMap.get(r.userId))}/${encodeURIComponent(r.slug)}`,
            priority: '0.7',
            changefreq: 'weekly',
            lastmod: r.updatedAt.toISOString().split('T')[0],
        }));
        const communityUrls = communityPosts.map(p => ({
            loc: `${BASE}/community/${p.id}`,
            priority: '0.5',
            changefreq: 'weekly',
            lastmod: p.updatedAt.toISOString().split('T')[0],
        }));
        const allUrls = [...staticUrls, ...resumeUrls, ...communityUrls];
        const urlsXml = allUrls.map(u => `  <url><loc>${u.loc}</loc>${u.lastmod ? `<lastmod>${u.lastmod}</lastmod>` : `<lastmod>${now}</lastmod>`}<changefreq>${u.changefreq}</changefreq><priority>${u.priority}</priority></url>`).join('\n');
        const xml = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urlsXml}\n</urlset>`;
        res.setHeader('Content-Type', 'application/xml; charset=utf-8');
        res.send(xml);
    }
};
exports.HealthController = HealthController;
__decorate([
    (0, common_1.Get)(),
    (0, auth_guard_1.Public)(),
    (0, cache_interceptor_1.CacheTTL)(10),
    (0, swagger_1.ApiOperation)({ summary: '서버 상태 확인 (간단)' }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], HealthController.prototype, "ping", null);
__decorate([
    (0, common_1.Get)('detailed'),
    (0, auth_guard_1.Public)(),
    (0, cache_interceptor_1.CacheTTL)(10),
    (0, swagger_1.ApiOperation)({ summary: '서버 상태 상세 확인' }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], HealthController.prototype, "check", null);
__decorate([
    (0, common_1.Get)('usage'),
    (0, swagger_1.ApiOperation)({ summary: '내 사용량 조회' }),
    __param(0, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], HealthController.prototype, "getUsage", null);
__decorate([
    (0, common_1.Get)('stats'),
    (0, auth_guard_1.Public)(),
    (0, cache_interceptor_1.CacheTTL)(60),
    (0, swagger_1.ApiOperation)({ summary: '공개 사이트 통계 (사용자수, 이력서수, 조회수)' }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], HealthController.prototype, "publicStats", null);
__decorate([
    (0, common_1.Get)('admin/stats'),
    (0, cache_interceptor_1.CacheTTL)(30),
    (0, swagger_1.ApiOperation)({ summary: '관리자 통계 (사이트 전체)' }),
    __param(0, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], HealthController.prototype, "adminStats", null);
__decorate([
    (0, common_1.Get)('sitemap.xml'),
    (0, auth_guard_1.Public)(),
    (0, cache_interceptor_1.CacheTTL)(3600),
    (0, swagger_1.ApiOperation)({ summary: '동적 XML 사이트맵' }),
    __param(0, (0, common_1.Res)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], HealthController.prototype, "sitemapXml", null);
exports.HealthController = HealthController = __decorate([
    (0, swagger_1.ApiTags)('health'),
    (0, common_1.Controller)('health'),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        config_1.ConfigService,
        admin_stats_service_1.AdminStatsService,
        usage_service_1.UsageService])
], HealthController);
