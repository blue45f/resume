import { useState } from 'react'

import type { Meta, StoryObj } from '@storybook/react-vite'

import ConfirmDialog from '@/shared/ui/ConfirmDialog'

const meta: Meta<typeof ConfirmDialog> = {
  title: 'UI Primitives/ConfirmDialog',
  component: ConfirmDialog,
  parameters: { layout: 'centered' },
}
export default meta
type Story = StoryObj<typeof ConfirmDialog>

function Demo(props: { title: string; description?: string; danger?: boolean }) {
  const [open, setOpen] = useState(true)
  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="px-4 py-2 rounded-lg bg-blue-600 text-white text-sm font-medium"
      >
        다이얼로그 열기
      </button>
      <ConfirmDialog
        open={open}
        onOpenChange={setOpen}
        title={props.title}
        description={props.description}
        danger={props.danger}
        onConfirm={() => setOpen(false)}
      />
    </>
  )
}

export const Default: Story = {
  render: () => <Demo title="저장하시겠습니까?" description="작성한 내용을 저장합니다." />,
}

export const Danger: Story = {
  render: () => (
    <Demo title="정말 삭제할까요?" description="삭제된 항목은 복구할 수 없습니다." danger />
  ),
}
