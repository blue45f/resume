/**
 * 이력서 섹션 단위 분석 모듈 — koreanChecker.ts 에서 분리.
 *
 * 제공 함수:
 * - splitByExperienceSection: 표준 섹션 제목으로 본문 분할
 * - analyzeSectionBalance: 섹션별 길이 균형 (과소/과대/쏠림)
 * - analyzeSectionOrder: 권장 배치 순서 평가 (역전쌍 기반 score)
 * - analyzeSectionDensity: 섹션별 숫자·액션동사·불릿 밀도
 * - computeSectionHealth: 위 3축을 단일 점수로 종합
 */

export interface SplitSection {
  key: string;
  heading: string;
  content: string;
  index: number;
}

const SECTION_HEADING_PATTERNS: Array<{ key: string; re: RegExp }> = [
  { key: '자기소개', re: /^[\s#=]*(자기\s?소개(?:서)?|프로필|Profile|About\s?Me|Summary)\s*$/im },
  { key: '경력', re: /^[\s#=]*(경력\s?사항|경력|근무\s?경력|Career|Work\s?Experience)\s*$/im },
  { key: '학력', re: /^[\s#=]*(학력\s?사항|학력|학업|Education)\s*$/im },
  { key: '기술', re: /^[\s#=]*(기술\s?스택|보유\s?기술|스킬|기술|Skills|Tech\s?Stack)\s*$/im },
  {
    key: '프로젝트',
    re: /^[\s#=]*(프로젝트(?:\s?경험)?|주요\s?프로젝트|Projects?|Portfolio)\s*$/im,
  },
  { key: '자격증', re: /^[\s#=]*(자격증|자격|Certifications?)\s*$/im },
  { key: '수상', re: /^[\s#=]*(수상\s?경력|수상|Awards?)\s*$/im },
];

/**
 * 이력서 텍스트를 섹션별로 분할 — 표준 섹션 제목(경력/학력/기술/프로젝트/자기소개) 을
 * 기준으로 본문을 쪼개 section → content 맵 생성. 섹션 단위 분석의 기반.
 */
export function splitByExperienceSection(text: string): SplitSection[] {
  const t = text ?? '';
  if (!t.trim()) return [];
  const lines = t.split(/\r?\n/);
  const sections: SplitSection[] = [];
  let currentKey = '';
  let currentHeading = '';
  let currentStart = 0;
  let buffer: string[] = [];
  const flush = (endIdx: number) => {
    if (currentKey) {
      sections.push({
        key: currentKey,
        heading: currentHeading,
        content: buffer.join('\n').trim(),
        index: endIdx,
      });
    }
    buffer = [];
  };
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const matched = SECTION_HEADING_PATTERNS.find((p) => p.re.test(line));
    if (matched) {
      flush(currentStart);
      currentKey = matched.key;
      currentHeading = line.trim();
      currentStart = i;
      continue;
    }
    buffer.push(line);
  }
  flush(currentStart);
  return sections;
}

export interface SectionBalanceIssue {
  key: string;
  chars: number;
  kind: 'too_short' | 'too_long' | 'dominant';
  message: string;
}

export interface SectionBalanceReport {
  sections: Array<{ key: string; chars: number; sharePct: number }>;
  totalChars: number;
  issues: SectionBalanceIssue[];
  balanceScore: number;
  verdict: 'balanced' | 'skewed' | 'lopsided';
}

/**
 * 섹션별 길이 균형 분석 — splitByExperienceSection 결과를 기반으로
 * 과소(<80자)·과대(>2000자) 섹션 및 한 섹션이 전체의 60% 이상을 차지하는 쏠림을 감지.
 * 균형 점수(0-100) = 100 - (최대섹션 비중 편차 + 과소섹션 페널티).
 */
export function analyzeSectionBalance(text: string): SectionBalanceReport {
  const parts = splitByExperienceSection(text);
  const sections = parts.map((p) => ({ key: p.key, chars: p.content.length }));
  const totalChars = sections.reduce((acc, s) => acc + s.chars, 0);
  const issues: SectionBalanceIssue[] = [];
  const enriched = sections.map((s) => ({
    ...s,
    sharePct: totalChars > 0 ? Math.round((s.chars / totalChars) * 100) : 0,
  }));
  if (sections.length === 0 || totalChars === 0) {
    return {
      sections: enriched,
      totalChars,
      issues,
      balanceScore: 0,
      verdict: 'lopsided',
    };
  }
  const SHORT_MIN = 80;
  const LONG_MAX = 2000;
  for (const s of enriched) {
    if (s.chars > 0 && s.chars < SHORT_MIN) {
      issues.push({
        key: s.key,
        chars: s.chars,
        kind: 'too_short',
        message: `${s.key} 섹션이 ${s.chars}자로 너무 짧습니다 (최소 ${SHORT_MIN}자 권장)`,
      });
    }
    if (s.chars > LONG_MAX) {
      issues.push({
        key: s.key,
        chars: s.chars,
        kind: 'too_long',
        message: `${s.key} 섹션이 ${s.chars}자로 과도하게 깁니다 (${LONG_MAX}자 이하 권장)`,
      });
    }
    if (s.sharePct >= 60 && sections.length >= 2) {
      issues.push({
        key: s.key,
        chars: s.chars,
        kind: 'dominant',
        message: `${s.key} 섹션이 전체의 ${s.sharePct}%를 차지해 다른 섹션과 균형이 맞지 않습니다`,
      });
    }
  }
  const maxShare = enriched.reduce((m, s) => Math.max(m, s.sharePct), 0);
  const idealShare = 100 / sections.length;
  const shareDeviation = Math.abs(maxShare - idealShare);
  const shortPenalty = issues.filter((i) => i.kind === 'too_short').length * 10;
  const balanceScore = Math.max(0, Math.min(100, Math.round(100 - shareDeviation - shortPenalty)));
  const verdict: SectionBalanceReport['verdict'] =
    balanceScore >= 75 ? 'balanced' : balanceScore >= 50 ? 'skewed' : 'lopsided';
  return { sections: enriched, totalChars, issues, balanceScore, verdict };
}

export interface SectionOrderReport {
  current: string[];
  recommended: string[];
  misplaced: Array<{ key: string; currentIndex: number; idealIndex: number }>;
  isOptimal: boolean;
  score: number;
}

const RECOMMENDED_SECTION_ORDER = [
  '자기소개',
  '경력',
  '프로젝트',
  '기술',
  '학력',
  '자격증',
  '수상',
] as const;

/**
 * 섹션 배치 순서 평가 — splitByExperienceSection 결과를 권장 순서와 비교.
 * 권장: 자기소개→경력→프로젝트→기술→학력→자격증→수상.
 * score = 100 × (1 - 역전쌍 비율). 역전쌍 = (i<j 인데 ideal[i] > ideal[j])인 모든 쌍.
 */
export function analyzeSectionOrder(text: string): SectionOrderReport {
  const parts = splitByExperienceSection(text);
  const current = parts.map((p) => p.key);
  const currentSet = new Set<string>(current);
  const recommended: string[] = (RECOMMENDED_SECTION_ORDER as readonly string[]).filter((k) =>
    currentSet.has(k),
  );
  if (current.length <= 1) {
    return {
      current,
      recommended,
      misplaced: [],
      isOptimal: true,
      score: 100,
    };
  }
  const idealIndexMap = new Map<string, number>();
  RECOMMENDED_SECTION_ORDER.forEach((k, i) => idealIndexMap.set(k, i));
  const idealPositions = current.map((k) => idealIndexMap.get(k) ?? 99);
  let inversions = 0;
  let totalPairs = 0;
  for (let i = 0; i < idealPositions.length; i++) {
    for (let j = i + 1; j < idealPositions.length; j++) {
      totalPairs++;
      if (idealPositions[i] > idealPositions[j]) inversions++;
    }
  }
  const misplaced: SectionOrderReport['misplaced'] = [];
  for (let i = 0; i < current.length; i++) {
    const key = current[i];
    const idealIndex = recommended.indexOf(key);
    if (idealIndex >= 0 && idealIndex !== i) {
      misplaced.push({ key, currentIndex: i, idealIndex });
    }
  }
  const score = totalPairs === 0 ? 100 : Math.round(100 * (1 - inversions / totalPairs));
  return {
    current,
    recommended,
    misplaced,
    isOptimal: inversions === 0,
    score,
  };
}

export interface SectionDensity {
  key: string;
  chars: number;
  numbers: number;
  actionVerbs: number;
  bullets: number;
  density: number;
  needsBoost: boolean;
  hint?: string;
}

const SECTION_DENSITY_ACTION_VERBS = [
  '개발',
  '구축',
  '설계',
  '구현',
  '개선',
  '최적화',
  '리팩터',
  '리팩토',
  '도입',
  '주도',
  '운영',
  '운용',
  '관리',
  '리드',
  '담당',
  '분석',
  '기획',
  '제안',
  '제작',
  '배포',
  '자동화',
  '통합',
  '마이그',
];

const SECTION_DENSITY_BULLET_RE = /^\s*[-•·▶►◆◇□■★☆*]/gm;
const SECTION_DENSITY_NUMBER_RE = /\d+(?:[.,]\d+)?(?:%|배|시간|분|초|건|명|개|회|원|만|억|천)?/g;

/**
 * 섹션별 구체성 밀도 — 숫자·액션동사·불릿의 per-100-char 밀도를 계산.
 * density 가 0.8 미만인 섹션은 needsBoost=true 로 표시하고 섹션별 힌트 제공.
 */
export function analyzeSectionDensity(text: string): SectionDensity[] {
  const parts = splitByExperienceSection(text);
  return parts.map((p) => {
    const chars = p.content.length;
    const numbers = (p.content.match(SECTION_DENSITY_NUMBER_RE) ?? []).length;
    const actionVerbs = SECTION_DENSITY_ACTION_VERBS.reduce(
      (acc, v) => acc + (p.content.match(new RegExp(v, 'g'))?.length ?? 0),
      0,
    );
    const bullets = (p.content.match(SECTION_DENSITY_BULLET_RE) ?? []).length;
    const signalCount = numbers + actionVerbs + bullets;
    const density = chars > 0 ? +((signalCount / chars) * 100).toFixed(2) : 0;
    const isExperienceLike = p.key === '경력' || p.key === '프로젝트' || p.key === '자기소개';
    const needsBoost = isExperienceLike && chars >= 120 && density < 0.8;
    let hint: string | undefined;
    if (needsBoost) {
      if (numbers < 2) hint = `${p.key}: 정량 지표(숫자·%·기간)가 부족합니다`;
      else if (actionVerbs < 2) hint = `${p.key}: 액션 동사(개발·개선·도입 등)를 추가하세요`;
      else if (bullets === 0) hint = `${p.key}: 불릿으로 성과를 구조화하세요`;
      else hint = `${p.key}: 구체적 성과 기술이 부족합니다`;
    }
    return { key: p.key, chars, numbers, actionVerbs, bullets, density, needsBoost, hint };
  });
}

export interface SectionHealth {
  overall: number;
  balanceScore: number;
  orderScore: number;
  densityScore: number;
  tier: 'excellent' | 'good' | 'fair' | 'poor';
  topHints: string[];
}

/**
 * 섹션 품질 종합 점수 — analyzeSectionBalance + analyzeSectionOrder + analyzeSectionDensity
 * 세 축을 균등 가중 평균(1:1:1)해 0-100 overall 산출.
 * 각 분석기에서 나온 이슈·힌트를 묶어 topHints (최대 3개) 로 리포트.
 */
export function computeSectionHealth(text: string): SectionHealth {
  const balance = analyzeSectionBalance(text);
  const order = analyzeSectionOrder(text);
  const density = analyzeSectionDensity(text);
  const densityItems = density.filter((d) => d.chars > 0);
  const boostCount = densityItems.filter((d) => d.needsBoost).length;
  const densityScore =
    densityItems.length === 0 ? 0 : Math.round(100 * (1 - boostCount / densityItems.length));
  const overall = Math.round((balance.balanceScore + order.score + densityScore) / 3);
  const tier: SectionHealth['tier'] =
    overall >= 85 ? 'excellent' : overall >= 70 ? 'good' : overall >= 50 ? 'fair' : 'poor';
  const hints: string[] = [];
  for (const issue of balance.issues) hints.push(issue.message);
  if (!order.isOptimal && order.misplaced.length > 0) {
    const first = order.misplaced[0];
    hints.push(
      `${first.key} 섹션 위치 조정 권장 (현재 ${first.currentIndex + 1}번째 → 권장 ${first.idealIndex + 1}번째)`,
    );
  }
  for (const d of densityItems) {
    if (d.hint) hints.push(d.hint);
  }
  return {
    overall,
    balanceScore: balance.balanceScore,
    orderScore: order.score,
    densityScore,
    tier,
    topHints: hints.slice(0, 3),
  };
}
