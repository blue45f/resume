/**
 * JD 연봉 투명성 분석기 — 채용공고에서 연봉/보상 정보가
 * 명시적으로 공개되어 있는지, 암시적으로만 존재하는지,
 * 아예 없는지 평가한다.
 */

export type SalaryDisclosureType =
  | 'explicit_range' // 구체적 연봉 범위 명시 (5000~7000만원)
  | 'explicit_base' // 기본급 명시
  | 'negotiable_stated' // "협의 가능"이 명시됨
  | 'equity_mentioned' // 스톡옵션/RSU 언급
  | 'bonus_mentioned' // 인센티브/성과급 언급
  | 'benefits_detailed' // 복지 포인트 등 수치화된 복리후생

export type SalaryOpacityType =
  | 'no_salary_info' // 연봉 정보 전무
  | 'vague_competitive' // "경쟁력 있는 연봉" 모호한 표현
  | 'interview_only' // "면접 시 협의" 로만 언급

export interface SalaryDisclosureSignal {
  type: SalaryDisclosureType
  excerpt: string
}

export interface SalaryOpacitySignal {
  type: SalaryOpacityType
  excerpt: string
}

export type SalaryTransparency = 'transparent' | 'partial' | 'opaque' | 'silent'

export interface JdSalaryTransparencyReport {
  disclosureSignals: SalaryDisclosureSignal[]
  opacitySignals: SalaryOpacitySignal[]
  transparency: SalaryTransparency
  hasEquity: boolean
  summary: string
  negotiationTips: string[]
}

// ---------------------------------------------------------------------------
// Disclosure patterns
// ---------------------------------------------------------------------------

interface DisclosurePattern {
  re: RegExp
  type: SalaryDisclosureType
}

const DISCLOSURE_PATTERNS: DisclosurePattern[] = [
  // Explicit range
  {
    re: /(?:[0-9,]+\s*만\s*원?\s*~\s*[0-9,]+\s*만\s*원?|[0-9,]+\s*만\s*~\s*[0-9,]+\s*만)/,
    type: 'explicit_range',
  },
  {
    re: /연봉\s*(?:[0-9,]+\s*만\s*원?\s*~\s*[0-9,]+|[0-9,]+[만억]\s*원?\s*이상|[0-9,]+[만억]\s*원?\s*내외)/,
    type: 'explicit_range',
  },
  { re: /\$[0-9,]+\s*(?:K|k)?\s*[-~]\s*\$?[0-9,]+\s*(?:K|k)?/, type: 'explicit_range' },

  // Explicit base
  {
    re: /(?:기본급|기본\s*연봉)\s*(?:[0-9,]+\s*만\s*원?|[0-9,]+[만억]\s*원?)/,
    type: 'explicit_base',
  },
  {
    re: /월\s*(?:급여|급)\s*(?:[0-9,]+\s*만\s*원?|[0-9,]+[만억]\s*원?)/,
    type: 'explicit_base',
  },

  // Negotiable stated
  {
    re: /연봉\s*(?:협의|협상|면담\s*후\s*결정|전년도\s*연봉\s*기준)/,
    type: 'negotiable_stated',
  },
  {
    re: /(?:연봉|급여)\s*(?:은|는)\s*(?:협의|협상|면접\s*후\s*결정)\s*합니다/,
    type: 'negotiable_stated',
  },

  // Equity
  {
    re: /(?:스톡\s*옵션|Stock\s*Option|주식매수선택권)\s*(?:제공|부여|지급|포함)/,
    type: 'equity_mentioned',
  },
  { re: /(?:RSU|우리사주|주식\s*보상)\s*(?:제공|부여|지급|포함)/, type: 'equity_mentioned' },

  // Bonus
  {
    re: /(?:성과급|인센티브|보너스)\s*(?:지급|제공|연\s*[0-9]+회|최대\s*[0-9]+개월)/,
    type: 'bonus_mentioned',
  },
  {
    re: /(?:분기|반기|연간)\s*(?:성과급|인센티브)\s*(?:지급|제공|별도)/,
    type: 'bonus_mentioned',
  },

  // Benefits with numbers
  {
    re: /(?:[0-9]+만\s*원|[0-9]+포인트)\s*(?:복지|복리후생|복지\s*포인트|교육비|건강검진)/,
    type: 'benefits_detailed',
  },
  {
    re: /복지\s*포인트\s*(?:연\s*)?[0-9]+만\s*원/,
    type: 'benefits_detailed',
  },
]

