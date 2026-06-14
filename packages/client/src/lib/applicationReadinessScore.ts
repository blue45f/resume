import { getApplicationNetworkingInsight } from './applicationNetworking'

import type { JobApplication } from './api'

export type ApplicationReadinessGrade = 'ready' | 'review' | 'blocked'

export interface ApplicationReadinessCheck {
  id: string
  label: string
  detail: string
  complete: boolean
  weight: number
}

export interface ApplicationReadinessScore {
  score: number
  grade: ApplicationReadinessGrade
  label: string
  nextAction: string
  checks: ApplicationReadinessCheck[]
  blockingItems: ApplicationReadinessCheck[]
}

const DAY_MS = 24 * 60 * 60 * 1000
const TERMINAL_STATUSES = new Set(['offer', 'rejected', 'withdrawn'])
const INTERVIEW_STATUSES = new Set(['interview', 'interviewing', 'technical', 'onsite', 'final'])

const normalizeStatus = (status: string) => status.trim().toLowerCase()

const daysSince = (value: string | undefined, now: Date) => {
  if (!value) return Number.POSITIVE_INFINITY
  const time = new Date(value).getTime()
  if (!Number.isFinite(time)) return Number.POSITIVE_INFINITY
  return Math.floor((now.getTime() - time) / DAY_MS)
}

const hasJobContext = (application: JobApplication) =>
  Boolean(application.url?.trim()) || (application.notes?.trim().length ?? 0) >= 60

const getGrade = (score: number): ApplicationReadinessGrade => {
  if (score >= 80) return 'ready'
  if (score >= 55) return 'review'
  return 'blocked'
}

const getLabel = (grade: ApplicationReadinessGrade) => {
  if (grade === 'ready') return '제출 준비'
  if (grade === 'review') return '보완 필요'
  return '준비 부족'
}

const getNextAction = (blockingItems: ApplicationReadinessCheck[]) => {
  const first = blockingItems[0]
  if (!first) return '지원 패킷이 안정적입니다. 다음 단계 전환에 집중하세요.'
  if (first.id === 'job-context') return '공고 URL 또는 JD 핵심 내용을 메모에 남기세요.'
  if (first.id === 'resume') return '이 지원에 사용할 맞춤 이력서를 연결하세요.'
  if (first.id === 'follow-up') return '후속 메일 또는 상태 확인 메모를 남기세요.'
  if (first.id === 'networking') return '담당자 이메일 또는 LinkedIn 힌트를 메모에 추가하세요.'
  if (first.id === 'interview-plan') return '면접일과 예상 질문 준비 상태를 기록하세요.'
  return first.detail
}

export const scoreApplicationReadiness = (
  application: JobApplication,
  now = new Date()
): ApplicationReadinessScore => {
  const status = normalizeStatus(application.status)
  const isTerminal = TERMINAL_STATUSES.has(status)
  const isInterview = INTERVIEW_STATUSES.has(status)
  const staleDays = daysSince(application.updatedAt, now)
  const networkingInsight = getApplicationNetworkingInsight(application)

  const checks: ApplicationReadinessCheck[] = [
    {
      id: 'job-context',
      label: 'JD 근거',
      detail: '공고 URL 또는 충분한 JD 메모가 있어야 맞춤 판단이 가능합니다.',
      complete: hasJobContext(application),
      weight: 20,
    },
    {
      id: 'resume',
      label: '맞춤 이력서',
      detail: '지원에 사용할 이력서가 연결되어야 패킷 추적이 가능합니다.',
      complete: Boolean(application.resumeId),
      weight: 22,
    },
    {
      id: 'timeline',
      label: '일정 정보',
      detail: '지원일, 마감일, 생성일 중 하나 이상이 기록되어 있어야 추적이 쉽습니다.',
      complete: Boolean(application.appliedDate || application.deadline || application.createdAt),
      weight: 14,
    },
    {
      id: 'follow-up',
      label: '후속 최신성',
      detail: '진행 중 지원은 7일 이내 업데이트 또는 후속 메모가 필요합니다.',
      complete: isTerminal || staleDays < 7,
      weight: 16,
    },
    {
      id: 'networking',
      label: '연락선',
      detail: '담당자 이메일 또는 LinkedIn 힌트가 있으면 후속 전환이 쉬워집니다.',
      complete: networkingInsight.hasContactHint || isTerminal,
      weight: 12,
    },
    {
      id: 'interview-plan',
      label: '면접 플랜',
      detail: '면접 단계에서는 면접일 또는 준비 메모가 필요합니다.',
      complete:
        !isInterview ||
        Boolean(application.interviewDate) ||
        (application.notes?.length ?? 0) >= 80,
      weight: 16,
    },
  ]

  const score = checks.reduce((sum, check) => sum + (check.complete ? check.weight : 0), 0)
  const grade = getGrade(score)
  const blockingItems = checks.filter((check) => !check.complete)

  return {
    score,
    grade,
    label: getLabel(grade),
    nextAction: getNextAction(blockingItems),
    checks,
    blockingItems,
  }
}
