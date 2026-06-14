import { estimateExperienceYears } from './experience'

export type TitleLevel = 'entry' | 'junior' | 'mid' | 'senior' | 'lead' | 'staff' | 'unknown'

export type TitleRoleFamily =
  | 'engineering'
  | 'design'
  | 'product'
  | 'data'
  | 'marketing'
  | 'sales'
  | 'operations'
  | 'finance'
  | 'hr'
  | 'unknown'

export type CoherenceMismatch =
  | 'none'
  | 'level-overshoot'
  | 'level-undershoot'
  | 'role-shift'
  | 'level-unknown'

export type CoherenceTone = 'good' | 'neutral' | 'warning'

export interface ResumeTitleCoherence {
  titleLevel: TitleLevel
  titleRoleFamily: TitleRoleFamily
  experienceYears: number
  experienceLevel: TitleLevel
  experienceRoleFamily: TitleRoleFamily
  coherent: boolean
  mismatch: CoherenceMismatch
  tone: CoherenceTone
  label: string
  detail: string
  suggestion: string
}

const LEVEL_PATTERNS: Array<{ level: Exclude<TitleLevel, 'unknown'>; patterns: RegExp[] }> = [
  {
    level: 'entry',
    patterns: [/신입/, /\b(?:intern|entry[-\s]?level|new\s*grad)\b/i],
  },
  {
    level: 'junior',
    patterns: [/주니어/, /\bjunior\b/i, /\bjr\.?\b/i, /associate/i],
  },
  {
    level: 'mid',
    patterns: [/\bmid[-\s]?level\b/i, /\bintermediate\b/i],
  },
  {
    level: 'senior',
    patterns: [/시니어/, /\bsenior\b/i, /\bSr\.?\b/i, /선임/],
  },
  {
    level: 'lead',
    patterns: [
      /리드/,
      /\b(?:lead|leading|team\s*lead|tech\s*lead)\b/i,
      /팀장|파트장|챕터장|그룹장|매니저\b/,
      /\bmanager\b/i,
    ],
  },
  {
    level: 'staff',
    patterns: [
      /수석|책임/,
      /\b(?:staff|principal|distinguished|architect|head\s+of|director|vp\b|vice\s+president|cto|cpo|coo|ceo)\b/i,
    ],
  },
]

const ROLE_FAMILY_PATTERNS: Array<{
  family: Exclude<TitleRoleFamily, 'unknown'>
  patterns: RegExp[]
}> = [
  {
    family: 'engineering',
    patterns: [
      /엔지니어|개발자|프로그래머|백엔드|프론트엔드|풀스택|소프트웨어/,
      /\b(?:engineer|developer|programmer|swe|backend|frontend|full[-\s]?stack|software|devops|sre|platform|infra(?:structure)?)\b/i,
    ],
  },
  {
    family: 'design',
    patterns: [/디자이너|디자인/, /\b(?:designer|design|ux|ui|product\s*design|visual)\b/i],
  },
  {
    family: 'product',
    patterns: [
      /프로덕트\s*매니저|기획자|기획\s*자|PM\b/,
      /\b(?:product\s*manager|pm|program\s*manager|product\s*owner)\b/i,
    ],
  },
  {
    family: 'data',
    patterns: [
      /데이터\s*(?:분석가|엔지니어|사이언티스트)|데이터\s*과학자|머신러닝|AI\b/,
      /\b(?:data\s*(?:scientist|analyst|engineer)|ml\s*engineer|machine\s*learning|analytics|business\s*intelligence|bi\b)\b/i,
    ],
  },
  {
    family: 'marketing',
    patterns: [
      /마케터|마케팅|콘텐츠|브랜드|그로스/,
      /\b(?:marketer|marketing|content|brand|growth|seo|sem|social\s*media)\b/i,
    ],
  },
  {
    family: 'sales',
    patterns: [
      /영업|세일즈|어카운트/,
      /\b(?:sales|account\s*(?:executive|manager)|business\s*development|bd\b)\b/i,
    ],
  },
  {
    family: 'operations',
    patterns: [/운영|기획\s*운영|오퍼레이션/, /\b(?:operations|ops|chief\s*of\s*staff)\b/i],
  },
  {
    family: 'finance',
    patterns: [/재무|회계|파이낸스/, /\b(?:finance|accounting|controller|fp&a)\b/i],
  },
  {
    family: 'hr',
    patterns: [
      /인사|HR\b|채용|리크루터/,
      /\b(?:hr|human\s*resources|recruiter|recruiting|people\s*ops|talent)\b/i,
    ],
  },
]