// ---------------------------------------------------------------------------
// Opacity patterns
// ---------------------------------------------------------------------------

interface OpacityPattern {
  re: RegExp
  type: SalaryOpacityType
}

const OPACITY_PATTERNS: OpacityPattern[] = [
  // Vague "competitive"
  {
    re: /(?:업계\s*최고\s*수준|업계\s*상위\s*수준|경쟁력\s*있는)\s*(?:연봉|급여|처우|보상)/,
    type: 'vague_competitive',
  },
  {
    re: /(?:좋은|훌륭한|최고의)\s*(?:처우|보상|급여\s*패키지)/,
    type: 'vague_competitive',
  },

  // Interview only
  {
    re: /(?:면접|면담)\s*(?:시|후|에서)\s*(?:연봉|급여|처우)\s*(?:협의|결정|논의)/,
    type: 'interview_only',
  },
  {
    re: /처우는?\s*(?:면접\s*후\s*결정|협의\s*가능|내부\s*규정)/,
    type: 'interview_only',
  },
]

// ---------------------------------------------------------------------------
// Main analysis
// ---------------------------------------------------------------------------

export function analyzeJdSalaryTransparency(text: string): JdSalaryTransparencyReport {
  const t = text ?? ''
  const disclosureSignals: SalaryDisclosureSignal[] = []
  const opacitySignals: SalaryOpacitySignal[] = []

  for (const { re, type } of DISCLOSURE_PATTERNS) {
    const m = t.match(re)
    if (m) disclosureSignals.push({ type, excerpt: m[0].slice(0, 60) })
  }

  for (const { re, type } of OPACITY_PATTERNS) {
    const m = t.match(re)
    if (m) opacitySignals.push({ type, excerpt: m[0].slice(0, 60) })
  }

  const hasExplicit = disclosureSignals.some(
    (s) => s.type === 'explicit_range' || s.type === 'explicit_base'
  )
  const hasPartial = disclosureSignals.some(
    (s) =>
      s.type === 'negotiable_stated' ||
      s.type === 'equity_mentioned' ||
      s.type === 'bonus_mentioned'
  )
  const hasEquity = disclosureSignals.some((s) => s.type === 'equity_mentioned')
  const hasOpacitySignals = opacitySignals.length > 0

  let transparency: SalaryTransparency
  if (hasExplicit) transparency = 'transparent'
  else if (hasPartial) transparency = 'partial'
  else if (hasOpacitySignals) transparency = 'opaque'
  else transparency = 'silent'

  let summary: string
  if (transparency === 'transparent') {
    summary = '연봉 정보가 명확히 공개되어 있습니다. 지원 전 기대치를 설정하기 좋습니다.'
  } else if (transparency === 'partial') {
    summary =
      '연봉 범위는 없으나 협의 가능/인센티브 등이 언급됩니다. 면접에서 구체적 숫자를 확인하세요.'
  } else if (transparency === 'opaque') {
    summary =
      '"경쟁력 있는 연봉" 등 모호한 표현만 있습니다. 면접 전 시장 기준을 파악하고 기대 연봉을 준비하세요.'
  } else {
    summary = '연봉 정보가 전혀 없습니다. 서류 합격 후 연봉 협상 전략을 미리 준비하세요.'
  }

  const negotiationTips: string[] = []
  if (transparency === 'silent' || transparency === 'opaque') {
    negotiationTips.push('잡코리아·원티드·링크드인에서 동일 포지션 연봉을 미리 조사하세요.')
    negotiationTips.push('합격 후 첫 제안 수락 전 "협의의 여지가 있나요?"라고 질문하세요.')
  }
  if (hasEquity) {
    negotiationTips.push('스톡옵션 행사가/클리프/베스팅 일정을 반드시 확인하세요.')
  }
  if (!hasExplicit && hasPartial) {
    negotiationTips.push('면접에서 구체적 연봉 범위나 비슷한 포지션의 보상 수준을 직접 물어보세요.')
  }

  return {
    disclosureSignals,
    opacitySignals,
    transparency,
    hasEquity,
    summary,
    negotiationTips,
  }
}
