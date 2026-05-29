/**
 * 자기소개서 개선 우선순위 플랜 — buildCoverLetterScore 의 4축(구성·구조·마무리·톤)
 * 가중 점수를 재가공해 "지금 가장 효과 큰 개선"을 순위화한다.
 *
 * 점수 자체(CoverLetterScoreRing)와 달리, 각 축의 개선 임팩트 = (100 − score) × weight
 * = 종합 점수 상승 잠재폭 으로 환산해 노력 대비 효과 큰 순으로 정렬하고 구체 조언을 붙인다.
 * resumeImprovementPlan 과 동일한 결정 지원 패턴을 자소서 면에 적용.
 *
 * 순수 함수(no DOM/network) — vitest 로 검증.
 */

import {
  buildCoverLetterScore,
  type CoverLetterScoreAxisKey,
  type CoverLetterScoreGrade,
} from './coverLetterScore';

export type CoverLetterImprovementSeverity = 'high' | 'medium' | 'low';

export interface CoverLetterImprovementItem {
  key: CoverLetterScoreAxisKey;
  axis: string; // 축 라벨 (구성·구조·마무리·톤)
  value: number; // 현재 점수 0~100
  impact: number; // 개선 시 종합 점수 상승 잠재폭 (= (100-value)*weight)
  severity: CoverLetterImprovementSeverity;
  advice: string;
}

export interface CoverLetterImprovementPlan {
  overall: number;
  grade: CoverLetterScoreGrade;
  items: CoverLetterImprovementItem[];
  topAdvice: string;
  hasRoom: boolean;
}

const ADVICE: Record<CoverLetterScoreAxisKey, string> = {
  coverage: '4대 핵심 블록(지원동기·직무역량·구체 경험·입사 후 포부) 중 빠진 항목을 채우세요.',
  structure: '문단을 명확히 나누고 첫 문장(훅)과 마무리를 강화해 읽기 쉬운 흐름을 만드세요.',
  closing: '마지막 문단에 입사 후 기여 의지를 분명한 한 문장으로 마무리하세요(CTA).',
  tone: '부정적·자기비하 표현을 긍정·성장 관점으로 바꿔 자신감 있는 톤을 유지하세요.',
};

function severityOf(impact: number): CoverLetterImprovementSeverity {
  if (impact >= 10) return 'high';
  if (impact >= 5) return 'medium';
  return 'low';
}

/**
 * 자소서 텍스트로부터 개선 우선순위 플랜을 만든다.
 * @param text 자기소개서 본문
 * @param topN 반환할 상위 개선 과제 수 (기본 3)
 */
export function buildCoverLetterImprovementPlan(
  text: string,
  topN = 3,
): CoverLetterImprovementPlan {
  const score = buildCoverLetterScore(text ?? '');

  const items: CoverLetterImprovementItem[] = score.axes
    .filter((a) => a.score < 90)
    .map((a) => {
      const impact = Math.round((100 - a.score) * a.weight);
      return {
        key: a.key,
        axis: a.label,
        value: a.score,
        impact,
        severity: severityOf(impact),
        advice: ADVICE[a.key],
      };
    })
    .sort((a, b) => b.impact - a.impact || a.value - b.value)
    .slice(0, topN);

  const hasRoom = items.length > 0 && items[0].impact > 0;

  let topAdvice: string;
  if (!hasRoom) {
    topAdvice = '4대 평가 축이 모두 탄탄합니다. 세부 패널에서 미세 조정만 점검하세요.';
  } else {
    const top = items[0];
    topAdvice = `가장 큰 개선 기회는 "${top.axis}"입니다 (현재 ${top.value}점, 보강 시 +${top.impact}점). ${top.advice}`;
  }

  return { overall: score.overall, grade: score.grade, items, topAdvice, hasRoom };
}
