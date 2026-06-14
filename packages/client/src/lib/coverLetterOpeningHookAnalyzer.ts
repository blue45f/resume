/**
 * 자기소개서 도입부 훅 강도 분석기 — 첫 단락이 면접관의 흥미를 끄는
 * 구체적 일화·수치·통찰로 시작하는지, 아니면 공식적·천편일률적
 * 자기소개("지원하게 된 동기는~")로 시작하는지 평가한다.
 */

export type HookStrengthType =
  | 'anecdote_hook' // 구체적 일화·에피소드로 시작
  | 'data_hook' // 수치·통계로 시작
  | 'insight_hook' // 통찰·역설적 관점으로 시작
  | 'problem_hook' // 해결한 문제로 시작
  | 'achievement_hook' // 성과·성취로 시작

export type GenericOpeningType =
  | 'greeting_formula' // "안녕하세요, ~에 지원합니다"
  | 'motivation_cliche' // "지원하게 된 동기는~"
  | 'self_intro_formula' // "저는 XX 전공의 홍길동입니다"
  | 'aspiration_cliche' // "꿈을 이루기 위해", "성장하고 싶어서"

export interface HookSignal {
  type: HookStrengthType
  excerpt: string
}

export interface GenericOpeningSignal {
  type: GenericOpeningType
  excerpt: string
}

export type OpeningHookGrade = 'strong' | 'adequate' | 'weak' | 'generic'

export interface CoverLetterOpeningHookReport {
  hookSignals: HookSignal[]
  genericSignals: GenericOpeningSignal[]
  hookScore: number // 0–100
  grade: OpeningHookGrade
  summary: string
  suggestions: string[]
}

// ---------------------------------------------------------------------------
// Helper: extract first paragraph (first ~200 chars before double newline)
// ---------------------------------------------------------------------------

function extractFirstParagraph(text: string): string {
  const trimmed = (text ?? '').trim()
  const firstBreak = trimmed.search(/\n\s*\n|\r\n\s*\r\n/)
  const candidate = firstBreak > 0 ? trimmed.slice(0, firstBreak) : trimmed.slice(0, 200)
  return candidate.trim()
}

// ---------------------------------------------------------------------------
// Hook patterns (positive)
// ---------------------------------------------------------------------------

interface HookPattern {
  re: RegExp
  type: HookStrengthType
  weight: number
}

const HOOK_PATTERNS: HookPattern[] = [
  // Anecdote hook — starts with a story
  {
    re: /(?:처음으로\s+|그\s+날|어느\s+날|당시\s+|그때\s+)\s*(?:[가-힣A-Za-z].{10,})/,
    type: 'anecdote_hook',
    weight: 25,
  },
  {
    re: /(?:[0-9]+년\s*전|[0-9]+개월\s*전|대학교\s*[0-9]+학년|첫\s*직장|처음\s*프로젝트)\s*(?:에서|에서는|에서의)\s*.{10,}/,
    type: 'anecdote_hook',
    weight: 25,
  },
  {
    re: /(?:[가-힣A-Za-z0-9\s]{5,20})\s*(?:을\s*만들었을\s*때|를\s*구현했을\s*때|에서\s*장애가\s*발생했을\s*때)/,
    type: 'anecdote_hook',
    weight: 20,
  },

  // Data hook — opens with a number
  {
    re: /^[0-9,]+(?:명|건|원|%|배|초|ms|TPS|억).{0,20}(?:이라는|이\s+|의\s+|만\s+).{5,}/m,
    type: 'data_hook',
    weight: 25,
  },
  {
    re: /[0-9]+%?.{0,8}(?:개선|향상|증가|달성|성과).{3,}/,
    type: 'data_hook',
    weight: 20,
  },

  // Insight hook — rhetorical question or counterintuitive statement
  {
    re: /(?:왜\s+[가-힣A-Za-z\s]+(?:할까요\?|일까요\?|없을까요\?))/,
    type: 'insight_hook',
    weight: 20,
  },
  {
    re: /(?:흔히들\s+|대부분의\s+사람들은\s+|일반적으로\s+).{5,}(?:아닙니다|다릅니다|생각합니다)/,
    type: 'insight_hook',
    weight: 15,
  },

  // Problem hook — starts by describing a problem they solved
  {
    re: /(?:해결하기\s+어려운|난제|복잡한\s+문제|아무도\s+해결하지\s+못한)\s*.{5,}/,
    type: 'problem_hook',
    weight: 20,
  },
  {
    re: /(?:당시\s+팀의\s+가장\s+큰\s+과제|가장\s+어려웠던\s+순간|해결해야\s+했던\s+문제)\s*.{5,}/,
    type: 'problem_hook',
    weight: 20,
  },

  // Achievement hook — starts with a concrete achievement
  {
    re: /(?:(?:[0-9]+만명|[0-9]+명의)\s*사용자가\s*(?:사용|이용)|(?:배포|출시)\s*[0-9]+개월\s*만에)/,
    type: 'achievement_hook',
    weight: 25,
  },
  {
    re: /(?:팀\s*내\s*최초로|업계\s*최초로|회사\s*최초로)\s*.{10,}/,
    type: 'achievement_hook',
    weight: 25,
  },
]

