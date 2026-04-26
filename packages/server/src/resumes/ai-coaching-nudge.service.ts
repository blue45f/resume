import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { PrismaService } from '../prisma/prisma.service';
import { NotificationsService } from '../notifications/notifications.service';

/**
 * 주간 AI 코칭 nudge — 활성 사용자에게 이력서 개선 제안 1개 자동 알림.
 *
 * - 매주 일요일 06:00 UTC (= 일요일 15:00 KST, 주말 막바지) 실행
 * - 대상: 이력서 1개 이상 + 지난 7일 내 nudge 알림 받지 않은 사용자
 * - LLM 호출 없음 — 간단한 휴리스틱(경력/기술 부족, 자기소개 비어있음, 60일 이상 미수정)으로
 *   가장 영향 큰 항목 1개 선택. 비용 0, 빠르게 모든 사용자 커버.
 *
 * Why heuristic over LLM:
 * - 1000명 사용자 × 매주 = 4000 LLM call/월. 비용 절약.
 * - 휴리스틱이 80% 정확하면 충분 (사용자가 알림 받고 직접 분석 페이지로 이동).
 * - 추후 user.plan === 'pro' 인 사용자에게만 LLM 기반 개인화 nudge 가능.
 */
@Injectable()
export class AiCoachingNudgeService {
  private readonly logger = new Logger(AiCoachingNudgeService.name);

  constructor(
    private prisma: PrismaService,
    private notifications: NotificationsService,
  ) {}

  // 매주 일요일 06:00 UTC (= 15:00 KST 일요일 오후)
  @Cron('0 6 * * 0')
  async sendWeeklyNudges() {
    try {
      const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

      // 최근 7일 내 nudge 알림 받지 않은 활성 사용자
      const recentNudges = await this.prisma.notification.findMany({
        where: {
          type: 'coaching_nudge',
          createdAt: { gte: sevenDaysAgo },
        },
        select: { userId: true },
      });
      const recentlyNudgedSet = new Set(recentNudges.map((n) => n.userId));

      const candidates = await this.prisma.user.findMany({
        where: {
          isSuspended: false,
          resumes: { some: {} }, // 이력서 1개 이상
        },
        select: {
          id: true,
          resumes: {
            orderBy: { updatedAt: 'desc' },
            take: 1,
            select: {
              id: true,
              title: true,
              updatedAt: true,
              experiences: { select: { id: true } },
              skills: { select: { id: true, items: true } },
              personalInfo: { select: { summary: true } },
            },
          },
        },
        take: 500, // 안전: 최대 500명/주
      });

      let sent = 0;
      for (const user of candidates) {
        if (recentlyNudgedSet.has(user.id)) continue;
        const resume = user.resumes[0];
        if (!resume) continue;

        const nudge = this.pickNudge(resume);
        if (!nudge) continue;

        await this.notifications
          .create(user.id, 'coaching_nudge', nudge.message, `/edit/${resume.id}#${nudge.section}`)
          .catch(() => {});
        sent += 1;
      }

      if (sent > 0) {
        this.logger.log(`weekly nudge: sent ${sent} notifications`);
      }
    } catch (err) {
      this.logger.warn(`weekly nudge 실패: ${(err as Error).message}`);
    }
  }

  /** 휴리스틱: 가장 영향 큰 개선 항목 1개 선택. null = 흠잡을 데 없음. */
  pickNudge(resume: {
    title: string;
    updatedAt: Date;
    experiences: { id: string }[];
    skills: { id: string; items: string }[];
    personalInfo: { summary: string } | null;
  }): { message: string; section: string } | null {
    const title = resume.title || '이력서';

    // 1순위: 자기소개 비어있음 (가장 큰 누락)
    const summary = resume.personalInfo?.summary?.trim() || '';
    if (summary.length < 30) {
      return {
        message: `'${title}'의 자기소개가 비어있어요. 1-2문단만 추가해도 서류 통과율 ↑`,
        section: 'personalInfo',
      };
    }

    // 2순위: 경력 0건 (신입 표기 안 됐거나 누락)
    if (resume.experiences.length === 0) {
      return {
        message: `'${title}'에 경력 항목이 없어요. 인턴/프로젝트라도 추가해보세요`,
        section: 'experiences',
      };
    }

    // 3순위: 기술 스택 5개 미만
    const skillCount = resume.skills
      .flatMap((s) => s.items.split(','))
      .filter((x) => x.trim()).length;
    if (skillCount < 5) {
      return {
        message: `'${title}'의 기술 스택이 ${skillCount}개로 적어요. 자주 쓰는 도구를 더 추가해보세요`,
        section: 'skills',
      };
    }

    // 4순위: 60일 이상 미수정
    const daysSinceUpdate = (Date.now() - resume.updatedAt.getTime()) / (24 * 60 * 60 * 1000);
    if (daysSinceUpdate >= 60) {
      return {
        message: `'${title}'이 ${Math.floor(daysSinceUpdate)}일 동안 업데이트되지 않았어요. 최근 성과 반영해보세요`,
        section: 'experiences',
      };
    }

    // 5순위: 경력 1건만 (다양한 경험 드러내기 권장)
    if (resume.experiences.length === 1) {
      return {
        message: `'${title}'에 경력이 1건만 있어요. 사이드 프로젝트나 동아리 활동도 추가하면 좋아요`,
        section: 'experiences',
      };
    }

    // 흠잡을 데 없음 — 알림 안 보냄
    return null;
  }
}
