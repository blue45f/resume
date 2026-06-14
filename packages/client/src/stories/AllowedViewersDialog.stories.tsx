import { useEffect } from 'react'

import { installFetchMock, uninstallFetchMock } from './_mockFetch'

import type { Meta, StoryObj } from '@storybook/react-vite'

import AllowedViewersDialog from '@/components/AllowedViewersDialog'

const meta: Meta<typeof AllowedViewersDialog> = {
  title: 'Sharing & Job/AllowedViewersDialog',
  component: AllowedViewersDialog,
  parameters: { layout: 'centered' },
}
export default meta
type Story = StoryObj<typeof AllowedViewersDialog>

const viewersMany = [
  {
    id: 'v1',
    userId: 'u1',
    user: { id: 'u1', name: '김지원', username: 'jiwon', email: 'jiwon@example.com', avatar: null },
    message: '검토 부탁드립니다.',
    expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
    lastViewedAt: new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString(),
    viewCount: 3,
  },
  {
    id: 'v2',
    userId: 'u2',
    user: { id: 'u2', name: '박민호', username: null, email: 'minho@corp.com', avatar: null },
    message: null,
    expiresAt: null,
    lastViewedAt: null,
    viewCount: 0,
  },
  {
    id: 'v3',
    userId: 'u3',
    user: { id: 'u3', name: 'Anna Lee', username: 'anna', email: 'anna@startup.io', avatar: null },
    message: '면접 검토용',
    expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
    lastViewedAt: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
    viewCount: 12,
  },
]

export const WithViewers: Story = {
  decorators: [
    (Story) => {
      useEffect(() => {
        installFetchMock({
          '/api/resumes/demo-id/viewers': viewersMany,
          '/api/users/search': [],
        })
        return () => uninstallFetchMock()
      }, [])
      return <Story />
    },
  ],
  args: { resumeId: 'demo-id', onClose: () => {} },
}

export const Empty: Story = {
  decorators: [
    (Story) => {
      useEffect(() => {
        installFetchMock({
          '/api/resumes/empty-id/viewers': [],
          '/api/users/search': [],
        })
        return () => uninstallFetchMock()
      }, [])
      return <Story />
    },
  ],
  args: { resumeId: 'empty-id', onClose: () => {} },
}
