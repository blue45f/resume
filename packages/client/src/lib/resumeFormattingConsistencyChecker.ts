/**
 * 이력서 포맷 일관성 검사기 — 날짜 형식 혼용, 불릿 기호 혼용,
 * 문장 끝 마침표 비일관성 등 시각적 일관성 문제를 감지한다.
 */

export type FormattingIssueType =
  | 'mixed_date_formats' // 날짜 형식 혼용 (YYYY.MM vs YYYY년 vs 2023-01)
  | 'mixed_bullet_styles' // 불릿 기호 혼용 (- vs • vs ▪)
  | 'mixed_sentence_endings' // 마침표 유무 혼재
  | 'mixed_number_formats'; // 숫자 단위 표기 혼용 (30% vs 30퍼센트)

export type DateFormatType = 'dot' | 'slash' | 'dash' | 'korean' | 'year_only';

export interface DateFormatOccurrence {
  format: DateFormatType;
  excerpt: string;
}

export interface FormattingIssue {
  type: FormattingIssueType;
  detail: string;
  count: number;
}

export type FormattingConsistency = 'consistent' | 'minor_issues' | 'inconsistent';

export interface ResumeFormattingReport {
  issues: FormattingIssue[];
  dateFormats: DateFormatOccurrence[];
  consistency: FormattingConsistency;
  summary: string;
  fixGuide: string[];
}

// ---------------------------------------------------------------------------
// Date format detection
// ---------------------------------------------------------------------------

interface DatePattern {
  format: DateFormatType;
  re: RegExp;
}

const DATE_PATTERNS: DatePattern[] = [
  { format: 'dot', re: /20\d{2}\.\d{1,2}(?:\.\d{1,2})?/g },
  { format: 'slash', re: /20\d{2}\/\d{1,2}(?:\/\d{1,2})?/g },
  { format: 'dash', re: /20\d{2}-\d{2}(?:-\d{2})?/g },
  { format: 'korean', re: /20\d{2}년\s*(?:[0-9]+월)?/g },
  { format: 'year_only', re: /20\d{2}년(?!\s*[0-9]+월)/g },
];

function detectDateFormats(text: string): DateFormatOccurrence[] {
  const results: DateFormatOccurrence[] = [];
  for (const { format, re } of DATE_PATTERNS) {
    const matches = text.match(re) ?? [];
    for (const m of matches.slice(0, 3)) {
      results.push({ format, excerpt: m });
    }
  }
  return results;
}

// ---------------------------------------------------------------------------
// Bullet detection
// ---------------------------------------------------------------------------

const BULLET_PATTERNS: Record<string, RegExp> = {
  dash: /^[\s\t]*-\s+/m,
  bullet_dot: /^[\s\t]*•\s+/m,
  bullet_square: /^[\s\t]*[▪▸▷►●]\s+/m,
  asterisk: /^[\s\t]*\*\s+/m,
};

function detectBulletStyles(text: string): string[] {
  return Object.entries(BULLET_PATTERNS)
    .filter(([, re]) => re.test(text))
    .map(([name]) => name);
}

// ---------------------------------------------------------------------------
// Main analysis
// ---------------------------------------------------------------------------

export function checkResumeFormattingConsistency(text: string): ResumeFormattingReport {
  const t = text ?? '';
  const issues: FormattingIssue[] = [];

  // 1. Date format check
  const dateOccurrences = detectDateFormats(t);
  const uniqueDateFormats = new Set(dateOccurrences.map((d) => d.format));
  if (uniqueDateFormats.size >= 2) {
    const formatNames: Record<DateFormatType, string> = {
      dot: 'YYYY.MM',
      slash: 'YYYY/MM',
      dash: 'YYYY-MM',
      korean: 'YYYY년 MM월',
      year_only: 'YYYY년',
    };
    const formats = Array.from(uniqueDateFormats)
      .map((f) => formatNames[f])
      .join(', ');
    issues.push({
      type: 'mixed_date_formats',
      detail: `혼용된 날짜 형식: ${formats}`,
      count: uniqueDateFormats.size,
    });
  }

  // 2. Bullet style check
  const bulletStyles = detectBulletStyles(t);
  if (bulletStyles.length >= 2) {
    issues.push({
      type: 'mixed_bullet_styles',
      detail: `불릿 기호 혼용: ${bulletStyles.join(', ')}`,
      count: bulletStyles.length,
    });
  }

  // 3. Sentence ending consistency
  // Split lines that look like bullet/list items and check endings
  const listLines = t
    .split('\n')
    .map((l) => l.trim())
    .filter((l) => l.length > 10 && /^[-•▪►*]/.test(l));

  if (listLines.length >= 4) {
    const withPeriod = listLines.filter((l) => /[.。]$/.test(l)).length;
    const withoutPeriod = listLines.filter((l) => !/[.。,;]$/.test(l)).length;
    const total = listLines.length;
    if (withPeriod > 0 && withoutPeriod > 0) {
      const ratio = Math.min(withPeriod, withoutPeriod) / total;
      if (ratio >= 0.2) {
        issues.push({
          type: 'mixed_sentence_endings',
          detail: `마침표 있는 항목 ${withPeriod}개, 없는 항목 ${withoutPeriod}개`,
          count: total,
        });
      }
    }
  }

  // 4. Number format
  const hasPercentSymbol = /%/.test(t);
  const hasKoreanPercent = /퍼센트/.test(t);
  if (hasPercentSymbol && hasKoreanPercent) {
    issues.push({
      type: 'mixed_number_formats',
      detail: '% 기호와 "퍼센트" 텍스트 혼용',
      count: 2,
    });
  }

  let consistency: FormattingConsistency;
  if (issues.length === 0) consistency = 'consistent';
  else if (issues.length === 1) consistency = 'minor_issues';
  else consistency = 'inconsistent';

  let summary: string;
  if (consistency === 'consistent') {
    summary = '포맷이 일관성 있게 작성되어 있습니다.';
  } else if (consistency === 'minor_issues') {
    summary = `소소한 포맷 불일치가 1개 감지됩니다. 통일하면 완성도가 높아집니다.`;
  } else {
    summary = `포맷 불일치가 ${issues.length}개 감지됩니다. 통일하면 전문적인 인상을 줄 수 있습니다.`;
  }

  const fixGuide: string[] = [];
  if (issues.some((i) => i.type === 'mixed_date_formats')) {
    fixGuide.push('날짜는 "YYYY.MM" 또는 "YYYY년 MM월" 중 하나로 통일하세요.');
  }
  if (issues.some((i) => i.type === 'mixed_bullet_styles')) {
    fixGuide.push('불릿은 "-" 또는 "•" 중 하나로 전체 통일하세요.');
  }
  if (issues.some((i) => i.type === 'mixed_sentence_endings')) {
    fixGuide.push(
      '목록 항목의 마침표 사용 여부를 통일하세요 (없는 것이 현대 스타일에 가깝습니다).',
    );
  }
  if (issues.some((i) => i.type === 'mixed_number_formats')) {
    fixGuide.push('수치 표기는 "%" 기호로 통일하고 "퍼센트"는 제거하세요.');
  }

  return {
    issues,
    dateFormats: dateOccurrences.slice(0, 6),
    consistency,
    summary,
    fixGuide,
  };
}
