import type { Meta, StoryObj } from '@storybook/react-vite'

import { CardSkeleton, CardGridSkeleton, StatsSkeleton, FormSkeleton } from '@/components/Skeleton'

const meta: Meta = {
  title: 'Layout/Skeleton',
  parameters: { layout: 'padded' },
}
export default meta
type Story = StoryObj

export const Card: Story = {
  render: () => (
    <div className="max-w-sm">
      <CardSkeleton />
    </div>
  ),
}

export const CardGrid: Story = {
  render: () => (
    <div className="max-w-4xl">
      <CardGridSkeleton count={6} />
    </div>
  ),
}

export const Stats: Story = {
  render: () => (
    <div className="max-w-3xl">
      <StatsSkeleton />
    </div>
  ),
}

export const Form: Story = {
  render: () => (
    <div className="max-w-md">
      <FormSkeleton />
    </div>
  ),
}
