import type { JobApplication } from './api'

type ReminderApplication = Pick<
  JobApplication,
  'company' | 'position' | 'status' | 'appliedDate' | 'createdAt' | 'deadline' | 'notes'
>

const DAY_MS = 24 * 60 * 60 * 1000

const toUtcDateOnly = (date: Date) =>
  new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()))

const parseDateOnly = (value?: string | null) => {
  if (!value) {
    return null
  }

  const match = value.match(/^(\d{4})-(\d{2})-(\d{2})/)
  if (match) {
    const [, year, month, day] = match
    return new Date(Date.UTC(Number(year), Number(month) - 1, Number(day)))
  }

  const parsed = new Date(value)
  return Number.isNaN(parsed.getTime()) ? null : toUtcDateOnly(parsed)
}

const addDays = (date: Date, days: number) => new Date(date.getTime() + days * DAY_MS)

const formatIcsDate = (date: Date) => {
  const year = date.getUTCFullYear()
  const month = `${date.getUTCMonth() + 1}`.padStart(2, '0')
  const day = `${date.getUTCDate()}`.padStart(2, '0')
  return `${year}${month}${day}`
}

const escapeIcsText = (value: string) =>
  value.replace(/\\/g, '\\\\').replace(/\r?\n/g, '\\n').replace(/,/g, '\\,').replace(/;/g, '\\;')

const normalizeText = (value?: string | null, fallback = '') => value?.trim() || fallback

export const getFollowUpReminderDate = (application: ReminderApplication, now = new Date()) => {
  const today = toUtcDateOnly(now)
  const appliedAt = parseDateOnly(application.appliedDate) ?? parseDateOnly(application.createdAt)
  let reminderDate = addDays(appliedAt ?? today, 7)

  if (reminderDate.getTime() <= today.getTime()) {
    reminderDate = addDays(today, 1)
  }

  const deadline = parseDateOnly(application.deadline)
  if (
    deadline &&
    deadline.getTime() > today.getTime() &&
    reminderDate.getTime() >= deadline.getTime()
  ) {
    const dayBeforeDeadline = addDays(deadline, -1)
    if (dayBeforeDeadline.getTime() > today.getTime()) {
      reminderDate = dayBeforeDeadline
    }
  }

  return reminderDate
}

export const getFollowUpReminderFileName = (application: ReminderApplication) => {
  const base =
    [application.company, application.position]
      .map((value) => normalizeText(value))
      .filter(Boolean)
      .join('-') || 'application'

  const safeBase = base
    .normalize('NFKC')
    .replace(/[\\/:*?"<>|]+/g, '-')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 80)

  return `${safeBase || 'application'}-follow-up.ics`
}

export const buildFollowUpCalendarEvent = (application: ReminderApplication, now = new Date()) => {
  const company = normalizeText(application.company, '지원 기업')
  const position = normalizeText(application.position, '지원 포지션')
  const status = normalizeText(application.status, '상태 미정')
  const reminderDate = getFollowUpReminderDate(application, now)
  const reminderEndDate = addDays(reminderDate, 1)
  const displayDate = `${reminderDate.getUTCFullYear()}.${`${reminderDate.getUTCMonth() + 1}`.padStart(
    2,
    '0'
  )}.${`${reminderDate.getUTCDate()}`.padStart(2, '0')}`
  const title = `${company} ${position} 후속 확인`
  const description = [
    `${company} ${position} 지원 현황을 확인하고 후속 메일을 보낼지 결정하세요.`,
    `현재 상태: ${status}`,
    application.notes ? `메모: ${application.notes.trim()}` : '',
  ]
    .filter(Boolean)
    .join('\n')
  const uidParts = [company, position, formatIcsDate(reminderDate)]
    .map((value) => value.toLowerCase().replace(/[^a-z0-9가-힣]+/gi, '-'))
    .filter(Boolean)
    .join('-')

  const ics = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Resume Workshop//Application Packet//KO',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    'BEGIN:VEVENT',
    `UID:${uidParts || 'application-follow-up'}@resume-workshop`,
    `DTSTAMP:${formatIcsDate(toUtcDateOnly(now))}T000000Z`,
    `DTSTART;VALUE=DATE:${formatIcsDate(reminderDate)}`,
    `DTEND;VALUE=DATE:${formatIcsDate(reminderEndDate)}`,
    `SUMMARY:${escapeIcsText(title)}`,
    `DESCRIPTION:${escapeIcsText(description)}`,
    'BEGIN:VALARM',
    'TRIGGER:-P1D',
    'ACTION:DISPLAY',
    `DESCRIPTION:${escapeIcsText(title)}`,
    'END:VALARM',
    'END:VEVENT',
    'END:VCALENDAR',
  ].join('\r\n')

  return {
    ics,
    reminderDate,
    displayDate,
  }
}
