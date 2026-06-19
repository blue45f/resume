export type JdSeniorityLevel =
  | 'entry'
  | 'junior'
  | 'mid'
  | 'senior'
  | 'lead'
  | 'staff'
  | 'unspecified'

export interface JdSeniorityYears {
  min: number | null
  max: number | null
}

export type JdSeniorityTone = 'good' | 'neutral' | 'warning'

export interface JdSenioritySignal {
  source: 'years' | 'level' | 'role' | 'responsibility'
  keyword: string
  weight: number
}

export interface JdSeniorityAnalysis {
  level: JdSeniorityLevel
  years: JdSeniorityYears
  signals: JdSenioritySignal[]
  hasLeadership: boolean
  /** Korean compact summary. */
  label: string
  /** Korean detail message that explains the verdict. */
  detail: string
  tone: JdSeniorityTone
}

interface LevelPattern {
  level: Exclude<JdSeniorityLevel, 'unspecified'>
  weight: number
  patterns: RegExp[]
}

const LEVEL_PATTERNS: LevelPattern[] = [
  {
    level: 'entry',
    weight: 4,
    patterns: [
      /\b(?:new\s*grad(?:uate)?s?|entry[-\s]?level)\b/i,
      /신입(?:사원|개발자|마케터|디자이너)?(?!\s*가능)/,
      /경력\s*무관/,
      /신입\s*\/?\s*경력/,
    ],
  },
  {
    level: 'junior',
    weight: 3,
    patterns: [/\bjunior\b/i, /주니어/, /연차\s*무관/, /1[~-]2\s*년/, /최소\s*1\s*년/],
  },
  {
    level: 'mid',
    weight: 3,
    patterns: [
      /\b(?:mid[-\s]?level|intermediate)\b/i,
      /(?:3|4|5)\s*[~-]\s*(?:5|6|7)\s*년/,
      /3\+\s*years?/i,
    ],
  },
  {
    level: 'senior',
    weight: 5,
    patterns: [
      /\bsenior(?:\s*(?:engineer|developer|designer|manager))?\b/i,
      /시니어/,
      /Sr\.?\s*(?:engineer|developer|designer|manager)/i,
      /5\+\s*years?/i,
      /최소\s*5\s*년/,
      /(?:7|8|9|10)\s*년\s*이상/,
    ],
  },
  {
    level: 'lead',
    weight: 6,
    patterns: [
      /\b(?:lead|leading|team\s*lead)\b/i,
      /리드(?:\s*(?:엔지니어|개발자|디자이너))?/,
      /팀\s*리[더드]/,
      /파트장|챕터장|그룹장/,
    ],
  },
  {
    level: 'staff',
    weight: 7,
    patterns: [
      /\b(?:staff|principal|distinguished|architect)\b/i,
      /스태프\s*(?:엔지니어|개발자)?/,
      /수석(?:\s*(?:엔지니어|개발자|연구원))?/,
      /책임(?:\s*(?:엔지니어|개발자))?/,
    ],
  },
]

const LEADERSHIP_PATTERNS: RegExp[] = [
  /\b(?:manage|managing|led|leading|mentor(?:ing|ship)?|coach(?:ing)?)\b/i,
  /팀\s*(?:리[더드]|관리|운영|빌딩)/,
  /피플\s*매니지먼트/,
  /멘토(?:링|십)?/,
  /people\s*management/i,
  /lead\s*a\s*team/i,
  /\b\d+\s*명(?:\s*이상)?\s*의?\s*팀/,
]

/**
 * Parses Korean and English year-of-experience patterns. Captures min/max separately.
 *
 * Examples:
 *   "3년 이상" -> { min: 3, max: null }
 *   "3-5년" -> { min: 3, max: 5 }
 *   "최소 5년" -> { min: 5, max: null }
 *   "5+ years" -> { min: 5, max: null }
 *   "5 to 7 years" -> { min: 5, max: 7 }
 *   "5년차 이상" -> { min: 5, max: null }
 */
