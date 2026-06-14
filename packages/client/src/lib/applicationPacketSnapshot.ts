import { buildStageCommunicationTemplates } from './applicationCommunication'
import { buildCompanyResearchBrief } from './applicationCompanyResearch'
import { scoreApplicationReadiness } from './applicationReadinessScore'
import { buildApplicationStageGuidance } from './applicationStageGuidance'

import type { JobApplication } from './api'

const normalizeText = (value?: string | null, fallback = '') => value?.trim() || fallback

const compact = (value?: string | null, maxLength = 420) => {
  const text = normalizeText(value).replace(/\s+/g, ' ')
  if (text.length <= maxLength) return text
  return `${text.slice(0, maxLength - 3).trim()}...`
}

const checkbox = (complete: boolean) => (complete ? '[x]' : '[ ]')

const bullet = (label: string, value?: string | null) =>
  value ? `- **${label}:** ${value}` : `- **${label}:** -`

export const buildApplicationPacketSnapshot = (application: JobApplication, now = new Date()) => {
  const readiness = scoreApplicationReadiness(application, now)
  const research = buildCompanyResearchBrief(application)
  const guidance = buildApplicationStageGuidance(application, now)
  const communications = buildStageCommunicationTemplates(application, now)
  const notes = compact(application.notes)

  return [
    `# ${normalizeText(application.company, '지원 기업')} · ${normalizeText(
      application.position,
      '지원 포지션'
    )}`,
    '',
    bullet('상태', application.status),
    bullet('우선순위', application.priority),
    bullet('지원일', application.appliedDate || application.createdAt?.slice(0, 10)),
    bullet('마감일', application.deadline),
    bullet('면접일', application.interviewDate),
    bullet('공고 URL', application.url),
    '',
    '## 지원 준비도',
    '',
    `- **점수:** ${readiness.score}/100 (${readiness.label})`,
    `- **다음 액션:** ${readiness.nextAction}`,
    ...readiness.checks.map(
      (check) => `- ${checkbox(check.complete)} ${check.label}: ${check.detail}`
    ),
    '',
    '## 회사 리서치',
    '',
    `- **점수:** ${research.score}/100 (${research.label})`,
    `- **다음 액션:** ${research.nextAction}`,
    ...research.checks.map(
      (check) => `- ${checkbox(check.complete)} ${check.label}: ${check.detail}`
    ),
    '',
    '## 단계 가이드',
    '',
    `- **현재 단계:** ${guidance.stageLabel}`,
    `- **요약:** ${guidance.summary}`,
    ...guidance.tasks.map((task) => `- ${checkbox(task.complete)} ${task.label}: ${task.detail}`),
    '',
    '## 커뮤니케이션 템플릿',
    '',
    ...communications.map((template) => `- **${template.label}:** ${template.description}`),
    '',
    '## 메모',
    '',
    notes || '-',
  ].join('\n')
}

export const getApplicationPacketSnapshotFileName = (application: JobApplication) => {
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

  return `${safeBase || 'application'}-packet.md`
}
