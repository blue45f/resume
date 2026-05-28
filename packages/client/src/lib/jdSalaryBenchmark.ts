/**
 * JD 연봉 벤치마크 — 한국 IT 시장 데이터(2024~2025 기준)와
 * JD 에서 감지된 시니어리티·회사 규모 신호를 결합해 협상 앵커를 제안한다.
 */

export type SeniorityLevel = 'junior' | 'mid' | 'senior' | 'lead';
export type CompanyType =
  | 'startup-early'
  | 'startup-growth'
  | 'unicorn'
  | 'bigtech'
  | 'chaebol'
  | 'unknown';

export interface SalaryRange {
  min: number; // 만원
  max: number; // 만원
}

export interface SalaryBenchmarkReport {
  /** Detected seniority level. */
  seniority: SeniorityLevel;
  /** Detected company type from JD signals. */
  companyType: CompanyType;
  /** Korean market range for this seniority+company bucket. */
  marketRange: SalaryRange;
  /** JD-stated salary range (null if not found). */
  jdRange: SalaryRange | null;
  /** Suggested negotiation anchor (market 70th-75th percentile). */
  negotiationAnchor: number;
  /** Whether the JD range is below market. */
  isBelowMarket: boolean;
  /** Korean one-sentence assessment. */
  assessment: string;
  /** Negotiation talking points in Korean. */
  tips: string[];
  /** Korean short label. */
  label: string;
}

// ---------------------------------------------------------------------------
// Market data tables (만원, 2024~2025 Korean IT market)
// ---------------------------------------------------------------------------

const BASE_RANGES: Record<SeniorityLevel, SalaryRange> = {
  junior: { min: 3000, max: 4500 },
  mid: { min: 4500, max: 7000 },
  senior: { min: 7000, max: 10000 },
  lead: { min: 10000, max: 15000 },
};

const COMPANY_MULTIPLIERS: Record<CompanyType, number> = {
  'startup-early': 0.85,
  'startup-growth': 0.95,
  unicorn: 1.1,
  bigtech: 1.25,
  chaebol: 1.0,
  unknown: 1.0,
};

const COMPANY_TYPE_LABELS: Record<CompanyType, string> = {
  'startup-early': '초기 스타트업',
  'startup-growth': '성장 스타트업',
  unicorn: '유니콘/후기 스타트업',
  bigtech: '빅테크(네이버·카카오·라인 등)',
  chaebol: '대기업',
  unknown: '일반 기업',
};

// ---------------------------------------------------------------------------
// Seniority detection from JD
// ---------------------------------------------------------------------------

const JUNIOR_PATTERNS = [/(?:신입|0\s*~?\s*[23]년|주니어|인턴|entry\s*level|junior)/i];
const MID_PATTERNS = [/(?:[23]\s*~?\s*[567]년|[23]년\s*이상|mid[-\s]?level|미들|middle)/i];
const SENIOR_PATTERNS = [/(?:[567]\s*~?\s*\d+년|[5-9]년\s*이상|시니어|senior|sr\.)/i];
const LEAD_PATTERNS = [
  /(?:팀장|리드|파트장|principal|staff|distinguished|10년\s*이상|lead\s*(?:engineer|developer))/i,
];

function detectSeniority(text: string): SeniorityLevel {
  if (LEAD_PATTERNS.some((p) => p.test(text))) return 'lead';
  if (SENIOR_PATTERNS.some((p) => p.test(text))) return 'senior';
  if (MID_PATTERNS.some((p) => p.test(text))) return 'mid';
  if (JUNIOR_PATTERNS.some((p) => p.test(text))) return 'junior';
  return 'mid'; // default
}

// ---------------------------------------------------------------------------
// Company type detection from JD
// ---------------------------------------------------------------------------

const BIGTECH_PATTERNS = [
  /(?:네이버|kakao|카카오|라인|line\s*plus|당근|토스|viva\s*republica|쿠팡|coupang|배달의민족|우아한형제|하이퍼클로바|cloud\s*bi)/i,
];
const UNICORN_PATTERNS = [
  /(?:series\s*[cd]|시리즈\s*[cd]|기업가치\s*\d|조\s*달러|유니콘|IPO\s*준비|pre[-\s]?ipo)/i,
];
const GROWTH_PATTERNS = [
  /(?:series\s*[ab]|시리즈\s*[ab]|성장\s*스타트업|growth\s*stage|수십억|수백억\s*투자)/i,
];
const STARTUP_EARLY_PATTERNS = [
  /(?:seed\s*stage|초기\s*스타트업|pre\s*series|창업|early\s*stage|소수\s*정예)/i,
];
const CHAEBOL_PATTERNS = [
  /(?:삼성|현대|SK\s*(?:하이닉스|텔레콤|C&C)|LG\s*(?:전자|CNS|유플러스)|롯데|한화|KT\s*(?:클라우드|DS)|포스코)/i,
];

