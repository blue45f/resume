import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest';
import { fireEvent, screen, waitFor } from '@testing-library/react';

vi.mock('@/lib/api', () => ({
  addBookmark: vi.fn(),
  removeBookmark: vi.fn(),
}));
vi.mock('@/components/Toast', () => ({
  toast: vi.fn(),
}));

import { QueryClient } from '@tanstack/react-query';
import BookmarkButton from './BookmarkButton';
import { addBookmark, removeBookmark } from '@/lib/api';
import { toast } from '@/components/Toast';
import { renderWithProviders } from '@/test/render';

// test/render 의 makeQueryClient 는 gcTime:0 이라 옵저버 없는 시드 캐시가 즉시 GC 됨 —
// 캐시 단정 테스트는 gcTime 무한 클라이언트를 사용한다.
function makeCacheClient() {
  return new QueryClient({
    defaultOptions: { queries: { retry: false, gcTime: Infinity }, mutations: { retry: false } },
  });
}

const addMock = addBookmark as unknown as ReturnType<typeof vi.fn>;
const removeMock = removeBookmark as unknown as ReturnType<typeof vi.fn>;

const bookmarkRows = [
  { id: 'b1', resumeId: 'r1', title: '이력서 A', name: '김철수', createdAt: '2026-01-01' },
  { id: 'b2', resumeId: 'r2', title: '이력서 B', name: '이영희', createdAt: '2026-01-02' },
];

describe('<BookmarkButton />', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    window.localStorage.setItem('token', 'tok123');
  });
  afterEach(() => {
    window.localStorage.clear();
  });

  it('클릭 즉시 낙관적으로 북마크 상태 반영 (서버 응답 전)', async () => {
    // 응답을 수동 resolve 하는 deferred mock
    let resolveAdd!: (value: unknown) => void;
    addMock.mockImplementation(
      () =>
        new Promise((resolve) => {
          resolveAdd = resolve;
        }),
    );
    renderWithProviders(<BookmarkButton resumeId="r1" />);
    fireEvent.click(screen.getByRole('button', { name: '북마크 추가' }));
    // 서버 응답 전인데 이미 '북마크 해제' aria-label (낙관 토글)
    await waitFor(() =>
      expect(screen.getByRole('button', { name: '북마크 해제' })).toBeInTheDocument(),
    );

    resolveAdd({ bookmarked: true });
    await waitFor(() => expect(addMock).toHaveBeenCalledWith('r1'));
    expect(toast).not.toHaveBeenCalled();
  });

  it('해제 시 [bookmarks] 캐시에서 해당 행을 즉시 제거', async () => {
    let resolveRemove!: (value: unknown) => void;
    removeMock.mockImplementation(
      () =>
        new Promise((resolve) => {
          resolveRemove = resolve;
        }),
    );
    const queryClient = makeCacheClient();
    queryClient.setQueryData(['bookmarks'], bookmarkRows);
    renderWithProviders(<BookmarkButton resumeId="r1" initialBookmarked />, { queryClient });
    fireEvent.click(screen.getByRole('button', { name: '북마크 해제' }));
    // 서버 응답 전에 목록 캐시에서 r1 행이 제거됨
    await waitFor(() => expect(queryClient.getQueryData(['bookmarks'])).toEqual([bookmarkRows[1]]));
    resolveRemove({ bookmarked: false });
    await waitFor(() => expect(removeMock).toHaveBeenCalledWith('r1'));
  });

  it('실패 시 버튼·캐시 모두 롤백 + 에러 토스트', async () => {
    removeMock.mockRejectedValue(new Error('500'));
    const queryClient = makeCacheClient();
    queryClient.setQueryData(['bookmarks'], bookmarkRows);
    renderWithProviders(<BookmarkButton resumeId="r1" initialBookmarked />, { queryClient });
    fireEvent.click(screen.getByRole('button', { name: '북마크 해제' }));
    await waitFor(() => expect(toast).toHaveBeenCalledWith('북마크 처리에 실패했습니다', 'error'));
    // 버튼 롤백 — 다시 '북마크 해제' (= bookmarked 상태)
    expect(screen.getByRole('button', { name: '북마크 해제' })).toBeInTheDocument();
    // 캐시 롤백 — 스냅샷 복원
    expect(queryClient.getQueryData(['bookmarks'])).toEqual(bookmarkRows);
  });

  it('토큰 없으면 아무것도 하지 않음', () => {
    window.localStorage.clear();
    renderWithProviders(<BookmarkButton resumeId="r1" />);
    fireEvent.click(screen.getByRole('button', { name: '북마크 추가' }));
    expect(addMock).not.toHaveBeenCalled();
    expect(removeMock).not.toHaveBeenCalled();
  });
});
