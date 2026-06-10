import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest';
import { fireEvent, screen, waitFor } from '@testing-library/react';

vi.mock('@/lib/api', () => ({
  followUser: vi.fn(),
  unfollowUser: vi.fn(),
}));
vi.mock('@/components/Toast', () => ({
  toast: vi.fn(),
}));

import FollowButton from './FollowButton';
import { followUser, unfollowUser } from '@/lib/api';
import { toast } from '@/components/Toast';
import { renderWithProviders } from '@/test/render';

const followMock = followUser as unknown as ReturnType<typeof vi.fn>;
const unfollowMock = unfollowUser as unknown as ReturnType<typeof vi.fn>;

describe('<FollowButton />', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    window.localStorage.setItem('token', 'tok123');
  });
  afterEach(() => {
    window.localStorage.clear();
  });

  it('클릭 즉시 낙관적으로 팔로잉 상태 반영 (서버 응답 전)', async () => {
    // 응답을 수동 resolve 하는 deferred mock
    let resolveFollow!: (value: unknown) => void;
    followMock.mockImplementation(
      () =>
        new Promise((resolve) => {
          resolveFollow = resolve;
        }),
    );
    renderWithProviders(<FollowButton userId="u1" />);
    fireEvent.click(screen.getByRole('button', { name: '팔로우' }));
    // 서버 응답 전인데 이미 '팔로우 취소' aria-label (낙관 토글)
    await waitFor(() =>
      expect(screen.getByRole('button', { name: '팔로우 취소' })).toBeInTheDocument(),
    );

    resolveFollow({ followed: true });
    await waitFor(() => expect(toast).toHaveBeenCalledWith('팔로우했습니다', 'success'));
  });

  it('실패 시 이전 상태로 롤백 + 에러 토스트', async () => {
    followMock.mockRejectedValue(new Error('500'));
    const onFollowChange = vi.fn();
    renderWithProviders(<FollowButton userId="u1" onFollowChange={onFollowChange} />);
    fireEvent.click(screen.getByRole('button', { name: '팔로우' }));
    await waitFor(() => expect(toast).toHaveBeenCalledWith('팔로우 처리에 실패했습니다', 'error'));
    // 롤백 — 다시 '팔로우' 상태
    expect(screen.getByRole('button', { name: '팔로우' })).toBeInTheDocument();
    // 낙관 true → 롤백 false 순서로 콜백
    expect(onFollowChange).toHaveBeenNthCalledWith(1, true);
    expect(onFollowChange).toHaveBeenNthCalledWith(2, false);
  });

  it('팔로잉 상태에서 클릭하면 unfollowUser 호출 (토글)', async () => {
    unfollowMock.mockResolvedValue({ followed: false });
    renderWithProviders(<FollowButton userId="u1" initialFollowing />);
    fireEvent.click(screen.getByRole('button', { name: '팔로우 취소' }));
    await waitFor(() => expect(unfollowMock).toHaveBeenCalledWith('u1'));
    expect(followMock).not.toHaveBeenCalled();
    // 언팔로우 성공에는 토스트 없음 (기존 동작 보존)
    expect(toast).not.toHaveBeenCalled();
  });

  it('토큰 없으면 아무것도 하지 않음', () => {
    window.localStorage.clear();
    renderWithProviders(<FollowButton userId="u1" />);
    fireEvent.click(screen.getByRole('button', { name: '팔로우' }));
    expect(followMock).not.toHaveBeenCalled();
    expect(unfollowMock).not.toHaveBeenCalled();
  });
});
