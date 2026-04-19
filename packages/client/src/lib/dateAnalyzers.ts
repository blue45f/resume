/**
 * 날짜 포맷 일관성 분석 모듈 — koreanChecker.ts 에서 분리.
 *
 * 제공:
 * - analyzeDateConsistency: 2023.01 / 2023-01-05 / 2023/01/05 / 2023년 1월 등 혼재 검출
 *
 * 관련 타입: DateFormatHit, DateConsistencyAnalysis.
 */

export interface DateFormatHit {
  format: 'dot' | 'hyphen' | 'slash' | 'korean' | 'other';
  sample: string;
  index: number;
}

export interface DateConsistencyAnalysis {
  hits: DateFormatHit[];
  formatCounts: Record<DateFormatHit['format'], number>;
  distinctFormats: number;
  dominantFormat: DateFormatHit['format'] | null;
  consistent: boolean;
  suggestion: string;
}

const DATE_PATTERNS: Array<{ re: RegExp; format: DateFormatHit['format'] }> = [
  { re: /\b\d{4}\.(0?[1-9]|1[0-2])(?:\.(0?[1-9]|[12]\d|3[01]))?\b/g, format: 'dot' },
  { re: /\b\d{4}-(0?[1-9]|1[0-2])(?:-(0?[1-9]|[12]\d|3[01]))?\b/g, format: 'hyphen' },
  { re: /\b\d{4}\/(0?[1-9]|1[0-2])(?:\/(0?[1-9]|[12]\d|3[01]))?\b/g, format: 'slash' },
  { re: /\d{4}년\s*\d{1,2}월(?:\s*\d{1,2}일)?/g, format: 'korean' },
];

/**
 * 날짜 포맷 일관성 검사 — 이력서·자소서 전반에서 2023.01 / 2023-01-05 / 2023/01/05 / 2023년 1월
 * 등 섞이면 전문성이 떨어져 보임. 포맷별 빈도를 계산해 2종 이상이면 경고.
 */
export function analyzeDateConsistency(text: string): DateConsistencyAnalysis {
  const t = text ?? '';
  const hits: DateFormatHit[] = [];
  for (const p of DATE_PATTERNS) {
    const re = new RegExp(p.re.source, 'g');
    let m: RegExpExecArray | null;
    while ((m = re.exec(t))) {
      hits.push({ format: p.format, sample: m[0], index: m.index });
      if (hits.length > 80) break;
    }
    if (hits.length > 80) break;
  }
  hits.sort((a, b) => a.index - b.index);
  const formatCounts: Record<DateFormatHit['format'], number> = {
    dot: 0,
    hyphen: 0,
    slash: 0,
    korean: 0,
    other: 0,
  };
  for (const h of hits) formatCounts[h.format]++;
  const usedFormats = (Object.keys(formatCounts) as DateFormatHit['format'][]).filter(
    (k) => formatCounts[k] > 0,
  );
  const distinctFormats = usedFormats.length;
  const dominantFormat = usedFormats.sort((a, b) => formatCounts[b] - formatCounts[a])[0] ?? null;
  const consistent = distinctFormats <= 1;
  let suggestion = '';
  if (hits.length === 0) suggestion = '날짜 표기가 감지되지 않았습니다.';
  else if (consistent) suggestion = `날짜 표기가 "${dominantFormat}" 로 일관됩니다.`;
  else
    suggestion = `날짜 포맷이 ${distinctFormats}종 혼재 — 한 가지로 통일하세요 (주류: "${dominantFormat}", ${formatCounts[dominantFormat!]}건).`;
  return {
    hits: hits.slice(0, 30),
    formatCounts,
    distinctFormats,
    dominantFormat,
    consistent,
    suggestion,
  };
}