const LEVEL_LABELS: Record<TitleLevel, string> = {
  entry: '신입',
  junior: '주니어',
  mid: '미드',
  senior: '시니어',
  lead: '리드',
  staff: '책임·임원급',
  unknown: '미지정',
}

const ROLE_LABELS: Record<TitleRoleFamily, string> = {
  engineering: '엔지니어링',
  design: '디자인',
  product: '프로덕트',
  data: '데이터',
  marketing: '마케팅',
  sales: '영업',
  operations: '운영',
  finance: '재무',
  hr: '인사',
  unknown: '직무 미지정',
}

const LEVEL_ORDER: TitleLevel[] = ['entry', 'junior', 'mid', 'senior', 'lead', 'staff', 'unknown']

export function detectTitleLevel(title: string): TitleLevel {
  if (!title?.trim()) return 'unknown'
  const detected: TitleLevel[] = []
  for (const block of LEVEL_PATTERNS) {
    if (block.patterns.some((p) => p.test(title))) detected.push(block.level)
  }
  if (detected.length === 0) return 'unknown'
  // Pick the strongest level claim (e.g. "Lead Senior Engineer" -> lead).
  return detected.reduce<TitleLevel>((acc, lvl) => {
    return LEVEL_ORDER.indexOf(lvl) > LEVEL_ORDER.indexOf(acc) ? lvl : acc
  }, detected[0])
}

export function detectRoleFamily(text: string): TitleRoleFamily {
  if (!text?.trim()) return 'unknown'
  const scores = new Map<TitleRoleFamily, number>()
  for (const block of ROLE_FAMILY_PATTERNS) {
    for (const pattern of block.patterns) {
      const matches = text.match(
        new RegExp(pattern.source, pattern.flags + (pattern.flags.includes('g') ? '' : 'g'))
      )
      if (matches) scores.set(block.family, (scores.get(block.family) ?? 0) + matches.length)
    }
  }
  if (scores.size === 0) return 'unknown'
  let best: TitleRoleFamily = 'unknown'
  let bestScore = 0
  for (const [family, score] of scores) {
    if (score > bestScore) {
      bestScore = score
      best = family
    }
  }
  return best
}

function levelFromYears(years: number): Exclude<TitleLevel, 'unknown'> {
  if (years <= 0) return 'entry'
  if (years <= 2) return 'junior'
  if (years <= 5) return 'mid'
  if (years <= 9) return 'senior'
  if (years <= 14) return 'lead'
  return 'staff'
}

function levelDistance(a: TitleLevel, b: TitleLevel): number {
  if (a === 'unknown' || b === 'unknown') return 0
  const order = LEVEL_ORDER.filter((l) => l !== 'unknown')
  return order.indexOf(a) - order.indexOf(b)
}

export interface AnalyzeOptions {
  title: string
  /** Free-form text combining all experience sections (descriptions + dates). */
  experienceText: string
  /** Optional explicit years override (skip auto-estimation). */
  experienceYears?: number
}

