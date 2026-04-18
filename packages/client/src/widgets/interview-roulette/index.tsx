import { useEffect, useMemo, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { fetchJobInterviewQuestions, type JobInterviewQuestion } from '@/lib/api';

/**
 * InterviewRoulette — 면접 질문 룰렛.
 * 공유 뱅크에서 질문을 받아 "spin" 애니메이션으로 랜덤 1개를 뽑음.
 * - 200ms 이상 spin + ease-out
 * - "다시 굴리기" 버튼으로 재추첨
 * - "답변 연습하기" CTA로 /mock-interview?question=... 전달
 * - prefers-reduced-motion 대응
 */

interface Props {
  /** 컴팩트 모드 (다른 위젯과 2열로 정렬될 때) */
  compact?: boolean;
}

const DIFFICULTY_COLORS: Record<string, string> = {
  쉬움: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800',
  보통: 'bg-sky-50 text-sky-700 dark:bg-sky-900/30 dark:text-sky-300 border-sky-200 dark:border-sky-800',
  어려움:
    'bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300 border-blue-200 dark:border-blue-800',
};

function pickRandom<T>(arr: T[], exclude?: T): T | null {
  if (!arr.length) return null;
  if (arr.length === 1) return arr[0];
  let pick = arr[Math.floor(Math.random() * arr.length)];
  let guard = 0;
  while (exclude && pick === exclude && guard < 8) {
    pick = arr[Math.floor(Math.random() * arr.length)];
    guard++;
  }
  return pick;
}

export default function InterviewRoulette({ compact = false }: Props) {
  const { data, isLoading } = useQuery({
    queryKey: ['roulette-job-interview-questions', { limit: 40 }],
    queryFn: () => fetchJobInterviewQuestions({ limit: 40 }),
    staleTime: 5 * 60_000,
  });

  const questions = useMemo<JobInterviewQuestion[]>(
    () => (Array.isArray(data) ? data : []),
    [data],
  );

  const [current, setCurrent] = useState<JobInterviewQuestion | null>(null);
  const [spinning, setSpinning] = useState(false);
  const [tickText, setTickText] = useState('');
  const intervalRef = useRef<number | null>(null);

  // Initialize on data load
  useEffect(() => {
    if (!current && questions.length > 0) {
      setCurrent(pickRandom(questions));
    }
  }, [questions, current]);

  useEffect(() => {
    return () => {
      if (intervalRef.current !== null) window.clearInterval(intervalRef.current);
    };
  }, []);

  const roll = () => {
    if (!questions.length || spinning) return;

    const prefersReduce =
      typeof window !== 'undefined' &&
      window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;

    if (prefersReduce) {
      setCurrent(pickRandom(questions, current ?? undefined));
      return;
    }

    setSpinning(true);
    const SPIN_MS = 900; // well over 200ms, feels punchy
    const start = performance.now();
    // Rapid flicker of question previews during spin
    intervalRef.current = window.setInterval(() => {
      const sneak = pickRandom(questions);
      if (sneak) setTickText(sneak.question);
    }, 70);

    const final = pickRandom(questions, current ?? undefined);

    window.setTimeout(
      () => {
        if (intervalRef.current !== null) {
          window.clearInterval(intervalRef.current);
          intervalRef.current = null;
        }
        setCurrent(final);
        setTickText('');
        setSpinning(false);
      },
      SPIN_MS + Math.max(0, 0 - (performance.now() - start)),
    );
  };

  if (isLoading) {
    return (
      <div className={`imp-card p-5 ${compact ? '' : 'mb-6'}`}>
        <div className="h-4 w-40 bg-slate-100 dark:bg-slate-800 rounded animate-pulse mb-3" />
        <div className="h-24 rounded-xl bg-slate-100 dark:bg-slate-800 animate-pulse" />
      </div>
    );
  }

  if (!questions.length) return null;

  const question = current;
  const difficulty = question?.difficulty ?? '보통';
  const difficultyClass = DIFFICULTY_COLORS[difficulty] ?? DIFFICULTY_COLORS['보통'];

  // MockInterview 연결 (query param 키: question / position / company)
  const practiceHref = question
    ? `/mock-interview?question=${encodeURIComponent(question.question)}${
        question.position ? `&position=${encodeURIComponent(question.position)}` : ''
      }${question.companyName ? `&company=${encodeURIComponent(question.companyName)}` : ''}`
    : '/mock-interview';

  return (
    <div
      className={`imp-card p-5 overflow-hidden relative ${compact ? '' : 'mb-6'}`}
      aria-live="polite"
    >
      {/* Ambient cyan glow */}
      <div
        aria-hidden
        className="absolute -top-24 -left-10 w-56 h-56 rounded-full opacity-[0.08] blur-3xl pointer-events-none bg-[radial-gradient(circle,#06b6d4,transparent_70%)]"
      />

      <div className="flex items-center justify-between mb-3 relative">
        <h3 className="text-sm font-semibold text-slate-800 dark:text-slate-200 flex items-center gap-2">
          <span
            className={`w-5 h-5 bg-sky-100 dark:bg-sky-900/30 text-sky-600 dark:text-sky-400 rounded-md flex items-center justify-center text-[13px] ${
              spinning ? 'animate-spin-slow' : ''
            }`}
            aria-hidden
          >
            ⟳
          </span>
          면접 질문 룰렛
        </h3>
        <Link
          to="/interview-prep"
          className="text-xs text-sky-600 dark:text-sky-400 hover:underline"
        >
          전체 →
        </Link>
      </div>

      {/* Slot — question reveal */}
      <div
        className="relative rounded-2xl border border-slate-200 dark:border-slate-700 bg-gradient-to-br from-white via-sky-50/40 to-white dark:from-slate-800 dark:via-sky-900/10 dark:to-slate-800 p-4 min-h-[104px] overflow-hidden"
        role="status"
      >
        {/* Motion reduce friendly transitions */}
        <div
          className="transition-all duration-300 motion-reduce:transition-none"
          style={{
            opacity: spinning ? 0.35 : 1,
            transform: spinning ? 'translateY(4px) scale(0.98)' : 'none',
            filter: spinning ? 'blur(1.5px)' : 'none',
          }}
        >
          <div className="flex items-center gap-2 mb-2 flex-wrap">
            <span
              className={`text-[10px] font-medium px-2 py-0.5 rounded-full border ${difficultyClass}`}
            >
              {difficulty}
            </span>
            {question?.category && (
              <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300">
                {question.category}
              </span>
            )}
            {question?.companyName && (
              <span className="text-[10px] text-slate-400 dark:text-slate-500 truncate max-w-[180px]">
                {question.companyName}
                {question.position ? ` · ${question.position}` : ''}
              </span>
            )}
          </div>
          <p className="text-sm sm:text-[15px] font-medium text-slate-800 dark:text-slate-100 leading-relaxed">
            {spinning ? tickText || question?.question : question?.question || '준비 중…'}
          </p>
        </div>

        {/* Reveal accent bar animation */}
        <span
          aria-hidden
          className="absolute left-0 top-0 h-full w-[3px] bg-gradient-to-b from-sky-400 via-blue-500 to-blue-700"
          style={{
            opacity: spinning ? 0.25 : 0.9,
            transition: 'opacity 400ms ease',
          }}
        />
      </div>

      {/* Actions */}
      <div className="mt-3 flex flex-wrap gap-2">
        <button
          type="button"
          onClick={roll}
          disabled={spinning}
          className="imp-btn group inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-lg disabled:opacity-60 focus-ring-accent transition-all"
          aria-label="다시 굴리기"
        >
          <span
            className={`inline-block transition-transform duration-500 ${spinning ? 'animate-spin-fast' : 'group-hover:rotate-180'}`}
            aria-hidden
          >
            ⟳
          </span>
          {spinning ? '굴리는 중…' : '다시 굴리기'}
        </button>

        <Link
          to={practiceHref}
          className="imp-btn inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus-ring-accent transition-colors"
        >
          답변 연습하기
          <span aria-hidden>→</span>
        </Link>

        {question && (
          <Link
            to={`/interview-prep?position=${encodeURIComponent(question.position || '')}`}
            className="imp-btn inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-medium bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors"
          >
            모범 답변 보기
          </Link>
        )}
      </div>
    </div>
  );
}
