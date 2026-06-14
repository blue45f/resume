/**
 * JD 복리후생 구체성 분석기 — "다양한 복지"와 "복지 포인트 연 120만 원"의
 * 차이를 구분하고 지원자에게 실질 복지 수준을 평가할 수 있게 돕는다.
 */

export type SpecificBenefitType =
  | 'benefit_points' // 복지 포인트 금액
  | 'remote_days' // 원격 근무 일수
  | 'flex_hours' // 유연 근무 시간
  | 'education_budget' // 교육비 금액
  | 'health_checkup' // 건강검진 항목
  | 'parental_leave' // 육아휴직 기간
  | 'vacation_days' // 연차 일수
  | 'meal_support' // 식대 금액

export type VagueBenefitType =
  | 'generic_welfare' // "다양한 복지"
  | 'best_in_class' // "업계 최고 복지"
  | 'flexible_generic' // "유연한 근무 환경" (시간 불명)
  | 'supportive_culture' // "성장 지원" (금액 불명)

export interface SpecificBenefitSignal {
  type: SpecificBenefitType
  excerpt: string
}

export interface VagueBenefitSignal {
  type: VagueBenefitType
  excerpt: string
}

export type BenefitsClarity = 'detailed' | 'partial' | 'vague' | 'absent'

export interface JdBenefitsSpecificityReport {
  specificSignals: SpecificBenefitSignal[]
  vagueSignals: VagueBenefitSignal[]
  clarity: BenefitsClarity
  specificCount: number
  vagueCount: number
  summary: string
  interviewQuestions: string[]
}

// ---------------------------------------------------------------------------
// Specific patterns
// ---------------------------------------------------------------------------

interface SpecificPattern {
  re: RegExp
  type: SpecificBenefitType
}

const SPECIFIC_PATTERNS: SpecificPattern[] = [
  // benefit_points
  {
    re: /복지\s*포인트\s*(?:연\s*)?[0-9,]+만\s*원/,
    type: 'benefit_points',
  },
  {
    re: /[0-9,]+만\s*원\s*(?:복지|복리후생|생활\s*지원)/,
    type: 'benefit_points',
  },

  // remote_days
  {
    re: /(?:주\s*[0-9]+일|월\s*[0-9]+일)\s*(?:재택|원격\s*근무)/,
    type: 'remote_days',
  },
  {
    re: /재택\s*근무\s*(?:주\s*[0-9]+일|[0-9]+일\s*가능|전면|100%)/,
    type: 'remote_days',
  },

  // flex_hours
  {
    re: /(?:코어\s*타임|코어타임)\s*(?:[0-9]+시|없음|없는)/,
    type: 'flex_hours',
  },
  {
    re: /(?:출근\s*시간|출퇴근\s*시간)\s*(?:자유|자율|[0-9]+시~[0-9]+시)/,
    type: 'flex_hours',
  },
  {
    re: /시차\s*출퇴근\s*(?:제도|가능|운영)/,
    type: 'flex_hours',
  },

  // education_budget
  {
    re: /(?:교육비|도서\s*구입비|교육\s*지원금)\s*(?:연\s*)?[0-9,]+만\s*원/,
    type: 'education_budget',
  },
  {
    re: /[0-9,]+만\s*원\s*(?:교육|자기\s*계발|학습)\s*(?:지원|지급|제공)/,
    type: 'education_budget',
  },

  // health_checkup
  {
    re: /건강검진\s*(?:연\s*[0-9]+회|전액\s*지원|비용\s*지원|[0-9,]+만\s*원)/,
    type: 'health_checkup',
  },
  {
    re: /(?:종합\s*건강검진|정기\s*건강검진)\s*(?:지원|제공|무료)/,
    type: 'health_checkup',
  },

  // parental_leave
  {
    re: /(?:육아휴직|출산\s*휴가)\s*(?:[0-9]+개월|[0-9]+년|자유롭게\s*사용|100%\s*사용)/,
    type: 'parental_leave',
  },

  // vacation_days
  {
    re: /(?:연차|휴가)\s*(?:[0-9]+일|최대\s*[0-9]+일|자유롭게\s*사용|의무\s*사용)/,
    type: 'vacation_days',
  },

  // meal_support
  {
    re: /(?:식대|점심\s*비용|식사\s*지원)\s*(?:[0-9,]+만\s*원|전액\s*지원|[0-9,]+원)/,
    type: 'meal_support',
  },
  {
    re: /사내\s*식당\s*(?:운영|제공|무료)/,
    type: 'meal_support',
  },
]