export function extractYearsRequirement(text: string): JdSeniorityYears {
  const candidates: { min: number | null; max: number | null }[] = []

  const koreanRanges = text.matchAll(/(\d{1,2})\s*[~\-–]\s*(\d{1,2})\s*년(?:차)?(?!\s*이하)/g)
  for (const m of koreanRanges) {
    const a = Number(m[1])
    const b = Number(m[2])
    if (a >= 0 && b > a && b <= 40) candidates.push({ min: a, max: b })
  }

  const koreanMin = text.matchAll(/(?:최소\s*)?(\d{1,2})\s*년(?:차)?\s*이상/g)
  for (const m of koreanMin) {
    const n = Number(m[1])
    if (n > 0 && n <= 40) candidates.push({ min: n, max: null })
  }

  const koreanAtLeast = text.matchAll(/최소\s*(\d{1,2})\s*년(?!\s*(?:이하|차?\s*이하))/g)
  for (const m of koreanAtLeast) {
    const n = Number(m[1])
    if (n > 0 && n <= 40) candidates.push({ min: n, max: null })
  }

  const koreanMax = text.matchAll(/(\d{1,2})\s*년(?:차)?\s*이하/g)
  for (const m of koreanMax) {
    const n = Number(m[1])
    if (n > 0 && n <= 40) candidates.push({ min: null, max: n })
  }

  const englishRanges = text.matchAll(/(\d{1,2})\s*(?:to|[-–])\s*(\d{1,2})\s*\+?\s*years?/gi)
  for (const m of englishRanges) {
    const a = Number(m[1])
    const b = Number(m[2])
    if (a >= 0 && b > a && b <= 40) candidates.push({ min: a, max: b })
  }

  const englishPlus = text.matchAll(/(\d{1,2})\s*\+\s*years?/gi)
  for (const m of englishPlus) {
    const n = Number(m[1])
    if (n > 0 && n <= 40) candidates.push({ min: n, max: null })
  }

  const englishMin = text.matchAll(/(?:minimum|at\s*least|over)\s+(\d{1,2})\s*years?/gi)
  for (const m of englishMin) {
    const n = Number(m[1])
    if (n > 0 && n <= 40) candidates.push({ min: n, max: null })
  }

  if (candidates.length === 0) return { min: null, max: null }

  const min = candidates
    .map((c) => c.min)
    .filter((v): v is number => v !== null)
    .reduce<number | null>((acc, v) => (acc === null ? v : Math.min(acc, v)), null)
  const max = candidates
    .map((c) => c.max)
    .filter((v): v is number => v !== null)
    .reduce<number | null>((acc, v) => (acc === null ? v : Math.max(acc, v)), null)

  return { min, max }
}

const LEVEL_ORDER: Exclude<JdSeniorityLevel, 'unspecified'>[] = [
  'entry',
  'junior',
  'mid',
  'senior',
  'lead',
  'staff',
]

function levelFromYears(years: JdSeniorityYears): Exclude<JdSeniorityLevel, 'unspecified'> | null {
  const min = years.min
  if (min === null) return null
  if (min === 0) return 'entry'
  if (min <= 2) return 'junior'
  if (min <= 4) return 'mid'
  if (min <= 7) return 'senior'
  if (min <= 10) return 'lead'
  return 'staff'
}

const LEVEL_LABELS: Record<Exclude<JdSeniorityLevel, 'unspecified'>, string> = {
  entry: '신입',
  junior: '주니어',
  mid: '미드 시니어',
  senior: '시니어',
  lead: '리드 / 매니저',
  staff: '스태프 / 책임급',
}

function describeYears(years: JdSeniorityYears): string | null {
  if (years.min !== null && years.max !== null) return `${years.min}~${years.max}년차`
  if (years.min !== null) return `${years.min}년차 이상`
  if (years.max !== null) return `~${years.max}년차`
  return null
}

