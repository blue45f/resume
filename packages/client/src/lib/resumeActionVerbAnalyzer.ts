export type VerbStrength = 'strong' | 'neutral' | 'weak';

export type ActionVerbTone = 'good' | 'neutral' | 'warning';

export interface ActionVerbHit {
  verb: string;
  strength: VerbStrength;
  count: number;
  /** Suggested replacements when the verb is weak. */
  alternatives?: string[];
}

export interface ActionVerbReport {
  /** Total action-verb occurrences detected (Korean + English). */
  totalHits: number;
  /** Distinct verb lemmas. */
  uniqueVerbs: number;
  /** uniqueVerbs / totalHits, rounded to 0.01. 1.0 = perfectly diverse. */
  diversityRatio: number;
  /** Weak verb occurrences (담당/수행/참여 등). */
  weakCount: number;
  /** Strong verb occurrences (주도/설계/출시 등). */
  strongCount: number;
  /** Top overused verbs, sorted by count desc then verb. */
  topVerbs: ActionVerbHit[];
  /** Verbs we wish appeared more. */
  weakVerbs: ActionVerbHit[];
  /** 0-100 overall score driven by diversity + strong/weak balance. */
  score: number;
  tone: ActionVerbTone;
  /** Korean short label e.g. "동사 다양도 72점". */
  label: string;
  /** Korean one-sentence summary. */
  summary: string;
}

interface VerbDef {
  /** Canonical lemma we report. */
  lemma: string;
  strength: VerbStrength;
  patterns: RegExp[];
  /** Suggested replacements when the lemma is weak. */
  alternatives?: string[];
}

/**
 * Build a pattern that matches a Korean noun-verb stem in either its
 * conjugated form (한/했/하/함/해/시…) or as a standalone noun followed by
 * punctuation/whitespace/end. The pattern only consumes the stem itself
 * (zero-width lookahead for the suffix) so counts stay accurate.
 */
