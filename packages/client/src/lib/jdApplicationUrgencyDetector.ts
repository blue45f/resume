/**
 * JD 지원 마감/긴급도 감지기 — 채용공고의 마감 시점과 긴급도를 파악하여
 * 지원 타이밍 전략을 돕는다.
 */

export type UrgencyLevel = 'urgent' | 'deadline_fixed' | 'rolling' | 'unspecified'

export type UrgencySignalType =
  | 'explicit_deadline' // 명시적 마감일/모집기간
  | 'rolling_recruit' // 상시채용/수시채용
  | 'fill_and_close' // 채용 시 마감
  | 'urgent_hire' // 급구/즉시채용
  | 'no_signal' // 마감 정보 없음

export interface UrgencySignal {
  type: UrgencySignalType
  excerpt: string
}

export interface JdApplicationUrgencyReport {
  level: UrgencyLevel
  signals: UrgencySignal[]
  deadlineText: string | null // 추출된 마감 표현 (예: "2026.06.15", "6월 15일까지")
  summary: string
  tips: string[]
}

// ---------------------------------------------------------------------------
// Pattern sets
// ---------------------------------------------------------------------------

const URGENT_PATTERNS = [
  /급구/,
  /긴급\s*채용/,
  /즉시\s*(?:채용|출근|투입)/,
  /ASAP/i,
  /조기\s*마감(?:될|\s*수)/,
  /서둘러\s*지원/,
]

const FILL_AND_CLOSE_PATTERNS = [
  /채용\s*(?:시|되면|확정\s*시)\s*(?:조기\s*)?마감/,
  /충원\s*(?:시|되면)\s*마감/,
  /적합한?\s*(?:인재|지원자)\s*(?:채용|발견)\s*시\s*마감/,
  /채용\s*완료\s*시\s*(?:까지|마감)/,
]

const ROLLING_PATTERNS = [
  /상시\s*채용/,
  /수시\s*채용/,
  /연중\s*(?:상시|채용)/,
  /상시\s*모집/,
  /rolling\s*basis/i,
]

const DEADLINE_PATTERNS = [
  /(?:19|20)\d{2}\s*[.\-/]\s*\d{1,2}\s*[.\-/]\s*\d{1,2}\s*(?:까지|마감)?/,
  /\d{1,2}\s*월\s*\d{1,2}\s*일\s*(?:까지|마감)/,
  /(?:모집|접수|지원)\s*(?:기간|마감)\s*[:：]?\s*[^\n]{0,30}/,
  /~\s*(?:19|20)?\d{2}[.\-/]\d{1,2}[.\-/]\d{1,2}/,
  /\d{1,2}\/\d{1,2}\s*(?:까지|마감)/,
]

// ---------------------------------------------------------------------------
// Deadline text extraction
// ---------------------------------------------------------------------------

const DEADLINE_EXTRACT_PATTERNS = [
  /(?:19|20)\d{2}\s*[.\-/]\s*\d{1,2}\s*[.\-/]\s*\d{1,2}/,
  /\d{1,2}\s*월\s*\d{1,2}\s*일/,
  /\d{1,2}\/\d{1,2}/,
]

function extractDeadlineText(text: string): string | null {
  for (const re of DEADLINE_EXTRACT_PATTERNS) {
    const m = text.match(re)
    if (m) return m[0].trim()
  }
  return null
}

// ---------------------------------------------------------------------------
// Main analysis
// ---------------------------------------------------------------------------

export function detectJdApplicationUrgency(text: string): JdApplicationUrgencyReport {
  const t = (text ?? '').trim()
  const signals: UrgencySignal[] = []

  let urgentHit = false
  let fillCloseHit = false
  let rollingHit = false
  let deadlineHit = false

  const lines = t.split('\n')
  for (const line of lines) {
    const l = line.trim()
    if (!l) continue

    if (!urgentHit) {
      for (const re of URGENT_PATTERNS) {
        if (re.test(l)) {
          urgentHit = true
          signals.push({ type: 'urgent_hire', excerpt: l.slice(0, 50) })
          break
        }
      }
    }
    if (!fillCloseHit) {
      for (const re of FILL_AND_CLOSE_PATTERNS) {
        if (re.test(l)) {
          fillCloseHit = true
          signals.push({ type: 'fill_and_close', excerpt: l.slice(0, 50) })
          break
        }
      }
    }
    if (!rollingHit) {
      for (const re of ROLLING_PATTERNS) {
        if (re.test(l)) {
          rollingHit = true
          signals.push({ type: 'rolling_recruit', excerpt: l.slice(0, 50) })
          break
        }
      }
    }
    if (!deadlineHit) {
      for (const re of DEADLINE_PATTERNS) {
        if (re.test(l)) {
          deadlineHit = true
          signals.push({ type: 'explicit_deadline', excerpt: l.slice(0, 50) })
          break
        }
      }
    }
  }

  if (signals.length === 0) {
    signals.push({ type: 'no_signal', excerpt: '' })
  }

  // Determine level (priority: urgent > deadline_fixed > rolling > unspecified)
  let level: UrgencyLevel
  if (urgentHit || fillCloseHit) {
    level = 'urgent'
  } else if (deadlineHit) {
    level = 'deadline_fixed'
  } else if (rollingHit) {
    level = 'rolling'
  } else {
    level = 'unspecified'
  }

  const deadlineText = deadlineHit ? extractDeadlineText(t) : null

  // Summary
  const LEVEL_LABEL: Record<UrgencyLevel, string> = {
    urgent: '긴급 채용 — 빠른 지원이 유리합니다.',
    deadline_fixed: '마감일 지정 — 기한 내 지원이 필요합니다.',
    rolling: '상시 채용 — 마감 압박은 적으나 빠를수록 유리합니다.',
    unspecified: '마감 정보 미명시 — 가능한 빨리 지원을 권장합니다.',
  }
  let summary = LEVEL_LABEL[level]
  if (deadlineText) {
    summary += ` (마감: ${deadlineText})`
  }

  // Tips
  const tips: string[] = []
  if (level === 'urgent') {
    tips.push('급구/조기마감 공고입니다. 24~48시간 내 지원을 권장합니다.')
    tips.push('이력서를 완벽히 다듬기보다 빠르게 제출 후 보완 연락을 노리세요.')
  } else if (level === 'deadline_fixed') {
    tips.push(
      deadlineText
        ? `마감(${deadlineText}) 최소 2~3일 전 제출해 서버 마감 혼잡을 피하세요.`
        : '명시된 마감일 2~3일 전까지 제출하세요.'
    )
    tips.push('마감 직전 지원자가 몰리므로 조기 지원이 검토 순서에서 유리할 수 있습니다.')
  } else if (level === 'rolling') {
    tips.push('상시 채용도 결원 충원 시 조기 종료될 수 있으니 미루지 마세요.')
    tips.push('상시 공고는 지원자 풀이 누적되므로 차별화 포인트를 명확히 하세요.')
  } else {
    tips.push('마감일이 없어도 채용은 선착순 검토되는 경우가 많습니다. 빠른 지원이 안전합니다.')
    tips.push('필요 시 채용 담당자에게 모집 마감 여부를 문의해 보세요.')
  }

  return {
    level,
    signals: signals.slice(0, 6),
    deadlineText,
    summary,
    tips,
  }
}
