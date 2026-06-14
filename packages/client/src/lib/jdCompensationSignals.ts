export type CompensationCategory = 'salary' | 'bonus' | 'equity' | 'benefits' | 'flexibility'

export type CompensationTone = 'good' | 'neutral' | 'warning'

export interface CompensationMention {
  category: CompensationCategory
  excerpt: string
}

export interface CompensationSnapshot {
  category: CompensationCategory
  label: string
  present: boolean
  excerpts: string[]
}

export interface CompensationReport {
  /** 0-100 score driven by category coverage + specificity. */
  transparencyScore: number
  /** Bullet snapshots in canonical category order. */
  categories: CompensationSnapshot[]
  /** Whether the JD includes a numeric salary band. */
  hasExplicitSalaryRange: boolean
  /** Detected numeric salary band string (raw). */
  salaryRangeText: string | null
  tone: CompensationTone
  /** Korean short label e.g. "투명도 72점". */
  label: string
  /** Korean one-sentence summary. */
  summary: string
}

interface CategoryRule {
  category: CompensationCategory
  label: string
  /** Patterns that count as "mentioned." */
  patterns: RegExp[]
  /** Vague hedges that should NOT count as a real mention. */
  hedges?: RegExp[]
}

const CATEGORY_RULES: CategoryRule[] = [
  {
    category: 'salary',
    label: '연봉·급여',
    patterns: [/(?:연봉|급여|보수|기본급|월급)/, /\bsalary\b/i, /\bcompensation\b/i, /\bpay\b/i],
    hedges: [
      /(?:연봉|급여|보수|기본급)[^\n]{0,20}(?:협의|추후\s*협의|면접\s*(?:후|시)\s*(?:안내|공개|조정)|회사\s*내규|규정에\s*따름)/,
      /\bsalary\s+(?:negotiable|tbd|discussed\s+at\s+interview)\b/i,
    ],
  },
  {
    category: 'bonus',
    label: '성과급·인센티브',
    patterns: [
      /(?:성과급|인센티브|보너스|성과\s*보상|연말\s*보상)/,
      /\b(?:bonus|incentive|profit\s*share|commission)\b/i,
    ],
  },
  {
    category: 'equity',
    label: '주식·스톡옵션',
    patterns: [
      /(?:스톡옵션|스톡\s*옵션|RSU|주식\s*보상|지분\s*참여)/,
      /\b(?:stock\s*option|equity|rsu|esop|stock\s*grant)\b/i,
    ],
  },
  {
    category: 'benefits',
    label: '복지·복리후생',
    patterns: [
      /(?:복지|복리후생|식대|식비|교통비|중식|점심\s*제공|간식|건강검진|경조사비|자기계발비|도서|학자금|육아|보육비|장기근속|4대\s*보험|국민연금)/,
      /\b(?:benefits|perks|health\s*insurance|wellness|gym|learning\s*budget|tuition|parental\s*leave)\b/i,
    ],
  },
  {
    category: 'flexibility',
    label: '근무·유연성',
    patterns: [
      /(?:재택|원격|리모트|하이브리드|유연근무|선택적\s*근로시간|자율출퇴근|시차\s*출퇴근|코어\s*타임|워케이션|단축근무|주\s*4(?:일|\.5일)?)/,
      /\b(?:remote|hybrid|wfh|work\s*from\s*home|flexible\s*hours|core\s*hours)\b/i,
    ],
  },
]

const CONTEXT_RADIUS = 20

function makeExcerpt(text: string, start: number, length: number): string {
  const left = Math.max(0, start - CONTEXT_RADIUS)
  const right = Math.min(text.length, start + length + CONTEXT_RADIUS)
  const prefix = left > 0 ? '…' : ''
  const suffix = right < text.length ? '…' : ''
  return `${prefix}${text.slice(left, right).trim()}${suffix}`
}

function findCategoryMentions(text: string, rule: CategoryRule): string[] {
  const excerpts: string[] = []
  const seen = new Set<number>()
  for (const pattern of rule.patterns) {
    const re = new RegExp(
      pattern.source,
      pattern.flags.includes('g') ? pattern.flags : pattern.flags + 'g'
    )
    let match: RegExpExecArray | null
    while ((match = re.exec(text)) !== null) {
      if (match[0].length === 0) {
        re.lastIndex += 1
        continue
      }
      if (seen.has(match.index)) continue
      seen.add(match.index)
      excerpts.push(makeExcerpt(text, match.index, match[0].length))
      if (excerpts.length >= 3) return excerpts
    }
  }
  return excerpts
}

