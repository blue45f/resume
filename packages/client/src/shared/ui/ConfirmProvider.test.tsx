import { describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';

import { ConfirmProvider, useConfirm } from './ConfirmProvider';

function Harness({ onResult }: { onResult: (v: boolean) => void }) {
  const confirm = useConfirm();
  return (
    <button
      onClick={async () => {
        onResult(await confirm({ title: '삭제하시겠습니까?', confirmText: '삭제', danger: true }));
      }}
    >
      trigger
    </button>
  );
}

describe('ConfirmProvider', () => {
  it('확인을 누르면 true로 resolve된다', async () => {
    const onResult = vi.fn();
    render(
      <ConfirmProvider>
        <Harness onResult={onResult} />
      </ConfirmProvider>,
    );

    fireEvent.click(screen.getByText('trigger'));
    expect(await screen.findByText('삭제하시겠습니까?')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: '삭제' }));
    await waitFor(() => expect(onResult).toHaveBeenCalledWith(true));
  });

  it('취소를 누르면 false로 resolve된다', async () => {
    const onResult = vi.fn();
    render(
      <ConfirmProvider>
        <Harness onResult={onResult} />
      </ConfirmProvider>,
    );

    fireEvent.click(screen.getByText('trigger'));
    await screen.findByText('삭제하시겠습니까?');

    fireEvent.click(screen.getByRole('button', { name: '취소' }));
    await waitFor(() => expect(onResult).toHaveBeenCalledWith(false));
  });

  it('Provider 밖에서 useConfirm 호출 시 throw한다', () => {
    const Bad = () => {
      useConfirm();
      return null;
    };
    const spy = vi.spyOn(console, 'error').mockImplementation(() => {});
    expect(() => render(<Bad />)).toThrow(/ConfirmProvider/);
    spy.mockRestore();
  });
});
