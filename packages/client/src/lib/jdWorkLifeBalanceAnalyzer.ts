/**
 * JD 워라밸 분석기 — 채용공고에서 근무시간·재택·유연근무·복지 등
 * 일-생활 균형에 영향을 주는 신호를 감지하고 종합 평가를 제공한다.
 */

export type WlbSignalType =
  | 'work_hour_compliance' // 52시간 준수 명시
  | 'flex_time' // 유연근무제·시차출퇴근
  | 'remote_work' // 재택·원격 근무
  | 'vacation_policy' // 넉넉한 휴가 제도
  | 'culture_respect' // 야근 없음·강요 없음 언급
  | 'parental_support' // 육아 지원·출산 휴가 강조
  | 'wellness_benefit' // 건강검진·헬스비·심리지원

export interface WlbSignal {
  type: WlbSignalType
  excerpt: string
}

export type WlbRating = 'excellent' | 'good' | 'neutral' | 'concern'

export interface JdWorkLifeBalanceReport {
  signals: WlbSignal[]
  detectedTypes: Set<WlbSignalType>
  score: number // 0–100
  rating: WlbRating
  summary: string
  interviewQuestions: string[]
  redFlags: string[]
}

// ---------------------------------------------------------------------------
// Positive signal patterns
// ---------------------------------------------------------------------------

interface WlbPattern {
  re: RegExp
  type: WlbSignalType
  weight: number
}

const WLB_PATTERNS: WlbPattern[] = [
  // Work hour compliance
  { re: /52시간\s*(?:준수|보장|제도|시행)|주\s*52시간/, type: 'work_hour_compliance', weight: 25 },
  {
    re: /연장\s*(?:근무|야근)\s*(?:없음|거의\s*없음|최소화)|야근\s*(?:없음|거의\s*없음|없어요)/,
    type: 'work_hour_compliance',
    weight: 20,
  },
  {
    re: /정시\s*(?:퇴근|출퇴근)\s*(?:문화|가능|보장|권장)/,
    type: 'work_hour_compliance',
    weight: 20,
  },

  // Flex time
  {
    re: /유연\s*(?:근무|근무제)|시차\s*출퇴근|탄력\s*(?:근무|근무제)/,
    type: 'flex_time',
    weight: 20,
  },
  { re: /자율\s*출퇴근|코어\s*타임|선택\s*근무제/, type: 'flex_time', weight: 20 },
  { re: /집중\s*근무\s*시간|autonomy\s*work\s*hour/, type: 'flex_time', weight: 10 },

  // Remote work
  {
    re: /재택\s*(?:근무|가능|허용|지원|기본)|원격\s*(?:근무|가능|허용)|리모트/,
    type: 'remote_work',
    weight: 25,
  },
  {
    re: /하이브리드\s*(?:근무|제도|가능)|주\s*[1-5]?\s*일\s*재택/,
    type: 'remote_work',
    weight: 20,
  },
  {
    re: /근무지\s*(?:자유|선택|유연)|장소\s*(?:무관|불문|자유)/,
    type: 'remote_work',
    weight: 15,
  },

  // Vacation policy
  {
    re: /(?:연차|휴가)\s*(?:자유롭게|자유로운|눈치\s*없이|마음껏)\s*(?:사용|쓰기)/,
    type: 'vacation_policy',
    weight: 25,
  },
  {
    re: /리프레시\s*(?:휴가|데이)|안식\s*(?:년|월)|장기\s*(?:휴가|안식)/,
    type: 'vacation_policy',
    weight: 20,
  },
  {
    re: /(?:법정|의무)\s*연차\s*(?:보장|이상|이외)/,
    type: 'vacation_policy',
    weight: 15,
  },

  // Culture of respect
  {
    re: /야근\s*(?:강요|시키지|없는\s*문화)|야근\s*(?:강제|강요)\s*(?:없음|안\s*함)/,
    type: 'culture_respect',
    weight: 25,
  },
  {
    re: /눈치\s*보지\s*않는|퇴근\s*(?:후\s*연락\s*없음|후\s*카톡\s*없음)/,
    type: 'culture_respect',
    weight: 20,
  },
  {
    re: /회식\s*(?:자율|강요\s*없음|선택)|음주\s*(?:강요\s*없음|강제\s*없음)/,
    type: 'culture_respect',
    weight: 15,
  },

  // Parental support
  {
    re: /육아\s*(?:지원|휴직\s*보장|병원|시간\s*단축)|출산\s*(?:지원|장려금|휴가)/,
    type: 'parental_support',
    weight: 20,
  },
  {
    re: /어린이집\s*(?:연계|지원|운영)|육아\s*휴직\s*(?:100%|전체|완전)/,
    type: 'parental_support',
    weight: 25,
  },
  {
    re: /패밀리\s*(?:데이|day)|가족\s*친화\s*(?:기업|인증|문화)/,
    type: 'parental_support',
    weight: 15,
  },

  // Wellness benefits
  {
    re: /건강\s*검진\s*(?:지원|제공|비용)|심리\s*(?:상담|지원|치료\s*비용)/,
    type: 'wellness_benefit',
    weight: 15,
  },
  {
    re: /헬스\s*(?:비용\s*지원|장비\s*지원|장려금)|운동\s*(?:비용|지원)/,
    type: 'wellness_benefit',
    weight: 10,
  },
  { re: /EAP|직원\s*지원\s*프로그램|명상\s*(?:앱|지원)/, type: 'wellness_benefit', weight: 10 },
]

