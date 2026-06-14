import type { JobApplication } from './api'

export type ApplicationNetworkingStatus = 'ready' | 'missing'

export interface ApplicationNetworkingInsight {
  hasContactHint: boolean
  contactHints: string[]
  status: ApplicationNetworkingStatus
  label: string
  detail: string
  nextAction: string
}

const EMAIL_PATTERN = /[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/gi
const LINKEDIN_PATTERN = /https?:\/\/(?:www\.)?linkedin\.com\/[^\s),]+/gi

const cleanText = (value?: string | null, fallback = '') => value?.trim() || fallback

const unique = (items: string[]) => [...new Set(items.map((item) => item.trim()).filter(Boolean))]

export const getApplicationNetworkingInsight = (
  application: Pick<JobApplication, 'company' | 'position' | 'notes'>
): ApplicationNetworkingInsight => {
  const notes = application.notes || ''
  const contactHints = unique([
    ...(notes.match(EMAIL_PATTERN) ?? []),
    ...(notes.match(LINKEDIN_PATTERN) ?? []),
  ])
  const hasContactHint = contactHints.length > 0

  if (hasContactHint) {
    return {
      hasContactHint,
      contactHints,
      status: 'ready',
      label: '연락선 확보',
      detail: `${contactHints.length}개의 이메일/LinkedIn 힌트를 찾았습니다.`,
      nextAction: '짧은 확인 메시지나 감사 메모를 남겨 관계 이력을 이어가세요.',
    }
  }

  return {
    hasContactHint,
    contactHints,
    status: 'missing',
    label: '연락선 없음',
    detail: `${cleanText(application.company, '지원 기업')} 담당자 정보가 아직 메모에 없습니다.`,
    nextAction: '채용 담당자, 리크루터, 팀 리드 중 한 명을 찾아 메모에 남기세요.',
  }
}

export const buildRecruiterOutreachMessage = (
  application: Pick<JobApplication, 'company' | 'position'>
) => {
  const company = cleanText(application.company, '귀사')
  const position = cleanText(application.position, '지원 포지션')

  return [
    `안녕하세요. ${company} ${position} 포지션에 관심이 있어 짧게 여쭙고 싶어 연락드립니다.`,
    '팀에서 중요하게 보는 역량이나 지원 전 보완하면 좋을 부분이 있다면 조언 부탁드립니다.',
    '감사합니다.',
  ].join(' ')
}

export const buildNetworkingSearchUrl = (
  application: Pick<JobApplication, 'company' | 'position'>
) => {
  const params = new URLSearchParams({
    keywords: `${cleanText(application.company)} ${cleanText(
      application.position
    )} recruiter hiring`.trim(),
  })

  return `https://www.linkedin.com/search/results/people/?${params.toString()}`
}
