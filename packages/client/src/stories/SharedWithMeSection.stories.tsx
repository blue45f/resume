import { useEffect } from 'react'

import { installFetchMock, uninstallFetchMock } from './_mockFetch'

import type { Meta, StoryObj } from '@storybook/react-vite'

import SharedWithMeSection from '@/components/SharedWithMeSection'

const meta: Meta<typeof SharedWithMeSection> = {
  title: 'Sharing & Job/SharedWithMeSection',
  component: SharedWithMeSection,
  parameters: { layout: 'padded' },
}
export default meta
type Story = StoryObj<typeof SharedWithMeSection>

const sharedMany = [
  {
    id: 's1',
    expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
    message: '검토 부탁드립니다',
    resume: {
      id: 'r1',
      title: '김지원의 개발자 이력서 v3',
      personalInfo: { name: '김지원' },
    },
    addedBy: { id: 'u1', name: '김지원' },
  },
  {
    id: 's2',
    expiresAt: null,
    message: null,
    resume: {
      id: 'r2',
      title: 'Senior Frontend Engineer Resume',
      personalInfo: { name: 'Anna Lee' },
    },
    addedBy: { id: 'u2', name: 'Anna Lee' },
  },
  {
    id: 's3',
    expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
    message: '면접 검토용',
    resume: {
      id: 'r3',
      title: '데이터 분석가 포트폴리오',
      personalInfo: { name: '박민호' },
    },
    addedBy: { id: 'u3', name: '박민호' },
  },
]

export const WithItems: Story = {
  decorators: [
    (Story) => {
      useEffect(() => {
        installFetchMock({ '/api/resumes/shared/list': sharedMany })
        return () => uninstallFetchMock()
      }, [])
      return <Story />
    },
  ],
}

/**
 * 빈 응답 — 컴포넌트는 null 반환 (UI 비어있음). 의도된 동작.
 */
export const Empty: Story = {
  decorators: [
    (Story) => {
      useEffect(() => {
        installFetchMock({ '/api/resumes/shared/list': [] })
        return () => uninstallFetchMock()
      }, [])
      return <Story />
    },
  ],
}
