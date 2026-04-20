/**
 * 파생 점수 분석 모듈 — koreanChecker.ts 에서 분리.
 *
 * 공통 주제: 다른 모듈 분석기 결과를 종합해 이력서 전반을 평가하는 상위 점수.
 *
 * - scoreInterviewability: 구체성·정량·액션동사·성취·섹션 완성도 5축 가중합 (면접 콜백률 근사)
 * - detectCareerGaps: 경력 구간 사이 6개월↑ 공백 검출
 */

import { scoreSpecificity, detectMissingResumeSections } from './resumeScoring';
import { analyzeQuantification, analyzeActionVerbs, countAchievements } from './achievementSignals';
import { estimateExperienceYears } from './experience';

export interface InterviewabilityScore {
  overall: number;
  breakdown: Array<{ axis: string; value: number; weight: number }>;
  tier: 'call-back' | 'promising' | 'needs-work' | 'below-bar';
  suggestion: string;
}

/**
 * 면접 적합도(interviewability) 점수 — 이력서를 본 리쿠르터가 면접으로 부를 확률을
 * 근사하는 0~100 지표. 문체·맞춤법은 제외하고 "채용 가치"에 집중.
 */
export function scoreInterviewability(text: string): InterviewabilityScore {
  const spec = scoreSpecificity(text);
  const quant = analyzeQuantification(text);
  const verbs = analyzeActionVerbs(text);
  const achievements = countAchievements(text);
  const sections = detectMissingResumeSections(text);

  const quantValue =
    quant.level === 'high' ? 100 : quant.level === 'medium' ? 70 : quant.level === 'low' ? 40 : 10;
  const verbsValue = verbs.strong + verbs.weak < 3 ? 50 : Math.round(verbs.ratio * 100);
  const achievementsValue =
    achievements.level === 'high'
      ? 100
      : achievements.level === 'medium'
        ? 65
        : achievements.total > 0
          ? 35
          : 10;
  const sectionsValue = Math.round(sections.coverageRatio * 100);

  const breakdown = [
    { axis: '구체성', value: spec.overall, weight: 0.3 },
    { axis: '정량 지표', value: quantValue, weight: 0.2 },
    { axis: '액션 동사', value: verbsValue, weight: 0.15 },
    { axis: '수상·성취', value: achievementsValue, weight: 0.15 },
    { axis: '섹션 완성도', value: sectionsValue, weight: 0.2 },
  ];
  const overall = Math.round(breakdown.reduce((a, b) => a + b.value * b.weight, 0));
  let tier: InterviewabilityScore['tier'];
  if (overall >= 80) tier = 'call-back';
  else if (overall >= 60) tier = 'promising';
  else if (overall >= 40) tier = 'needs-work';
  else tier = 'below-bar';
  const weakest = [...breakdown].sort((a, b) => a.value - b.value)[0];
  const suggestion =
    tier === 'call-back'
      ? '면접 콜백 가능성 높음 — 강력한 이력서입니다.'
      : tier === 'promising'
        ? `유망 (${overall}점). 약한 축: ${weakest.axis} (${weakest.value}) 보강 시 콜백률 상승.`
        : tier === 'needs-work'
          ? `보완 필요 (${overall}점). ${weakest.axis} (${weakest.value}) 를 먼저 개선하세요.`
          : `면접 문턱 미달 (${overall}점). 섹션 완성도·정량 지표·구체 경험을 전면 재작성 권장.`;
  return { overall, breakdown, tier, suggestion };
}

export interface CareerGap {
  from: { year: number; month: number };
  to: { year: number; month: number };
  gapMonths: number;
  severity: 'minor' | 'notable' | 'major';
}

export interface CareerGapAnalysis {
  gaps: CareerGap[];
  totalGapMonths: number;
  suggestion: string;
}

/**
 * 경력 공백(gap) 검출 — estimateExperienceYears 로 추출한 기간들의 시작~종료를 시간순으로
 * 정렬 후 인접 구간 사이에 6개월 이상 공백이 있으면 리포트.
 */
export function detectCareerGaps(text: string): CareerGapAnalysis {
  const exp = estimateExperienceYears(text);
  if (exp.ranges.length < 2) {
    return {
      gaps: [],
      totalGapMonths: 0,
      suggestion: '2개 이상 경력 구간이 있어야 공백 분석 가능.',
    };
  }
  const sorted = [...exp.ranges].sort(
    (a, b) => a.start.year * 12 + a.start.month - (b.start.year * 12 + b.start.month),
  );
  const gaps: CareerGap[] = [];
  for (let i = 1; i < sorted.length; i++) {
    const prevEnd = sorted[i - 1].end;
    const curStart = sorted[i].start;
    const gapMonths = curStart.year * 12 + curStart.month - (prevEnd.year * 12 + prevEnd.month) - 1;
    if (gapMonths >= 6) {
      gaps.push({
        from: prevEnd,
        to: curStart,
        gapMonths,
        severity: gapMonths >= 24 ? 'major' : gapMonths >= 12 ? 'notable' : 'minor',
      });
    }
  }
  const totalGapMonths = gaps.reduce((a, b) => a + b.gapMonths, 0);
  const suggestion =
    gaps.length === 0
      ? '경력 공백이 감지되지 않았습니다.'
      : `${gaps.length}개 공백 (총 ${totalGapMonths}개월) — 이력서 또는 면접 답변으로 설명 준비 필요.`;
  return { gaps, totalGapMonths, suggestion };
}
