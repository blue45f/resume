/**
 * 이력서 수상·성과 분석기 — 공모전/장학금/표창/특허·논문/순위 등 성취 이력을
 * 감지하고 제시 품질(주최·시기 맥락)을 평가한다.
 */

export type AwardCategory =
  | 'competition' // 공모전/해커톤/경진대회
  | 'scholarship' // 장학금/장학생
  | 'recognition' // 수상/표창/우수사원
  | 'patent_publication' // 특허/논문/게재
  | 'ranking'; // 순위/우승/입상

export interface AwardMatch {
  category: AwardCategory;
  excerpt: string;
  hasContext: boolean; // 시기(연도) 또는 주최/주관 명시 여부
}

export type AwardsQuality = 'strong' | 'present' | 'bare' | 'none';

export interface ResumeAwardsReport {
  quality: AwardsQuality;
  awards: AwardMatch[];
  count: number;
  contextRatio: number; // 맥락(시기/주최)이 명시된 비율 0–100
  summary: string;
  suggestions: string[];
}

// ---------------------------------------------------------------------------
// Section isolation (optional 수상/성과 header)
// ---------------------------------------------------------------------------

const AWARDS_HEADER_RE = /(?:수상\s*(?:내역|경력|이력)?|성과|어워드|Awards?|Achievements?)/i;

// ---------------------------------------------------------------------------
// Category patterns
// ---------------------------------------------------------------------------

const CATEGORY_PATTERNS: Array<{ category: AwardCategory; re: RegExp }> = [
  {
    category: 'competition',
    re: /(?:공모전|해커톤|경진\s*대회|경연\s*대회|콘테스트|hackathon|contest)/i,
  },
  { category: 'scholarship', re: /(?:장학금|장학생|국가\s*장학|성적\s*우수\s*장학)/ },
  {
    category: 'recognition',
    re: /(?:대상|최우수상|우수상|장려상|금상|은상|동상|특별상|표창|우수\s*사원|MVP|사장상|회장상|수상)/,
  },
  {
    category: 'patent_publication',
    re: /(?:특허\s*(?:등록|출원)?|논문\s*게재|학술지|SCI|저널\s*게재)/,
  },
  {
    category: 'ranking',
    re: /(?:우승|준우승|입상|[1-3]위\b|최우수\s*팀|상위\s*\d+\s*%|top\s*\d+)/i,
  },
];

// Context signals: year or organizer present near the award mention
const CONTEXT_RE = /(?:(?:19|20)\d{2}\s*[년.\-/]?|주최|주관|발행|발급|수여|개최|\d{4})/;

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function getRelevantText(text: string): string {
  // If an awards header exists, weight the section after it; else use full text.
  const m = text.match(AWARDS_HEADER_RE);
  if (m && m.index !== undefined) {
    return text; // keep full text so cross-section mentions still count
  }
  return text;
}

// ---------------------------------------------------------------------------
// Main analysis
// ---------------------------------------------------------------------------

export function analyzeResumeAwards(text: string): ResumeAwardsReport {
  const t = (text ?? '').trim();
  const body = getRelevantText(t);
  const lines = body
    .split('\n')
    .map((l) => l.trim())
    .filter(Boolean);

  const awards: AwardMatch[] = [];

  for (const line of lines) {
    for (const { category, re } of CATEGORY_PATTERNS) {
      if (re.test(line)) {
        const hasContext = CONTEXT_RE.test(line);
        awards.push({ category, excerpt: line.slice(0, 50), hasContext });
        break; // one category per line
      }
    }
  }

  const count = awards.length;
  const contextCount = awards.filter((a) => a.hasContext).length;
  const contextRatio = count > 0 ? Math.round((contextCount / count) * 100) : 0;

  let quality: AwardsQuality;
  if (count === 0) {
    quality = 'none';
  } else if (count >= 2 && contextRatio >= 50) {
    quality = 'strong';
  } else if (contextCount >= 1) {
    quality = 'present';
  } else {
    quality = 'bare';
  }

  // Summary
  const QUALITY_LABEL: Record<AwardsQuality, string> = {
    strong: `성취 이력이 잘 정리되어 있습니다 (${count}건, 맥락 ${contextRatio}%).`,
    present: `수상·성과 이력이 있습니다 (${count}건). 일부는 맥락 보강이 필요합니다.`,
    bare: `수상·성과 키워드는 있으나 시기·주최 정보가 부족합니다 (${count}건).`,
    none: '수상·공모전·성과 이력이 감지되지 않습니다.',
  };
  const summary = QUALITY_LABEL[quality];

  // Suggestions
  const suggestions: string[] = [];
  if (quality === 'bare' || quality === 'present') {
    suggestions.push('각 수상 항목에 시기(연도)와 주최/주관 기관을 함께 기재하세요.');
    suggestions.push('가능하면 순위·규모(예: 200팀 중 1위)를 덧붙여 임팩트를 강조하세요.');
  }
  if (quality === 'none') {
    suggestions.push('공모전·해커톤·장학금·사내 표창 등 성취가 있다면 "수상" 섹션으로 추가하세요.');
    suggestions.push('직무 무관한 수상보다 직무 연관 성취를 우선 기재하세요.');
  }
  if (quality === 'strong') {
    suggestions.push('성취 이력이 충분합니다. 직무와의 연관성을 한 줄로 연결하면 더 좋습니다.');
  }

  return {
    quality,
    awards: awards.slice(0, 8),
    count,
    contextRatio,
    summary,
    suggestions,
  };
}
