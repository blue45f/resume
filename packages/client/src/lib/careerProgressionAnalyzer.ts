/**
 * 커리어 성장 가시성 분석 모듈.
 *
 * 제공:
 * - analyzeCareerProgression: 이력서에서 승진·역할 확대·팀 성장 신호 감지
 *
 * 관련 타입: CareerProgressionReport.
 */

export type ProgressionClarity = 'clear' | 'some' | 'unclear';

export interface ProgressionSignal {
  text: string;
  type: 'promotion' | 'scope' | 'team_growth' | 'role_change';
  label: string;
}

export interface CareerProgressionReport {
  clarity: ProgressionClarity;
  signals: ProgressionSignal[];
  promotionCount: number;
  scopeCount: number;
  suggestion: string;
}

// ---------------------------------------------------------------------------
// Signal patterns
// ---------------------------------------------------------------------------

interface SignalPattern {
  re: RegExp;
  type: ProgressionSignal['type'];
  label: string;
}

const PROGRESSION_PATTERNS: SignalPattern[] = [
  // Promotion / seniority elevation
  { re: /승진|진급/, type: 'promotion', label: '승진' },
  {
    re: /시니어\s*(?:개발자|엔지니어|레벨)?|Sr\.?\s*(?:Dev|Eng)/,
    type: 'promotion',
    label: '시니어 승격',
  },
  {
    re: /(?:팀장|테크\s*리드|리드\s*개발자|수석\s*(?:개발자|엔지니어))/,
    type: 'promotion',
    label: '팀장/리드',
  },
  { re: /매니저|Manager|PM\s*(?:으로|로\s*전환)/, type: 'promotion', label: '매니저 역할' },
  { re: /(?:부장|차장|과장|대리)\s*(?:으로|로|직급)/, type: 'promotion', label: '직급 상승' },
  { re: /[Pp]rincipal|[Ss]taff\s*(?:Engineer|Dev)/, type: 'promotion', label: 'Staff 레벨' },

  // Scope expansion
  {
    re: /\d+\s*명\s*(?:팀|인원|규모)?\s*(?:이상|에서|을|관리|리드)/,
    type: 'scope',
    label: 'N명 팀/관리',
  },
  { re: /팀\s*(?:규모|인원)\s*(?:확대|증가|\d+배)/, type: 'scope', label: '팀 규모 확대' },
  {
    re: /(?:전\s*팀원|팀\s*전체|파트\s*전체)\s*(?:관리|감독|코칭)/,
    type: 'scope',
    label: '전체 팀 관리',
  },
  {
    re: /담당\s*(?:서비스|시스템|제품)\s*(?:확대|증가|추가)/,
    type: 'scope',
    label: '담당 범위 확대',
  },
  {
    re: /(?:예산|비용)\s*(?:\d+억|\d+만원|\d+천만)\s*(?:관리|담당)/,
    type: 'scope',
    label: '예산 관리',
  },

  // Team/org growth as evidence of impact
  {
    re: /MAU\s*\d+\s*만?\s*→\s*\d+|사용자\s*\d+\s*만?\s*→\s*\d+/,
    type: 'team_growth',
    label: 'MAU/사용자 성장',
  },
  { re: /서비스\s*\d+배\s*성장|매출\s*\d+배/, type: 'team_growth', label: '서비스 성장 기여' },

  // Role change / evolution
  {
    re: /(?:백엔드|프론트엔드|풀스택)\s*(?:로\s*전환|전환|이직|합류)/,
    type: 'role_change',
    label: '기술 스택 전환',
  },
  { re: /창업|co.founder|공동\s*창업/, type: 'role_change', label: '창업 경험' },
  { re: /인턴.*정규직|계약직.*정규직|정규직\s*전환/, type: 'role_change', label: '정규직 전환' },
];

// ---------------------------------------------------------------------------
// Main analysis
// ---------------------------------------------------------------------------

/**
 * 이력서 텍스트에서 커리어 성장 신호를 감지하고 가시성을 평가.
 */
export function analyzeCareerProgression(text: string): CareerProgressionReport {
  const t = text ?? '';

  const signals: ProgressionSignal[] = PROGRESSION_PATTERNS.filter(({ re }) => re.test(t)).map(
    ({ re, type, label }) => ({
      text: (t.match(re) ?? [''])[0].trim(),
      type,
      label,
    }),
  );

  const promotionCount = signals.filter((s) => s.type === 'promotion').length;
  const scopeCount = signals.filter((s) => s.type === 'scope' || s.type === 'team_growth').length;

  let clarity: ProgressionClarity;
  if (promotionCount >= 1 && scopeCount >= 1) {
    clarity = 'clear';
  } else if (signals.length >= 2) {
    clarity = 'some';
  } else if (signals.length === 1) {
    clarity = 'some';
  } else {
    clarity = 'unclear';
  }

  let suggestion: string;
  if (clarity === 'clear') {
    suggestion = '커리어 성장 흐름이 잘 드러나 있습니다.';
  } else if (clarity === 'some') {
    suggestion =
      promotionCount === 0
        ? '직책 변화(시니어·리드·팀장 등 승진)를 명시하면 성장 흐름이 더 명확해집니다.'
        : '담당 팀 규모, 책임 범위 확대, 매출·사용자 성장 기여를 수치로 보여주세요.';
  } else {
    suggestion =
      '승진·역할 확대·팀 성장 신호가 보이지 않습니다. ' +
      '직책 변화, 담당 인원 수, 매출/사용자 성장 기여 등을 각 경력 항목에 추가하면 차별화됩니다.';
  }

  return { clarity, signals, promotionCount, scopeCount, suggestion };
}
