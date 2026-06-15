import type { JobApplication } from './api'

export interface WeeklyCount {
  /** ISO week start (Monday) in YYYY-MM-DD. */
  weekStart: string
  /** Number of applications submitted that week. */
  count: number
  /** True when count >= target. */
  metTarget: boolean
}

export interface ApplicationStreakReport {
  /** Customizable weekly target (defaults to 5). */
  target: number
  /** Last N weeks oldest first. */
  weeks: WeeklyCount[]
  /** Consecutive met-target weeks ending at the current week. */
  currentStreak: number
  /** Longest met-target streak seen in the globalThis. */
  bestStreak: number
  /** All-time best single-week count within the globalThis. */
  bestWeek: WeeklyCount | null
  /** Number of applications already in the current week. */
  thisWeekCount: number
  /** Days remaining (inclusive) in the current ISO week. */
  daysLeftInWeek: number
  /** Applications needed per remaining day to meet target. */
  paceNeeded: number
  tone: 'good' | 'neutral' | 'warning'
  /** Short Korean label. */
  label: string
  /** Korean one-line summary. */
  summary: string
}

const DAY_MS = 24 * 60 * 60 * 1000

export const APPLICATION_TARGET_STORAGE_KEY = 'application_weekly_target'
const DEFAULT_TARGET = 5
const DEFAULT_LOOKBACK_WEEKS = 8
const MIN_TARGET = 1
const MAX_TARGET = 50

export function readApplicationTarget(storage?: Pick<Storage, 'getItem'>): number {
  try {
    const store = storage ?? (typeof window !== 'undefined' ? globalThis.localStorage : undefined)
    if (!store) return DEFAULT_TARGET
    const raw = store.getItem(APPLICATION_TARGET_STORAGE_KEY)
    if (!raw) return DEFAULT_TARGET
    const parsed = Number(raw)
    if (!Number.isFinite(parsed) || parsed < MIN_TARGET || parsed > MAX_TARGET) {
      return DEFAULT_TARGET
    }
    return Math.round(parsed)
  } catch {
    return DEFAULT_TARGET
  }
}

export function writeApplicationTarget(value: number, storage?: Pick<Storage, 'setItem'>): number {
  const safe = Math.max(MIN_TARGET, Math.min(MAX_TARGET, Math.round(value)))
  try {
    const store = storage ?? (typeof window !== 'undefined' ? globalThis.localStorage : undefined)
    store?.setItem(APPLICATION_TARGET_STORAGE_KEY, String(safe))
  } catch {
    // ignore storage errors; the in-memory value is what we return
  }
  return safe
}

function startOfIsoWeek(date: Date): Date {
  const d = new Date(date)
  d.setUTCHours(0, 0, 0, 0)
  const day = d.getUTCDay() // 0 (Sun) .. 6 (Sat)
  const diff = day === 0 ? -6 : 1 - day // shift to Monday
  d.setUTCDate(d.getUTCDate() + diff)
  return d
}

function formatIso(date: Date): string {
  return date.toISOString().slice(0, 10)
}

function getApplicationDate(app: JobApplication): string {
  return app.appliedDate || app.createdAt
}

interface BuildOptions {
  lookbackWeeks?: number
  target?: number
  now?: Date
}

export function buildApplicationStreakReport(
  applications: JobApplication[],
  options: BuildOptions = {}
): ApplicationStreakReport {
  const lookbackWeeks = Math.max(2, Math.min(26, options.lookbackWeeks ?? DEFAULT_LOOKBACK_WEEKS))
  const target = Math.max(
    MIN_TARGET,
    Math.min(MAX_TARGET, Math.round(options.target ?? DEFAULT_TARGET))
  )
  const now = options.now ?? new Date()

  const currentWeekStart = startOfIsoWeek(now)
  const oldestWeekStart = new Date(currentWeekStart.getTime() - (lookbackWeeks - 1) * 7 * DAY_MS)

  // Build week buckets oldest -> newest
  const buckets = new Map<string, number>()
  for (let i = 0; i < lookbackWeeks; i++) {
    const week = new Date(oldestWeekStart.getTime() + i * 7 * DAY_MS)
    buckets.set(formatIso(week), 0)
  }

  for (const app of applications) {
    const dateString = getApplicationDate(app)
    if (!dateString) continue
    const d = new Date(dateString)
    if (Number.isNaN(d.getTime())) continue
    const weekStart = formatIso(startOfIsoWeek(d))
    if (buckets.has(weekStart)) buckets.set(weekStart, (buckets.get(weekStart) ?? 0) + 1)
  }

  const weeks: WeeklyCount[] = Array.from(buckets.entries()).map(([weekStart, count]) => ({
    weekStart,
    count,
    metTarget: count >= target,
  }))

  // current streak: walk from newest backwards, must include current week
  let currentStreak = 0
  for (let i = weeks.length - 1; i >= 0; i--) {
    if (weeks[i].metTarget) currentStreak += 1
    else break
  }

  // best streak inside the window
  let bestStreak = 0
  let running = 0
  for (const w of weeks) {
    if (w.metTarget) {
      running += 1
      if (running > bestStreak) bestStreak = running
    } else {
      running = 0
    }
  }

  const bestWeek = weeks.reduce<WeeklyCount | null>((acc, w) => {
    if (!acc) return w
    return w.count > acc.count ? w : acc
  }, null)

  const thisWeek = weeks[weeks.length - 1]
  const thisWeekCount = thisWeek?.count ?? 0

  // Days left in the current ISO week (inclusive of today). Monday=1..Sunday=7.
  const dayOfWeek = ((now.getUTCDay() + 6) % 7) + 1
  const daysLeftInWeek = Math.max(1, 7 - dayOfWeek + 1)

  const remaining = Math.max(0, target - thisWeekCount)
  const paceNeeded = remaining === 0 ? 0 : Math.ceil(remaining / daysLeftInWeek)

  let tone: ApplicationStreakReport['tone']
  let label: string
  let summary: string

  if (currentStreak >= 3) {
    tone = 'good'
    label = `${currentStreak}주 연속 달성`
    summary = `이번 주 ${thisWeekCount}/${target}건. 연속 ${currentStreak}주째 목표를 지키고 있습니다.`
  } else if (thisWeekCount >= target) {
    tone = 'good'
    label = '이번 주 달성'
    summary = `이번 주 ${thisWeekCount}/${target}건. 연속 기록을 ${currentStreak + 1}주차로 이어가는 중입니다.`
  } else if (thisWeekCount === 0 && daysLeftInWeek <= 3) {
    tone = 'warning'
    label = '이번 주 미시작'
    summary = `이번 주 0/${target}건. 남은 ${daysLeftInWeek}일 동안 ${paceNeeded}건/일 페이스가 필요합니다.`
  } else if (paceNeeded > 0) {
    tone = remaining > target / 2 ? 'warning' : 'neutral'
    label = `이번 주 ${thisWeekCount}/${target}건`
    summary = `목표까지 ${remaining}건 부족. 남은 ${daysLeftInWeek}일 동안 ${paceNeeded}건/일 페이스로 따라잡을 수 있습니다.`
  } else {
    tone = 'neutral'
    label = `이번 주 ${thisWeekCount}/${target}건`
    summary = '이번 주 페이스는 목표 안에 있습니다. 후속 메모와 답변 준비를 함께 챙겨두세요.'
  }

  return {
    target,
    weeks,
    currentStreak,
    bestStreak,
    bestWeek,
    thisWeekCount,
    daysLeftInWeek,
    paceNeeded,
    tone,
    label,
    summary,
  }
}
