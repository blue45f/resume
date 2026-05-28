import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, renderWithProviders, screen, waitFor } from '@/test/render';
import AnnouncementBanner from './AnnouncementBanner';

const storedAnnouncement = {
  id: 'release-2026-05',
  message: '새 공지 기능이 배포되었습니다.',
  type: 'info',
};

describe('AnnouncementBanner', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.stubGlobal('fetch', vi.fn());
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it('dismisses the visible announcement even when localStorage writes fail', async () => {
    localStorage.setItem('admin-announcement', JSON.stringify(storedAnnouncement));
    renderWithProviders(<AnnouncementBanner />);

    expect(await screen.findByText(storedAnnouncement.message)).toBeInTheDocument();

    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new Error('storage blocked');
    });

    expect(() => {
      fireEvent.click(screen.getByRole('button', { name: '공지 닫기' }));
    }).not.toThrow();

    await waitFor(() => {
      expect(screen.queryByText(storedAnnouncement.message)).not.toBeInTheDocument();
    });
  });
});
