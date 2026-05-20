import type { Meta, StoryObj } from '@storybook/react-vite';
import CareerGapPanel from '@/components/CareerGapPanel';
import { richResumeText, longTextWithGaps, shortText } from './_fixtures';

const meta: Meta<typeof CareerGapPanel> = {
  title: 'Resume Analysis/CareerGapPanel',
  component: CareerGapPanel,
  parameters: { layout: 'padded' },
  argTypes: {
    text: { control: 'text' },
    minLength: { control: { type: 'number', min: 0, max: 1000, step: 50 } },
  },
};
export default meta;
type Story = StoryObj<typeof CareerGapPanel>;

/**
 * 여러 경력 구간 사이에 6개월↑ 공백이 있는 fixtures 사용.
 */
export const WithGaps: Story = {
  args: { text: longTextWithGaps, minLength: 200 },
};

/**
 * 갭이 없는(연속 경력) 텍스트 — 컴포넌트는 null 반환, 캔버스 비어있음.
 */
export const NoGaps: Story = {
  args: { text: richResumeText, minLength: 200 },
};

export const Empty: Story = {
  args: { text: shortText, minLength: 200 },
};