export function analyzeJdSeniority(text: string): JdSeniorityAnalysis {
  const safe = (text ?? '').trim()
  if (!safe) {
    return {
      level: 'unspecified',
      years: { min: null, max: null },
      signals: [],
      hasLeadership: false,
      label: '미지정',
      detail: 'JD가 비어 있어 연차 정보를 추정할 수 없습니다.',
      tone: 'neutral',
    }
  }

  const signals: JdSenioritySignal[] = []
  const buckets = new Map<Exclude<JdSeniorityLevel, 'unspecified'>, number>()

  for (const block of LEVEL_PATTERNS) {
    for (const pattern of block.patterns) {
      const match = safe.match(pattern)
      if (!match) continue
      buckets.set(block.level, (buckets.get(block.level) ?? 0) + block.weight)
      signals.push({
        source: block.level === 'lead' || block.level === 'staff' ? 'role' : 'level',
        keyword: match[0].trim(),
        weight: block.weight,
      })
    }
  }

  const years = extractYearsRequirement(safe)
  if (years.min !== null || years.max !== null) {
    const yearsLevel = levelFromYears(years)
    if (yearsLevel) {
      buckets.set(yearsLevel, (buckets.get(yearsLevel) ?? 0) + 4)
      signals.push({
        source: 'years',
        keyword: describeYears(years) ?? '연차 명시',
        weight: 4,
      })
    }
  }

  let hasLeadership = false
  for (const pattern of LEADERSHIP_PATTERNS) {
    const match = safe.match(pattern)
    if (match) {
      hasLeadership = true
      signals.push({ source: 'responsibility', keyword: match[0].trim(), weight: 2 })
      break
    }
  }

  let level: JdSeniorityLevel = 'unspecified'
  if (buckets.size > 0) {
    // Explicit lead/staff role titles dominate: a "Lead Engineer" with "5+ years" is still a lead role.
    if (buckets.has('staff')) {
      level = 'staff'
    } else if (buckets.has('lead')) {
      level = 'lead'
    } else {
      let best: Exclude<JdSeniorityLevel, 'unspecified'> = 'mid'
      let bestScore = -1
      for (const candidate of LEVEL_ORDER) {
        const score = buckets.get(candidate) ?? 0
        if (score > bestScore || (score === bestScore && score > 0)) {
          bestScore = score
          best = candidate
        }
      }
      level = best
    }
  }

  const yearsLabel = describeYears(years)
  let label: string
  let detail: string
  let tone: JdSeniorityTone

  if (level === 'unspecified') {
    label = '연차 미지정'
    detail =
      '연차나 직급 단서를 찾지 못했습니다. JD에 "신입/경력" 표기나 "X년 이상"이 있는지 확인하세요.'
    tone = 'neutral'
  } else {
    const role = LEVEL_LABELS[level]
    label = yearsLabel ? `${role} · ${yearsLabel}` : role
    if (hasLeadership && (level === 'senior' || level === 'lead' || level === 'staff')) {
      detail = `${role}급 포지션이며 리더십·매니징 책임이 포함된 자리입니다. 팀 빌딩·멘토링 경험을 자기소개서 상단에 배치하세요.`
      tone = 'good'
    } else if (level === 'entry' || level === 'junior') {
      detail = `${role} 자리입니다. 학습 곡선과 임팩트 사례, 협업 의지를 강조하세요.`
      tone = 'neutral'
    } else if (yearsLabel) {
      detail = `${role}급(${yearsLabel})입니다. 핵심 성과를 정량 지표(전·후 수치, 도입 효과)로 정리해 두면 매칭이 쉬워집니다.`
      tone = 'good'
    } else {
      detail = `${role}급 시그널이 보이지만 명확한 연차 표기가 없습니다. 채용 담당자에게 정확한 기대 연차를 문의해 두세요.`
      tone = 'warning'
    }
  }

  signals.sort((a, b) => b.weight - a.weight)

  return { level, years, signals, hasLeadership, label, detail, tone }
}
