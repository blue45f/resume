import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { PrismaService } from '../prisma/prisma.service';

/**
 * 만료된 ResumeViewer (selective 공개 화이트리스트) 자동 정리.
 *
 * - 매일 03:00 UTC (한국 12:00 KST) 실행
 * - expiresAt < now 인 row 삭제
 * - 만료된 JobUrlCache (>24h 이전) 도 같이 정리
 *
 * findOne 의 access check 가 이미 expiresAt 검증을 하므로 보안 측면에선 cleanup 안 해도 안전.
 * 이 서비스는 단순히 누적 row 가 무한 증가하는 것을 막는 hygiene 용도.
 */
@Injectable()
export class ResumeViewerCleanupService {
  private readonly logger = new Logger(ResumeViewerCleanupService.name);

  constructor(private prisma: PrismaService) {}

  @Cron(CronExpression.EVERY_DAY_AT_3AM)
  async cleanupExpired() {
    try {
      const now = new Date();

      // ResumeViewer: 만료 지난 항목 제거
      const viewers = await this.prisma.resumeViewer.deleteMany({
        where: {
          expiresAt: { not: null, lt: now },
        },
      });

      // JobUrlCache: 24시간 지난 항목 제거 (TTL 만료)
      const dayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
      const cache = await this.prisma.jobUrlCache.deleteMany({
        where: { createdAt: { lt: dayAgo } },
      });

      if (viewers.count > 0 || cache.count > 0) {
        this.logger.log(
          `cleanup: removed ${viewers.count} expired viewers, ${cache.count} stale URL cache rows`,
        );
      }
    } catch (err) {
      this.logger.warn(`cleanup 실패: ${(err as Error).message}`);
    }
  }
}
