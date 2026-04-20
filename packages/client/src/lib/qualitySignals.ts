/**
 * 품질 신호 분석 모듈 — koreanChecker.ts 에서 분리.
 *
 * 공통 주제: 개별 문장/단어 단위의 품질 결함 신호 감지.
 *
 * - detectUnquantifiedClaims: 성과 동사(개선/향상/달성) 문장에 수치 없으면 플래그
 * - detectEmptyClaims: "잘 안다/자신 있다/전문입니다" 등 근거 없는 역량 주장
 * - analyzeVerbTense: 과거/현재/미래 시제 혼재 감지
 * - detectAllCapsOveruse: 축약어 아닌 ALL CAPS 영문 단어 과용
 */

const ACHIEVEMENT_VERBS = [
  '개선',
  '향상',
  '달성',
  '증가',
  '감소',
  '단축',
  '절감',
  '상승',
  '하락',
  '확장',
  '성장',
  '기여',
  '창출',
  '극복',
  '최적화',
  '구현',
  '구축',
];

export interface UnquantifiedClaim {
  sentence: string;
  verb: string;
  index: number;
  reason: string;
}

/**
 * 수치화 누락 청구 검출 — "개선/향상/달성" 등 성과 동사 문장에 수치가 없으면 리포트.
 */
export function detectUnquantifiedClaims(text: string): UnquantifiedClaim[] {
  const clean = (text ?? '').replace(/\s+/g, ' ').trim();
  if (!clean) return [];
  const sentences = clean.split(/[.!?。]+/).filter((s) => s.trim().length > 0);
  const results: UnquantifiedClaim[] = [];
  let cursor = 0;
  const quantRe =
    /\d+(?:[.,]\d+)?\s*(?:%|배|퍼센트|년|개월|달|주|일|시간|원|건|명|회|차|번)|상위\s*\d+|TOP\s*\d+/;
  for (const raw of sentences) {
    const trimmed = raw.trim();
    const idx = clean.indexOf(trimmed, cursor);
    if (idx >= 0) cursor = idx + trimmed.length;
    for (const v of ACHIEVEMENT_VERBS) {
      if (trimmed.includes(v)) {
        if (!quantRe.test(trimmed)) {
          results.push({
            sentence: trimmed,
            verb: v,
            index: idx,
            reason: `"${v}" 성과 표현에 수치가 없습니다 — %·배수·기간 등을 추가하세요.`,
          });
          break;
        }
      }
    }
    if (results.length >= 15) break;
  }
  return results;
}

const EMPTY_CLAIM_PATTERNS: Array<{ re: RegExp; phrase: string; reason: string }> = [
  {
    re: /잘\s*(?:알|이해하|다룰)/g,
    phrase: '잘 알고 있다',
    reason: '구체 예시로 "어떻게 아는지" 증명.',
  },
  {
    re: /(?:대한|에\s*대한)\s*이해가?\s*(?:깊|풍부)/g,
    phrase: '대한 이해가 깊다',
    reason: '프로젝트·결과로 이해 수준을 증명.',
  },
  { re: /자신\s*(?:있|있습)/g, phrase: '자신 있다', reason: '구체 사례 제시.' },
  {
    re: /(?:전문|능숙|숙련)\s*합(?:니다|임)/g,
    phrase: '전문/능숙/숙련',
    reason: '연수·프로젝트·산출물 링크로 증명.',
  },
  { re: /꼼꼼(?:하|함)/g, phrase: '꼼꼼함', reason: '체크리스트·QA 사례로 증명.' },
  {
    re: /탁월한?\s*(?:역량|능력|실력)/g,
    phrase: '탁월한 역량/능력',
    reason: '수치·비교 사례 필요.',
  },
];

export interface EmptyClaimHit {
  phrase: string;
  index: number;
  reason: string;
}

export interface EmptyClaimAnalysis {
  hits: EmptyClaimHit[];
  count: number;
  level: 'none' | 'few' | 'many';
  suggestion: string;
}

/**
 * 빈 주장(empty claim) 감지 — "잘 알고 있다/자신 있다/전문입니다" 등 근거 없는 역량 주장.
 */
