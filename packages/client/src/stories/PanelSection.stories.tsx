import type { Meta, StoryObj } from '@storybook/react-vite'

import PanelSection from '@/components/PanelSection'

const meta: Meta<typeof PanelSection> = {
  title: 'Layout/PanelSection',
  component: PanelSection,
  parameters: { layout: 'padded' },
  argTypes: {
    title: { control: 'text' },
    subtitle: { control: 'text' },
    icon: { control: 'text' },
    defaultOpen: { control: 'boolean' },
  },
}
export default meta
type Story = StoryObj<typeof PanelSection>

export const Default: Story = {
  args: {
    title: '이력서 신호',
    subtitle: '정량/액션동사/STAR 분석 결과',
    icon: '💼',
    defaultOpen: true,
    children: (
      <div className="p-3 imp-card bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg">
        <p className="text-sm text-slate-600 dark:text-slate-300">패널 내부 콘텐츠.</p>
      </div>
    ),
  },
}

export const Collapsed: Story = {
  args: {
    title: '문체 · 가독성',
    subtitle: '맞춤법·어휘 다양성·어미 변주',
    icon: '📖',
    defaultOpen: false,
    children: <p>토글 후 표시되는 콘텐츠</p>,
  },
}

export const NoSubtitle: Story = {
  args: {
    title: '기본 정보',
    icon: '🪪',
    defaultOpen: true,
    children: <p className="text-sm">서브타이틀 없는 케이스.</p>,
  },
}
