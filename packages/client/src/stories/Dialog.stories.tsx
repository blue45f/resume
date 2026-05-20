import type { Meta, StoryObj } from '@storybook/react-vite';
import { useState } from 'react';
import Dialog from '@/shared/ui/Dialog';

const meta: Meta<typeof Dialog> = {
  title: 'UI Primitives/Dialog',
  component: Dialog,
  parameters: { layout: 'centered' },
};
export default meta;
type Story = StoryObj<typeof Dialog>;

function Demo(props: {
  title?: string;
  description?: string;
  bodyKind: 'short' | 'long' | 'form';
}) {
  const [open, setOpen] = useState(true);
  return (
    <div>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="px-4 py-2 rounded-lg bg-blue-600 text-white text-sm font-medium"
      >
        다이얼로그 열기
      </button>
      <Dialog
        open={open}
        onOpenChange={setOpen}
        title={props.title}
        description={props.description}
      >
        {props.bodyKind === 'short' && (
          <p className="text-sm text-slate-600 dark:text-slate-300">
            짧은 안내 본문입니다. 확인 후 닫기를 누르세요.
          </p>
        )}
        {props.bodyKind === 'long' && (
          <div className="space-y-3 text-sm text-slate-600 dark:text-slate-300">
            {Array.from({ length: 12 }).map((_, i) => (
              <p key={i}>
                긴 콘텐츠 라인 {i + 1} — 다이얼로그 내부 스크롤이 잘 동작하는지 확인합니다.
              </p>
            ))}
          </div>
        )}
        {props.bodyKind === 'form' && (
          <form className="space-y-3 mt-1">
            <input
              type="text"
              placeholder="이름"
              className="w-full px-3 py-2 text-sm border border-slate-200 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700"
            />
            <input
              type="email"
              placeholder="이메일"
              className="w-full px-3 py-2 text-sm border border-slate-200 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700"
            />
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="w-full px-4 py-2 rounded-lg bg-blue-600 text-white text-sm font-semibold"
            >
              제출
            </button>
          </form>
        )}
      </Dialog>
    </div>
  );
}

export const Default: Story = {
  render: () => (
    <Demo title="다이얼로그 제목" description="기본 다이얼로그 — 짧은 본문." bodyKind="short" />
  ),
};

export const LongScrollable: Story = {
  render: () => <Demo title="긴 콘텐츠" description="내부 스크롤 검증." bodyKind="long" />,
};

export const FormDialog: Story = {
  render: () => (
    <Demo title="회원 가입" description="이름과 이메일을 입력해주세요." bodyKind="form" />
  ),
};

export const NoDescription: Story = {
  render: () => <Demo title="설명 없는 헤더" bodyKind="short" />,
};