function detectCompanyType(text: string): CompanyType {
  if (BIGTECH_PATTERNS.some((p) => p.test(text))) return 'bigtech';
  if (CHAEBOL_PATTERNS.some((p) => p.test(text))) return 'chaebol';
  if (UNICORN_PATTERNS.some((p) => p.test(text))) return 'unicorn';
  if (GROWTH_PATTERNS.some((p) => p.test(text))) return 'startup-growth';
  if (STARTUP_EARLY_PATTERNS.some((p) => p.test(text))) return 'startup-early';
  return 'unknown';
}

// ---------------------------------------------------------------------------
// JD salary range extraction (Korean won, 만원 unit)
// ---------------------------------------------------------------------------

const KRW_BAND_RE =
  /([3-9]\d{3}|[1-9]\d{4})\s*(?:만원?)?\s*[~\-–]\s*([3-9]\d{3}|[1-9]\d{4})\s*(?:만원?)/g;
const KRW_ANNUAL_RE = /연봉\s*([3-9]\d{3}|[1-9]\d{4})\s*(?:만원?)/g;

function extractJdRange(text: string): SalaryRange | null {
  KRW_BAND_RE.lastIndex = 0;
  const bandMatch = KRW_BAND_RE.exec(text);
  if (bandMatch) {
    return { min: parseInt(bandMatch[1], 10), max: parseInt(bandMatch[2], 10) };
  }
  KRW_ANNUAL_RE.lastIndex = 0;
  const singleMatch = KRW_ANNUAL_RE.exec(text);
  if (singleMatch) {
    const v = parseInt(singleMatch[1], 10);
    return { min: Math.round(v * 0.9), max: Math.round(v * 1.1) };
  }
  return null;
}

// ---------------------------------------------------------------------------
// Main export
// ---------------------------------------------------------------------------

export function buildSalaryBenchmarkReport(jdText: string): SalaryBenchmarkReport {
  const safe = (jdText ?? '').trim();

  const seniority = detectSeniority(safe);
  const companyType = detectCompanyType(safe);
  const multiplier = COMPANY_MULTIPLIERS[companyType];
  const base = BASE_RANGES[seniority];
  const marketRange: SalaryRange = {
    min: Math.round((base.min * multiplier) / 100) * 100,
    max: Math.round((base.max * multiplier) / 100) * 100,
  };

  const jdRange = extractJdRange(safe);

  // Anchor = 70th-75th percentile of market range.
  const anchor =
    Math.round((marketRange.min + (marketRange.max - marketRange.min) * 0.72) / 100) * 100;

  const isBelowMarket = jdRange !== null && jdRange.max < marketRange.min * 0.9;

  let assessment: string;
  if (!jdRange) {
    assessment = `연봉 미명시. ${COMPANY_TYPE_LABELS[companyType]} ${seniority === 'junior' ? '신입/주니어' : seniority === 'mid' ? '미드레벨' : seniority === 'senior' ? '시니어' : '리드'} 시장 범위는 ${marketRange.min.toLocaleString()}~${marketRange.max.toLocaleString()}만원 수준입니다.`;
  } else if (isBelowMarket) {
    assessment = `JD 제시 연봉(${jdRange.min.toLocaleString()}~${jdRange.max.toLocaleString()}만원)이 시장 하단보다 낮습니다. 협상 여지를 확보하세요.`;
  } else if (jdRange.max >= marketRange.max * 0.95) {
    assessment = `JD 연봉 범위(${jdRange.min.toLocaleString()}~${jdRange.max.toLocaleString()}만원)가 시장 상단 수준입니다.`;
  } else {
    assessment = `JD 연봉(${jdRange.min.toLocaleString()}~${jdRange.max.toLocaleString()}만원)은 시장 중간 수준입니다. 상단 ${anchor.toLocaleString()}만원을 앵커로 제시해 볼 수 있습니다.`;
  }

  const tips: string[] = [
    `첫 제안은 ${anchor.toLocaleString()}만원 전후로 구체적 숫자로 제시하세요 — "협의 가능"보다 명확한 앵커가 유리합니다.`,
    `현재 연봉·오퍼 공개는 선택입니다. 먼저 회사의 밴드를 물어보는 것이 유리합니다.`,
    `연봉 외 사이닝 보너스·스톡·인상 주기를 패키지로 협상하세요.`,
    `수락 전 "72시간 검토" 여유를 요청하는 것은 일반적인 관행입니다.`,
  ];

  const label = jdRange
    ? `${jdRange.min.toLocaleString()}~${jdRange.max.toLocaleString()}만원`
    : `시장 ${marketRange.min.toLocaleString()}~${marketRange.max.toLocaleString()}만원`;

  return {
    seniority,
    companyType,
    marketRange,
    jdRange,
    negotiationAnchor: anchor,
    isBelowMarket,
    assessment,
    tips,
    label,
  };
}
