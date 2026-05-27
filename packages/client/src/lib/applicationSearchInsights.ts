import type { JobApplication } from './api';

export type ApplicationInsightTone = 'good' | 'neutral' | 'warning' | 'danger';

export interface ApplicationSearchInsightCard {
  id: string;
  label: string;
  value: string;
  detail: string;
  tone: ApplicationInsightTone;
}

export interface ApplicationSearchInsightSummary {
  focus: ApplicationSearchInsightCard;
  cards: ApplicationSearchInsightCard[];
}

const DAY_MS = 24 * 60 * 60 * 1000;
const TERMINAL_STATUSES = new Set(['offer', 'rejected', 'withdrawn']);
const SAVED_STATUSES = new Set(['saved', 'bookmark', 'bookmarked', 'draft']);
const INTERVIEW_STATUSES = new Set(['interview', 'interviewing', 'technical', 'onsite', 'final']);

const normalizeStatus = (status: string) => status.trim().toLowerCase();

const parseDate = (value?: string | null) => {
  if (!value) {
    return null;
  }

  const time = new Date(value).getTime();
  return Number.isFinite(time) ? time : null;
};

const daysSince = (value: string | undefined, now: Date) => {
  const time = parseDate(value);
  if (time === null) {
    return Number.POSITIVE_INFINITY;
  }
  return Math.floor((now.getTime() - time) / DAY_MS);
};

const daysUntil = (value: string | undefined, now: Date) => {
  const time = parseDate(value);
  if (time === null) {
    return null;
  }
  return Math.ceil((time - now.getTime()) / DAY_MS);
};

const getApplicationDate = (application: JobApplication) =>
  application.appliedDate || application.createdAt;

const isActiveApplication = (application: JobApplication) =>
  !TERMINAL_STATUSES.has(normalizeStatus(application.status));

const isAppliedApplication = (application: JobApplication) => {
  const status = normalizeStatus(application.status);
  return !SAVED_STATUSES.has(status) && status !== 'withdrawn';
};

const isResponseApplication = (application: JobApplication) => {
  const status = normalizeStatus(application.status);
  return INTERVIEW_STATUSES.has(status) || status === 'offer';
};

const getToneForConversion = (rate: number, appliedBaseCount: number): ApplicationInsightTone => {
  if (appliedBaseCount < 3) return 'neutral';
  if (rate >= 25) return 'good';
  if (rate >= 10) return 'neutral';
  return 'warning';
};

export const buildApplicationSearchInsights = (
  applications: JobApplication[],
  now = new Date(),
): ApplicationSearchInsightSummary | null => {
  if (applications.length === 0) {
    return null;
  }

  const active = applications.filter(isActiveApplication);
  const appliedBase = applications.filter(isAppliedApplication);
  const responseCount = applications.filter(isResponseApplication).length;
  const interviewCount = applications.filter((application) =>
    INTERVIEW_STATUSES.has(normalizeStatus(application.status)),
  ).length;
  const recentCount = applications.filter(
    (application) => daysSince(getApplicationDate(application), now) <= 7,
  ).length;
  const followUpDue = active.filter((application) => daysSince(application.updatedAt, now) >= 7);
  const deadlineSoon = active.filter((application) => {
    const days = daysUntil(application.deadline, now);
    return days !== null && days >= 0 && days <= 7;
  });
  const overdue = active.filter((application) => {
    const days = daysUntil(application.deadline, now);
    return days !== null && days < 0;
  });
  const riskIds = new Set(
    [...followUpDue, ...deadlineSoon, ...overdue].map((application) => application.id),
  );
  const interviewConversionRate =
    appliedBase.length > 0 ? Math.round((responseCount / appliedBase.length) * 100) : 0;

  let focus: ApplicationSearchInsightCard;
  if (overdue.length > 0) {
    focus = {
      id: 'focus-overdue',
      label: '오늘의 병목',
      value: `마감 초과 ${overdue.length}건`,
      detail: '마감이 지난 지원은 상태 갱신 또는 철회 처리로 보드를 정리하세요.',
      tone: 'danger',
    };
  } else if (deadlineSoon.length > 0) {
    focus = {
      id: 'focus-deadline',
      label: '오늘의 병목',
      value: `마감 임박 ${deadlineSoon.length}건`,
      detail: '마감 전 맞춤 이력서, 자소서, 후속 메모를 먼저 끝내는 것이 좋습니다.',
      tone: 'warning',
    };
  } else if (followUpDue.length > 0) {
    focus = {
      id: 'focus-follow-up',
      label: '오늘의 병목',
      value: `후속 필요 ${followUpDue.length}건`,
      detail: '일주일 이상 멈춘 지원에 후속 메일 또는 리마인더를 남기세요.',
      tone: 'warning',
    };
  } else if (appliedBase.length >= 3 && responseCount === 0) {
    focus = {
      id: 'focus-conversion',
      label: '오늘의 병목',
      value: '전환 없음',
      detail: '지원은 쌓였지만 면접 전환이 없습니다. 키워드 매칭과 요약문을 다시 점검하세요.',
      tone: 'warning',
    };
  } else if (recentCount < 3 && active.length > 0) {
    focus = {
      id: 'focus-rhythm',
      label: '오늘의 병목',
      value: `7일 활동 ${recentCount}건`,
      detail: '지원·업데이트 리듬이 낮습니다. 관심 공고를 저장하거나 한 건을 다음 단계로 옮기세요.',
      tone: 'neutral',
    };
  } else {
    focus = {
      id: 'focus-balanced',
      label: '오늘의 병목',
      value: '흐름 양호',
      detail: '지원, 후속, 마감 흐름이 안정적입니다. 다음 패킷 품질을 높이는 데 집중하세요.',
      tone: 'good',
    };
  }

  return {
    focus,
    cards: [
      {
        id: 'conversion',
        label: '지원→면접',
        value: appliedBase.length > 0 ? `${interviewConversionRate}%` : '대기',
        detail:
          appliedBase.length > 0
            ? `${responseCount}/${appliedBase.length}건이 면접·오퍼 단계로 이동`
            : '지원 완료 건이 쌓이면 전환율을 계산합니다.',
        tone: getToneForConversion(interviewConversionRate, appliedBase.length),
      },
      {
        id: 'weekly',
        label: '7일 활동',
        value: `${recentCount}건`,
        detail:
          recentCount >= 3
            ? '최근 저장·지원 리듬이 유지되고 있습니다.'
            : '최근 일주일 활동이 낮아 파이프라인이 마를 수 있습니다.',
        tone: recentCount >= 3 ? 'good' : 'neutral',
      },
      {
        id: 'risk',
        label: '후속 리스크',
        value: `${riskIds.size}건`,
        detail:
          riskIds.size > 0
            ? '마감, 장기 미업데이트, 후속 필요 지원이 포함됩니다.'
            : '마감과 후속 알림이 안정적으로 관리되고 있습니다.',
        tone: overdue.length > 0 ? 'danger' : riskIds.size > 0 ? 'warning' : 'good',
      },
      {
        id: 'interviews',
        label: '면접 단계',
        value: `${interviewCount}건`,
        detail:
          interviewCount > 0
            ? '면접 질문과 후속 메모를 같은 패킷에서 준비하세요.'
            : '면접 단계가 생기면 준비 루틴을 자동으로 강조합니다.',
        tone: interviewCount > 0 ? 'good' : 'neutral',
      },
    ],
  };
};
