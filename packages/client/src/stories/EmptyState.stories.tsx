import type { Meta, StoryObj } from '@storybook/react-vite'

import EmptyState from '@/components/EmptyState'

const meta: Meta<typeof EmptyState> = {
  title: 'Layout/EmptyState',
  component: EmptyState,
  parameters: { layout: 'fullscreen' },
  argTypes: {
    type: {
      control: 'select',
      options: [
        'search',
        'resume',
        'application',
        'template',
        'tag',
        'version',
        'attachment',
        'scout',
        'cover-letter',
        'message',
        'notification',
      ],
    },
    query: { control: 'text' },
  },
}
export default meta
type Story = StoryObj<typeof EmptyState>

export const Resume: Story = { args: { type: 'resume' } }
export const SearchNoResults: Story = { args: { type: 'search', query: 'TypeScript' } }
export const Notifications: Story = { args: { type: 'notification' } }
export const Scouts: Story = { args: { type: 'scout' } }
export const Versions: Story = { args: { type: 'version' } }
