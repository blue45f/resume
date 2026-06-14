import { getApplicationNetworkingInsight } from './applicationNetworking'

import type { JobApplication } from './api'

export type WeeklyPlanTone = 'good' | 'neutral' | 'warning'

export interface WeeklyPlanCard {
  id: string
  label: string
  current: number
  target: number
  remaining: number
  detail: string
  tone: WeeklyPlanTone
}

export interface ApplicationWeeklyPlan {
  focus: string
  cards: WeeklyPlanCard[]
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

const daysUntil = (value: string | undefined, now: Date) => {
  if (!value) return null
  const time = new Date(value).getTime()
  if (!Number.isFinite(time)) return null
  return Math.ceil((time - now.getTime()) / DAY_MS)
}

const getApplicationDate = (application: JobApplication) =>
  application.appliedDate || application.createdAt

const isActive = (application: JobApplication) =>
  !TERMINAL_STATUSES.has(normalizeStatus(application.status))

const isInterview = (application: JobApplication) =>
  INTERVIEW_STATUSES.has(normalizeStatus(application.status))

const card = (
  id: string,
  label: string,
  current: number,
  target: number,
  detail: string,
  tone: WeeklyPlanTone
): WeeklyPlanCard => ({
  id,
  label,
  current,
  target,
  remaining: Math.max(0, target - current),
  detail,
  tone,
})

export const buildApplicationWeeklyPlan = (
  applications: JobApplication[],
  now = new Date()
): ApplicationWeeklyPlan => {
  const active = applications.filter(isActive)
  const recentApplications = applications.filter(
    (application) => daysSince(getApplicationDate(application), now) <= 7
  )
  const upcomingInterviews = active.filter((application) => {
    const interviewDays = daysUntil(application.interviewDate, now)
    return (
      isInterview(application) ||
      (interviewDays !== null && interviewDays >= 0 && interviewDays <= 7)
    )
  })
  const followUps = active.filter((application) => {
    const staleDays = daysSince(application.updatedAt, now)
    return staleDays >= 7 && staleDays < 21 && !isInterview(application)
  })
  const closeOuts = active.filter((application) => {
    const staleDays = daysSince(application.updatedAt, now)
    return (
      staleDays >= 21 &&
      ['applied', 'screening'].includes(normalizeStatus(application.status)) &&
      !isInterview(application)
    )
  })
  const networking = active.filter(
    (application) =>
      (application.priority === 'high' || daysSince(application.updatedAt, now) >= 3) &&
      !getApplicationNetworkingInsight(application).hasContactHint
  )

  const qualityTarget = active.length >= 8 ? 2 : 3
  const networkingTarget = Math.min(4, Math.max(2, networking.length))
  const cards = [
    card(
      'qualityApplications',
      '맞춤 지원',
      recentApplications.length,
      qualityTarget,
      '이번 주 새 공고를 적게 보내더라도 JD/이력서/회사 리서치를 맞춰 제출하세요.',
      recentApplications.length >= qualityTarget ? 'good' : 'warning'
    ),
    card(
      'followUps',
      '후속 확인',
      followUps.length,
      Math.max(1, followUps.length),
      '7~20일 정체된 진행 중 지원에 후속 메일 또는 상태 확인을 남기세요.',
      followUps.length > 0 ? 'warning' : 'good'
    ),
    card(
      'networking',
      '담당자 접점',
      networking.length,
      networkingTarget,
      '우선순위가 높거나 멈춘 지원은 담당자/리크루터 힌트를 메모에 남기세요.',
      networking.length > 0 ? 'warning' : 'neutral'
    ),
    card(
      'interviews',
      '면접 준비',
      upcomingInterviews.length,
      Math.max(1, upcomingInterviews.length),
      '면접 예정 또는 면접 단계 지원은 질문, STAR 답변, 감사 메일을 준비하세요.',
      upcomingInterviews.length > 0 ? 'warning' : 'neutral'
    ),
    card(
      'closeOuts',
      '무응답 정리',
      closeOuts.length,
      Math.max(1, closeOuts.length),
      '3주 이상 무응답인 지원은 마지막 확인 후 withdrawn/no response로 정리하세요.',
      closeOuts.length > 0 ? 'warning' : 'good'
    ),
  ]

  let focus = '이번 주에는 맞춤 지원 2~3건과 담당자 접점 만들기에 집중하세요.'
  if (upcomingInterviews.length > 0) {
    focus = `이번 주 핵심은 면접 준비입니다. ${upcomingInterviews.length}건의 면접/면접 단계 지원을 먼저 정리하세요.`
  } else if (closeOuts.length > 0) {
    focus = `이번 주 핵심은 무응답 정리입니다. ${closeOuts.length}건을 마지막 확인 후 보드에서 정리하세요.`
  } else if (followUps.length > 0) {
    focus = `이번 주 핵심은 후속 확인입니다. ${followUps.length}건의 멈춘 지원을 다시 움직이세요.`
  } else if (recentApplications.length < qualityTarget) {
    focus = `이번 주 핵심은 맞춤 지원 보강입니다. ${qualityTarget - recentApplications.length}건을 더 선별해 제출하세요.`
  } else if (networking.length > 0) {
    focus = `이번 주 핵심은 담당자 접점입니다. ${networking.length}건의 우선순위 지원에 연락 힌트를 남기세요.`
  }

  return { focus, cards }
}
