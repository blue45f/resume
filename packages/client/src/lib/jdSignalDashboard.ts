/**
 * JD 신호등 대시보드 — 여러 JD 분석기를 신호등(양호/주의/우려/정보없음) 한 줄 상태로
 * 종합한다. 길게 쌓인 개별 힌트 카드 대신 "한눈에" 공고 건강도를 보여준다.
 */

import { checkJdPostingCompleteness } from './jdPostingCompletenessChecker';
import { analyzeJdSalaryTransparency } from './jdSalaryTransparencyAnalyzer';
import { analyzeJdWorkLifeBalance } from './jdWorkLifeBalanceAnalyzer';
import { analyzeJdGrowthOpportunity } from './jdGrowthOpportunityAnalyzer';
import { detectJdRedFlags } from './jdRedFlagDetector';
import { detectJdStatutoryBenefits } from './jdStatutoryBenefitsDetector';
import { detectJdResponsibilityVagueness } from './jdResponsibilityVaguenessDetector';

export type SignalStatus = 'good' | 'caution' | 'concern' | 'unknown';

export interface JdSignal {
  key: string;
  label: string;
  status: SignalStatus;
  note: string;
}

export interface JdSignalDashboardReport {
  signals: JdSignal[];
  goodCount: number;
  cautionCount: number;
  concernCount: number;
  headline: string;
}

const STATUS_NOTE: Record<SignalStatus, string> = {
  good: '양호',
  caution: '주의',
  concern: '우려',
  unknown: '정보 부족',
};

export function buildJdSignalDashboard(text: string): JdSignalDashboardReport {
  const t = (text ?? '').trim();

  const completeness = checkJdPostingCompleteness(t);
  const salary = analyzeJdSalaryTransparency(t);
  const wlb = analyzeJdWorkLifeBalance(t);
  const growth = analyzeJdGrowthOpportunity(t);
  const redFlags = detectJdRedFlags(t);
  const benefits = detectJdStatutoryBenefits(t);
  const responsibility = detectJdResponsibilityVagueness(t);

  const signals: JdSignal[] = [
    {
      key: 'completeness',
      label: '공고 완성도',
      status: pick(completeness.grade, {
        good: ['complete', 'good'],
        caution: ['partial'],
        concern: ['sparse'],
      }),
      note: '',
    },
    {
      key: 'salary',
      label: '보상 투명성',
      status: pick(salary.transparency, {
        good: ['transparent'],
        caution: ['partial'],
        concern: ['opaque'],
        unknown: ['silent'],
      }),
      note: '',
    },
    {
      key: 'wlb',
      label: '워라밸',
      status: pick(wlb.rating, {
        good: ['excellent', 'good'],
        caution: ['neutral'],
        concern: ['concern'],
      }),
      note: '',
    },
    {
      key: 'growth',
      label: '성장 기회',
      status: pick(growth.rating, {
        good: ['rich'],
        caution: ['moderate'],
        unknown: ['sparse', 'none'],
      }),
      note: '',
    },
    {
      key: 'redflags',
      label: '위험 신호',
      status: pick(redFlags.riskLevel, {
        good: ['clean', 'low'],
        caution: ['moderate'],
        concern: ['high'],
      }),
      note: redFlags.highCount > 0 ? `고위험 ${redFlags.highCount}건` : '',
    },
    {
      key: 'benefits',
      label: '복지 실질성',
      status: pick(benefits.padding, {
        good: ['genuine'],
        caution: ['mixed'],
        concern: ['padded'],
        unknown: ['none'],
      }),
      note: '',
    },
    {
      key: 'responsibility',
      label: '담당업무 명확성',
      status: pick(responsibility.clarity, {
        good: ['clear'],
        caution: ['some'],
        concern: ['vague'],
      }),
      note: '',
    },
  ];

  for (const s of signals) {
    if (!s.note) s.note = STATUS_NOTE[s.status];
  }

  const goodCount = signals.filter((s) => s.status === 'good').length;
  const cautionCount = signals.filter((s) => s.status === 'caution').length;
  const concernCount = signals.filter((s) => s.status === 'concern').length;

  let headline: string;
  if (concernCount >= 2) {
    headline = '우려 신호가 여러 개입니다. 지원 전 면접에서 꼼꼼히 확인하세요.';
  } else if (concernCount === 1) {
    headline = '대체로 무난하나 우려 신호가 하나 있습니다.';
  } else if (cautionCount >= 3) {
    headline = '정보가 모호한 항목이 많습니다. 추가 확인을 권장합니다.';
  } else {
    headline = '전반적으로 양호한 공고입니다.';
  }

  return { signals, goodCount, cautionCount, concernCount, headline };
}

// Map an analyzer value to a status via a lookup of status → matching values.
function pick<T extends string>(value: T, map: Partial<Record<SignalStatus, T[]>>): SignalStatus {
  for (const status of ['good', 'caution', 'concern', 'unknown'] as SignalStatus[]) {
    if (map[status]?.includes(value)) return status;
  }
  return 'unknown';
}
