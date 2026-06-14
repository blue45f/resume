/**
 * 이력서 하이라이트 — 본문 텍스트 위에 강점/약점 신호를 색으로 표시하기 위한
 * 토큰화기. 채용 담당자의 6초 스캔에서 "무엇이 눈에 띄는가"를 시각적으로 보여준다.
 *
 * - metric: 정량 성과(40%, 2억 원, 30배 …)
 * - strongVerb: 강한 액션 동사(주도·구축·개선 …)
 * - filler: 모호한 상투 표현(다양한·열심히·많은 …)
 */

export type HighlightCategory = 'metric' | 'strongVerb' | 'filler'

export interface HighlightToken {
  text: string
  category: HighlightCategory | null
}

export interface ResumeHighlightResult {
  tokens: HighlightToken[]
  counts: Record<HighlightCategory, number>
  truncated: boolean
}

const MAX_CHARS = 1500

const CATEGORY_PATTERNS: Array<{ category: HighlightCategory; re: RegExp }> = [
  {
    category: 'metric',
    re: /\d[\d,.]*\s*(?:%|％|퍼센트|원|만\s?원|억\s?원?|배|명|건|개월|개|년|주|시간|위|등|점|회|MAU|DAU|QPS|TPS|TB|GB)/g,
  },
  {
    category: 'strongVerb',
    re: /(?:주도|구축|개선|향상|달성|출시|설계|구현|리드|이끌|최적화|자동화|도입|확립|정립|혁신|런칭|배포|증대|단축|절감|확보|전환)(?:하였|했|합니다|한|해|하며|하고)?/g,
  },
  {
    category: 'filler',
    re: /(?:다양한|여러\s*가지|열심히|최선을\s*다해?|많은|다수의|성실히|적극적으로|원활하게|폭넓은|다방면|열정을\s*가지고|책임감을\s*가지고)/g,
  },
]

interface RawMatch {
  start: number
  end: number
  category: HighlightCategory
}

export function highlightResume(text: string): ResumeHighlightResult {
  const full = text ?? ''
  const truncated = full.length > MAX_CHARS
  const t = truncated ? full.slice(0, MAX_CHARS) : full

  // 1. Collect all matches.
  const raw: RawMatch[] = []
  for (const { category, re } of CATEGORY_PATTERNS) {
    for (const m of t.matchAll(re)) {
      if (m.index === undefined) continue
      const matched = m[0]
      if (!matched) continue
      raw.push({ start: m.index, end: m.index + matched.length, category })
    }
  }

  // 2. Sort by start asc, then by length desc (prefer longer match on ties).
  raw.sort((a, b) => a.start - b.start || b.end - b.start - (a.end - a.start))

  // 3. Greedily select non-overlapping matches.
  const selected: RawMatch[] = []
  let lastEnd = 0
  for (const m of raw) {
    if (m.start >= lastEnd) {
      selected.push(m)
      lastEnd = m.end
    }
  }

  // 4. Build ordered tokens, filling gaps with plain text.
  const tokens: HighlightToken[] = []
  const counts: Record<HighlightCategory, number> = { metric: 0, strongVerb: 0, filler: 0 }
  let cursor = 0
  for (const m of selected) {
    if (m.start > cursor) {
      tokens.push({ text: t.slice(cursor, m.start), category: null })
    }
    tokens.push({ text: t.slice(m.start, m.end), category: m.category })
    counts[m.category]++
    cursor = m.end
  }
  if (cursor < t.length) {
    tokens.push({ text: t.slice(cursor), category: null })
  }

  return { tokens, counts, truncated }
}
