/**
 * AdminTable — 관리자 페이지에서 4개 탭 공통으로 쓰는 테이블 컴포넌트
 *
 * - 페이지네이션 (외부 제어)
 * - 빈 상태 (ListEmptyState)
 * - 로딩 스켈레톤
 * - 검색바 slot, 필터 slot (자유롭게 주입)
 */
import type { ReactNode } from 'react';

export interface AdminTableColumn<T> {
  key: string;
  header: ReactNode;
  render: (item: T) => ReactNode;
  className?: string;
  width?: string;
}

interface Props<T> {
  columns: AdminTableColumn<T>[];
  items: T[];
  loading?: boolean;
  emptyLabel?: ReactNode;
  getKey: (item: T) => string;
  toolbar?: ReactNode;
  footer?: ReactNode;
  page?: number;
  totalPages?: number;
  onPageChange?: (page: number) => void;
  total?: number;
  rowClassName?: (item: T) => string;
}

export function AdminTable<T>(props: Props<T>) {
  const {
    columns,
    items,
    loading,
    emptyLabel = '데이터가 없습니다',
    getKey,
    toolbar,
    footer,
    page,
    totalPages,
    onPageChange,
    total,
    rowClassName,
  } = props;

  return (
    <div className="space-y-3">
      {toolbar && (
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
          {toolbar}
        </div>
      )}

      {loading ? (
        <div className="rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden">
          <div className="animate-pulse">
            {Array.from({ length: 6 }).map((_, i) => (
              <div
                key={i}
                className="h-12 bg-slate-100 dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 last:border-0"
              />
            ))}
          </div>
        </div>
      ) : items.length === 0 ? (
        <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-10 text-center">
          <p className="text-3xl mb-2" aria-hidden>
            📭
          </p>
          <p className="text-sm text-slate-500 dark:text-slate-400">{emptyLabel}</p>
        </div>
      ) : (
        <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-slate-50 dark:bg-slate-900 text-left">
                {columns.map((col) => (
                  <th
                    key={col.key}
                    className={`px-4 py-2.5 text-xs font-medium text-slate-500 dark:text-slate-400 ${
                      col.className || ''
                    }`}
                    style={col.width ? { width: col.width } : undefined}
                  >
                    {col.header}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
              {items.map((item) => (
                <tr
                  key={getKey(item)}
                  className={`hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors ${
                    rowClassName ? rowClassName(item) : ''
                  }`}
                >
                  {columns.map((col) => (
                    <td
                      key={col.key}
                      className={`px-4 py-2.5 align-middle text-slate-700 dark:text-slate-300 ${
                        col.className || ''
                      }`}
                    >
                      {col.render(item)}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {(footer ||
        (typeof page === 'number' && typeof totalPages === 'number' && totalPages > 1)) && (
        <div className="flex items-center justify-between">
          <span className="text-xs text-slate-400">
            {typeof total === 'number' ? `총 ${total}건 · ` : ''}
            {typeof page === 'number' && typeof totalPages === 'number'
              ? `${page} / ${totalPages} 페이지`
              : ''}
          </span>
          <div className="flex items-center gap-1">
            {footer}
            {typeof page === 'number' && typeof totalPages === 'number' && totalPages > 1 && (
              <>
                <button
                  type="button"
                  onClick={() => onPageChange?.(Math.max(1, page - 1))}
                  disabled={page <= 1}
                  className="px-3 py-2 min-h-[40px] min-w-[44px] text-xs bg-slate-100 dark:bg-slate-700 rounded-lg disabled:opacity-30"
                >
                  이전
                </button>
                <button
                  type="button"
                  onClick={() => onPageChange?.(Math.min(totalPages, page + 1))}
                  disabled={page >= totalPages}
                  className="px-3 py-2 min-h-[40px] min-w-[44px] text-xs bg-slate-100 dark:bg-slate-700 rounded-lg disabled:opacity-30"
                >
                  다음
                </button>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default AdminTable;
