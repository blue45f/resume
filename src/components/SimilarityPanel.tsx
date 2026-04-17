import type { Resume } from '@/types/resume';
import { findDuplicates } from '@/lib/similarity';

interface Props {
  resume: Resume;
}

export default function SimilarityPanel({ resume }: Props) {
  const issues = findDuplicates(resume);

  if (issues.length === 0) return null;

  return (
    <div className="bg-white dark:bg-slate-800 rounded-xl border border-amber-200 dark:border-amber-800 p-4 no-print">
      <h3 className="text-sm font-semibold text-amber-700 dark:text-amber-400 mb-3 flex items-center gap-2">
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
        </svg>
        중복 콘텐츠 감지 ({issues.length}건)
      </h3>
      <div className="space-y-2">
        {issues.map((issue, i) => (
          <div key={i} className="p-3 bg-amber-50 dark:bg-amber-900/20 rounded-lg text-sm">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xs font-medium text-amber-600 dark:text-amber-400 bg-amber-100 dark:bg-amber-900/30 px-1.5 py-0.5 rounded">{issue.section}</span>
              <span className="text-xs text-amber-500">{issue.similarity}% 유사</span>
            </div>
            <p className="text-amber-800 dark:text-amber-300 text-xs">{issue.message}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
