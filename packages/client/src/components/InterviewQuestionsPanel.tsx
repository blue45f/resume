import { useMemo, useState } from 'react';
import { generateInterviewQuestions, type InterviewQuestion } from '@/lib/koreanChecker';

interface Props {
  text: string;
  minLength?: number;
  maxQuestions?: number;
  className?: string;
}

const CATEGORY_COLORS: Record<InterviewQuestion['category'], string> = {
  skill:
    'bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 border-blue-100 dark:border-blue-900/40',
  experience:
    'bg-cyan-50 dark:bg-cyan-900/20 text-cyan-700 dark:text-cyan-300 border-cyan-100 dark:border-cyan-900/40',
  behavioral:
    'bg-slate-50 dark:bg-slate-800/60 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700',
  project:
    'bg-sapphire-50 dark:bg-sapphire-900/20 text-sky-700 dark:text-sky-300 border-sky-100 dark:border-sky-900/40',
};

const CATEGORY_LABELS: Record<InterviewQuestion['category'], string> = {
  skill: '기술',
  experience: '경험',
  behavioral: '행동',
  project: '프로젝트',
};

/**
 * 이력서·자소서 본문에서 예상 면접 질문을 룰-기반으로 생성해 카드 리스트로 렌더.
 * category 별 색상 + reason 툴팁 + 접기/펼치기.
 */
export default function InterviewQuestionsPanel({
  text,
  minLength = 150,
  maxQuestions = 10,
  className = '',
}: Props) {
  const [expanded, setExpanded] = useState(false);
  const questions = useMemo(() => {
    if (!text || text.length < minLength) return [];
    return generateInterviewQuestions(text, maxQuestions);
  }, [text, minLength, maxQuestions]);

  if (questions.length === 0) return null;

  const displayed = expanded ? questions : questions.slice(0, 3);

  return (
    <div className={`mt-3 ${className}`}>
      <div className="flex items-baseline justify-between mb-1.5">
        <div className="text-[11px] font-medium text-slate-500 dark:text-slate-400">
          🎤 예상 면접 질문 ({questions.length})
        </div>
        {questions.length > 3 && (
          <button
            type="button"
            onClick={() => setExpanded((v) => !v)}
            className="text-[10px] text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 rounded"
          >
            {expanded ? '접기' : `+${questions.length - 3}개 더 보기`}
          </button>
        )}
      </div>
      <ol className="space-y-1.5">
        {displayed.map((q, i) => (
          <li key={i} className="flex items-start gap-2">
            <span className="inline-flex w-5 h-5 shrink-0 items-center justify-center rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 text-[10px] font-semibold mt-0.5">
              {i + 1}
            </span>
            <div className="flex-1 min-w-0">
              <p className="text-[12px] leading-snug text-slate-800 dark:text-slate-200">
                {q.question}
              </p>
              <div className="mt-0.5 flex items-center gap-2">
                <span
                  className={`inline-flex items-center px-1.5 py-0 rounded text-[9px] font-medium border ${CATEGORY_COLORS[q.category]}`}
                  title={q.reason}
                >
                  {CATEGORY_LABELS[q.category]}
                </span>
                <span className="text-[9.5px] text-slate-400 dark:text-slate-500 truncate">
                  {q.reason}
                </span>
              </div>
            </div>
          </li>
        ))}
      </ol>
    </div>
  );
}