function isHedgedSalary(text: string, rule: CategoryRule): boolean {
  if (!rule.hedges) return false
  return rule.hedges.some((p) => p.test(text))
}

/** Detects a numeric salary band such as "4,500~6,500만원" or "₩60M~80M". */
export function detectSalaryRange(text: string): string | null {
  const patterns: RegExp[] = [
    /(\d{1,2}(?:,\d{3})?)\s*[~\-–]\s*(\d{1,2}(?:,\d{3})?)\s*만원/,
    /(\d{2,4})\s*[~\-–]\s*(\d{2,4})\s*\(?\s*만원\)?/,
    /(\d{1,3})\s*[~\-–]\s*(\d{1,3})\s*M\b/,
    /(?:₩|KRW)\s*(\d{1,3}(?:,\d{3})*)\s*[~\-–]\s*(?:₩|KRW)?\s*(\d{1,3}(?:,\d{3})*)/,
    /\$(\d{2,3}(?:,\d{3})?)\s*k?\s*[~\-–]\s*\$?(\d{2,3}(?:,\d{3})?)\s*k?/i,
  ]
  for (const pattern of patterns) {
    const m = text.match(pattern)
    if (m) return m[0].trim()
  }
  return null
}

const CATEGORY_WEIGHTS: Record<CompensationCategory, number> = {
  salary: 35,
  bonus: 15,
  equity: 15,
  benefits: 20,
  flexibility: 15,
}

export function buildJdCompensationReport(text: string): CompensationReport {
  const safe = (text ?? '').trim()
  const categories: CompensationSnapshot[] = []
  let score = 0
  let salaryHedged = false

  for (const rule of CATEGORY_RULES) {
    const excerpts = findCategoryMentions(safe, rule)
    const present = excerpts.length > 0
    if (present) score += CATEGORY_WEIGHTS[rule.category]
    categories.push({
      category: rule.category,
      label: rule.label,
      present,
      excerpts,
    })
    if (rule.category === 'salary' && present) {
      salaryHedged = isHedgedSalary(safe, rule)
    }
  }

  const salaryRangeText = detectSalaryRange(safe)
  const hasExplicitSalaryRange = !!salaryRangeText

  // Salary specificity bonus: explicit numeric band = +15, hedged = -10
  if (hasExplicitSalaryRange) score += 15
  if (salaryHedged && !hasExplicitSalaryRange) score = Math.max(0, score - 10)

  // Saturate
  if (score > 100) score = 100
  if (score < 0) score = 0

  let tone: CompensationTone
  let summary: string
  if (hasExplicitSalaryRange && score >= 70) {
    tone = 'good'
    summary = `구체적인 급여 범위(${salaryRangeText})가 명시되어 있고 복지·유연성도 확인됩니다.`
  } else if (!categories.find((c) => c.category === 'salary')?.present) {
    tone = 'warning'
    summary =
      '급여 언급 자체가 보이지 않습니다. 채용 담당자에게 사전 협의 가능한 범위를 문의해 두세요.'
  } else if (salaryHedged && !hasExplicitSalaryRange) {
    tone = 'warning'
    summary =
      '급여가 "협의" 표현으로만 처리되어 있습니다. 면접 1단계 통과 후 기대 연봉을 먼저 정리해 두세요.'
  } else if (score >= 55) {
    tone = 'neutral'
    summary = '주요 항목은 언급되어 있지만 구체 수치(범위·식대 금액 등)는 부족합니다.'
  } else {
    tone = 'warning'
    summary =
      '보상 정보가 빈약합니다. 회사의 보상 페이지나 글래스도어·블라인드 후기를 함께 확인하세요.'
  }

  return {
    transparencyScore: score,
    categories,
    hasExplicitSalaryRange,
    salaryRangeText,
    tone,
    label: `투명도 ${score}점`,
    summary,
  }
}
