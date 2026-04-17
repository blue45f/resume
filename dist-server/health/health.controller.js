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
            uptime: Math.floor(process.uptime()),
            env: process.env.NODE_ENV || 'development',
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
        const [users, resumes, views, templates, publicResumes, communityPosts, comments, jobs] = await Promise.all([
            this.prisma.user.count(),
            this.prisma.resume.count(),
            this.prisma.resume.aggregate({ _sum: { viewCount: true } }),
            this.prisma.template.count(),
            this.prisma.resume.count({ where: { visibility: 'public' } }),
            this.prisma.communityPost.count(),
            this.prisma.communityComment.count(),
            this.prisma.curatedJob.count({ where: { status: 'active' } }).catch(() => 0),
        ]);
        const todayStart = new Date();
        todayStart.setHours(0, 0, 0, 0);
        const weekStart = new Date(todayStart);
        weekStart.setDate(weekStart.getDate() - 7);
        const [todayUsers, weekUsers, todayResumes] = await Promise.all([
            this.prisma.user.count({ where: { createdAt: { gte: todayStart } } }),
            this.prisma.user.count({ where: { createdAt: { gte: weekStart } } }),
            this.prisma.resume.count({ where: { createdAt: { gte: todayStart } } }),
        ]);
        return {
            users: { total: users, today: todayUsers, thisWeek: weekUsers },
            resumes: { total: resumes, public: publicResumes, today: todayResumes },
            activity: { totalViews: views._sum.viewCount || 0 },
            content: { templates },
            community: { posts: communityPosts, comments },
            jobs: { active: jobs },
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
    newsCache = null;
    async newsRss() {
        if (this.newsCache && Date.now() - this.newsCache.time < 10 * 60_000) {
            return this.newsCache.items;
        }
        try {
            const rssUrl = 'https://news.google.com/rss/search?q=%EC%B1%84%EC%9A%A9+%EC%B7%A8%EC%97%85+%EC%9D%B4%EB%A0%A5%EC%84%9C&hl=ko&gl=KR&ceid=KR:ko';
            const r = await fetch(rssUrl, { headers: { 'User-Agent': 'Mozilla/5.0 (compatible; ResumeBot/1.0)' }, signal: AbortSignal.timeout(10000) });
            const xml = await r.text();
            const items = [];
            const regex = /<item>[\s\S]*?<title>([\s\S]*?)<\/title>[\s\S]*?<link>([\s\S]*?)<\/link>[\s\S]*?<pubDate>([\s\S]*?)<\/pubDate>[\s\S]*?<source[^>]*>([\s\S]*?)<\/source>[\s\S]*?<\/item>/g;
            let match;
            while ((match = regex.exec(xml)) && items.length < 10) {
                items.push({ title: match[1].trim(), url: match[2].trim(), source: match[4].trim(), pubDate: match[3].trim() });
            }
            this.newsCache = { items, time: Date.now() };
            return items;
        }
        catch {
            return this.newsCache?.items || [];
        }
    }
    async getAnnouncement() {
        try {
            const config = await this.prisma.systemConfig.findFirst({ where: { key: 'announcement' } });
            if (config?.value)
                return JSON.parse(config.value);
        }
        catch { }
        return null;
    }
    async getDraft(type, req) {
        if (!req.user?.id)
            throw new common_1.UnauthorizedException();
        const draft = await this.prisma.draft.findUnique({ where: { userId_type: { userId: req.user.id, type } } });
        if (!draft)
            return null;
        try {
            return JSON.parse(draft.content);
        }
        catch {
            return draft.content;
        }
    }
    async saveDraft(type, body, req) {
        if (!req.user?.id)
            throw new common_1.UnauthorizedException();
        const content = JSON.stringify(body);
        await this.prisma.draft.upsert({
            where: { userId_type: { userId: req.user.id, type } },
            update: { content },
            create: { userId: req.user.id, type, content },
        });
        return { success: true };
    }
    async deleteDraft(type, req) {
        if (!req.user?.id)
            throw new common_1.UnauthorizedException();
        await this.prisma.draft.deleteMany({ where: { userId: req.user.id, type } });
        return { success: true };
    }
    async sitemapXml(res) {
        const BASE = process.env.FRONTEND_URL || 'https://resume-gongbang.vercel.app';
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
            { loc: `${BASE}/stats`, priority: '0.5', changefreq: 'daily' },
            { loc: `${BASE}/cover-letter`, priority: '0.6', changefreq: 'weekly' },
            { loc: `${BASE}/help`, priority: '0.5', changefreq: 'monthly' },
            { loc: `${BASE}/feedback`, priority: '0.4', changefreq: 'monthly' },
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
    (0, common_1.Get)('news-rss'),
    (0, auth_guard_1.Public)(),
    (0, cache_interceptor_1.CacheTTL)(600),
    (0, swagger_1.ApiOperation)({ summary: '채용 뉴스 (JSON, 10분 캐시)' }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], HealthController.prototype, "newsRss", null);
__decorate([
    (0, common_1.Get)('announcement'),
    (0, auth_guard_1.Public)(),
    (0, cache_interceptor_1.CacheTTL)(60),
    (0, swagger_1.ApiOperation)({ summary: '공지 배너 조회' }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], HealthController.prototype, "getAnnouncement", null);
__decorate([
    (0, common_1.Get)('drafts/:type'),
    (0, swagger_1.ApiOperation)({ summary: '임시저장 조회' }),
    __param(0, (0, common_1.Param)('type')),
    __param(1, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], HealthController.prototype, "getDraft", null);
__decorate([
    (0, common_1.Put)('drafts/:type'),
    (0, swagger_1.ApiOperation)({ summary: '임시저장 저장/갱신' }),
    __param(0, (0, common_1.Param)('type')),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object, Object]),
    __metadata("design:returntype", Promise)
], HealthController.prototype, "saveDraft", null);
__decorate([
    (0, common_1.Delete)('drafts/:type'),
    (0, swagger_1.ApiOperation)({ summary: '임시저장 삭제' }),
    __param(0, (0, common_1.Param)('type')),
    __param(1, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], HealthController.prototype, "deleteDraft", null);
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
