import type { Meta, StoryObj } from '@storybook/react-vite';
import Tooltip from '@/shared/ui/Tooltip';

const meta: Meta<typeof Tooltip> = {
  title: 'UI Primitives/Tooltip',
  component: Tooltip,
  parameters: { layout: 'centered' },
  argTypes: {
    side: { control: 'select', options: ['top', 'right', 'bottom', 'left'] },
    delay: { control: { type: 'number', min: 0, max: 1500, step: 50 } },
  },
};
export default meta;
type Story = StoryObj<typeof Tooltip>;

export const Top: Story = {
  args: {
    content: '북마크 추가',
    side: 'top',
    children: (
      <button className="px-3 py-1.5 rounded-lg border border-slate-200 text-sm">호버</button>
    ),
  },
};

export const Right: Story = {
  args: {
    content: '오른쪽 툴팁',
    side: 'right',
    children: (
      <button className="px-3 py-1.5 rounded-lg border border-slate-200 text-sm">호버 →</button>
    ),
  },
};

export const LongContent: Story = {
  args: {
    content:
      '여러 줄로 길게 표시되는 툴팁입니다. 최대 너비가 제한되어 자동으로 줄바꿈됩니다. max-w-xs.',
    side: 'top',
    children: (
      <span className="underline decoration-dotted underline-offset-2 text-sm cursor-help">
        긴 설명
      </span>
    ),
  },
};
