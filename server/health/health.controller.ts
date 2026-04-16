import { Controller, Get, Req, Res, UnauthorizedException, ForbiddenException } from '@nestjs/common';
import { Response } from 'express';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { ConfigService } from '@nestjs/config';
import { Public } from '../auth/auth.guard';
import { CacheTTL } from '../common/interceptors/cache.interceptor';
import { PrismaService } from '../prisma/prisma.service';
import { AdminStatsService } from './admin-stats.service';
import { UsageService } from './usage.service';

// eslint-disable-next-line @typescript-eslint/no-require-imports
const pkg = require('../../package.json');

@ApiTags('health')
@Controller('health')
export class HealthController {
  constructor(
    private readonly prisma: PrismaService,
    private readonly config: ConfigService,
    private readonly statsService: AdminStatsService,
    private readonly usageService: UsageService,
  ) {}

  /** Lightweight health check for uptime monitoring / load balancers */
  @Get()
  @Public()
  @CacheTTL(10)
  @ApiOperation({ summary: '서버 상태 확인 (간단)' })
  ping() {
    return {
      status: 'ok',
      timestamp: new Date().toISOString(),
      version: pkg.version as string,
    };
  }

  /** Detailed health check including DB, memory, providers */
  @Get('detailed')
  @Public()
  @CacheTTL(10)
  @ApiOperation({ summary: '서버 상태 상세 확인' })
  async check() {
    let dbStatus = 'ok';
    let resumeCount = 0;
    let userCount = 0;
    try {
      await this.prisma.$queryRaw`SELECT 1`;
      [resumeCount, userCount] = await Promise.all([
        this.prisma.resume.count(),
        this.prisma.user.count(),
      ]);
    } catch {
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
      version: pkg.version as string,
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

  @Get('usage')
  @ApiOperation({ summary: '내 사용량 조회' })
  async getUsage(@Req() req: any) {
    if (!req.user?.id) throw new UnauthorizedException('로그인이 필요합니다');
    return this.usageService.getUsage(req.user.id);
  }

  /** Public site-wide counters for landing page / footer (no sensitive data) */
  @Get('stats')
  @Public()
  @CacheTTL(60)
  @ApiOperation({ summary: '공개 사이트 통계 (사용자수, 이력서수, 조회수)' })
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

  /** Full admin stats -- requires admin role */
  @Get('admin/stats')
  @CacheTTL(30)
  @ApiOperation({ summary: '관리자 통계 (사이트 전체)' })
  async adminStats(@Req() req: any) {
    if (!req.user?.id) throw new UnauthorizedException('로그인이 필요합니다');
    if (req.user.role !== 'admin' && req.user.role !== 'superadmin') {
      throw new ForbiddenException('관리자 권한이 필요합니다');
    }
    return this.statsService.getStats();
  }

  /** Dynamic XML sitemap including public resumes, community posts */
  @Get('sitemap.xml')
  @Public()
  @CacheTTL(3600)
  @ApiOperation({ summary: '동적 XML 사이트맵' })
  async sitemapXml(@Res() res: Response) {
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

    // Build user lookup for slug URLs
    const userIds = [...new Set(publicResumes.map(r => r.userId).filter(Boolean) as string[])];
    const users = userIds.length
      ? await this.prisma.user.findMany({ where: { id: { in: userIds } }, select: { id: true, username: true } })
      : [];
    const userMap = new Map(users.map(u => [u.id, u.username]));

    const staticUrls: Array<{ loc: string; priority: string; changefreq: string; lastmod?: string }> = [
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
        loc: `${BASE}/@${encodeURIComponent(userMap.get(r.userId!)!)}/${encodeURIComponent(r.slug)}`,
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
    const urlsXml = allUrls.map(u =>
      `  <url><loc>${u.loc}</loc>${u.lastmod ? `<lastmod>${u.lastmod}</lastmod>` : `<lastmod>${now}</lastmod>`}<changefreq>${u.changefreq}</changefreq><priority>${u.priority}</priority></url>`
    ).join('\n');

    const xml = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urlsXml}\n</urlset>`;
    res.setHeader('Content-Type', 'application/xml; charset=utf-8');
    res.send(xml);
  }
}
