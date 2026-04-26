import { Inject, Injectable, Logger, forwardRef } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { PrismaService } from '../prisma/prisma.service';
import { NotificationsService } from '../notifications/notifications.service';
import { LlmService } from '../llm/llm.service';

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
    @Inject(forwardRef(() => LlmService)) private llm: LlmService,
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
          plan: true,
          resumes: {
            orderBy: { updatedAt: 'desc' },
            take: 1,
            select: {
              id: true,
              title: true,
              updatedAt: true,
              experiences: { select: { id: true, position: true, company: true } },
              skills: { select: { id: true, items: true } },
              personalInfo: { select: { summary: true } },
            },
          },
        },
        take: 500, // 안전: 최대 500명/주
      });

      let sent = 0;
      let llmSent = 0;
      for (const user of candidates) {
        if (recentlyNudgedSet.has(user.id)) continue;
        const resume = user.resumes[0];
        if (!resume) continue;

        // Pro 플랜 → LLM 개인화 nudge 시도. 실패 시 휴리스틱으로 자연스럽게 폴백.
        let message: string | null = null;
        let section = 'personalInfo';
        if (user.plan === 'pro' || user.plan === 'enterprise') {
          const llmNudge = await this.generateLlmNudge(resume).catch(() => null);
          if (llmNudge) {
            message = llmNudge.message;
            section = llmNudge.section;
            llmSent += 1;
          }
        }
        if (!message) {
          const nudge = this.pickNudge(resume);
          if (!nudge) continue;
          message = nudge.message;
          section = nudge.section;
        }

        await this.notifications
          .create(user.id, 'coaching_nudge', message, `/edit/${resume.id}#${section}`)
          .catch(() => {});
        sent += 1;
      }

      if (sent > 0) {
        this.logger.log(`weekly nudge: sent ${sent} notifications (${llmSent} LLM-personalized)`);
      }
    } catch (err) {
      this.logger.warn(`weekly nudge 실패: ${(err as Error).message}`);
    }
  }

  /**
   * Pro 플랜 사용자 LLM 개인화 nudge — 이력서 요약 → 가장 영향 큰 개선 1줄 + 섹션 키.
   * 비용 보수적: 매주 1번, 짧은 프롬프트 (요약만 보냄), 실패 시 휴리스틱 폴백.
   */
  private async generateLlmNudge(resume: {
    title: string;
    experiences: { position: string; company: string }[];
    skills: { items: string }[];
    personalInfo: { summary: string } | null;
  }): Promise<{ message: string; section: string } | null> {
    const summary = (resume.personalInfo?.summary || '').slice(0, 300);
    const expBrief = resume.experiences
      .slice(0, 3)
      .map((e) => `${e.company || '?'} ${e.position || '?'}`)
      .join(' | ');
    const skillBrief = resume.skills
      .flatMap((s) => s.items.split(',').map((x) => x.trim()))
      .filter(Boolean)
      .slice(0, 10)
      .join(', ');

    const systemPrompt = `당신은 한국 취업 코치입니다. 이력서 요약을 보고 가장 임팩트 있는 개선 제안 1개를 골라
JSON 으로 응답하세요. 마크다운 / 추가 설명 금지.

스키마:
{ "message": string (60자 이내, 친근한 한국어, 끝에 마침표 X), "section": one of "personalInfo"|"experiences"|"skills"|"educations"|"projects" }

원칙: 이력서가 이미 충분하면 message="" 반환 (알림 안 보냄).`;

    const userMessage = `[이력서 제목] ${resume.title}
[자기소개] ${summary || '(비어있음)'}
[경력] ${expBrief || '(없음)'}
[기술] ${skillBrief || '(없음)'}`;

    try {
      const res = await this.llm.generateWithFallback(systemPrompt, userMessage, 'groq');
      const cleaned = (res.text || '')
        .replace(/^```(?:json)?\s*/i, '')
        .replace(/```\s*$/i, '')
        .trim();
      const start = cleaned.indexOf('{');
      const end = cleaned.lastIndexOf('}');
      if (start === -1 || end === -1) return null;
      const obj = JSON.parse(cleaned.slice(start, end + 1));
      const message = String(obj.message || '')
        .trim()
        .slice(0, 80);
      const section = String(obj.section || 'personalInfo');
      const validSections = ['personalInfo', 'experiences', 'skills', 'educations', 'projects'];
      if (!message) return null;
      return { message, section: validSections.includes(section) ? section : 'personalInfo' };
    } catch {
      return null;
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