// ---------------------------------------------------------------------------
// Vague patterns
// ---------------------------------------------------------------------------

interface VaguePattern {
  re: RegExp
  type: VagueBenefitType
}

const VAGUE_PATTERNS: VaguePattern[] = [
  // generic_welfare
  {
    re: /다양한\s*(?:복지|복리후생|혜택)/,
    type: 'generic_welfare',
  },
  {
    re: /풍부한\s*(?:복지|복리후생)/,
    type: 'generic_welfare',
  },

  // best_in_class
  {
    re: /(?:업계\s*최고\s*수준|최고의)\s*(?:복지|복리후생|처우)/,
    type: 'best_in_class',
  },

  // flexible_generic
  {
    re: /(?:유연한|자유로운)\s*(?:근무\s*환경|근무\s*문화|업무\s*환경)/,
    type: 'flexible_generic',
  },
  {
    re: /자율\s*(?:출퇴근|근무)\s*(?:가능|제도|운영)(?!\s*[0-9])/,
    type: 'flexible_generic',
  },

  // supportive_culture
  {
    re: /(?:성장을?\s*지원|자기\s*계발\s*지원|학습\s*지원)(?!\s*[0-9])/,
    type: 'supportive_culture',
  },
  {
    re: /(?:개인\s*성장|역량\s*개발)\s*(?:을|를)?\s*(?:응원|지원|촉진)/,
    type: 'supportive_culture',
  },
]

// ---------------------------------------------------------------------------
// Main analysis
// ---------------------------------------------------------------------------

export function analyzeJdBenefitsSpecificity(text: string): JdBenefitsSpecificityReport {
  const t = text ?? ''
  const specificSignals: SpecificBenefitSignal[] = []
  const vagueSignals: VagueBenefitSignal[] = []

  for (const { re, type } of SPECIFIC_PATTERNS) {
    const m = t.match(re)
    if (m) specificSignals.push({ type, excerpt: m[0].slice(0, 50) })
  }

  for (const { re, type } of VAGUE_PATTERNS) {
    const m = t.match(re)
    if (m) vagueSignals.push({ type, excerpt: m[0].slice(0, 40) })
  }

  const hasSpecific = specificSignals.length >= 2
  const hasVague = vagueSignals.length > 0
  const hasSome = specificSignals.length === 1

  let clarity: BenefitsClarity
  if (specificSignals.length === 0 && vagueSignals.length === 0) {
    clarity = 'absent'
  } else if (hasSpecific && !hasVague) {
    clarity = 'detailed'
  } else if (hasSpecific || hasSome) {
    clarity = 'partial'
  } else {
    clarity = 'vague'
  }

  let summary: string
  if (clarity === 'detailed') {
    summary = `복리후생이 ${specificSignals.length}개 구체적으로 명시되어 있습니다. 지원 전 본인 우선순위와 비교해 보세요.`
  } else if (clarity === 'partial') {
    const vagueCount = vagueSignals.length
    summary =
      vagueCount > 0
        ? `일부 복지는 구체적이나 ${vagueCount}개 항목은 모호합니다. 면접에서 추가 확인이 필요합니다.`
        : '복리후생 정보가 부분적으로만 공개되어 있습니다.'
  } else if (clarity === 'vague') {
    summary = '"다양한 복지" 등 모호한 표현만 있습니다. 면접 전 실제 복지 항목을 질문하세요.'
  } else {
    summary = '복리후생 정보가 공고에 없습니다. 면접에서 직접 확인하세요.'
  }

  const interviewQuestions: string[] = []
  if (!specificSignals.some((s) => s.type === 'remote_days')) {
    interviewQuestions.push('재택/원격 근무는 주 몇 일 가능한가요?')
  }
  if (!specificSignals.some((s) => s.type === 'flex_hours')) {
    interviewQuestions.push('코어 타임이 있나요? 출퇴근 시간이 자유로운가요?')
  }
  if (!specificSignals.some((s) => s.type === 'education_budget')) {
    interviewQuestions.push('교육비·도서 구입비 등 자기 계발 지원 금액이 있나요?')
  }
  if (!specificSignals.some((s) => s.type === 'vacation_days')) {
    interviewQuestions.push('연차 일수와 자유로운 사용이 보장되나요?')
  }

  return {
    specificSignals,
    vagueSignals,
    clarity,
    specificCount: specificSignals.length,
    vagueCount: vagueSignals.length,
    summary,
    interviewQuestions: interviewQuestions.slice(0, 3),
  }
}
