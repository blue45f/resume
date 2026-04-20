/**
 * 이력서 생성·파생 유틸 모듈 — koreanChecker.ts 에서 분리.
 *
 * - generateResumeTldr: 경력·스킬·레벨·완성도 기반 3줄 요약
 * - generateStarBulletTemplate: STAR 포맷 bullet 템플릿
 * - extractQuotableLines: 수치·고유명사·강한 동사 포함 임팩트 문장 Top-N
 * - computeTextSimilarity: 두 텍스트 Jaccard 유사도
 */

import { detectSkillMentions, extractKeywords } from './jdKeywords';
import { estimateJobLevel, scoreResumeCompleteness } from './resumeScoring';
import { detectSoftSkills } from './softSkills';

/**
 * 이력서 3줄 요약(TL;DR) — 감지된 총 경력 / 상위 스킬 3종 / 경력 레벨 + 완성도 점수를
 * 가벼운 템플릿 문장으로 조합. 리쿠르터 스카우트 메시지 / 이력서 헤드라인 초안용.
 */
export function generateResumeTldr(text: string): {
  lines: string[];
  summary: string;
} {
  const level = estimateJobLevel(text);
  const skills = detectSkillMentions(text, 3)
    .slice(0, 3)
    .map((s) => s.skill);
  const completeness = scoreResumeCompleteness(text);
  const softSkills = detectSoftSkills(text);

  const levelLabel =
    level.level === 'lead'
      ? '리드'
      : level.level === 'senior'
        ? '시니어'
        : level.level === 'mid'
          ? '미드'
          : '주니어';
  const skillPart = skills.length > 0 ? skills.join(' · ') : '다양한 기술';
  const softPart =
    softSkills.hits
      .slice(0, 2)
      .map((h) => h.skill)
      .join('·') || '학습 의지';

  const yearsText = level.years > 0 ? `${level.years}년` : '경력 초기';
  const lines = [
    `${yearsText} 경험의 ${levelLabel} 레벨.`,
    `${skillPart} 를 중심으로 실전 프로젝트를 수행.`,
    `${softPart} 에 강점이 있는 동시에 이력서 완성도 ${completeness.overall}점.`,
  ];
  return { lines, summary: lines.join(' ') };
}

export interface StarBulletTemplate {
  skill: string;
  template: string;
  prompts: { situation: string; task: string; action: string; result: string };
}

/**
 * STAR 포맷 bullet 템플릿 생성 — 스킬·경력 기반으로 "상황·과제·행동·결과" 구조의
 * 빈 템플릿을 뽑아줌. 이력서 경력 섹션 bullet 작성에 가이드로 활용.
 */
export function generateStarBulletTemplate(skill: string, context?: string): StarBulletTemplate {
  const ctx = context?.trim() || '해당 프로젝트';
  return {
    skill,
    template: `[${ctx}] 상황에서 [문제/기회] 를 발견, ${skill} 를 활용해 [구체 행동] 을 수행, [수치 결과] 를 달성.`,
    prompts: {
      situation: `어떤 ${ctx}? (회사·팀 규모·기간)`,
      task: `왜 해결이 필요했는가? (문제의 크기·임팩트)`,
      action: `${skill} 로 구체적으로 무엇을 했는가? (자기가 주도한 부분)`,
      result: '성과를 수치로 표현 (%·배수·기간·비용)',
    },
  };
}

export interface QuotableLine {
  sentence: string;
  score: number;
  signals: { hasNumber: boolean; hasStrongVerb: boolean; hasProper: boolean };
}

const STRONG_VERBS_QUOTABLE = [
  '주도',
  '달성',
  '개선',
  '출시',
  '구축',
  '혁신',
  '최적화',
  '단축',
  '절감',
  '증가',
  '성장',
  '구현',
];

/**
 * 인용 가능한 문장(Quotable Lines) 추출 — 수치·고유명사·강한 동사를 포함한 임팩트 있는
 * 문장 Top-N. 소셜 카드 / 포트폴리오 헤드라인 / 추천사 스타일 하이라이트에 활용.
 */
export function extractQuotableLines(text: string, topN = 3): QuotableLine[] {
  const clean = (text ?? '').replace(/\s+/g, ' ').trim();
  if (!clean) return [];
  const sentences = clean
    .split(/[.!?。]+/)
    .filter((s) => s.trim().length > 20 && s.trim().length < 200);
  const results: QuotableLine[] = [];
  for (const raw of sentences) {
    const s = raw.trim();
    const hasNumber =
      /\d+(?:[.,]\d+)?\s*(?:%|배|년|개월|주|일|시간|원|건|명|회|차|번)|상위\s*\d+/.test(s);
    const hasStrongVerb = STRONG_VERBS_QUOTABLE.some((v) => s.includes(v));
    const hasProper =
      /\b[A-Z][A-Za-z0-9.]+\b/.test(s) ||
      /(네이버|카카오|삼성|LG|SK|현대|쿠팡|토스|배민|당근|라인|NHN|KT)/.test(s);
    let score = 0;
    if (hasNumber) score += 3;
    if (hasStrongVerb) score += 2;
    if (hasProper) score += 1;
    if (score === 0) continue;
    if (s.length >= 40 && s.length <= 120) score += 1;
    results.push({
      sentence: s,
      score,
      signals: { hasNumber, hasStrongVerb, hasProper },
    });
  }
  results.sort((a, b) => b.score - a.score);
  return results.slice(0, topN);
}

export interface TextSimilarityResult {
  jaccard: number;
  shared: string[];
  uniqueA: string[];
  uniqueB: string[];
  verdict: '거의 동일' | '매우 유사' | '유사' | '다름' | '매우 다름';
}

/**
 * 두 텍스트 간 Jaccard 유사도 — 키워드 집합 교집합/합집합 기반. 0~1.
 * 1에 가까울수록 유사. 이력서 버전 간 변화 감지 · 복붙 의심 판정에 활용.
 */
export function computeTextSimilarity(a: string, b: string): TextSimilarityResult {
  const kwA = new Set(extractKeywords(a ?? '', 100).map((k) => k.word));
  const kwB = new Set(extractKeywords(b ?? '', 100).map((k) => k.word));
  const intersection = [...kwA].filter((w) => kwB.has(w));
  const union = new Set([...kwA, ...kwB]);
  const jaccard =
    union.size === 0 ? 0 : Math.round((intersection.length / union.size) * 1000) / 1000;
  const uniqueA = [...kwA].filter((w) => !kwB.has(w)).slice(0, 10);
  const uniqueB = [...kwB].filter((w) => !kwA.has(w)).slice(0, 10);
  const verdict: TextSimilarityResult['verdict'] =
    jaccard >= 0.9
      ? '거의 동일'
      : jaccard >= 0.7
        ? '매우 유사'
        : jaccard >= 0.4
          ? '유사'
          : jaccard >= 0.2
            ? '다름'
            : '매우 다름';
  return { jaccard, shared: intersection.slice(0, 10), uniqueA, uniqueB, verdict };
}
