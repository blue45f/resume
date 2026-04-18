interface Props {
  message?: string;
  onRetry: () => void;
}

export default function ErrorRetry({ message = '서버에 연결할 수 없습니다', onRetry }: Props) {
  return (
    <div className="text-center py-16 animate-fade-in">
      <svg
        className="w-14 h-14 mx-auto mb-4 text-slate-300 dark:text-slate-600"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={1.5}
          d="M12 9v2m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
        />
      </svg>
      <p className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">{message}</p>
      <p className="text-xs text-slate-500 dark:text-slate-400 mb-5">
        서버가 시작 중이거나 일시적 오류일 수 있습니다
      </p>
      <button
        onClick={onRetry}
        className="px-5 py-2.5 bg-blue-600 text-white text-sm font-medium rounded-xl hover:bg-blue-700 transition-colors"
      >
        다시 시도
      </button>
    </div>
  );
}
