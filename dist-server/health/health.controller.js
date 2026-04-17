"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
Object.defineProperty(exports, "HealthController", {
    enumerable: true,
    get: function() {
        return HealthController;
    }
});
const _common = require("@nestjs/common");
const _express = require("express");
const _swagger = require("@nestjs/swagger");
const _config = require("@nestjs/config");
const _authguard = require("../auth/auth.guard");
const _cacheinterceptor = require("../common/interceptors/cache.interceptor");
const _prismaservice = require("../prisma/prisma.service");
const _adminstatsservice = require("./admin-stats.service");
const _usageservice = require("./usage.service");
function _ts_decorate(decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for(var i = decorators.length - 1; i >= 0; i--)if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
}
function _ts_metadata(k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
}
function _ts_param(paramIndex, decorator) {
    return function(target, key) {
        decorator(target, key, paramIndex);
    };
}
// eslint-disable-next-line @typescript-eslint/no-require-imports
const pkg = require('../../package.json');
let HealthController = class HealthController {
    /** Lightweight health check for uptime monitoring / load balancers */ ping() {
        return {
            status: 'ok',
            timestamp: new Date().toISOString(),
            version: pkg.version,
            uptime: Math.floor(process.uptime()),
            env: process.env.NODE_ENV || 'development'
        };
    }
    /** Detailed health check including DB, memory, providers */ async check() {
        let dbStatus = 'ok';
        let resumeCount = 0;
        let userCount = 0;
        try {
            await this.prisma.$queryRaw`SELECT 1`;
            [resumeCount, userCount] = await Promise.all([
                this.prisma.resume.count(),
                this.prisma.user.count()
            ]);
        } catch  {
            dbStatus = 'error';
        }
        const providers = {
            google: !!this.config.get('GOOGLE_CLIENT_ID'),
            github: !!this.config.get('GITHUB_CLIENT_ID'),
            kakao: !!this.config.get('KAKAO_CLIENT_ID')
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
                heapUsed: Math.round(process.memoryUsage().heapUsed / 1024 / 1024)
            },
            stats: {
                resumes: resumeCount,
                users: userCount
            },
            providers
        };
    }
    async getUsage(req) {
        if (!req.user?.id) throw new _common.UnauthorizedException('로그인이 필요합니다');
        return this.usageService.getUsage(req.user.id);
    }
    /** Public site-wide counters for landing page / footer (no sensitive data) */ async publicStats() {
        const [users, resumes, views, templates, publicResumes, communityPosts, comments, jobs] = await Promise.all([
            this.prisma.user.count(),
            this.prisma.resume.count(),
            this.prisma.resume.aggregate({
                _sum: {
                    viewCount: true
                }
            }),
            this.prisma.template.count(),
            this.prisma.resume.count({
                where: {
                    visibility: 'public'
                }
            }),
            this.prisma.communityPost.count(),
            this.prisma.communityComment.count(),
            this.prisma.curatedJob.count({
                where: {
                    status: 'active'
                }
            }).catch(()=>0)
        ]);
        const todayStart = new Date();
        todayStart.setHours(0, 0, 0, 0);
        const weekStart = new Date(todayStart);
        weekStart.setDate(weekStart.getDate() - 7);
        const [todayUsers, weekUsers, todayResumes] = await Promise.all([
            this.prisma.user.count({
                where: {
                    createdAt: {
                        gte: todayStart
                    }
                }
            }),
            this.prisma.user.count({
                where: {
                    createdAt: {
                        gte: weekStart
                    }
                }
            }),
            this.prisma.resume.count({
                where: {
                    createdAt: {
                        gte: todayStart
                    }
                }
            })
        ]);
        return {
            users: {
                total: users,
                today: todayUsers,
                thisWeek: weekUsers
            },
            resumes: {
                total: resumes,
                public: publicResumes,
                today: todayResumes
            },
            activity: {
                totalViews: views._sum.viewCount || 0
            },
            content: {
                templates
            },
            community: {
                posts: communityPosts,
                comments
            },
            jobs: {
                active: jobs
            }
        };
    }
    /** Full admin stats -- requires admin role */ async adminStats(req) {
        if (!req.user?.id) throw new _common.UnauthorizedException('로그인이 필요합니다');
        if (req.user.role !== 'admin' && req.user.role !== 'superadmin') {
            throw new _common.ForbiddenException('관리자 권한이 필요합니다');
        }
        return this.statsService.getStats();
    }
    async newsRss() {
        if (this.newsCache && Date.now() - this.newsCache.time < 10 * 60_000) {
            return this.newsCache.items;
        }
        try {
            const rssUrl = 'https://news.google.com/rss/search?q=%EC%B1%84%EC%9A%A9+%EC%B7%A8%EC%97%85+%EC%9D%B4%EB%A0%A5%EC%84%9C&hl=ko&gl=KR&ceid=KR:ko';
            const r = await fetch(rssUrl, {
                headers: {
                    'User-Agent': 'Mozilla/5.0 (compatible; ResumeBot/1.0)'
                },
                signal: AbortSignal.timeout(10000)
            });
            const xml = await r.text();
            const items = [];
            const regex = /<item>[\s\S]*?<title>([\s\S]*?)<\/title>[\s\S]*?<link>([\s\S]*?)<\/link>[\s\S]*?<pubDate>([\s\S]*?)<\/pubDate>[\s\S]*?<source[^>]*>([\s\S]*?)<\/source>[\s\S]*?<\/item>/g;
            let match;
            while((match = regex.exec(xml)) && items.length < 10){
                items.push({
                    title: match[1].trim(),
                    url: match[2].trim(),
                    source: match[4].trim(),
                    pubDate: match[3].trim()
                });
            }
            this.newsCache = {
                items,
                time: Date.now()
            };
            return items;
        } catch  {
            return this.newsCache?.items || [];
        }
    }
    async getAnnouncement() {
        try {
            const config = await this.prisma.systemConfig.findFirst({
                where: {
                    key: 'announcement'
                }
            });
            if (config?.value) return JSON.parse(config.value);
        } catch  {}
        return null;
    }
    async getDraft(type, req) {
        if (!req.user?.id) throw new _common.UnauthorizedException();
        const draft = await this.prisma.draft.findUnique({
            where: {
                userId_type: {
                    userId: req.user.id,
                    type
                }
            }
        });
        if (!draft) return null;
        try {
            return JSON.parse(draft.content);
        } catch  {
            return draft.content;
        }
    }
    async saveDraft(type, body, req) {
        if (!req.user?.id) throw new _common.UnauthorizedException();
        const content = JSON.stringify(body);
        await this.prisma.draft.upsert({
            where: {
                userId_type: {
                    userId: req.user.id,
                    type
                }
            },
            update: {
                content
            },
            create: {
                userId: req.user.id,
                type,
                content
            }
        });
        return {
            success: true
        };
    }
    async deleteDraft(type, req) {
        if (!req.user?.id) throw new _common.UnauthorizedException();
        await this.prisma.draft.deleteMany({
            where: {
                userId: req.user.id,
                type
            }
        });
        return {
            success: true
        };
    }
    /** Dynamic XML sitemap including public resumes, community posts */ async sitemapXml(res) {
        const BASE = process.env.FRONTEND_URL || 'https://resume-gongbang.vercel.app';
        const now = new Date().toISOString().split('T')[0];
        const [publicResumes, communityPosts] = await Promise.all([
            this.prisma.resume.findMany({
                where: {
                    visibility: 'public',
                    slug: {
                        not: ''
                    }
                },
                select: {
                    slug: true,
                    userId: true,
                    updatedAt: true,
                    personalInfo: {
                        select: {
                            name: true
                        }
                    }
                },
                orderBy: {
                    updatedAt: 'desc'
                },
                take: 1000
            }),
            this.prisma.communityPost.findMany({
                where: {
                    isHidden: false
                },
                select: {
                    id: true,
                    updatedAt: true
                },
                orderBy: {
                    updatedAt: 'desc'
                },
                take: 500
            })
        ]);
        // Build user lookup for slug URLs
        const userIds = [
            ...new Set(publicResumes.map((r)=>r.userId).filter(Boolean))
        ];
        const users = userIds.length ? await this.prisma.user.findMany({
            where: {
                id: {
                    in: userIds
                }
            },
            select: {
                id: true,
                username: true
            }
        }) : [];
        const userMap = new Map(users.map((u)=>[
                u.id,
                u.username
            ]));
        const staticUrls = [
            {
                loc: `${BASE}/`,
                priority: '1.0',
                changefreq: 'daily'
            },
            {
                loc: `${BASE}/explore`,
                priority: '0.9',
                changefreq: 'daily'
            },
            {
                loc: `${BASE}/jobs`,
                priority: '0.9',
                changefreq: 'daily'
            },
            {
                loc: `${BASE}/templates`,
                priority: '0.8',
                changefreq: 'weekly'
            },
            {
                loc: `${BASE}/community`,
                priority: '0.8',
                changefreq: 'daily'
            },
            {
                loc: `${BASE}/interview-prep`,
                priority: '0.7',
                changefreq: 'weekly'
            },
            {
                loc: `${BASE}/about`,
                priority: '0.6',
                changefreq: 'monthly'
            },
            {
                loc: `${BASE}/tutorial`,
                priority: '0.6',
                changefreq: 'monthly'
            },
            {
                loc: `${BASE}/pricing`,
                priority: '0.6',
                changefreq: 'weekly'
            },
            {
                loc: `${BASE}/notices`,
                priority: '0.5',
                changefreq: 'weekly'
            },
            {
                loc: `${BASE}/stats`,
                priority: '0.5',
                changefreq: 'daily'
            },
            {
                loc: `${BASE}/cover-letter`,
                priority: '0.6',
                changefreq: 'weekly'
            },
            {
                loc: `${BASE}/help`,
                priority: '0.5',
                changefreq: 'monthly'
            },
            {
                loc: `${BASE}/feedback`,
                priority: '0.4',
                changefreq: 'monthly'
            },
            {
                loc: `${BASE}/terms`,
                priority: '0.3',
                changefreq: 'monthly'
            }
        ];
        const resumeUrls = publicResumes.filter((r)=>r.slug && r.userId && userMap.get(r.userId)).map((r)=>({
                loc: `${BASE}/@${encodeURIComponent(userMap.get(r.userId))}/${encodeURIComponent(r.slug)}`,
                priority: '0.7',
                changefreq: 'weekly',
                lastmod: r.updatedAt.toISOString().split('T')[0]
            }));
        const communityUrls = communityPosts.map((p)=>({
                loc: `${BASE}/community/${p.id}`,
                priority: '0.5',
                changefreq: 'weekly',
                lastmod: p.updatedAt.toISOString().split('T')[0]
            }));
        const allUrls = [
            ...staticUrls,
            ...resumeUrls,
            ...communityUrls
        ];
        const urlsXml = allUrls.map((u)=>`  <url><loc>${u.loc}</loc>${u.lastmod ? `<lastmod>${u.lastmod}</lastmod>` : `<lastmod>${now}</lastmod>`}<changefreq>${u.changefreq}</changefreq><priority>${u.priority}</priority></url>`).join('\n');
        const xml = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urlsXml}\n</urlset>`;
        res.setHeader('Content-Type', 'application/xml; charset=utf-8');
        res.send(xml);
    }
    constructor(prisma, config, statsService, usageService){
        this.prisma = prisma;
        this.config = config;
        this.statsService = statsService;
        this.usageService = usageService;
        this.newsCache = null;
    }
};
_ts_decorate([
    (0, _common.Get)(),
    (0, _authguard.Public)(),
    (0, _cacheinterceptor.CacheTTL)(10),
    (0, _swagger.ApiOperation)({
        summary: '서버 상태 확인 (간단)'
    }),
    _ts_metadata("design:type", Function),
    _ts_metadata("design:paramtypes", []),
    _ts_metadata("design:returntype", void 0)
], HealthController.prototype, "ping", null);
_ts_decorate([
    (0, _common.Get)('detailed'),
    (0, _authguard.Public)(),
    (0, _cacheinterceptor.CacheTTL)(10),
    (0, _swagger.ApiOperation)({
        summary: '서버 상태 상세 확인'
    }),
    _ts_metadata("design:type", Function),
    _ts_metadata("design:paramtypes", []),
    _ts_metadata("design:returntype", Promise)
], HealthController.prototype, "check", null);
_ts_decorate([
    (0, _common.Get)('usage'),
    (0, _swagger.ApiOperation)({
        summary: '내 사용량 조회'
    }),
    _ts_param(0, (0, _common.Req)()),
    _ts_metadata("design:type", Function),
    _ts_metadata("design:paramtypes", [
        Object
    ]),
    _ts_metadata("design:returntype", Promise)
], HealthController.prototype, "getUsage", null);
_ts_decorate([
    (0, _common.Get)('stats'),
    (0, _authguard.Public)(),
    (0, _cacheinterceptor.CacheTTL)(60),
    (0, _swagger.ApiOperation)({
        summary: '공개 사이트 통계 (사용자수, 이력서수, 조회수)'
    }),
    _ts_metadata("design:type", Function),
    _ts_metadata("design:paramtypes", []),
    _ts_metadata("design:returntype", Promise)
], HealthController.prototype, "publicStats", null);
_ts_decorate([
    (0, _common.Get)('admin/stats'),
    (0, _cacheinterceptor.CacheTTL)(30),
    (0, _swagger.ApiOperation)({
        summary: '관리자 통계 (사이트 전체)'
    }),
    _ts_param(0, (0, _common.Req)()),
    _ts_metadata("design:type", Function),
    _ts_metadata("design:paramtypes", [
        Object
    ]),
    _ts_metadata("design:returntype", Promise)
], HealthController.prototype, "adminStats", null);
_ts_decorate([
    (0, _common.Get)('news-rss'),
    (0, _authguard.Public)(),
    (0, _cacheinterceptor.CacheTTL)(600),
    (0, _swagger.ApiOperation)({
        summary: '채용 뉴스 (JSON, 10분 캐시)'
    }),
    _ts_metadata("design:type", Function),
    _ts_metadata("design:paramtypes", []),
    _ts_metadata("design:returntype", Promise)
], HealthController.prototype, "newsRss", null);
_ts_decorate([
    (0, _common.Get)('announcement'),
    (0, _authguard.Public)(),
    (0, _cacheinterceptor.CacheTTL)(60),
    (0, _swagger.ApiOperation)({
        summary: '공지 배너 조회'
    }),
    _ts_metadata("design:type", Function),
    _ts_metadata("design:paramtypes", []),
    _ts_metadata("design:returntype", Promise)
], HealthController.prototype, "getAnnouncement", null);
_ts_decorate([
    (0, _common.Get)('drafts/:type'),
    (0, _swagger.ApiOperation)({
        summary: '임시저장 조회'
    }),
    _ts_param(0, (0, _common.Param)('type')),
    _ts_param(1, (0, _common.Req)()),
    _ts_metadata("design:type", Function),
    _ts_metadata("design:paramtypes", [
        String,
        Object
    ]),
    _ts_metadata("design:returntype", Promise)
], HealthController.prototype, "getDraft", null);
_ts_decorate([
    (0, _common.Put)('drafts/:type'),
    (0, _swagger.ApiOperation)({
        summary: '임시저장 저장/갱신'
    }),
    _ts_param(0, (0, _common.Param)('type')),
    _ts_param(1, (0, _common.Body)()),
    _ts_param(2, (0, _common.Req)()),
    _ts_metadata("design:type", Function),
    _ts_metadata("design:paramtypes", [
        String,
        Object,
        Object
    ]),
    _ts_metadata("design:returntype", Promise)
], HealthController.prototype, "saveDraft", null);
_ts_decorate([
    (0, _common.Delete)('drafts/:type'),
    (0, _swagger.ApiOperation)({
        summary: '임시저장 삭제'
    }),
    _ts_param(0, (0, _common.Param)('type')),
    _ts_param(1, (0, _common.Req)()),
    _ts_metadata("design:type", Function),
    _ts_metadata("design:paramtypes", [
        String,
        Object
    ]),
    _ts_metadata("design:returntype", Promise)
], HealthController.prototype, "deleteDraft", null);
_ts_decorate([
    (0, _common.Get)('sitemap.xml'),
    (0, _authguard.Public)(),
    (0, _cacheinterceptor.CacheTTL)(3600),
    (0, _swagger.ApiOperation)({
        summary: '동적 XML 사이트맵'
    }),
    _ts_param(0, (0, _common.Res)()),
    _ts_metadata("design:type", Function),
    _ts_metadata("design:paramtypes", [
        typeof _express.Response === "undefined" ? Object : _express.Response
    ]),
    _ts_metadata("design:returntype", Promise)
], HealthController.prototype, "sitemapXml", null);
HealthController = _ts_decorate([
    (0, _swagger.ApiTags)('health'),
    (0, _common.Controller)('health'),
    _ts_metadata("design:type", Function),
    _ts_metadata("design:paramtypes", [
        typeof _prismaservice.PrismaService === "undefined" ? Object : _prismaservice.PrismaService,
        typeof _config.ConfigService === "undefined" ? Object : _config.ConfigService,
        typeof _adminstatsservice.AdminStatsService === "undefined" ? Object : _adminstatsservice.AdminStatsService,
        typeof _usageservice.UsageService === "undefined" ? Object : _usageservice.UsageService
    ])
], HealthController);
