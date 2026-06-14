/**
 * 이력서 KPI/OKR 성과 추적 분석기 — 성과 기술이 구체적인 목표치(KPI/OKR)에
 * 연결되어 있는지, 아니면 모호한 결과만 나열하는지 감지한다.
 */

export type AchievementType =
  | 'kpi_explicit' // KPI/OKR/목표 명시 후 달성 수치
  | 'numeric_outcome' // 수치 성과 (% 개선, N배 향상 등)
  | 'award_recognition' // 수상·인정 성과
  | 'vague_positive' // 막연한 긍정 서술 (성과를 냈습니다 등)
  | 'effort_only' // 노력·과정만 기술 (열심히 했습니다 등)

export interface AchievementSignal {
  type: AchievementType
  phrase: string
}

export type KpiGrade = 'strong' | 'adequate' | 'weak' | 'none'

export interface KpiOkrReport {
  signals: AchievementSignal[]
  kpiExplicitCount: number
  numericOutcomeCount: number
  vagueCount: number
  effortOnlyCount: number
  grade: KpiGrade
  score: number // 0-100
  suggestion: string
}

// ---------------------------------------------------------------------------
// Pattern definitions
// ---------------------------------------------------------------------------

interface AchievementPattern {
  re: RegExp
  type: AchievementType
}

const PATTERNS: AchievementPattern[] = [
  // KPI/OKR explicit
  {
    re: /KPI\s*(?:달성|초과|달성률|목표|관리)|OKR\s*(?:달성|달성률|수립|관리)/,
    type: 'kpi_explicit',
  },
  { re: /목표\s*(?:대비|달성률|초과|달성|\d+%)\s*\d*%?/, type: 'kpi_explicit' },
  { re: /분기\s*목표\s*(?:달성|초과|초과달성)/, type: 'kpi_explicit' },
  { re: /연간\s*목표\s*(?:달성|초과|초과달성|\d+%\s*달성)/, type: 'kpi_explicit' },
  { re: /MBO\s*(?:달성|관리|수립)|성과\s*지표\s*(?:달성|관리|수립)/, type: 'kpi_explicit' },

  // Numeric outcomes
  {
    re: /\d+\s*%\s*(?:향상|개선|단축|절감|증가|증대|상승|감소|절약|성장)/,
    type: 'numeric_outcome',
  },
  { re: /\d+\s*배\s*(?:향상|개선|단축|빠른|증가|빠르게)/, type: 'numeric_outcome' },
  {
    re: /(?:매출|비용|시간|리소스|레이턴시|응답속도|처리속도)\s*\d+\s*%\s*(?:향상|단축|절감|증가)/,
    type: 'numeric_outcome',
  },
  { re: /\d+억?\s*원\s*(?:매출|절감|절약|비용\s*절감|달성)/, type: 'numeric_outcome' },
  { re: /\d+\s*(?:만|천)\s*(?:DAU|MAU|사용자|고객|가입자)/, type: 'numeric_outcome' },
  { re: /(?:NPS|CSAT|재구매율|전환율|이탈률)\s*\d+\s*(?:%|점|포인트)/, type: 'numeric_outcome' },

  // Award/recognition
  {
    re: /(?:최우수|우수|MVP|수상|선정|표창)\s*(?:팀|직원|엔지니어|개발자|성과)?/,
    type: 'award_recognition',
  },
  { re: /(?:내부|사내|전사)\s*(?:어워드|Award|수상|인정)/, type: 'award_recognition' },

  // Vague positives
  {
    re: /(?:성과를|결과를)\s*(?:냈습니다|거뒀습니다|달성했습니다)(?!\s*\d)/,
    type: 'vague_positive',
  },
  { re: /(?:기여했습니다|기여함)(?!\s*\d)(?!\s*(?:통해|으로)\s*\d)/, type: 'vague_positive' },
  { re: /(?:많은|큰|상당한)\s*(?:성과|기여|발전|개선|향상)/, type: 'vague_positive' },
  { re: /(?:유의미한|의미있는)\s*(?:성과|결과|개선)/, type: 'vague_positive' },

  // Effort only
  { re: /열심히\s*(?:하였|했|해)\s*(?:습니다|음|왔습니다)/, type: 'effort_only' },
  { re: /최선을\s*다하였\s*습니다|최선을\s*다했습니다/, type: 'effort_only' },
  { re: /(?:노력했습니다|노력하였습니다)(?!\s*[가-힣]{0,10}\d)/, type: 'effort_only' },
  { re: /(?:경험을\s*쌓았습니다|경험\s*보유|경험이\s*있습니다)(?!\s*\d)/, type: 'effort_only' },
]

// ---------------------------------------------------------------------------
// Main analysis
// ---------------------------------------------------------------------------

export function analyzeKpiOkrAchievements(text: string): KpiOkrReport {
  const t = text ?? ''
  const signals: AchievementSignal[] = []
  const seenByType = new Map<AchievementType, number>()

  for (const { re, type } of PATTERNS) {
    let m: RegExpMatchArray | null
    const gRe = new RegExp(re.source, re.flags.includes('g') ? re.flags : re.flags + 'g')
    while ((m = gRe.exec(t)) !== null) {
      if (m[0].length === 0) {
        gRe.lastIndex++
        continue
      }
      signals.push({ type, phrase: m[0].slice(0, 60) })
      seenByType.set(type, (seenByType.get(type) ?? 0) + 1)
    }
  }

  const kpiExplicitCount = seenByType.get('kpi_explicit') ?? 0
  const numericOutcomeCount = seenByType.get('numeric_outcome') ?? 0
  const awardCount = seenByType.get('award_recognition') ?? 0
  const vagueCount = seenByType.get('vague_positive') ?? 0
  const effortOnlyCount = seenByType.get('effort_only') ?? 0

  const strongCount = kpiExplicitCount * 3 + numericOutcomeCount * 2 + awardCount
  const weakCount = vagueCount + effortOnlyCount * 2
  const total = strongCount + weakCount

  let grade: KpiGrade
  let score: number

  if (total === 0) {
    grade = 'none'
    score = 0
  } else {
    score = Math.min(100, Math.round((strongCount / (total + 1)) * 100))
    if (
      kpiExplicitCount >= 2 ||
      numericOutcomeCount >= 3 ||
      (kpiExplicitCount >= 1 && numericOutcomeCount >= 1)
    )
      grade = 'strong'
    else if (kpiExplicitCount >= 1 || numericOutcomeCount >= 1) grade = 'adequate'
    else grade = 'weak'
  }

  let suggestion: string
  if (grade === 'strong') {
    suggestion =
      'KPI/OKR 목표와 구체적 수치 성과가 잘 연결되어 있습니다. 채용 담당자에게 신뢰감을 줍니다.'
  } else if (grade === 'adequate') {
    suggestion =
      '일부 수치 성과가 있습니다. KPI 달성률(예: "분기 목표 120% 달성") 또는 비즈니스 임팩트 수치를 추가하면 더욱 설득력이 높아집니다.'
  } else if (grade === 'weak') {
    suggestion =
      '성과 기술이 막연합니다. "기여했습니다" 대신 "분기 OKR 120% 달성", "MAU 50만→80만 성장 기여" 같이 목표 기준과 결과를 함께 기재하세요.'
  } else {
    suggestion = 'KPI/OKR 또는 수치 성과 기술이 감지되지 않았습니다. 성과 중심으로 재작성하세요.'
  }

  return {
    signals,
    kpiExplicitCount,
    numericOutcomeCount,
    vagueCount,
    effortOnlyCount,
    grade,
    score,
    suggestion,
  }
}
