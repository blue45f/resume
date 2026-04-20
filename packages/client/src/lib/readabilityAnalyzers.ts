/**
 * 가독성·길이·종결어미 분석 모듈 — koreanChecker.ts 에서 분리.
 *
 * 공통 주제: 문장·단어·문단 단위의 정량 지표 측정.
 *
 * - analyzeReadability: 평균 문장 길이·단어 길이 기반 0-100 가독성 점수
 * - analyzeLength: 자수·단어·문단 수 + target 범위 대비 상태
 * - countSentencesByEnding: 종결 어미 유형별 (합니다/했다/요/기타) 카운트
 */

export interface ReadabilityAnalysis {
  sentenceCount: number;
  avgSentenceLength: number;
  maxSentenceLength: number;
  avgWordLength: number;
  readabilityScore: number; // 0~100, 높을수록 읽기 편함
  level: 'easy' | 'ok' | 'hard';
  suggestion: string;
}

/**
 * 가독성 분석 — 평균 문장 길이, 평균 단어 길이, 문장 수 기반 단순 점수.
 * 이력서·자소서에 적정: 평균 35~60자, 단어 3자 이내.
 */
export function analyzeReadability(text: string): ReadabilityAnalysis {
  const clean = (text ?? '').replace(/\s+/g, ' ').trim();
  if (!clean) {
    return {
      sentenceCount: 0,
      avgSentenceLength: 0,
      maxSentenceLength: 0,
      avgWordLength: 0,
      readabilityScore: 0,
      level: 'ok',
      suggestion: '분석할 본문이 없습니다.',
    };
  }
  const sentences = clean.split(/[.!?。]+/).filter((s) => s.trim().length > 0);
  const sentenceLens = sentences.map((s) => s.trim().length);
  const sentenceCount = sentenceLens.length || 1;
  const avgSentenceLength = Math.round(sentenceLens.reduce((a, b) => a + b, 0) / sentenceCount);
  const maxSentenceLength = sentenceLens.reduce((a, b) => (b > a ? b : a), 0);
  const words = clean.match(/[가-힣A-Za-z0-9]+/g) ?? [];
  const avgWordLength = words.length
    ? Math.round((words.reduce((a, w) => a + w.length, 0) / words.length) * 10) / 10
    : 0;
  let score = 100;
  if (avgSentenceLength > 80) score -= 35;
  else if (avgSentenceLength > 60) score -= 20;
  else if (avgSentenceLength > 45) score -= 10;
  if (maxSentenceLength > 150) score -= 15;
  else if (maxSentenceLength > 100) score -= 8;
  if (avgWordLength > 4) score -= 10;
  score = Math.max(0, score);
  const level: ReadabilityAnalysis['level'] = score >= 75 ? 'easy' : score >= 55 ? 'ok' : 'hard';
  const suggestion =
    level === 'easy'
      ? '가독성이 좋습니다.'
      : level === 'ok'
        ? '문장 길이를 조금 더 짧게 다듬으면 더 읽기 편해집니다.'
        : '문장이 너무 깁니다. 한 문장당 한 가지 메시지를 유지하세요.';
  return {
    sentenceCount,
    avgSentenceLength,
    maxSentenceLength,
    avgWordLength,
    readabilityScore: score,
    level,
    suggestion,
  };
}

export interface LengthAnalysis {
  charsWithSpaces: number;
  charsWithoutSpaces: number;
  words: number;
  paragraphs: number;
  target?: { min?: number; max?: number };
  status: 'under' | 'ok' | 'over' | 'no-target';
  suggestion: string;
}

/**
 * 길이 분석 — 자소서·입사지원서는 보통 500~2000 자 범위 제한.
 * 입력이 target 범위를 벗어나면 경고. 공백 포함/제외 2가지 기준 모두 제공.
 */
export function analyzeLength(
  text: string,
  target?: { min?: number; max?: number },
): LengthAnalysis {
  const t = text ?? '';
  const charsWithSpaces = t.length;
  const charsWithoutSpaces = t.replace(/\s+/g, '').length;
  const words = (t.match(/[가-힣A-Za-z0-9]+/g) ?? []).length;
  const paragraphs = t
    .split(/\n{2,}/)
    .map((p) => p.trim())
    .filter((p) => p.length > 0).length;
  let status: LengthAnalysis['status'] = 'no-target';
  let suggestion = '';
  const effective = charsWithSpaces;
  if (target) {
    if (target.min !== undefined && effective < target.min) {
      status = 'under';
      suggestion = `목표 최소치 ${target.min}자 대비 ${target.min - effective}자 부족합니다.`;
    } else if (target.max !== undefined && effective > target.max) {
      status = 'over';
      suggestion = `목표 최대치 ${target.max}자를 ${effective - target.max}자 초과했습니다.`;
    } else {
      status = 'ok';
      suggestion = `목표 범위 내 (${effective}자).`;
    }
  } else {
    suggestion = `현재 ${effective}자 (공백 제외 ${charsWithoutSpaces}자, ${words}단어, ${paragraphs}문단).`;
  }
  return { charsWithSpaces, charsWithoutSpaces, words, paragraphs, target, status, suggestion };
}

export interface EndingTypeCount {
  formal: number; // 합니다/했습니다/됩니다 등
  declarative: number; // 다./했다 등 문어체
  polite: number; // 해요/요 등
  other: number;
  total: number;
  dominant: 'formal' | 'declarative' | 'polite' | 'mixed' | 'none';
}

/**
 * 문장 종결 어미 카운트 — 합니다체 vs 다./했다체 vs 요체 문장 수. 문체 통일 가이드에
 * 활용. toneMix 와 비슷하지만 구체적 어미 라벨로 제공.
 */
export function countSentencesByEnding(text: string): EndingTypeCount {
  const clean = (text ?? '').replace(/\s+/g, ' ').trim();
  if (!clean) {
    return {
      formal: 0,
      declarative: 0,
      polite: 0,
      other: 0,
      total: 0,
      dominant: 'none',
    };
  }
  const sentences = clean.split(/[.!?。]+/).filter((s) => s.trim().length > 0);
  const counts = { formal: 0, declarative: 0, polite: 0, other: 0 };
  for (const s of sentences) {
    const trimmed = s.trim();
    if (/(습니다|합니다|됩니다|입니다|있습니다|없습니다|드립니다)$/.test(trimmed)) {
      counts.formal++;
    } else if (/(했다|했고|한다|된다|이다|이며|이었다)$/.test(trimmed)) {
      counts.declarative++;
    } else if (/(해요|이에요|예요|세요)$/.test(trimmed)) {
      counts.polite++;
    } else {
      counts.other++;
    }
  }
  const total = sentences.length;
  const buckets: Array<{ k: 'formal' | 'declarative' | 'polite' | 'other'; v: number }> = [
    { k: 'formal', v: counts.formal },
    { k: 'declarative', v: counts.declarative },
    { k: 'polite', v: counts.polite },
    { k: 'other', v: counts.other },
  ];
  buckets.sort((a, b) => b.v - a.v);
  const top = buckets[0];
  let dominant: EndingTypeCount['dominant'] = 'none';
  if (total > 0 && top.v / total >= 0.6 && top.k !== 'other') {
    dominant = top.k;
  } else if (total > 0) {
    dominant = 'mixed';
  }
  return { ...counts, total, dominant };
}
