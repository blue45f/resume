import { Controller, Get, Req, UnauthorizedException, ForbiddenException } from '@nestjs/common';
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
}
