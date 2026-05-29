/**
 * 이력서 개인 기여도 명확성 체커 — "우리/팀이/함께" 같은 집단 주어가 과다하고
 * "제가/직접/주도적으로" 같은 개인 기여 표현이 부족하면, 검토자가 지원자 본인이
 * 무엇을 했는지 파악하기 어렵다. 이 불균형을 감지한다.
 */

export type ContributionClarity = 'clear' | 'mixed' | 'unclear';

export interface ResumeContributionReport {
  clarity: ContributionClarity;
  collectiveCount: number;
  individualCount: number;
  ownershipRatio: number; // 개인 표현 비율 0–100
  collectiveExamples: string[];
  summary: string;
  suggestions: string[];
}

// ---------------------------------------------------------------------------
// Marker patterns (global, for counting)
// ---------------------------------------------------------------------------

// 집단 "주어" 신호에 집중 — 협업/팀과 같은 정상적 맥락은 제외한다.
const COLLECTIVE_RES: RegExp[] = [
  /우리(?:가|는|의|팀|\s)/g,
  /저희(?:가|는|의|팀|\s)/g,
  /팀(?:이|에서|원들이?|을)\s?/g,
  /함께/g,
  /공동으?로/g,
  /다\s*같이/g,
];

const INDIVIDUAL_RES: RegExp[] = [
  /제가/g,
  /본인이?/g,
  /직접/g,
  /혼자(?:서)?/g,
  /주도(?:적으로|하여|해서|적|하였|했)/g,
  /단독(?:으로)?/g,
  /스스로/g,
  /개인적으로/g,
];

function countMatches(text: string, patterns: RegExp[]): number {
  let total = 0;
  for (const re of patterns) {
    total += (text.match(re) ?? []).length;
  }
  return total;
}

// ---------------------------------------------------------------------------
// Main analysis
// ---------------------------------------------------------------------------

export function checkResumeContributionClarity(text: string): ResumeContributionReport {
  const t = (text ?? '').trim();

  const collectiveCount = countMatches(t, COLLECTIVE_RES);
  const individualCount = countMatches(t, INDIVIDUAL_RES);

  const denom = collectiveCount + individualCount;
  const ownershipRatio = denom > 0 ? Math.round((individualCount / denom) * 100) : 0;

  // Collect example lines containing collective markers.
  const collectiveExamples: string[] = [];
  for (const line of t.split('\n')) {
    const l = line.trim();
    if (!l) continue;
    if (COLLECTIVE_RES.some((re) => new RegExp(re.source).test(l))) {
      collectiveExamples.push(l.slice(0, 50));
      if (collectiveExamples.length >= 4) break;
    }
  }

  let clarity: ContributionClarity;
  if (collectiveCount < 2) {
    // Not enough collective language to create ambiguity.
    clarity = 'clear';
  } else if (ownershipRatio >= 50) {
    clarity = 'clear';
  } else if (ownershipRatio >= 20) {
    clarity = 'mixed';
  } else {
    clarity = 'unclear';
  }

  // Summary
  let summary: string;
  if (clarity === 'clear') {
    summary =
      collectiveCount < 2
        ? '집단 주어 사용이 적어 기여 주체가 모호하지 않습니다.'
        : `개인 기여 표현이 충분합니다 (개인 ${individualCount} / 집단 ${collectiveCount}).`;
  } else if (clarity === 'mixed') {
    summary = `집단 주어가 다소 많습니다 (개인 ${individualCount} / 집단 ${collectiveCount}). 본인 기여를 더 드러내세요.`;
  } else {
    summary = `"우리/팀" 위주 서술로 본인 기여가 잘 드러나지 않습니다 (개인 ${individualCount} / 집단 ${collectiveCount}).`;
  }

  // Suggestions
  const suggestions: string[] = [];
  if (clarity !== 'clear') {
    suggestions.push('"팀이 ~했다" → "제가 ○○를 담당해 ~했다"로 본인 역할을 명시하세요.');
    suggestions.push('3인 팀에서 단독 개발한 모듈처럼, 본인 기여 범위를 구체적으로 표현하세요.');
    if (clarity === 'unclear') {
      suggestions.push('성과 옆에 본인 기여 비중(예: 핵심 로직 80% 담당)을 덧붙이면 효과적입니다.');
    }
  }

  return {
    clarity,
    collectiveCount,
    individualCount,
    ownershipRatio,
    collectiveExamples,
    summary,
    suggestions,
  };
}
