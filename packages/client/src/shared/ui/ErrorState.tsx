/**
 * 쿼리 실패 배너 — 서버 에러를 "데이터가 없습니다" 류 빈 상태로 위장하지 않기 위한 프리미티브.
 * HomePage 가 손으로 그리던 amber 콜드스타트 경고 + 재시도 패턴을 한곳으로 모았다
 * (무료 호스팅 특성상 첫 요청이 30~60초 걸리며 5xx/타임아웃이 실제로 자주 발생한다).
 * role="alert" 로 보조기술에 즉시 알리고, 재시도 버튼이 refetch 를 잇는다.
 *
 * 사용:
 *   {isError ? (
 *     <ErrorState message="북마크를 불러오지 못했습니다" onRetry={() => refetch()} />
 *   ) : items.length === 0 ? (
 *     <EmptyState ... /> // 빈 상태는 "성공 + 0건"일 때만
 *   ) : ( ... )}
 */
export function ErrorState({
  message = '데이터를 불러오지 못했습니다',
  hint = '무료 호스팅 특성상 서버 시작에 30~60초가 걸릴 수 있습니다. 잠시 후 다시 시도해주세요.',
  onRetry,
  className = '',
}: {
  message?: string;
  hint?: string;
  onRetry: () => void;
  className?: string;
}) {
  return (
    <div
      role="alert"
      className={`p-4 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-xl flex items-start sm:items-center justify-between gap-3 animate-fade-in ${className}`}
    >
      <div className="flex items-start gap-2 min-w-0">
        <svg
          className="w-5 h-5 text-amber-500 shrink-0 mt-0.5"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
          aria-hidden="true"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M12 9v2m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
          />
        </svg>
        <div className="min-w-0">
          <p className="text-sm font-medium text-amber-800 dark:text-amber-300">{message}</p>
          <p className="text-xs text-amber-700 dark:text-amber-400 mt-0.5">{hint}</p>
        </div>
      </div>
      <button
        type="button"
        onClick={onRetry}
        className="shrink-0 px-3 py-1.5 bg-amber-600 hover:bg-amber-700 text-white text-xs font-medium rounded-lg transition-colors"
      >
        재시도
      </button>
    </div>
  );
}
