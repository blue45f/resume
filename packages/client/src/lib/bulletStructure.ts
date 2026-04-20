/**
 * 목록·불릿·문장부호 분석 모듈 — koreanChecker.ts 에서 분리.
 *
 * 공통 주제: 줄 단위 목록과 문장부호의 일관성·균형.
 *
 * - analyzeParallelism: bullet 평행구조 (종결어미 통일)
 * - analyzeBulletMarkerConsistency: bullet 기호(-, •, 별표, ▪) 혼재 감지
 * - analyzePunctuationBalance: 마침표·쉼표·물음표·느낌표 분포
 */

export interface ParallelismAnalysis {
  lines: number;
  styles: Array<{ style: string; count: number; percent: number }>;
  consistency: number; // 0~100, 주류 어미 비율 × 100
  suggestion: string;
}

/**
 * bullet 평행구조 — 줄 단위 목록에서 종결어미가 섞이면 (습니다/했음/-ㅁ/다.) 인상이 떨어짐.
 * 줄바꿈 · "- " · "• " 시작 줄을 추출해 어미 분포를 계산.
 */
export function analyzeParallelism(text: string): ParallelismAnalysis {
  const t = text ?? '';
  const candidates = t
    .split(/\r?\n/)
    .map((l) => l.replace(/^[-·•*\s\d.)]+/, '').trim())
    .filter((l) => l.length >= 5);
  const counts = new Map<string, number>();
  const classifiers: Array<{ label: string; re: RegExp }> = [
    { label: '합니다체', re: /(했|합|입|됩|있|없)습니다[.!?]?\s*$/ },
    { label: '다./했다', re: /[가-힣]다[.!?]?\s*$/ },
    { label: '-함/-했음', re: /(함|했음|됨|임|있음|없음)[.!?]?\s*$/ },
    { label: '-기', re: /기[.!?]?\s*$/ },
    { label: '해요체', re: /해요[.!?]?\s*$/ },
  ];
  for (const line of candidates) {
    let matched = false;
    for (const c of classifiers) {
      if (c.re.test(line)) {
        counts.set(c.label, (counts.get(c.label) ?? 0) + 1);
        matched = true;
        break;
      }
    }
    if (!matched) counts.set('기타', (counts.get('기타') ?? 0) + 1);
  }
  const total = candidates.length || 1;
  const styles = [...counts.entries()]
    .map(([style, count]) => ({ style, count, percent: (count * 100) / total }))
    .sort((a, b) => b.count - a.count);
  const top = styles[0];
  const consistency = top ? Math.round(top.percent) : 0;
  let suggestion = '';
  if (candidates.length < 3) suggestion = '목록 항목이 부족해 분석이 제한적입니다.';
  else if (consistency >= 85) suggestion = `목록 어미가 "${top.style}" 로 일관됩니다.`;
  else if (consistency >= 65)
    suggestion = `주로 "${top.style}" 이지만 다른 어미가 섞여 있습니다. 통일을 권장합니다.`;
  else
    suggestion = `어미가 ${styles.length} 가지로 뒤섞여 있습니다. 하나로 통일하세요 (예: 모두 "-했음" 또는 모두 "합니다").`;
  return { lines: candidates.length, styles: styles.slice(0, 5), consistency, suggestion };
}

export interface BulletMarkerAnalysis {
  markers: Array<{ marker: string; count: number; percent: number }>;
  distinct: number;
  dominant: string | null;
  consistent: boolean;
  suggestion: string;
}

/**
 * Bullet 마커 일관성 — `-`, `•`, `*`, `▪`, `·` 등 목록 기호가 섞이면 지저분한 인상.
 * 줄 시작 위치에서 각 마커 빈도를 집계하고 혼재 여부 리포트.
 */
export function analyzeBulletMarkerConsistency(text: string): BulletMarkerAnalysis {
  const t = text ?? '';
  const lines = t.split(/\r?\n/);
  const markerRe = /^\s*([-*•▪·◦▫☆★→▶▸])\s+/;
  const counts = new Map<string, number>();
  for (const l of lines) {
    const m = l.match(markerRe);
    if (m) counts.set(m[1], (counts.get(m[1]) ?? 0) + 1);
  }
  const total = [...counts.values()].reduce((a, b) => a + b, 0) || 1;
  const markers = [...counts.entries()]
    .map(([marker, count]) => ({ marker, count, percent: Math.round((count / total) * 100) }))
    .sort((a, b) => b.count - a.count);
  const distinct = markers.length;
  const dominant = markers[0]?.marker ?? null;
  const consistent = distinct <= 1;
  const suggestion = !markers.length
    ? 'bullet 목록이 감지되지 않았습니다.'
    : consistent
      ? `bullet 마커가 "${dominant}" 하나로 일관됩니다.`
      : `bullet 마커 ${distinct}종 혼재 (${markers.map((m) => m.marker).join(' ')}) — "${dominant}" 하나로 통일하세요.`;
  return { markers, distinct, dominant, consistent, suggestion };
}

export interface PunctuationBalance {
  periods: number;
  commas: number;
  questions: number;
  exclamations: number;
  total: number;
  commasPerSentence: number;
  suggestion: string;
}

/**
 * 문장부호 분포 분석 — 마침표/쉼표/물음표/느낌표 비율. 느낌표 과다 · 쉼표 부족(짧은 문장)
 * · 물음표 많음(확신 부족) 같은 신호를 포착.
 */
export function analyzePunctuationBalance(text: string): PunctuationBalance {
  const t = text ?? '';
  const periods = (t.match(/[.。]/g) ?? []).length;
  const commas = (t.match(/[,，]/g) ?? []).length;
  const questions = (t.match(/[?？]/g) ?? []).length;
  const exclamations = (t.match(/[!！]/g) ?? []).length;
  const total = periods + commas + questions + exclamations;
  const sentences = Math.max(1, periods + questions + exclamations);
  const commasPerSentence = Math.round((commas / sentences) * 100) / 100;

  let suggestion = '';
  if (total === 0) suggestion = '문장부호가 감지되지 않았습니다.';
  else if (exclamations > sentences * 0.3)
    suggestion = `느낌표 과다 (${exclamations}/${sentences}) — 공식 문서 톤으로 줄이세요.`;
  else if (questions > sentences * 0.2)
    suggestion = `물음표가 많습니다 (${questions}) — 확신 있는 서술형으로 재구성.`;
  else if (commasPerSentence < 0.3 && sentences > 5)
    suggestion = `쉼표 사용이 적습니다 (문장당 ${commasPerSentence}) — 긴 문장에 쉼표로 호흡을 주세요.`;
  else suggestion = `문장부호 분포 정상 (문장당 쉼표 ${commasPerSentence}).`;
  return { periods, commas, questions, exclamations, total, commasPerSentence, suggestion };
}
