/**
 * 반복·중복 분석 모듈 — koreanChecker.ts 에서 분리.
 *
 * 공통 주제: 같은 표현의 재등장 = 편집 실수 or 어휘 빈약 신호.
 *
 * - analyzeLexicalDiversity: TTR (Type-Token Ratio) 로 어휘 다양성 측정
 * - analyzeRedundancy: windowChars 내 2자+ 한글 단어 근접 반복 검출
 * - detectRepeatedPhrases: 2~3 단어 N-gram 반복 구절 검출
 * - detectDuplicateSentences: 정규화 후 동일/유사 문장 중복 검출
 */

export interface LexicalDiversityAnalysis {
  tokenCount: number;
  uniqueCount: number;
  ttr: number; // 0~1, 1 에 가까울수록 다양
  level: 'low' | 'medium' | 'high';
  suggestion: string;
}

/**
 * 어휘 다양성 (Type-Token Ratio) — 중복 단어 비율이 높으면 어휘 빈약.
 * 한글 단어만 2자 이상 추출해 TTR 계산.
 */
export function analyzeLexicalDiversity(text: string): LexicalDiversityAnalysis {
  const tokens = (text ?? '').match(/[가-힣]{2,}/g) ?? [];
  const tokenCount = tokens.length;
  if (tokenCount === 0) {
    return {
      tokenCount: 0,
      uniqueCount: 0,
      ttr: 0,
      level: 'low',
      suggestion: '분석할 한글 단어가 없습니다.',
    };
  }
  const uniqueCount = new Set(tokens).size;
  const ttr = uniqueCount / tokenCount;
  let level: LexicalDiversityAnalysis['level'];
  let suggestion: string;
  if (tokenCount < 30) {
    level = 'medium';
    suggestion = '단어가 적어 분석이 제한적입니다.';
  } else if (ttr >= 0.6) {
    level = 'high';
    suggestion = '어휘가 풍부합니다.';
  } else if (ttr >= 0.4) {
    level = 'medium';
    suggestion = '반복 표현이 다소 있습니다. 동의어·유의어로 변주해 보세요.';
  } else {
    level = 'low';
    suggestion = '같은 단어가 자주 반복됩니다. 주요 명사·동사를 2~3 가지로 다양화하세요.';
  }
  return { tokenCount, uniqueCount, ttr: Math.round(ttr * 1000) / 1000, level, suggestion };
}

export interface RedundancyHit {
  word: string;
  firstIndex: number;
  secondIndex: number;
  distance: number;
}

export interface RedundancyAnalysis {
  hits: RedundancyHit[];
  worst: RedundancyHit | null;
  suggestion: string;
}

/**
 * 근접 반복어 검출 — 같은 2자 이상 한글 단어가 windowChars 내에서 재등장하면
 * 중언부언 후보로 리포트. 이력서에서 "~을 수행하여 ~수행했고 ~수행했다"같은 반복 감지.
 */
export function analyzeRedundancy(text: string, windowChars = 40): RedundancyAnalysis {
  const clean = (text ?? '').replace(/\s+/g, ' ');
  if (!clean) return { hits: [], worst: null, suggestion: '' };
  const re = /[가-힣]{2,}/g;
  const positions: Array<{ word: string; idx: number }> = [];
  let m: RegExpExecArray | null;
  while ((m = re.exec(clean))) {
    positions.push({ word: m[0], idx: m.index });
  }
  const STOPWORDS = new Set([
    '그리고',
    '그래서',
    '또한',
    '하지만',
    '그러나',
    '있습',
    '없습',
    '있다',
    '없다',
    '입니',
    '합니',
    '됩니',
    '대한',
    '통해',
    '대해',
    '많은',
    '좋은',
    '다양',
    '여러',
  ]);
  const hits: RedundancyHit[] = [];
  const seenPair = new Set<string>();
  for (let i = 0; i < positions.length; i++) {
    for (let j = i + 1; j < positions.length; j++) {
      const a = positions[i];
      const b = positions[j];
      const distance = b.idx - a.idx;
      if (distance > windowChars) break;
      if (a.word !== b.word) continue;
      if (STOPWORDS.has(a.word)) continue;
      const pairKey = `${a.idx}|${b.idx}|${a.word}`;
      if (seenPair.has(pairKey)) continue;
      seenPair.add(pairKey);
      hits.push({ word: a.word, firstIndex: a.idx, secondIndex: b.idx, distance });
    }
  }
  hits.sort((a, b) => a.distance - b.distance);
  const worst = hits[0] ?? null;
  let suggestion = '';
  if (!worst) suggestion = '근접 반복어가 발견되지 않았습니다.';
  else if (hits.length >= 5)
    suggestion = `"${worst.word}" 등 근접 반복어가 ${hits.length}건 감지되었습니다. 동의어로 변주하거나 문장을 줄여 보세요.`;
  else
    suggestion = `근접 반복어 ${hits.length}건 — 특히 "${worst.word}" (${worst.distance}자 간격) 를 확인해 보세요.`;
  return { hits: hits.slice(0, 20), worst, suggestion };
}

