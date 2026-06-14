import Header from '@/components/Header'

interface EditResumeNotFoundProps {
  onBackHome: () => void
}

export default function EditResumeNotFound({ onBackHome }: EditResumeNotFoundProps) {
  return (
    <>
      <Header />
      <main id="main-content" className="flex-1 flex items-center justify-center" role="main">
        <div className="text-center px-4 animate-fade-in">
          <div className="mx-auto mb-4 w-16 h-16 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center">
            <svg
              className="w-8 h-8 text-slate-400 dark:text-slate-500"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={1.5}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m6.75 12H9.75m0 0l2.25-2.25M9.75 15l2.25 2.25M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
          </div>
          <p className="text-lg font-medium text-slate-700 dark:text-slate-300 mb-1">
            이력서를 찾을 수 없습니다
          </p>
          <p className="text-sm text-slate-500 dark:text-slate-400 mb-5">
            삭제되었거나 존재하지 않는 이력서입니다.
          </p>
          <button
            onClick={onBackHome}
            className="text-blue-600 hover:underline focus:outline-none focus:ring-2 focus:ring-blue-500 rounded"
          >
            목록으로 돌아가기
          </button>
        </div>
      </main>
    </>
  )
}
