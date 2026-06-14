/**
 * JD 담당업무 모호성 감지기 — 직무 범위가 불명확한 포괄·잡무성 표현을 잡아내어
 * 입사 후 업무 범위 불확실성(스코프 크리프)을 사전에 점검하도록 돕는다.
 *
 * jdRedFlagDetector(특정 근무조건 신호)·cultureVagueness(문화 주장)와 달리,
 * "담당업무 자체가 정의되어 있는가"에 집중한다.
 */

export type VagueResponsibilityType =
  | 'catch_all' // 기타 업무/그 외 업무/잡무
  | 'on_demand' // 필요시 지원/요청 시 수행
  | 'broad_generic' // 전반적인 업무/회사 전반
  | 'undefined_misc' // 그때그때/닥치는 대로/멀티태스킹

export interface VagueResponsibilityMatch {
  type: VagueResponsibilityType
  excerpt: string
}

export type ResponsibilityClarity = 'clear' | 'some' | 'vague'

export interface JdResponsibilityVaguenessReport {
  clarity: ResponsibilityClarity
  matches: VagueResponsibilityMatch[]
  count: number
  summary: string
  tips: string[]
}

// ---------------------------------------------------------------------------
// Pattern sets
// ---------------------------------------------------------------------------

const PATTERNS: Array<{ type: VagueResponsibilityType; re: RegExp }> = [
  {
    type: 'catch_all',
    re: /(?:기타\s*(?:업무|등|사항|잡무)|그\s*외\s*(?:의\s*)?업무|잡무|제반\s*업무|기타\s*등등)/,
  },
  {
    type: 'on_demand',
    re: /(?:필요\s*시.{0,15}(?:지원|투입|수행)|요청\s*시.{0,15}(?:지원|수행)|상황에\s*따라.{0,12}(?:업무|투입)|수시로\s*발생)/,
  },
  {
    type: 'broad_generic',
    re: /(?:전반적인?\s*(?:업무|관리|운영|지원)|회사\s*전반|부서\s*전반|업무\s*전반에?\s*걸친)/,
  },
  {
    type: 'undefined_misc',
    re: /(?:그때그때|닥치는\s*대로|멀티\s*(?:플레이|태스킹)|다방면(?:의|으로)\s*업무|여러\s*가지\s*업무를\s*동시)/,
  },
]

const TYPE_LABEL: Record<VagueResponsibilityType, string> = {
  catch_all: '기타/잡무성 표현',
  on_demand: '필요시 투입',
  broad_generic: '전반적 업무',
  undefined_misc: '비정형 업무',
}

// ---------------------------------------------------------------------------
// Main analysis
// ---------------------------------------------------------------------------

export function detectJdResponsibilityVagueness(text: string): JdResponsibilityVaguenessReport {
  const t = (text ?? '').trim()
  const lines = t.split('\n').map((l) => l.trim())

  const matches: VagueResponsibilityMatch[] = []
  for (const line of lines) {
    if (!line) continue
    for (const { type, re } of PATTERNS) {
      if (re.test(line)) {
        matches.push({ type, excerpt: line.slice(0, 50) })
        break // one type per line
      }
    }
  }

  const count = matches.length

  let clarity: ResponsibilityClarity
  if (count === 0) {
    clarity = 'clear'
  } else if (count <= 2) {
    clarity = 'some'
  } else {
    clarity = 'vague'
  }

  // Summary
  let summary: string
  if (clarity === 'clear') {
    summary = '담당업무가 비교적 구체적으로 정의되어 있습니다.'
  } else if (clarity === 'some') {
    summary = `범위가 모호한 업무 표현이 ${count}건 있습니다. 실제 담당 범위를 확인하세요.`
  } else {
    summary = `포괄·잡무성 표현이 ${count}건으로 직무 범위가 불명확합니다. 스코프 크리프에 유의하세요.`
  }

  // Tips
  const tips: string[] = []
  if (clarity !== 'clear') {
    const types = Array.from(new Set(matches.map((m) => TYPE_LABEL[m.type])))
    tips.push(`감지된 유형: ${types.join(', ')}`)
    tips.push('"일과 시간의 70%는 어떤 업무에 쓰이나요?"로 핵심 업무 비중을 확인하세요.')
  }
  if (clarity === 'vague') {
    tips.push('담당업무가 광범위하면 평가 기준도 모호해질 수 있으니 KPI·성과 기준을 질문하세요.')
  }

  return {
    clarity,
    matches: matches.slice(0, 6),
    count,
    summary,
    tips,
  }
}
