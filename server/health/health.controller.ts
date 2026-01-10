import { Controller, Get } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { ConfigService } from '@nestjs/config';
import { Public } from '../auth/auth.guard';
import { PrismaService } from '../prisma/prisma.service';

// eslint-disable-next-line @typescript-eslint/no-require-imports
const pkg = require('../../package.json');

@ApiTags('health')
@Controller('health')
export class HealthController {
  constructor(
    private readonly prisma: PrismaService,
    private readonly config: ConfigService,
  ) {}

  @Get()
  @Public()
  @ApiOperation({ summary: '서버 상태 확인' })
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

    return {
      status: dbStatus === 'ok' ? 'ok' : 'degraded',
      version: pkg.version as string,
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
}
