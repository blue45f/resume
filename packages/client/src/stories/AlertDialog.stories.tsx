import type { Meta, StoryObj } from '@storybook/react-vite';
import { useState } from 'react';
import AlertDialog from '@/shared/ui/AlertDialog';

const meta: Meta<typeof AlertDialog> = {
  title: 'UI Primitives/AlertDialog',
  component: AlertDialog,
  parameters: { layout: 'centered' },
};
export default meta;
type Story = StoryObj<typeof AlertDialog>;

function Demo(props: {
  title: string;
  description?: string;
  danger?: boolean;
  confirmText?: string;
}) {
  const [open, setOpen] = useState(true);
  return (
    <div>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className={`px-4 py-2 rounded-lg text-sm font-medium text-white ${
          props.danger ? 'bg-red-600 hover:bg-red-700' : 'bg-neutral-900 hover:bg-neutral-800'
        }`}
      >
        다이얼로그 열기
      </button>
      <AlertDialog
        open={open}
        onOpenChange={setOpen}
        title={props.title}
        description={props.description}
        danger={props.danger}
        confirmText={props.confirmText}
        onConfirm={() => setOpen(false)}
      />
    </div>
  );
}

export const Confirm: Story = {
  render: () => (
    <Demo title="저장하시겠습니까?" description="변경사항을 저장합니다." confirmText="저장" />
  ),
};

export const DangerDelete: Story = {
  render: () => (
    <Demo
      title="이력서를 삭제하시겠습니까?"
      description="이 작업은 되돌릴 수 없습니다. 모든 버전 기록도 함께 사라집니다."
      danger
      confirmText="삭제"
    />
  ),
};

export const MinimalNoDescription: Story = {
  render: () => <Demo title="계속하시겠습니까?" />,
};