// ---------------------------------------------------------------------------
// Red flag patterns — negative WLB signals
// ---------------------------------------------------------------------------

interface RedFlagPattern {
  re: RegExp
  label: string
}

const RED_FLAG_PATTERNS: RedFlagPattern[] = [
  {
    re: /(?:빠른|신속한)\s*성장(?:\s*원하는|을\s*위한)?\s*분|열정\s*있는\s*분\s*환영/,
    label: '열정/성장 강조 — 과도한 헌신 요구 가능성',
  },
  {
    re: /24시간|365일\s*(?:서비스|운영)|온콜\s*(?:필수|대기|상시)/,
    label: '상시 대기 문화 암시',
  },
  {
    re: /빠른\s*납기|긴급\s*대응\s*필수|즉각\s*대응\s*가능/,
    label: '긴급 대응 문화 암시',
  },
  {
    re: /프로\s*(?:정신|의식)\s*있는|군인\s*정신|헌신적인\s*(?:분|인재)/,
    label: '과도한 헌신 요구 언어',
  },
]

// ---------------------------------------------------------------------------
// Interview questions per missing type
// ---------------------------------------------------------------------------

const MISSING_TYPE_QUESTIONS: Record<WlbSignalType, string> = {
  work_hour_compliance: '평균 야근 빈도와 시간이 어떻게 되나요?',
  flex_time: '출퇴근 시간을 조정할 수 있는 유연근무 제도가 있나요?',
  remote_work: '재택 또는 원격 근무가 가능한가요?',
  vacation_policy: '연차 사용 문화가 어떻게 되나요? 눈치 없이 쓸 수 있나요?',
  culture_respect: '퇴근 후 업무 연락이 오는 편인가요?',
  parental_support: '육아휴직 사용률이나 실질적 지원 수준이 어떻게 되나요?',
  wellness_benefit: '직원 건강·복지 관련 지원 제도가 있나요?',
}

// ---------------------------------------------------------------------------
// Main analysis
// ---------------------------------------------------------------------------

export function analyzeJdWorkLifeBalance(text: string): JdWorkLifeBalanceReport {
  const t = text ?? ''
  const signals: WlbSignal[] = []
  const detectedTypes = new Set<WlbSignalType>()
  let totalWeight = 0

  for (const { re, type, weight } of WLB_PATTERNS) {
    const m = t.match(re)
    if (m) {
      signals.push({ type, excerpt: m[0].slice(0, 60) })
      if (!detectedTypes.has(type)) {
        detectedTypes.add(type)
        totalWeight += weight
      }
    }
  }

  const redFlags: string[] = []
  for (const { re, label } of RED_FLAG_PATTERNS) {
    if (re.test(t)) redFlags.push(label)
  }

  // Penalize for red flags
  const adjustedScore = Math.max(0, Math.min(100, totalWeight - redFlags.length * 10))

  let rating: WlbRating
  if (redFlags.length >= 2) rating = 'concern'
  else if (adjustedScore >= 55) rating = 'excellent'
  else if (adjustedScore >= 25) rating = 'good'
  else rating = 'neutral'

  let summary: string
  if (rating === 'excellent') {
    summary =
      '워라밸 지원 신호가 풍부합니다. 재택·유연근무·휴가 등 긍정적 제도가 명시되어 있습니다.'
  } else if (rating === 'good') {
    summary = '일부 워라밸 지원이 명시되어 있습니다. 면접에서 누락된 항목을 직접 확인하세요.'
  } else if (rating === 'neutral') {
    summary = '워라밸 관련 정보가 거의 없습니다. 입사 전 근무 환경을 반드시 파악하세요.'
  } else {
    summary = '부정적인 근무 환경 신호가 감지됩니다. 지원 전 신중하게 검토하세요.'
  }

  const priorityTypes: WlbSignalType[] = [
    'work_hour_compliance',
    'remote_work',
    'flex_time',
    'vacation_policy',
    'culture_respect',
  ]
  const interviewQuestions = priorityTypes
    .filter((tp) => !detectedTypes.has(tp))
    .slice(0, 3)
    .map((tp) => MISSING_TYPE_QUESTIONS[tp])

  return {
    signals,
    detectedTypes,
    score: adjustedScore,
    rating,
    summary,
    interviewQuestions,
    redFlags,
  }
}
