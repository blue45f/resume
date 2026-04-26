import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { fetchMySharedResumes, type MySharedResume } from '@/lib/api';
import { ROUTES } from '@/lib/routes';
import { tx } from '@/lib/i18n';

/**
 * "공유받은 이력서" 섹션 — selective 공개 이력서를 받은 사용자에게만 보임.
 *
 * 데이터가 없으면 null 반환 (빈 영역 차지하지 않음). 한 번 fetch 후 5분 cache.
 */
export default function SharedWithMeSection() {
  const [items, setItems] = useState<MySharedResume[] | null>(null);

  useEffect(() => {
    let cancelled = false;
    fetchMySharedResumes()
      .then((data) => {
        if (!cancelled) setItems(data);
      })
      .catch(() => {
        if (!cancelled) setItems([]);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  if (!items || items.length === 0) return null;

  return (
    <div className="mb-6">
      <h3 className="text-sm font-medium text-slate-600 dark:text-slate-400 mb-2 flex items-center gap-1.5">
        <svg
          className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
          aria-hidden="true"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M17 20h5v-2a4 4 0 00-3-3.87M9 20H4v-2a4 4 0 013-3.87m6 0a4 4 0 10-4-4 4 4 0 004 4z"
          />
        </svg>
        {tx('sharing.sharedWithMe')} ({items.length})
      </h3>
      <div className="flex gap-2 overflow-x-auto pb-2">
        {items.map((s) => {
          const ownerName =
            s.resume.personalInfo?.name || s.addedBy?.name || tx('common.anonymous');
          return (
            <Link
              key={s.id}
              to={ROUTES.resume.preview(s.resume.id)}
              className="shrink-0 max-w-[260px] px-3 py-2 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg hover:bg-blue-100 dark:hover:bg-blue-900/30 transition-colors group"
              title={s.message || tx('sharing.sharedBy', { name: ownerName })}
            >
              <p className="text-sm font-medium text-blue-700 dark:text-blue-300 truncate">
                {s.resume.title || '제목 없음'}
              </p>
              <p className="text-[11px] text-blue-600/80 dark:text-blue-400/80 truncate mt-0.5">
                {tx('sharing.sharedBy', { name: ownerName })}
                {s.expiresAt && (
                  <>
                    {' · '}~{new Date(s.expiresAt).toLocaleDateString()}
                  </>
                )}
              </p>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
