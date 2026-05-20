import type { Meta, StoryObj } from '@storybook/react-vite';
import { InterviewabilityRow } from '@/components/KoreanQualityBadge';
import { richResumeText, longTextWithGaps, shortText } from './_fixtures';

/**
 * InterviewabilityRow 는 KoreanQualityBadge 내부 행이지만 export 되어 단독 노출 가능.
 * 200자 미만이면 null 반환.
 */
const meta: Meta<typeof InterviewabilityRow> = {
  title: 'Resume Analysis/InterviewabilityRow',
  component: InterviewabilityRow,
  parameters: { layout: 'padded' },
  argTypes: {
    text: { control: 'text' },
  },
};
export default meta;
type Story = StoryObj<typeof InterviewabilityRow>;

function Wrap(children: React.ReactNode) {
  return (
    <div className="w-72 p-3 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900">
      {children}
    </div>
  );
}

export const PromisingResume: Story = {
  args: { text: richResumeText },
  render: (args) => Wrap(<InterviewabilityRow {...args} />),
};

export const Chronological: Story = {
  args: { text: longTextWithGaps },
  render: (args) => Wrap(<InterviewabilityRow {...args} />),
};

export const BelowThreshold: Story = {
  args: { text: shortText },
  render: (args) => Wrap(<InterviewabilityRow {...args} />),
};
