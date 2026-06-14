import { getApplicationNetworkingInsight } from './applicationNetworking'

import type { JobApplication } from './api'

export type ApplicationStageTaskTone = 'good' | 'neutral' | 'warning'

export interface ApplicationStageTask {
  id: string
  label: string
  detail: string
  complete: boolean
  tone: ApplicationStageTaskTone
}

export interface ApplicationStageGuidance {
  stageLabel: string
  summary: string
  tasks: ApplicationStageTask[]
}

const DAY_MS = 24 * 60 * 60 * 1000
const INTERVIEW_STATUSES = new Set(['interview', 'interviewing', 'technical', 'onsite', 'final'])

const normalizeStatus = (status: string) => status.trim().toLowerCase()

const daysSince = (value: string | undefined, now: Date) => {
  if (!value) return Number.POSITIVE_INFINITY
  const time = new Date(value).getTime()
  if (!Number.isFinite(time)) return Number.POSITIVE_INFINITY
  return Math.floor((now.getTime() - time) / DAY_MS)
}

const hasSubstantialNotes = (application: JobApplication, minLength = 60) =>
  (application.notes?.trim().length ?? 0) >= minLength

const task = (
  id: string,
  label: string,
  detail: string,
  complete: boolean,
  tone: ApplicationStageTaskTone = complete ? 'good' : 'neutral'
): ApplicationStageTask => ({
  id,
  label,
  detail,
  complete,
  tone: complete ? 'good' : tone,
})

export const buildApplicationStageGuidance = (
  application: JobApplication,
  now = new Date()
): ApplicationStageGuidance => {
  const status = normalizeStatus(application.status)
  const staleDays = daysSince(application.updatedAt, now)
  const networking = getApplicationNetworkingInsight(application)

  if (INTERVIEW_STATUSES.has(status)) {
    return {
      stageLabel: '면접 단계',
      summary: '면접 전후 액션을 놓치지 않도록 질문, 감사 메일, 결정 후속을 묶어 관리하세요.',
      tasks: [
        task(
          'interview-plan',
          '면접 플랜',
          '면접일 또는 예상 질문/STAR 답변 메모를 기록하세요.',
          Boolean(application.interviewDate) || hasSubstantialNotes(application, 50),
          'warning'
        ),
        task(
          'thank-you-note',
          '감사 메일',
          '면접 당일 또는 다음 영업일에 감사 메일을 보낼 준비를 하세요.',
          hasSubstantialNotes(application, 120),
          'neutral'
        ),
        task(
          'decision-follow-up',
          '결과 후속',
          '다음 단계 안내가 없다면 5~7일 뒤 확인할 메모를 남기세요.',
          staleDays < 7,
          'warning'
        ),
      ],
    }
  }

  if (status === 'offer') {
    return {
      stageLabel: '오퍼 검토',
      summary: '처우, 입사일, 역할 범위, 협상 포인트를 확정해 의사결정을 남기세요.',
      tasks: [
        task(
          'offer-terms',
          '조건 확인',
          '처우와 입사 일정을 메모에 정리하세요.',
          hasSubstantialNotes(application, 80),
          'warning'
        ),
        task(
          'offer-reply',
          '수락/협상 회신',
          '오퍼 확인 또는 수락 템플릿으로 회신을 준비하세요.',
          staleDays < 5,
          'neutral'
        ),
      ],
    }
  }

  if (['rejected', 'withdrawn'].includes(status)) {
    return {
      stageLabel: '전형 종료',
      summary: '마무리된 지원은 배운 점과 재지원 가능성을 남기면 다음 지원 품질이 올라갑니다.',
      tasks: [
        task(
          'learning-note',
          '회고 메모',
          '탈락/철회 사유, 개선할 키워드, 다음 액션을 메모하세요.',
          hasSubstantialNotes(application, 60),
          'neutral'
        ),
        task(
          'relationship-close',
          '관계 유지',
          '필요하면 감사 회신 또는 LinkedIn 연결로 관계를 정리하세요.',
          networking.hasContactHint,
          'neutral'
        ),
      ],
    }
  }

  return {
    stageLabel: status === 'screening' ? '서류 검토' : '지원 완료',
    summary: '맞춤 이력서, 담당자 힌트, 후속 타이밍을 관리하면 초기 단계 누락을 줄일 수 있습니다.',
    tasks: [
      task(
        'resume-linked',
        '맞춤 이력서',
        '이 지원에 사용할 이력서를 연결하세요.',
        Boolean(application.resumeId),
        'warning'
      ),
      task(
        'contact-hint',
        '담당자 힌트',
        '채용 담당자 이메일 또는 LinkedIn 링크를 메모에 남기세요.',
        networking.hasContactHint,
        'neutral'
      ),
      task(
        'follow-up-window',
        '후속 타이밍',
        '7일 이상 업데이트가 없으면 후속 메일 또는 마지막 확인을 준비하세요.',
        staleDays < 7,
        'warning'
      ),
    ],
  }
}