export function detectEmptyClaims(text: string): EmptyClaimAnalysis {
  const t = text ?? '';
  const hits: EmptyClaimHit[] = [];
  for (const p of EMPTY_CLAIM_PATTERNS) {
    const re = new RegExp(p.re.source, 'g');
    let m: RegExpExecArray | null;
    while ((m = re.exec(t))) {
      hits.push({ phrase: p.phrase, index: m.index, reason: p.reason });
      if (hits.length > 30) break;
    }
    if (hits.length > 30) break;
  }
  hits.sort((a, b) => a.index - b.index);
  const count = hits.length;
  const level: EmptyClaimAnalysis['level'] = count === 0 ? 'none' : count <= 2 ? 'few' : 'many';
  const suggestion =
    level === 'none'
      ? '빈 주장이 감지되지 않았습니다.'
      : level === 'few'
        ? `빈 주장 ${count}건 — 각 표현에 증거(수치·사례·산출물) 1개씩 덧붙이세요.`
        : `빈 주장이 ${count}건으로 많습니다. "잘 안다/자신 있다" 같은 주장은 구체 사례로 증명하세요.`;
  return { hits: hits.slice(0, 20), count, level, suggestion };
}

export interface TenseAnalysis {
  past: number;
  present: number;
  future: number;
  total: number;
  dominant: 'past' | 'present' | 'future' | 'mixed' | 'none';
  suggestion: string;
}

/**
 * 시제 일관성 분석 — 경력 섹션은 과거시제 통일이 권장됨(현재 재직 중 제외).
 */
export function analyzeVerbTense(text: string): TenseAnalysis {
  const t = text ?? '';
  const past = (t.match(/(?:했|였|었|았|왔|갔|봤|냈)(?:습니다|다|고|으며|음|었다)/g) ?? []).length;
  const present = (
    t.match(/(?:합니다|입니다|됩니다|있습니다|없습니다|한다|된다)(?=[.!?\s]|$)/g) ?? []
  ).length;
  const future = (t.match(/(?:할|될)\s*(?:것|예정|계획)/g) ?? []).length;
  const total = past + present + future;
  if (total === 0) {
    return {
      past: 0,
      present: 0,
      future: 0,
      total: 0,
      dominant: 'none',
      suggestion: '동사 시제가 감지되지 않았습니다.',
    };
  }
  const buckets = [
    { k: 'past' as const, v: past },
    { k: 'present' as const, v: present },
    { k: 'future' as const, v: future },
  ].sort((a, b) => b.v - a.v);
  const top = buckets[0];
  const dominant: TenseAnalysis['dominant'] = top.v / total >= 0.7 ? top.k : 'mixed';
  const suggestion =
    dominant === 'mixed'
      ? `시제가 섞여 있습니다 (과거 ${past} · 현재 ${present} · 미래 ${future}) — 경력 기술은 과거시제로 통일.`
      : dominant === 'past'
        ? '과거시제로 일관 — 경력 기술의 표준 톤.'
        : dominant === 'present'
          ? `현재시제 우세 (${present}건) — 경력 기술은 과거시제 전환 권장.`
          : `미래시제 우세 (${future}건) — 입사 후 계획 외에는 과거시제로.`;
  return { past, present, future, total, dominant, suggestion };
}

export interface AllCapsHit {
  word: string;
  index: number;
}

export interface AllCapsAnalysis {
  hits: AllCapsHit[];
  count: number;
  suggestion: string;
}

const ALL_CAPS_ALLOWLIST = new Set([
  'AI',
  'ML',
  'API',
  'URL',
  'UI',
  'UX',
  'IT',
  'OS',
  'DB',
  'SQL',
  'CSS',
  'HTML',
  'JS',
  'TS',
  'AWS',
  'GCP',
  'CI',
  'CD',
  'PR',
  'QA',
  'KPI',
  'ROI',
  'OKR',
  'PM',
  'TF',
  'BM',
  'FE',
  'BE',
]);

/**
 * ALL CAPS 과용 검출 — 축약어가 아닌 일반 영문 단어를 대문자로만 쓰면 소리치는 인상.
 */
export function detectAllCapsOveruse(text: string): AllCapsAnalysis {
  const t = text ?? '';
  const hits: AllCapsHit[] = [];
  const re = /\b([A-Z]{3,})\b/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(t))) {
    const word = m[1];
    if (ALL_CAPS_ALLOWLIST.has(word)) continue;
    if (word.length < 6 && /^(?:[A-Z][a-z]+)+$/.test(word)) continue;
    hits.push({ word, index: m.index });
    if (hits.length > 30) break;
  }
  const count = hits.length;
  const suggestion =
    count === 0
      ? 'ALL CAPS 과용 없음.'
      : count <= 2
        ? `ALL CAPS ${count}건 — 일반 단어는 소문자/Title Case 로.`
        : `ALL CAPS ${count}건 — "소리치는 인상"을 주므로 축약어 외엔 피하세요.`;
  return { hits: hits.slice(0, 20), count, suggestion };
}
