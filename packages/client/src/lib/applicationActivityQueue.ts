import { getApplicationNetworkingInsight } from './applicationNetworking'

import type { JobApplication } from './api'

export type ApplicationActivityType =
  | 'deadline'
  | 'interview'
  | 'follow-up'
  | 'networking'
  | 'close-out'
export type ApplicationActivityTone = 'danger' | 'warning' | 'info' | 'good'

export interface ApplicationActivityItem {
  id: string
  applicationId: string
  company: string
  position: string
  type: ApplicationActivityType
  title: string
  detail: string
  dueLabel: string
  tone: ApplicationActivityTone
  urgency: number
}

interface ActivityQueueOptions {
  now?: Date
  limit?: number
}

const DAY_MS = 24 * 60 * 60 * 1000
const TERMINAL_STATUSES = new Set(['offer', 'rejected', 'withdrawn'])
const INTERVIEW_STATUSES = new Set(['interview', 'interviewing', 'technical', 'onsite', 'final'])

const normalizeStatus = (status: string) => status.trim().toLowerCase()

const dateOnly = (date: Date) =>
  new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()))

const parseDate = (value?: string | null) => {
  if (!value) return null
  const match = value.match(/^(\d{4})-(\d{2})-(\d{2})/)
  if (match) {
    const [, year, month, day] = match
    return new Date(Date.UTC(Number(year), Number(month) - 1, Number(day)))
  }
  const parsed = new Date(value)
  return Number.isNaN(parsed.getTime()) ? null : dateOnly(parsed)
}

const daysUntil = (value: string | undefined, now: Date) => {
  const date = parseDate(value)
  if (!date) return null
  return Math.ceil((date.getTime() - dateOnly(now).getTime()) / DAY_MS)
}

const daysSince = (value: string | undefined, now: Date) => {
  const date = parseDate(value)
  if (!date) return Number.POSITIVE_INFINITY
  return Math.floor((dateOnly(now).getTime() - date.getTime()) / DAY_MS)
}

const priorityBoost = (priority?: string) =>
  priority === 'high' ? 35 : priority === 'medium' ? 15 : 0

const isTerminal = (application: JobApplication) =>
  TERMINAL_STATUSES.has(normalizeStatus(application.status))

const isInterviewStage = (application: JobApplication) =>
  INTERVIEW_STATUSES.has(normalizeStatus(application.status))

const makeItem = (
  application: JobApplication,
  item: Omit<ApplicationActivityItem, 'applicationId' | 'company' | 'position'>
): ApplicationActivityItem => ({
  ...item,
  applicationId: application.id,
  company: application.company,
  position: application.position,
})

export const buildApplicationActivityQueue = (
  applications: JobApplication[],
  options: ActivityQueueOptions = {}
): ApplicationActivityItem[] => {
  const now = options.now ?? new Date()
  const limit = options.limit ?? 6
  const items: ApplicationActivityItem[] = []

  for (const application of applications) {
    const status = normalizeStatus(application.status)
    const deadlineDays = daysUntil(application.deadline, now)
    const interviewDays = daysUntil(application.interviewDate, now)
    const staleDays = daysSince(application.updatedAt, now)
    const boost = priorityBoost(application.priority)

    if (!isTerminal(application) && deadlineDays !== null && deadlineDays <= 3) {
      const overdue = deadlineDays < 0
      items.push(
        makeItem(application, {
          id: `${application.id}-deadline`,
          type: 'deadline',
          title: overdue ? '마감 정리' : '마감 전 패킷 마무리',
          detail: overdue
            ? '마감이 지난 지원입니다. 상태를 갱신하거나 보드에서 정리하세요.'
            : '마감 전에 맞춤 이력서, 자소서, 지원 메모를 마무리하세요.',
          dueLabel: overdue
            ? `마감 ${Math.abs(deadlineDays)}일 초과`
            : deadlineDays === 0
              ? '마감 오늘'
              : `마감 ${deadlineDays}일 전`,
          tone: overdue ? 'danger' : 'warning',
          urgency: overdue ? 1000 + Math.abs(deadlineDays) + boost : 900 - deadlineDays + boost,
        })
      )
    }

    if (!isTerminal(application) && (isInterviewStage(application) || interviewDays !== null)) {
      const label =
        interviewDays === null
          ? '면접 단계'
          : interviewDays < 0
            ? `면접 ${Math.abs(interviewDays)}일 경과`
            : interviewDays === 0
              ? '면접 오늘'
              : `면접 ${interviewDays}일 전`
      items.push(
        makeItem(application, {
          id: `${application.id}-interview`,
          type: 'interview',
          title: '면접 준비',
          detail: '예상 질문, STAR 답변, 감사 메일 초안을 같은 흐름에서 준비하세요.',
          dueLabel: label,
          tone: interviewDays !== null && interviewDays <= 1 ? 'warning' : 'info',
          urgency: 820 - Math.max(interviewDays ?? 3, 0) + boost,
        })
      )
    }

    if (
      !isTerminal(application) &&
      !isInterviewStage(application) &&
      ['applied', 'screening'].includes(status) &&
      staleDays >= 21
    ) {
      items.push(
        makeItem(application, {
          id: `${application.id}-close-out`,
          type: 'close-out',
          title: '무응답 정리',
          detail:
            '3주 이상 응답이 없습니다. 마지막 확인 메일을 보내거나 withdrawn/no response로 정리하세요.',
          dueLabel: `${staleDays}일 무응답`,
          tone: 'warning',
          urgency: 760 + staleDays + boost,
        })
      )
    } else if (!isTerminal(application) && staleDays >= 7) {
      items.push(
        makeItem(application, {
          id: `${application.id}-follow-up`,
          type: 'follow-up',
          title: '후속 확인',
          detail: '일주일 이상 업데이트가 없습니다. 후속 메일 또는 상태 확인 메모를 남기세요.',
          dueLabel: `${staleDays}일 정체`,
          tone: staleDays >= 14 ? 'warning' : 'info',
          urgency: 700 + staleDays + boost,
        })
      )
    }

    if (
      !isTerminal(application) &&
      ['applied', 'screening'].includes(status) &&
      (application.priority === 'high' || staleDays >= 3) &&
      !getApplicationNetworkingInsight(application).hasContactHint
    ) {
      items.push(
        makeItem(application, {
          id: `${application.id}-networking`,
          type: 'networking',
          title: '담당자 찾기',
          detail: '채용 담당자, 리크루터, 팀 리드 중 한 명을 찾아 메모에 남기세요.',
          dueLabel: '관계 만들기',
          tone: 'info',
          urgency: 560 + boost,
        })
      )
    }
  }

  return items
    .sort((a, b) => b.urgency - a.urgency || a.company.localeCompare(b.company, 'ko'))
    .slice(0, limit)
}