// ---------------------------------------------------------------------------
// Generic / cliché opening patterns (negative)
// ---------------------------------------------------------------------------

interface GenericPattern {
  re: RegExp
  type: GenericOpeningType
  penalty: number
}

const GENERIC_PATTERNS: GenericPattern[] = [
  // Greeting formula
  { re: /^안녕하세요[.,\s]/, type: 'greeting_formula', penalty: 15 },
  {
    re: /^(?:귀사에|귀\s*사에)\s*(?:지원|입사)\s*(?:하게\s+된\s+|하는)\s*.{0,5}(?:지원합니다|입니다)/m,
    type: 'greeting_formula',
    penalty: 15,
  },

  // Motivation cliché
  {
    re: /(?:지원하게\s+된\s+동기|지원\s+동기)\s*(?:는|는\s+다음과|를\s+말씀)/,
    type: 'motivation_cliche',
    penalty: 10,
  },
  {
    re: /(?:어릴\s+때부터|학창\s+시절부터)\s*(?:꿈|관심|목표)\s*(?:이었|이었습니다|을\s+가졌)/,
    type: 'motivation_cliche',
    penalty: 10,
  },

  // Self-intro formula
  {
    re: /^저는\s+(?:[A-Za-z가-힣]+\s+){0,3}(?:전공|출신|를\s+전공한)\s*.{0,10}(?:홍길동|입니다)/m,
    type: 'self_intro_formula',
    penalty: 10,
  },
  {
    re: /^저는\s+[0-9]+년\s*(?:간|동안|차)\s*(?:경력|경험|개발|근무)/m,
    type: 'self_intro_formula',
    penalty: 5,
  },

  // Aspiration cliché
  {
    re: /(?:꿈을\s+이루기\s+위해|꿈을\s+향해|꿈에\s+한\s+발짝)/,
    type: 'aspiration_cliche',
    penalty: 10,
  },
  {
    re: /(?:성장하고\s+싶어서|발전하고\s+싶어서|배우고\s+싶어서)\s+(?:지원|입사)/,
    type: 'aspiration_cliche',
    penalty: 10,
  },
]

// ---------------------------------------------------------------------------
// Main analysis
// ---------------------------------------------------------------------------

export function analyzeCoverLetterOpeningHook(text: string): CoverLetterOpeningHookReport {
  const firstPara = extractFirstParagraph(text)
  if (!firstPara) {
    return {
      hookSignals: [],
      genericSignals: [],
      hookScore: 0,
      grade: 'generic',
      summary: '도입부가 감지되지 않았습니다.',
      suggestions: [],
    }
  }

  const hookSignals: HookSignal[] = []
  const genericSignals: GenericOpeningSignal[] = []
  let hookRaw = 0
  let genericPenalty = 0

  for (const { re, type, weight } of HOOK_PATTERNS) {
    const m = firstPara.match(re)
    if (m) {
      hookSignals.push({ type, excerpt: m[0].slice(0, 60) })
      hookRaw += weight
    }
  }

  for (const { re, type, penalty } of GENERIC_PATTERNS) {
    const m = firstPara.match(re)
    if (m) {
      genericSignals.push({ type, excerpt: m[0].slice(0, 60) })
      genericPenalty += penalty
    }
  }

  const hookScore = Math.min(100, Math.max(0, hookRaw - genericPenalty))

  let grade: OpeningHookGrade
  if (genericPenalty >= 20 && hookRaw === 0) grade = 'generic'
  else if (hookScore >= 40) grade = 'strong'
  else if (hookScore >= 15) grade = 'adequate'
  else if (genericPenalty >= 10) grade = 'weak'
  else grade = 'adequate'

  let summary: string
  if (grade === 'strong') {
    summary = '도입부가 구체적인 훅(일화·수치·성과)으로 시작되어 면접관의 흥미를 끌기 좋습니다.'
  } else if (grade === 'adequate') {
    summary = '도입부가 무난합니다. 구체적 에피소드나 수치로 시작하면 더 인상적입니다.'
  } else if (grade === 'weak') {
    summary =
      '도입부가 약합니다. "안녕하세요", "지원 동기는", "저는 ~입니다" 패턴을 줄이고 훅으로 시작하세요.'
  } else {
    summary =
      '도입부가 천편일률적 표현으로 가득합니다. 구체적 에피소드나 성과 수치로 첫 문장을 시작하세요.'
  }

  const suggestions: string[] = []
  if (hookSignals.length === 0) {
    suggestions.push(
      '첫 문장을 구체적인 수치나 에피소드로 시작해보세요. ("N명의 사용자가 쓰는 서비스를...")'
    )
  }
  if (genericSignals.some((s) => s.type === 'greeting_formula')) {
    suggestions.push('"안녕하세요" 인사말 없이 바로 본론으로 시작하세요.')
  }
  if (genericSignals.some((s) => s.type === 'motivation_cliche')) {
    suggestions.push('"지원 동기" 나열 대신 그 동기를 보여주는 구체적 경험을 서술하세요.')
  }

  return { hookSignals, genericSignals, hookScore, grade, summary, suggestions }
}