export interface RepeatedPhrase {
  phrase: string;
  count: number;
  n: 2 | 3;
}

/**
 * N-gram 반복 구절 검출 — 2~3단어 구절이 2회 이상 반복되면 리포트.
 * analyzeRedundancy(단일 단어) 와 상보 — 다단어 상투적 표현 발견 시 주목할 만한 신호.
 */
export function detectRepeatedPhrases(text: string, minCount = 2): RepeatedPhrase[] {
  const t = (text ?? '').replace(/\s+/g, ' ').trim();
  if (!t) return [];
  const tokens = t.match(/[가-힣A-Za-z0-9]+/g) ?? [];
  if (tokens.length < 4) return [];
  const counts = new Map<string, { count: number; n: 2 | 3 }>();
  for (const n of [2, 3] as const) {
    for (let i = 0; i + n <= tokens.length; i++) {
      const slice = tokens.slice(i, i + n);
      if (slice.some((s) => s.length < 2)) continue;
      const key = slice.join(' ');
      const prev = counts.get(key);
      counts.set(key, { count: (prev?.count ?? 0) + 1, n });
    }
  }
  const hits: RepeatedPhrase[] = [];
  for (const [phrase, { count, n }] of counts.entries()) {
    if (count >= minCount) hits.push({ phrase, count, n });
  }
  hits.sort((a, b) => (b.n - a.n) * 10 + (b.count - a.count));
  const filtered: RepeatedPhrase[] = [];
  for (const h of hits) {
    const swallowed = filtered.some((f) => f.n > h.n && f.phrase.includes(h.phrase));
    if (!swallowed) filtered.push(h);
  }
  return filtered.slice(0, 15);
}

export interface DuplicateSentence {
  normalized: string;
  first: { original: string; index: number };
  duplicates: Array<{ original: string; index: number }>;
  count: number;
}

function normalizeSentence(s: string): string {
  return s
    .replace(/\s+/g, '')
    .replace(/[.!?。,"'「」『』()]/g, '')
    .replace(/(을|를|이|가|은|는|의|에|에서|로|으로|와|과|도)(?=[가-힣])/g, '')
    .toLowerCase();
}

/**
 * 중복 문장 검출 — 동일하거나 매우 유사한 문장이 2번 이상 반복되면 편집 실수 혹은
 * 템플릿 복사 흔적. 문장 정규화(공백/조사 일부 제거) 후 빈도 집계.
 */
export function detectDuplicateSentences(text: string, minLength = 15): DuplicateSentence[] {
  const t = (text ?? '').replace(/\n/g, ' ').trim();
  if (!t) return [];
  const sentences = t.split(/[.!?。]+/).filter((s) => s.trim().length >= minLength);
  const byNormalized = new Map<
    string,
    { original: string; index: number; duplicates: Array<{ original: string; index: number }> }
  >();
  let cursor = 0;
  for (const s of sentences) {
    const normalized = normalizeSentence(s);
    if (!normalized) continue;
    const trimmed = s.trim();
    const localIndex = t.indexOf(trimmed, cursor);
    cursor = localIndex >= 0 ? localIndex + trimmed.length : cursor;
    const existing = byNormalized.get(normalized);
    if (existing) {
      existing.duplicates.push({ original: trimmed, index: localIndex });
    } else {
      byNormalized.set(normalized, { original: trimmed, index: localIndex, duplicates: [] });
    }
  }
  const results: DuplicateSentence[] = [];
  for (const [normalized, entry] of byNormalized.entries()) {
    if (entry.duplicates.length >= 1) {
      results.push({
        normalized,
        first: { original: entry.original, index: entry.index },
        duplicates: entry.duplicates,
        count: 1 + entry.duplicates.length,
      });
    }
  }
  results.sort((a, b) => b.count - a.count);
  return results.slice(0, 10);
}
