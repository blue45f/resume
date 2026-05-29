/**
 * 이력서 개선 우선순위 플랜 — 기존 scoreInterviewability 의 가중 breakdown 을 재사용해
 * "지금 가장 임팩트 큰 개선 과제"를 순위화한다.
 *
 * 18+개 품질 패널은 "무엇이 약한가"를 각각 보여주지만 "무엇부터 고칠까"는 알려주지 않는다.
 * 이 플랜은 각 평가 축의 개선 임팩트 = (100 − 현재값) × 가중치 = 종합 면접적합도 점수의
 * 상승 잠재폭 으로 환산해, 노력 대비 효과가 큰 순으로 정렬하고 구체 조언을 붙인다.
 *
 * 구조 완성도(buildRoadmap, 필드 존재)와 달리 콘텐츠 "품질" 개선에 집중하며,
 * 별도 분석을 재실행하지 않고 scoreInterviewability 결과만 가공한다(순수 함수).
 */

import { scoreInterviewability } from './derivedScores';

export type ImprovementSeverity = 'high' | 'medium' | 'low';

export interface ImprovementItem {
  axis: string; // 평가 축 (구체성·정량 지표 등)
  value: number; // 현재 점수 0~100
  impact: number; // 개선 시 종합 점수 상승 잠재폭 (= (100-value)*weight, 반올림)
  severity: ImprovementSeverity;
  advice: string; // 구체적·실행 가능한 개선 조언
}

export interface ResumeImprovementPlan {
  overall: number; // 현재 면접 적합도 0~100
  tier: 'call-back' | 'promising' | 'needs-work' | 'below-bar';
  items: ImprovementItem[]; // 임팩트 내림차순 (개선 여지 있는 축만)
  topAdvice: string; // 헤드라인 한 줄
  hasRoom: boolean; // 개선 여지가 있는가
}

// 평가 축별 구체 조언 (scoreInterviewability breakdown 의 axis 라벨과 1:1)
const ADVICE: Record<string, string> = {
  구체성:
    '추상적 표현을 고유명사·구체 상황으로 바꾸세요. "다양한 업무" → "결제 API 3종 연동·정산 배치 운영".',
  '정량 지표': '성과에 숫자를 더하세요. "개선했다" → "응답 시간 40% 단축", "비용 3천만원 절감".',
  '액션 동사':
    '"담당/참여" 같은 약한 동사를 "주도/구현/달성/최적화" 같은 강한 동사로 바꿔 주도성을 드러내세요.',
  '수상·성취': '수상·자격증·선정 등 객관적 성취를 추가해 역량을 제3자 관점에서 증명하세요.',
  '섹션 완성도':
    '비어 있는 핵심 섹션(자기소개·경력·기술·프로젝트)을 채워 한눈에 평가 가능한 이력서로 만드세요.',
};

function severityOf(impact: number): ImprovementSeverity {
  if (impact >= 10) return 'high';
  if (impact >= 5) return 'medium';
  return 'low';
}

/**
 * 이력서 텍스트로부터 개선 우선순위 플랜을 만든다.
 * @param text 이력서 전체 텍스트(buildResumePlainText 결과 등)
 * @param topN 반환할 상위 개선 과제 수 (기본 3)
 */
export function buildResumeImprovementPlan(text: string, topN = 3): ResumeImprovementPlan {
  const score = scoreInterviewability(text ?? '');

  const items: ImprovementItem[] = score.breakdown
    // 개선 여지가 의미 있는 축만 (이미 충분히 높은 축은 제외)
    .filter((b) => b.value < 90)
    .map((b) => {
      const impact = Math.round((100 - b.value) * b.weight);
      return {
        axis: b.axis,
        value: b.value,
        impact,
        severity: severityOf(impact),
        advice: ADVICE[b.axis] ?? `${b.axis} 항목을 보강하세요.`,
      };
    })
    // 임팩트(종합 점수 상승 잠재폭) 내림차순, 동률 시 현재값 낮은 순
    .sort((a, b) => b.impact - a.impact || a.value - b.value)
    .slice(0, topN);

  const hasRoom = items.length > 0 && items[0].impact > 0;

  let topAdvice: string;
  if (!hasRoom) {
    topAdvice = '주요 평가 축이 모두 탄탄합니다. 세부 패널에서 미세 조정만 점검하세요.';
  } else {
    const top = items[0];
    topAdvice = `가장 큰 개선 기회는 "${top.axis}"입니다 (현재 ${top.value}점, 보강 시 +${top.impact}점). ${top.advice}`;
  }

  return {
    overall: score.overall,
    tier: score.tier,
    items,
    topAdvice,
    hasRoom,
  };
}
