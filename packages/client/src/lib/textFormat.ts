/**
 * 텍스트 포맷 분석 모듈 — 괄호 균형 + 공백 이상 검출. koreanChecker.ts 에서 분리.
 *
 * 제공:
 * - analyzeBracketBalance: ()/[]/{}/「」/『』/<>/"" 등 괄호 짝 맞음 검증
 * - detectWhitespaceAnomalies: trailing·tab·NBSP·전각 공백·연속 빈줄 감지
 */

export interface BracketBalanceAnalysis {
  pairs: Array<{ open: string; close: string; opened: number; closed: number; unbalanced: number }>;
  unbalanced: boolean;
  suggestion: string;
}

const BRACKET_PAIRS: Array<{ open: string; close: string }> = [
  { open: '(', close: ')' },
  { open: '[', close: ']' },
  { open: '{', close: '}' },
  { open: '「', close: '」' },
  { open: '『', close: '』' },
  { open: '<', close: '>' },
  { open: '"', close: '"' },
  { open: '"', close: '"' },
];

/**
 * 괄호 균형 검사 — ([{「『 와 대응 닫힘의 개수가 다르면 편집 실수. 이력서·자소서에서
 * 편집 중 생기는 흔한 실수를 간단히 포착.
 */
export function analyzeBracketBalance(text: string): BracketBalanceAnalysis {
  const t = text ?? '';
  const pairs = BRACKET_PAIRS.map(({ open, close }) => {
    const opened =
      open === close
        ? Math.floor((t.split(open).length - 1) / 2) // 대칭 기호는 짝수 기대
        : t.split(open).length - 1;
    const closed = open === close ? opened : t.split(close).length - 1;
    const unbalanced = Math.abs(opened - closed);
    return { open, close, opened, closed, unbalanced };
  }).filter((p) => p.opened > 0 || p.closed > 0);
  const hasUnbalanced = pairs.some((p) => p.unbalanced > 0);
  const suggestion = hasUnbalanced
    ? `괄호 불균형: ${pairs
        .filter((p) => p.unbalanced > 0)
        .map((p) => `${p.open}${p.close} ${p.opened}/${p.closed}`)
        .join(', ')} — 짝을 맞추세요.`
    : pairs.length > 0
      ? '괄호 균형이 맞습니다.'
      : '괄호가 사용되지 않았습니다.';
  return { pairs, unbalanced: hasUnbalanced, suggestion };
}

export interface WhitespaceAnomaly {
  type: 'trailing' | 'tab' | 'nbsp' | 'fullwidth' | 'multiple-blank-lines';
  index: number;
  line: number;
  sample: string;
}

export interface WhitespaceAnalysis {
  anomalies: WhitespaceAnomaly[];
  counts: Record<WhitespaceAnomaly['type'], number>;
  clean: boolean;
  suggestion: string;
}

/**
 * 공백 이상 검출 — 줄 끝 trailing 공백 · 탭 문자 · 무중단 공백(NBSP) · 탭·공백 혼재 등
 * 복사/붙여넣기 혹은 에디터 설정 차이로 생기는 숨은 쓰레기. 자동 제거 대상.
 */
export function detectWhitespaceAnomalies(text: string): WhitespaceAnalysis {
  const t = text ?? '';
  const anomalies: WhitespaceAnomaly[] = [];
  const lines = t.split('\n');
  let lineOffset = 0;
  let consecBlank = 0;
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    // trailing
    if (/ +$/.test(line)) {
      anomalies.push({
        type: 'trailing',
        index: lineOffset + line.length - (line.match(/ +$/)?.[0].length ?? 0),
        line: i + 1,
        sample: '·'.repeat(line.match(/ +$/)?.[0].length ?? 0),
      });
    }
    // tab
    const tabMatch = line.match(/\t/);
    if (tabMatch) {
      anomalies.push({
        type: 'tab',
        index: lineOffset + (tabMatch.index ?? 0),
        line: i + 1,
        sample: '→',
      });
    }
    // NBSP (U+00A0)
    const nbspMatch = line.match(/\u00A0/);
    if (nbspMatch) {
      anomalies.push({
        type: 'nbsp',
        index: lineOffset + (nbspMatch.index ?? 0),
        line: i + 1,
        sample: '[NBSP]',
      });
    }
    // fullwidth (U+3000)
    const fwMatch = line.match(/\u3000/);
    if (fwMatch) {
      anomalies.push({
        type: 'fullwidth',
        index: lineOffset + (fwMatch.index ?? 0),
        line: i + 1,
        sample: '[전각]',
      });
    }
    if (/^\s*$/.test(line)) consecBlank++;
    else {
      if (consecBlank >= 3) {
        anomalies.push({
          type: 'multiple-blank-lines',
          index: lineOffset - consecBlank,
          line: i - consecBlank + 1,
          sample: `빈줄 ${consecBlank}개`,
        });
      }
      consecBlank = 0;
    }
    lineOffset += line.length + 1; // +1 for '\n'
  }
  const counts: Record<WhitespaceAnomaly['type'], number> = {
    trailing: 0,
    tab: 0,
    nbsp: 0,
    fullwidth: 0,
    'multiple-blank-lines': 0,
  };
  for (const a of anomalies) counts[a.type]++;
  const clean = anomalies.length === 0;
  const suggestion = clean
    ? '공백 이상이 없습니다.'
    : `공백 이상 ${anomalies.length}건: ${Object.entries(counts)
        .filter(([, v]) => v > 0)
        .map(([k, v]) => `${k}=${v}`)
        .join(', ')} — 에디터에서 정리하세요.`;
  return { anomalies: anomalies.slice(0, 30), counts, clean, suggestion };
}