function koVerb(stems: string[] | string, extraSuffixes: string[] = []): RegExp {
  const arr = Array.isArray(stems) ? stems : [stems];
  const alt = arr.map((s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('|');
  const conj = ['한', '했', '하', '함', '해', '시', ...extraSuffixes].join('');
  // Lookahead: either a known conjugation/derivation char, or a non-Korean-alpha
  // boundary (punctuation, whitespace, end of input).
  return new RegExp(`(?<![가-힣])(?:${alt})(?=[${conj}]|[^가-힣A-Za-z]|$)`, 'g');
}

const STRONG_VERBS: VerbDef[] = [
  { lemma: '주도', strength: 'strong', patterns: [koVerb('주도', ['적'])] },
  { lemma: '설계', strength: 'strong', patterns: [koVerb('설계')] },
  { lemma: '출시', strength: 'strong', patterns: [koVerb('출시')] },
  { lemma: '개선', strength: 'strong', patterns: [koVerb('개선')] },
  { lemma: '구축', strength: 'strong', patterns: [koVerb('구축')] },
  { lemma: '런칭', strength: 'strong', patterns: [koVerb(['런칭', '론칭'])] },
  { lemma: '리드', strength: 'strong', patterns: [koVerb(['리드', '리딩'])] },
  { lemma: '자동화', strength: 'strong', patterns: [koVerb('자동화')] },
  { lemma: '최적화', strength: 'strong', patterns: [koVerb('최적화')] },
  { lemma: '절감', strength: 'strong', patterns: [koVerb('절감')] },
  { lemma: '증대', strength: 'strong', patterns: [koVerb(['증대', '증가'])] },
  { lemma: '확장', strength: 'strong', patterns: [koVerb('확장')] },
  { lemma: '확보', strength: 'strong', patterns: [koVerb('확보')] },
  { lemma: '도입', strength: 'strong', patterns: [koVerb('도입')] },
  { lemma: '발굴', strength: 'strong', patterns: [koVerb('발굴')] },
  { lemma: '협상', strength: 'strong', patterns: [koVerb('협상')] },
  { lemma: '제안', strength: 'strong', patterns: [koVerb('제안')] },
  { lemma: '완료', strength: 'strong', patterns: [koVerb('완료')] },
];

const NEUTRAL_VERBS: VerbDef[] = [
  { lemma: '개발', strength: 'neutral', patterns: [koVerb('개발')] },
  { lemma: '기획', strength: 'neutral', patterns: [koVerb('기획')] },
  { lemma: '구현', strength: 'neutral', patterns: [koVerb('구현')] },
  { lemma: '운영', strength: 'neutral', patterns: [koVerb('운영')] },
  { lemma: '분석', strength: 'neutral', patterns: [koVerb('분석')] },
  { lemma: '관리', strength: 'neutral', patterns: [koVerb('관리')] },
  { lemma: '진행', strength: 'neutral', patterns: [koVerb('진행')] },
  { lemma: '작성', strength: 'neutral', patterns: [koVerb('작성')] },
  { lemma: '제작', strength: 'neutral', patterns: [koVerb('제작')] },
  { lemma: '검증', strength: 'neutral', patterns: [koVerb('검증')] },
];

const WEAK_VERBS: VerbDef[] = [
  {
    lemma: '담당',
    strength: 'weak',
    patterns: [koVerb('담당', ['자'])],
    alternatives: ['주도', '설계', '운영', '구축'],
  },
  {
    lemma: '수행',
    strength: 'weak',
    patterns: [koVerb('수행')],
    alternatives: ['주도', '실행', '리드', '완료'],
  },
  {
    lemma: '참여',
    strength: 'weak',
    patterns: [koVerb('참여')],
    alternatives: ['주도', '제안', '리드', '협업'],
  },
  {
    lemma: '도와',
    strength: 'weak',
    patterns: [/도와(?:줬|줌|드렸|드림|주었|준\s)/g, /도움을?\s*(?:주|준|줬|드렸)/g],
    alternatives: ['협업', '리드', '주도'],
  },
];

const ENGLISH_STRONG: VerbDef[] = [
  { lemma: 'led', strength: 'strong', patterns: [/\b(?:led|leading|spearheaded)\b/gi] },
  { lemma: 'launched', strength: 'strong', patterns: [/\b(?:launched|shipped|released)\b/gi] },
  {
    lemma: 'designed',
    strength: 'strong',
    patterns: [/\b(?:designed|architected|engineered)\b/gi],
  },
  {
    lemma: 'optimized',
    strength: 'strong',
    patterns: [/\b(?:optimized|improved|streamlined|accelerated)\b/gi],
  },
  { lemma: 'reduced', strength: 'strong', patterns: [/\b(?:reduced|cut|decreased|saved)\b/gi] },
  { lemma: 'scaled', strength: 'strong', patterns: [/\b(?:scaled|grew|expanded|increased)\b/gi] },
];

const ENGLISH_WEAK: VerbDef[] = [
  {
    lemma: 'responsible-for',
    strength: 'weak',
    patterns: [/\b(?:responsible\s+for|in\s+charge\s+of)\b/gi],
    alternatives: ['led', 'owned', 'drove'],
  },
  {
    lemma: 'worked-on',
    strength: 'weak',
    patterns: [/\b(?:worked\s+on|involved\s+in|participated\s+in)\b/gi],
    alternatives: ['shipped', 'designed', 'led'],
  },
  {
    lemma: 'helped',
    strength: 'weak',
    patterns: [/\b(?:helped|assisted|supported)\b/gi],
    alternatives: ['partnered', 'enabled', 'led'],
  },
];

const ALL_VERBS: VerbDef[] = [
  ...STRONG_VERBS,
  ...NEUTRAL_VERBS,
  ...WEAK_VERBS,
  ...ENGLISH_STRONG,
  ...ENGLISH_WEAK,
];

function countMatches(text: string, def: VerbDef): number {
  let count = 0;
  for (const pattern of def.patterns) {
    const flags = pattern.flags.includes('g') ? pattern.flags : pattern.flags + 'g';
    const re = new RegExp(pattern.source, flags);
    let match: RegExpExecArray | null;
    while ((match = re.exec(text)) !== null) {
      if (match[0].length === 0) {
        re.lastIndex += 1;
        continue;
      }
      count += 1;
    }
  }
  return count;
}

export function buildResumeActionVerbReport(text: string): ActionVerbReport {
  const safe = (text ?? '').trim();
  const hits: ActionVerbHit[] = [];
  let totalHits = 0;
  let weakCount = 0;
  let strongCount = 0;

  for (const def of ALL_VERBS) {
    const count = countMatches(safe, def);
    if (count === 0) continue;
    totalHits += count;
    if (def.strength === 'weak') weakCount += count;
    if (def.strength === 'strong') strongCount += count;
    hits.push({
      verb: def.lemma,
      strength: def.strength,
      count,
      alternatives: def.alternatives,
    });
  }

  const uniqueVerbs = hits.length;
  const diversityRatio = totalHits === 0 ? 0 : Math.round((uniqueVerbs / totalHits) * 100) / 100;

  let score: number;
  if (totalHits === 0) {
    score = 0;
  } else {
    const diversityComponent = Math.min(1, diversityRatio * 1.2) * 55;
    const strongRatio = strongCount / totalHits;
    const strongComponent = Math.min(1, strongRatio * 2.5) * 30;
    const weakRatio = weakCount / totalHits;
    const weakPenalty = Math.min(1, weakRatio * 2) * 25;
    const raw = Math.round(diversityComponent + strongComponent + 15 - weakPenalty);
    score = Math.max(0, Math.min(100, raw));
  }

  const topVerbs = hits
    .slice()
    .sort((a, b) => b.count - a.count || a.verb.localeCompare(b.verb))
    .slice(0, 5);

  const weakVerbs = hits
    .filter((h) => h.strength === 'weak')
    .sort((a, b) => b.count - a.count)
    .slice(0, 3);

  let tone: ActionVerbTone;
  let summary: string;
  if (totalHits === 0) {
    tone = 'warning';
    summary =
      '실행 동사가 거의 보이지 않습니다. 경력 본문을 "주도/설계/출시/개선" 같은 동사로 시작하는 문장으로 다듬어 보세요.';
  } else if (weakCount > strongCount && weakCount >= 3) {
    tone = 'warning';
    const focus = weakVerbs[0]?.verb ?? '담당';
    summary = `"${focus}" 같은 약한 동사가 강한 동사보다 많습니다. 임팩트가 있는 동사로 1~2개씩 교체하면 첫인상이 달라집니다.`;
  } else if (diversityRatio < 0.45 && totalHits >= 6) {
    tone = 'warning';
    const focus = topVerbs[0]?.verb ?? '동사';
    summary = `같은 동사("${focus}")가 반복됩니다. 비슷한 의미라도 동사를 바꾸면 글이 단조롭지 않게 보입니다.`;
  } else if (score >= 75) {
    tone = 'good';
    summary = '동사 다양도와 임팩트 균형이 좋습니다. 다음은 정량 성과를 한 줄씩 추가해 보세요.';
  } else {
    tone = 'neutral';
    summary = '기본은 갖췄지만 강한 실행 동사(주도/출시/개선 등) 비중을 늘리면 점수가 더 오릅니다.';
  }

  return {
    totalHits,
    uniqueVerbs,
    diversityRatio,
    weakCount,
    strongCount,
    topVerbs,
    weakVerbs,
    score,
    tone,
    label: `동사 다양도 ${score}점`,
    summary,
  };
}
