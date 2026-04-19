/**
 * 숫자 포맷 일관성 분석 모듈 — koreanChecker.ts 에서 분리.
 *
 * 제공:
 * - analyzeNumericFormat: 1,000 / 1000 / 1천·1만 등 4자리 이상 숫자 표기 혼재 검출
 *
 * 관련 타입: NumericFormatAnalysis.
 */

export interface NumericFormatAnalysis {
  comma: number; // 1,000
  plain: number; // 1000
  korean: number; // 1천, 1만, 1억
  distinct: number;
  dominant: 'comma' | 'plain' | 'korean' | null;
  consistent: boolean;
  suggestion: string;
}

/**
 * 숫자 포맷 일관성 — "1,000 / 1000 / 1천" 혼재 여부. 이력서·자소서 전반에서 숫자 표기를
 * 한 가지로 통일하면 전문성 상승.
 */
export function analyzeNumericFormat(text: string): NumericFormatAnalysis {
  const t = text ?? '';
  const comma = (t.match(/\b\d{1,3}(?:,\d{3})+\b/g) ?? []).length;
  const korean = (t.match(/\d+\s*(천|만|억|조)/g) ?? []).length;
  // plain: 4자리 이상 숫자이면서 쉼표·한글단위 없이 등장
  const allLarge = (t.match(/(?<![,\d])\d{4,}(?![,\d])/g) ?? []).length;
  const plain = Math.max(0, allLarge - comma - korean);
  const allFormats: Array<{ key: NonNullable<NumericFormatAnalysis['dominant']>; count: number }> =
    [
      { key: 'comma' as const, count: comma },
      { key: 'plain' as const, count: plain },
      { key: 'korean' as const, count: korean },
    ];
  const formats = allFormats.filter((f) => f.count > 0);
  const distinct = formats.length;
  formats.sort((a, b) => b.count - a.count);
  const dominant = formats[0]?.key ?? null;
  const consistent = distinct <= 1;
  let suggestion = '';
  const total = comma + plain + korean;
  if (total === 0) suggestion = '4자리 이상 숫자가 없습니다.';
  else if (consistent) suggestion = `숫자 포맷이 "${dominant}" 로 일관됩니다.`;
  else
    suggestion = `숫자 포맷 ${distinct}종 혼재 — "${dominant}" 스타일로 통일하세요 (쉼표=${comma}, 단순=${plain}, 한글=${korean}).`;
  return { comma, plain, korean, distinct, dominant, consistent, suggestion };
}
