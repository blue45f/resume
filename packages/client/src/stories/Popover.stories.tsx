import type { Meta, StoryObj } from '@storybook/react-vite';
import Popover from '@/shared/ui/Popover';

const meta: Meta = {
  title: 'UI Primitives/Popover',
  parameters: { layout: 'centered' },
};
export default meta;
type Story = StoryObj;

export const Default: Story = {
  render: () => (
    <Popover.Root>
      <Popover.Trigger asChild>
        <button className="px-3 py-1.5 rounded-lg border border-slate-200 text-sm">
          팝오버 열기
        </button>
      </Popover.Trigger>
      <Popover.Content>
        <h4 className="text-sm font-semibold mb-2">팝오버 제목</h4>
        <p className="text-xs text-slate-600 dark:text-slate-300">
          간단한 안내 메시지를 표시합니다.
        </p>
      </Popover.Content>
    </Popover.Root>
  ),
};

export const Form: Story = {
  render: () => (
    <Popover.Root>
      <Popover.Trigger asChild>
        <button className="px-3 py-1.5 rounded-lg border border-slate-200 text-sm">필터</button>
      </Popover.Trigger>
      <Popover.Content>
        <div className="space-y-2">
          <label className="block text-xs font-medium">키워드</label>
          <input
            type="text"
            placeholder="예: TypeScript"
            className="w-full px-2 py-1.5 text-xs border border-slate-200 rounded-md"
          />
          <button className="w-full px-3 py-1.5 rounded-md bg-blue-600 text-white text-xs font-semibold">
            적용
          </button>
        </div>
      </Popover.Content>
    </Popover.Root>
  ),
};
