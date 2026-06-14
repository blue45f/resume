/**
 * 자기소개서 부정 프레이밍 감지기 — 전 직장·상사·동료에 대한 비방이나
 * 부정적 퇴사 사유 표현을 감지한다. 면접관이 가장 경계하는 신호 중 하나다.
 *
 * 일반 감성 분석(analyzeSentiment)과 달리, "과거 직장/사람 비방"이라는
 * 특정 패턴을 동시 출현(co-occurrence) 기준으로 잡아낸다.
 */

export type NegativeFramingType =
  | 'ex_employer_badmouth' // 전 직장/회사 비방
  | 'colleague_complaint' // 상사·동료 불만
  | 'negative_resignation' // 부정적 퇴사 사유
  | 'blame_excuse' // 남 탓·환경 탓 표현

export interface NegativeFramingMatch {
  type: NegativeFramingType
  excerpt: string
}

export type NegativityGrade = 'clean' | 'minor' | 'concerning'

export interface CoverLetterNegativeFramingReport {
  grade: NegativityGrade
  matches: NegativeFramingMatch[]
  summary: string
  suggestions: string[]
}

// ---------------------------------------------------------------------------
// Lexicons
// ---------------------------------------------------------------------------

const EX_EMPLOYER_RE =
  /(?:전\s*직장|이전\s*회사|예전\s*(?:직장|회사)|지난\s*(?:직장|회사)|前\s*직장|기존\s*회사)/
const COLLEAGUE_RE = /(?:상사|팀장|사수|상관|윗사람|경영진|대표님?|동료|부서장|임원)/
const RESIGNATION_RE = /(?:퇴사|이직|그만두|나오게\s*되|떠나게\s*되)/

const NEGATIVE_RE =
  /(?:불만|부당|부조리|불합리|박봉|갑질|텃세|꼰대|열악|답답|한계(?:를?\s*느)|비전이?\s*(?:없|안\s*보)|워라밸이?\s*(?:없|안)|체계가?\s*(?:없|부족)|비효율|소통이?\s*안|존중(?:이|받지)\s*(?:없|못)|성장(?:할\s*수\s*없|이\s*없)|미래가?\s*없)/

const BLAME_EXCUSE_RE =
  /(?:어쩔\s*수\s*없이|할\s*수\s*없이|남\s*탓|환경\s*탓|회사\s*탓|때문에\s*(?:힘들|어려웠|포기|그만)|탓에\s*(?:힘들|어려))/

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function splitUnits(text: string): string[] {
  return text
    .split(/(?<=[.!?。])\s+|\n+/)
    .map((s) => s.trim())
    .filter((s) => s.length > 3)
}

// ---------------------------------------------------------------------------
// Main analysis
// ---------------------------------------------------------------------------

export function detectCoverLetterNegativeFraming(text: string): CoverLetterNegativeFramingReport {
  const t = (text ?? '').trim()
  const units = splitUnits(t)

  const matches: NegativeFramingMatch[] = []
  const seen = new Set<NegativeFramingType>()

  const add = (type: NegativeFramingType, excerpt: string) => {
    if (!seen.has(type)) {
      matches.push({ type, excerpt: excerpt.slice(0, 55) })
      seen.add(type)
    }
  }

  for (const unit of units) {
    const hasNegative = NEGATIVE_RE.test(unit)

    if (hasNegative && EX_EMPLOYER_RE.test(unit)) {
      add('ex_employer_badmouth', unit)
    }
    if (hasNegative && COLLEAGUE_RE.test(unit)) {
      add('colleague_complaint', unit)
    }
    if (hasNegative && RESIGNATION_RE.test(unit)) {
      add('negative_resignation', unit)
    }
    if (BLAME_EXCUSE_RE.test(unit)) {
      add('blame_excuse', unit)
    }
  }

  let grade: NegativityGrade
  if (matches.length === 0) {
    grade = 'clean'
  } else if (matches.length === 1) {
    grade = 'minor'
  } else {
    grade = 'concerning'
  }

  // Summary
  let summary: string
  if (grade === 'clean') {
    summary = '전 직장·동료에 대한 부정적 표현이 감지되지 않았습니다.'
  } else if (grade === 'minor') {
    summary = '부정적으로 비칠 수 있는 표현이 1건 있습니다. 긍정적 프레이밍으로 바꿔 보세요.'
  } else {
    summary = `부정적 프레이밍이 ${matches.length}건 감지되었습니다. 면접관에게 불리하게 작용할 수 있습니다.`
  }

  // Suggestions
  const TYPE_TIP: Record<NegativeFramingType, string> = {
    ex_employer_badmouth:
      '전 직장 비판 대신 "새로운 도전/성장 기회를 찾아"처럼 미래 지향적으로 표현하세요.',
    colleague_complaint:
      '상사·동료 불만은 협업 태도를 의심받게 합니다. 배운 점 중심으로 전환하세요.',
    negative_resignation:
      '퇴사 사유는 부정적 이유보다 "지원 직무에서 이루고 싶은 목표" 중심으로 서술하세요.',
    blame_excuse: '남·환경 탓 표현은 주도성을 떨어뜨립니다. 본인이 시도한 노력으로 바꿔 보세요.',
  }
  const suggestions: string[] = []
  for (const m of matches) {
    suggestions.push(TYPE_TIP[m.type])
  }
  if (grade !== 'clean') {
    suggestions.push(
      '퇴사·이직 사유는 "~에서 벗어나"가 아니라 "~을 향해"로 표현하면 인상이 좋아집니다.'
    )
  }

  return {
    grade,
    matches: matches.slice(0, 6),
    summary,
    suggestions,
  }
}
