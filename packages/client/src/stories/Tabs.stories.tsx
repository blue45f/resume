import type { Meta, StoryObj } from '@storybook/react-vite'

import Tabs from '@/shared/ui/Tabs'

const meta: Meta<typeof Tabs> = {
  title: 'UI Primitives/Tabs',
  component: Tabs,
  parameters: { layout: 'centered' },
  argTypes: {
    ariaLabel: { control: 'text' },
    defaultTab: { control: 'text' },
  },
}
export default meta
type Story = StoryObj<typeof Tabs>

const baseItems = [
  {
    id: 'overview',
    label: '개요',
    content: <p className="text-sm">개요 패널 — 사용자가 가장 먼저 보는 콘텐츠입니다.</p>,
  },
  {
    id: 'detail',
    label: '상세',
    content: <p className="text-sm">상세 패널 — 세부 정보를 표시합니다.</p>,
  },
  {
    id: 'history',
    label: '이력',
    content: <p className="text-sm">이력 패널 — 과거 활동을 표시합니다.</p>,
  },
]

export const Default: Story = {
  args: {
    items: baseItems,
    defaultTab: 'overview',
    ariaLabel: '리소스 탭',
  },
}

export const WithCounts: Story = {
  args: {
    items: [
      {
        id: 'all',
        label: '전체',
        count: 142,
        content: <p className="text-sm">전체 항목 142건.</p>,
      },
      { id: 'open', label: '진행중', count: 17, content: <p className="text-sm">진행중 17건.</p> },
      { id: 'done', label: '완료', count: 125, content: <p className="text-sm">완료 125건.</p> },
    ],
    defaultTab: 'all',
    ariaLabel: '상태별 탭',
  },
}

export const SingleTab: Story = {
  args: {
    items: [
      {
        id: 'only',
        label: '유일',
        content: <p className="text-sm">탭이 한 개만 있는 엣지 케이스.</p>,
      },
    ],
  },
}

export const ManyTabs: Story = {
  args: {
    items: Array.from({ length: 7 }).map((_, i) => ({
      id: `t${i}`,
      label: `탭 ${i + 1}`,
      content: <p className="text-sm">탭 {i + 1} 콘텐츠.</p>,
    })),
  },
}
