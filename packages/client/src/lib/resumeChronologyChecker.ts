/**
 * 이력서 시간순 정렬 체커 — 경력·학력의 기간(date range)을 문서 등장 순서대로
 * 추출하여 최신순(역순) 정렬 규칙을 지키는지 검사한다.
 *
 * 한국·해외 이력서 표준은 역순(reverse-chronological): 가장 최근 항목이 맨 위.
 */

export type ChronologyGrade = 'ordered' | 'mixed' | 'reversed'

export interface DateRangeHit {
  excerpt: string
  startYear: number
}

export interface ResumeChronologyReport {
  grade: ChronologyGrade
  ranges: DateRangeHit[]
  rangeCount: number
  inversions: number
  summary: string
  suggestions: string[]
}

// ---------------------------------------------------------------------------
// Date range extraction
// ---------------------------------------------------------------------------

// 시작 연도(+선택 월) → 범위 구분자(~ – — 부터 to "- ") → 종료(연도 또는 진행중 키워드)
const RANGE_RE =
  /(\d{4})\s*(?:[.\-/]\s*\d{1,2}|년\s*\d{1,2}\s*월?)?\s*(?:~|–|—|부터|\bto\b|\s-\s)\s*(?:(\d{4})|현재|재직|present|now|진행|ing)/gi

const MIN_YEAR = 1980
const MAX_YEAR = 2099

function extractRanges(text: string): DateRangeHit[] {
  const hits: DateRangeHit[] = []
  for (const m of text.matchAll(RANGE_RE)) {
    const startYear = parseInt(m[1], 10)
    if (startYear < MIN_YEAR || startYear > MAX_YEAR) continue
    hits.push({ excerpt: m[0].slice(0, 40).trim(), startYear })
  }
  return hits
}

// ---------------------------------------------------------------------------
// Main analysis
// ---------------------------------------------------------------------------

export function checkResumeChronology(text: string): ResumeChronologyReport {
  const t = (text ?? '').trim()
  const ranges = extractRanges(t)
  const rangeCount = ranges.length

  // Count inversions: in reverse-chronological order, start years should be
  // non-increasing as we read down. A later entry with a *more recent* start
  // than the previous entry is an inversion (wrong order).
  let inversions = 0
  for (let i = 0; i < ranges.length - 1; i++) {
    if (ranges[i].startYear < ranges[i + 1].startYear) {
      inversions++
    }
  }

  let grade: ChronologyGrade
  if (rangeCount < 2 || inversions === 0) {
    grade = 'ordered'
  } else {
    const ratio = inversions / (rangeCount - 1)
    grade = ratio >= 0.6 ? 'reversed' : 'mixed'
  }

  // Summary
  let summary: string
  if (grade === 'ordered') {
    summary =
      rangeCount < 2
        ? '정렬을 판단할 기간 정보가 충분하지 않습니다.'
        : '경력·학력이 최신순(역순)으로 잘 정렬되어 있습니다.'
  } else if (grade === 'reversed') {
    summary = '경력이 오래된 순으로 나열된 것으로 보입니다. 최신순(역순)으로 재정렬하세요.'
  } else {
    summary = `시간순이 어긋난 항목이 ${inversions}건 있습니다. 전체를 최신→과거 순으로 통일하세요.`
  }

  // Suggestions
  const suggestions: string[] = []
  if (grade === 'reversed') {
    suggestions.push('가장 최근 경력·학력이 맨 위에 오도록 순서를 뒤집으세요.')
    suggestions.push('채용 담당자는 최신 경력을 먼저 확인하므로 역순 정렬이 표준입니다.')
  } else if (grade === 'mixed') {
    suggestions.push('일부 항목의 순서가 어긋났습니다. 모든 섹션을 최신순으로 통일하세요.')
    suggestions.push('같은 섹션(경력/학력) 내에서 정렬 기준을 일관되게 유지하세요.')
  }

  return {
    grade,
    ranges: ranges.slice(0, 8),
    rangeCount,
    inversions,
    summary,
    suggestions,
  }
}
