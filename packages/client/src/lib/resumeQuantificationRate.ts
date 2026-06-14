export type QuantTone = 'good' | 'neutral' | 'warning'

export interface QuantBullet {
  text: string
  /** True if the bullet contains at least one numeric outcome. */
  quantified: boolean
  /** The matched numeric snippet, if any. */
  match?: string
}

export interface QuantReport {
  /** All identified experience/achievement bullets. */
  bullets: QuantBullet[]
  /** Number of bullets with a numeric outcome. */
  quantifiedCount: number
  /** 0.0-1.0 fraction. */
  rate: number
  /** 0-100 score derived from rate. */
  score: number
  tone: QuantTone
  /** Korean short label. */
  label: string
  /** Korean one-sentence summary. */
  summary: string
  /** Up to 5 unquantified bullets as rewrite suggestions. */
  suggestions: string[]
}

// ---------------------------------------------------------------------------
// Quantification patterns — ordered broad → narrow to avoid double-count
// ---------------------------------------------------------------------------
const QUANT_PATTERNS: RegExp[] = [
  // Percentage: 5%, 23.5%, 100% — allow space before %
  /\d+(?:\.\d+)?\s*%/g,
  // Rank: 상위 5%
  /상위\s*\d+\s*%/g,
  // Korean monetary: 3억, 50만, 3억원, 500만원
  /[1-9]\d{0,5}\s*(?:억|만|천)\s*원?/g,
  // Multiplier: 3배, 10배
  /[1-9]\d{0,3}\s*배/g,
  // Headcount: 50명, 3명
  /[1-9]\d{0,4}\s*명/g,
  // Count of things: 200개, 5개
  /[1-9]\d{0,4}\s*개/g,
  // Cases / tickets: 300건
  /[1-9]\d{0,4}\s*건/g,
  // Score / rating: 95점
  /[1-9]\d{0,2}\s*점/g,
  // Time as metric: 30분, 2시간 (not dates)
  /[1-9]\d{0,3}\s*(?:초|분|시간)/g,
  // Short durations as metric (1개월-99개월, 1주-99주, 1년-99년 — exclude 4-digit years)
  /(?<!\d)[1-9]\d?\s*(?:개월|주간|주|년)/g,
  // USD: $3,000 / $1M / $500k
  /\$\s*\d[\d,]*(?:\.\d+)?\s*[kKmMbB]?/g,
  // Abbreviated large numbers: 3k, 2M, 1B (English)
  /\b\d+(?:\.\d+)?\s*[kKmMbB]\b/g,
  // Comma-formatted numbers (1,000+): large enough to be a meaningful metric
  /[1-9]\d{0,2}(?:,\d{3})+/g,
]

// ---------------------------------------------------------------------------
// Bullet extraction
// ---------------------------------------------------------------------------

// Header-like line heuristics: short + ends with colon or is ALL-CAPS.
const HEADER_RE = /^[A-Z가-힣\s:·|-]{1,25}[:\s]*$/

// Minimum chars for a line to be treated as a bullet/sentence.
const MIN_BULLET_LEN = 18

// Characters that mark explicit bullet points.
const EXPLICIT_BULLET = /^[-•*▪■◦▸►→✓✔]\s+/

// Korean verb endings that indicate a sentence (not a bare header).
const KO_VERB_RE = /(?:했|하여|했으|한\s*결과|했음|하고|하는|한\s*후|해서|하였|하며)/

function isLikelyBullet(line: string): boolean {
  const trimmed = line.trim()
  if (trimmed.length < MIN_BULLET_LEN) return false
  if (EXPLICIT_BULLET.test(trimmed)) return true
  // Must look like a sentence (contains a Korean verb ending) and not a pure header.
  if (HEADER_RE.test(trimmed)) return false
  return KO_VERB_RE.test(trimmed) || /[.!,]/.test(trimmed)
}

function extractBullets(text: string): string[] {
  return text
    .split('\n')
    .map((l) => l.trim().replace(EXPLICIT_BULLET, ''))
    .filter(isLikelyBullet)
}

function firstQuantMatch(text: string): string | undefined {
  for (const p of QUANT_PATTERNS) {
    const re = new RegExp(p.source, p.flags.includes('g') ? p.flags : p.flags + 'g')
    const m = re.exec(text)
    if (m) return m[0].trim()
  }
  return undefined
}

// ---------------------------------------------------------------------------
// Main export
// ---------------------------------------------------------------------------
export function buildQuantReport(text: string): QuantReport {
  const safe = (text ?? '').trim()
  if (!safe) {
    return {
      bullets: [],
      quantifiedCount: 0,
      rate: 0,
      score: 0,
      tone: 'warning',
      label: '수치 분석 없음',
      summary: '분석할 이력서 본문이 없습니다.',
      suggestions: [],
    }
  }

  const rawBullets = extractBullets(safe)

  const bullets: QuantBullet[] = rawBullets.map((t) => {
    const match = firstQuantMatch(t)
    return { text: t, quantified: match !== undefined, match }
  })

  const quantifiedCount = bullets.filter((b) => b.quantified).length
  const total = bullets.length
  const rate = total === 0 ? 0 : quantifiedCount / total
  const score = total === 0 ? 0 : Math.round(rate * 100)

  let tone: QuantTone
  let summary: string
  if (total === 0) {
    tone = 'warning'
    summary = '경력 기술 문장이 감지되지 않았습니다. 경력 항목을 작성해 보세요.'
  } else if (score >= 60) {
    tone = 'good'
    summary = `경력 기술의 ${score}%가 수치를 포함합니다. 채용 담당자가 성과를 즉시 파악할 수 있습니다.`
  } else if (score >= 35) {
    tone = 'neutral'
    summary = `수치 포함 비율이 ${score}%입니다. 절반 이상 문장에 숫자를 추가하면 경쟁력이 크게 올라갑니다.`
  } else {
    tone = 'warning'
    summary = `수치 포함 비율이 ${score}%로 낮습니다. 각 업무 성과를 숫자(%, 배, 명, 건)로 바꿔 보세요.`
  }

  const suggestions = bullets
    .filter((b) => !b.quantified)
    .slice(0, 5)
    .map((b) => b.text)

  return {
    bullets,
    quantifiedCount,
    rate,
    score,
    tone,
    label: `수치화 ${score}%`,
    summary,
    suggestions,
  }
}
