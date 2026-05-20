import type { Meta, StoryObj } from '@storybook/react-vite';
import KoreanQualityBadge from '@/components/KoreanQualityBadge';
import { richResumeText, longTextWithGaps, shortText } from './_fixtures';

const meta: Meta<typeof KoreanQualityBadge> = {
  title: 'Resume Analysis/KoreanQualityBadge',
  component: KoreanQualityBadge,
  parameters: { layout: 'padded' },
  argTypes: {
    text: { control: 'text' },
    label: { control: 'text' },
    minLength: { control: { type: 'number', min: 0, max: 1000, step: 10 } },
  },
};
export default meta;
type Story = StoryObj<typeof KoreanQualityBadge>;

export const ResumeBody: Story = {
  args: { text: richResumeText, label: '본문', minLength: 50 },
};

export const Chronological: Story = {
  args: { text: longTextWithGaps, label: '경력', minLength: 50 },
};

/** minLength 미달 — 컴포넌트는 null 반환. */
export const Empty: Story = {
  args: { text: shortText, label: '본문', minLength: 50 },
};