export function analyzeResumeTitleCoherence(opts: AnalyzeOptions): ResumeTitleCoherence {
  const title = (opts.title ?? '').trim()
  const experienceText = (opts.experienceText ?? '').trim()

  const titleLevel = detectTitleLevel(title)
  const titleRoleFamily = detectRoleFamily(title)
  const experienceRoleFamily = detectRoleFamily(experienceText)

  const years =
    opts.experienceYears !== undefined
      ? Math.max(0, opts.experienceYears)
      : Math.round(estimateExperienceYears(experienceText).totalYears * 10) / 10
  const experienceLevel = levelFromYears(years)

  let mismatch: CoherenceMismatch
  let tone: CoherenceTone
  let detail: string
  let suggestion: string

  if (titleLevel === 'unknown') {
    mismatch = 'level-unknown'
    tone = 'neutral'
    detail = `타이틀에 직급(주니어/시니어/리드 등) 단서가 없습니다. 경력 ${years}년 기준 ${LEVEL_LABELS[experienceLevel]} 레벨로 추정됩니다.`
    suggestion = `타이틀을 "${LEVEL_LABELS[experienceLevel]} ${ROLE_LABELS[experienceRoleFamily]}" 형식으로 다듬으면 ATS 매칭 정확도가 올라갑니다.`
  } else if (
    titleRoleFamily !== 'unknown' &&
    experienceRoleFamily !== 'unknown' &&
    titleRoleFamily !== experienceRoleFamily
  ) {
    mismatch = 'role-shift'
    tone = 'warning'
    detail = `타이틀은 ${ROLE_LABELS[titleRoleFamily]}이지만 경력 본문은 ${ROLE_LABELS[experienceRoleFamily]}이 중심입니다.`
    suggestion =
      '직무 전환 사유와 가져갈 수 있는 트랜스퍼러블 스킬을 자기소개서 상단에 명시하세요. 타이틀과 경력 본문이 정합하지 않으면 채용 담당자가 첫 줄에서 멈춥니다.'
  } else {
    const distance = levelDistance(titleLevel, experienceLevel)
    if (distance >= 2) {
      mismatch = 'level-overshoot'
      tone = 'warning'
      detail = `타이틀은 ${LEVEL_LABELS[titleLevel]}이지만 경력 ${years}년은 보통 ${LEVEL_LABELS[experienceLevel]} 레벨입니다.`
      suggestion =
        '타이틀을 한 단계 낮추거나, 리딩·임팩트 사례(${LEVEL_LABELS[titleLevel]} 직급이 맞다는 근거)를 경력 본문 상단에 추가하세요.'
    } else if (distance <= -2) {
      mismatch = 'level-undershoot'
      tone = 'warning'
      detail = `타이틀은 ${LEVEL_LABELS[titleLevel]}이지만 경력 ${years}년은 보통 ${LEVEL_LABELS[experienceLevel]} 이상입니다.`
      suggestion =
        '연차에 비해 타이틀이 보수적입니다. 타이틀을 한 단계 올리거나, 실제 책임 범위가 작았다면 본문에 그 맥락을 명시하세요.'
    } else {
      mismatch = 'none'
      tone = 'good'
      detail = `${LEVEL_LABELS[titleLevel]} · ${ROLE_LABELS[titleRoleFamily === 'unknown' ? experienceRoleFamily : titleRoleFamily]} · 경력 ${years}년이 일관됩니다.`
      suggestion =
        '타이틀과 경력의 결이 맞습니다. 다음은 정량 성과·임팩트 키워드 강화에 집중하세요.'
    }
  }

  const label =
    mismatch === 'none'
      ? '타이틀 정합'
      : mismatch === 'level-overshoot'
        ? '타이틀 과장'
        : mismatch === 'level-undershoot'
          ? '타이틀 보수적'
          : mismatch === 'role-shift'
            ? '직무 전환 신호'
            : '직급 미지정'

  return {
    titleLevel,
    titleRoleFamily,
    experienceYears: years,
    experienceLevel,
    experienceRoleFamily,
    coherent: mismatch === 'none',
    mismatch,
    tone,
    label,
    detail,
    suggestion,
  }
}

export const __TITLE_COHERENCE_LABELS__ = { LEVEL_LABELS, ROLE_LABELS }
