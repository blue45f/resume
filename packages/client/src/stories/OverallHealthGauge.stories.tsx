import { richResumeText, shortText, longTextWithGaps } from './_fixtures'

import type { Meta, StoryObj } from '@storybook/react-vite'

import OverallHealthGauge from '@/components/OverallHealthGauge'

const meta: Meta<typeof OverallHealthGauge> = {
  title: 'Resume Analysis/OverallHealthGauge',
  component: OverallHealthGauge,
  parameters: { layout: 'padded' },
  argTypes: {
    text: { control: 'text' },
    minLength: { control: { type: 'number', min: 0, max: 1000, step: 50 } },
  },
}
export default meta
type Story = StoryObj<typeof OverallHealthGauge>

export const HealthyResume: Story = {
  args: {
    text: richResumeText,
    minLength: 200,
  },
}

export const ChronologicalResume: Story = {
  args: {
    text: longTextWithGaps,
    minLength: 200,
  },
}

/**
 * 입력이 minLength 미만이면 컴포넌트는 null 반환 — Storybook 캔버스는 비어있음.
 */
export const BelowMinLength: Story = {
  args: {
    text: shortText,
    minLength: 200,
  },
}
