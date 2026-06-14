import { richResumeText, shortText } from './_fixtures'

import type { Meta, StoryObj } from '@storybook/react-vite'

import QuotableHighlights from '@/components/QuotableHighlights'

const meta: Meta<typeof QuotableHighlights> = {
  title: 'Resume Analysis/QuotableHighlights',
  component: QuotableHighlights,
  parameters: { layout: 'padded' },
  argTypes: {
    topN: { control: { type: 'number', min: 1, max: 10, step: 1 } },
    minLength: { control: { type: 'number', min: 0, max: 1000, step: 50 } },
  },
}
export default meta
type Story = StoryObj<typeof QuotableHighlights>

export const TopThree: Story = {
  args: { text: richResumeText, topN: 3, minLength: 200 },
}

export const TopFive: Story = {
  args: { text: richResumeText, topN: 5, minLength: 200 },
}

export const Empty: Story = {
  args: { text: shortText, topN: 3, minLength: 200 },
}
