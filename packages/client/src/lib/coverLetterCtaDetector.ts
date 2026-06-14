/**
 * 자기소개서 마무리 CTA(Call-To-Action) 감지기 — 지원자의 적극적인 다음 행동 요청
 * (면접 요청, 연락 준비, 포트폴리오 안내 등)이 있는지 평가한다.
 */

export type CtaStrength = 'strong' | 'present' | 'weak' | 'absent'

export type CtaPattern =
  | 'interview_request' // 면접 기회를 요청
  | 'contact_readiness' // 연락 시 바로 응답 가능 표현
  | 'portfolio_offer' // 포트폴리오/추가 자료 제공 의지
  | 'followup_intent' // 후속 조치 의지
  | 'passive_closing' // 막연한 기대 표현 ("검토해 주시면 감사하겠습니다")
  | 'abrupt_end' // 행동 없이 끝맺음 ("감사합니다"만)

export interface CtaMatch {
  pattern: CtaPattern
  excerpt: string
}

export interface CoverLetterCtaReport {
  strength: CtaStrength
  matches: CtaMatch[]
  lastParagraph: string
  summary: string
  suggestions: string[]
}

// ---------------------------------------------------------------------------
// Pattern definitions
// ---------------------------------------------------------------------------

const STRONG_CTA_PATTERNS: Array<{ re: RegExp; pattern: CtaPattern }> = [
  {
    re: /면접\s*(?:기회|자리)\s*(?:를|를\s*주시면|에서\s*말씀드리|을\s*통해)/,
    pattern: 'interview_request',
  },
  {
    re: /(?:연락|연락처)\s*(?:주시면|주시기\s*바라며|주시면\s*언제든|해\s*주시면)\s*(?:바로|즉시|언제든)/,
    pattern: 'contact_readiness',
  },
  {
    re: /(?:포트폴리오|깃허브|GitHub|github\.com|링크|자료)\s*(?:를\s*보내|첨부|공유|드리겠|확인|제출)/,
    pattern: 'portfolio_offer',
  },
  {
    re: /(?:추가\s*(?:자료|정보|질문)\s*(?:가\s*있으시면|이\s*있으시면|을?\s*원하시면))/,
    pattern: 'contact_readiness',
  },
  {
    re: /(?:언제든\s*(?:지|지\s*연락|연락)\s*(?:주시면|주십시오|주세요))/,
    pattern: 'contact_readiness',
  },
]

const PRESENT_CTA_PATTERNS: Array<{ re: RegExp; pattern: CtaPattern }> = [
  {
    re: /(?:귀사\s*의\s*발전|귀사\s*에\s*기여|기여하고\s*싶[습어은])/,
    pattern: 'followup_intent',
  },
  {
    re: /(?:열심히|최선을\s*다해|성장하여|함께\s*성장)\s*(?:하겠|하여|이\s*되겠)/,
    pattern: 'followup_intent',
  },
  {
    re: /(?:검토|검토해\s*주시면|검토\s*부탁드립니다|살펴봐\s*주시면)/,
    pattern: 'passive_closing',
  },
]

const WEAK_CTA_PATTERNS: RegExp[] = [
  /^감사합니다\.?$/,
  /(?:잘\s*부탁|잘\s*부탁드립니다|부탁드립니다)\.?\s*$/,
  /(?:이상으로\s*마치|이상입니다)\.?\s*$/,
]

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function extractLastParagraph(text: string): string {
  const paragraphs = text
    .split(/\n{2,}/)
    .map((p) => p.trim())
    .filter((p) => p.length > 5)
  return paragraphs[paragraphs.length - 1] ?? text.slice(-200).trim()
}

// ---------------------------------------------------------------------------
// Main analysis
// ---------------------------------------------------------------------------

export function detectCoverLetterCta(text: string): CoverLetterCtaReport {
  const t = (text ?? '').trim()

  if (t.length === 0) {
    return {
      strength: 'absent',
      matches: [],
      lastParagraph: '',
      summary: '내용이 너무 짧습니다.',
      suggestions: ['마무리 단락에 면접 또는 연락 요청 문장을 추가하세요.'],
    }
  }

  const lastParagraph = extractLastParagraph(t)
  const matches: CtaMatch[] = []

  // Check strong patterns (across full text and last paragraph)
  for (const { re, pattern } of STRONG_CTA_PATTERNS) {
    const m = lastParagraph.match(re) ?? t.match(re)
    if (m) {
      matches.push({ pattern, excerpt: m[0].slice(0, 50) })
    }
  }

  // Check present patterns
  for (const { re, pattern } of PRESENT_CTA_PATTERNS) {
    const m = lastParagraph.match(re) ?? t.match(re)
    if (m) {
      matches.push({ pattern, excerpt: m[0].slice(0, 50) })
    }
  }

  // Check weak ending
  const lastLine = lastParagraph.split('\n').pop()?.trim() ?? ''
  for (const re of WEAK_CTA_PATTERNS) {
    if (re.test(lastLine)) {
      matches.push({ pattern: 'abrupt_end', excerpt: lastLine.slice(0, 50) })
      break
    }
  }

  // Determine strength
  const strongCount = matches.filter(
    (m) =>
      m.pattern === 'interview_request' ||
      m.pattern === 'contact_readiness' ||
      m.pattern === 'portfolio_offer'
  ).length
  const presentCount = matches.filter((m) => m.pattern === 'followup_intent').length
  const passiveCount = matches.filter(
    (m) => m.pattern === 'passive_closing' || m.pattern === 'abrupt_end'
  ).length

  let strength: CtaStrength
  if (strongCount >= 1) {
    strength = 'strong'
  } else if (presentCount >= 1 && passiveCount === 0) {
    strength = 'present'
  } else if (presentCount >= 1 || passiveCount >= 1) {
    strength = 'weak'
  } else {
    strength = 'absent'
  }

  // Summary & suggestions
  const STRENGTH_LABEL: Record<CtaStrength, string> = {
    strong: '강한 CTA — 면접/연락 요청이 명확합니다.',
    present: 'CTA 있음 — 의지 표현은 있으나 구체적 요청이 없습니다.',
    weak: '소극적 마무리 — CTA가 막연하거나 부재합니다.',
    absent: 'CTA 없음 — 마무리 행동 요청이 없습니다.',
  }
  const summary = STRENGTH_LABEL[strength]

  const suggestions: string[] = []
  if (strength === 'absent' || strength === 'weak') {
    suggestions.push(
      '"면접 기회를 주신다면 더 자세히 말씀드리겠습니다." 와 같이 면접 요청 문장을 추가하세요.'
    )
    suggestions.push('"추가 자료가 필요하시면 언제든 연락 주세요." 형태로 연락 준비를 표현하세요.')
  }
  if (strength === 'present') {
    suggestions.push(
      '열심히 하겠다는 의지 표현에 더해, 면접을 직접 요청하는 문장을 한 줄 추가하면 인상이 강해집니다.'
    )
  }
  if (matches.some((m) => m.pattern === 'abrupt_end')) {
    suggestions.push('"감사합니다" 앞에 면접·연락 요청 문장을 추가해 마무리를 강화하세요.')
  }

  return {
    strength,
    matches: matches.slice(0, 6),
    lastParagraph: lastParagraph.slice(0, 200),
    summary,
    suggestions,
  }
}
