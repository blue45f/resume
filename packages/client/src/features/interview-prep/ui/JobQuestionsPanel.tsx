import { useEffect, useState, useCallback, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { toast } from '@/components/Toast';
import { getUser } from '@/lib/auth';
import {
  fetchJobInterviewQuestions,
  createJobInterviewQuestion,
  upvoteJobInterviewQuestion,
  aiGenerateJobInterviewQuestions,
  type JobInterviewQuestion,
} from '@/lib/api';

interface JobQuestionsPanelProps {
  jobPostId?: string;
  curatedJobId?: string;
  companyName: string;
  position: string;
  /** Optional context used to improve AI generation quality */
  description?: string;
  requirements?: string;
  skills?: string;
}

const CATEGORY_LABELS: Record<string, string> = {
  technical: '기술',
  behavioral: '행동',
  situational: '상황',
  personality: '인성',
  culture: '컬처',
  general: '일반',
};

const DIFFICULTY_COLORS: Record<string, string> = {
  beginner: 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-400',
  intermediate: 'bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-400',
  advanced: 'bg-rose-50 dark:bg-rose-900/20 text-rose-700 dark:text-rose-400',
};

/**
 * JobQuestionsPanel
 * Lists JobInterviewQuestions tied to a specific JobPost or CuratedJob.
 * - AI 생성 (persist=true), 직접 추가, 업보트, expand/collapse 답변.
 */
export default function JobQuestionsPanel({
  jobPostId,
  curatedJobId,
  companyName,
  position,
  description,
  requirements,
  skills,
}: JobQuestionsPanelProps) {
  const [items, setItems] = useState<JobInterviewQuestion[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());
  const [aiLoading, setAiLoading] = useState(false);
  const [showAdd, setShowAdd] = useState(false);
  const [addForm, setAddForm] = useState({
    question: '',
    sampleAnswer: '',
    category: 'technical',
    difficulty: 'intermediate',
  });
  const [savingAdd, setSavingAdd] = useState(false);
  const user = getUser();

  const load = useCallback(async () => {
    if (!jobPostId && !curatedJobId) return;
    setLoading(true);
    setError(null);
    try {
      const data = await fetchJobInterviewQuestions({ jobPostId, curatedJobId, limit: 50 });
      setItems(data);
    } catch (e) {
      setError(e instanceof Error ? e.message : '질문을 불러오지 못했습니다');
    } finally {
      setLoading(false);
    }
  }, [jobPostId, curatedJobId]);

  useEffect(() => {
    load();
  }, [load]);

  const randomQuestion = useMemo(() => {
    if (items.length === 0) return null;
    return items[Math.floor(Math.random() * items.length)];
  }, [items]);

  const handleUpvote = async (q: JobInterviewQuestion) => {
    if (!user) {
      toast('로그인 후 이용 가능합니다.', 'error');
      return;
    }
    // Optimistic update
    const wasVoted = !!q.myVote;
    setItems((prev) =>
      prev.map((it) =>
        it.id === q.id
          ? { ...it, upvotes: it.upvotes + (wasVoted ? -1 : 1), myVote: !wasVoted }
          : it,
      ),
    );
    try {
      const { upvoted } = await upvoteJobInterviewQuestion(q.id);
      // Correct in case optimistic guess was off
      setItems((prev) =>
        prev.map((it) =>
          it.id === q.id
            ? {
                ...it,
                myVote: upvoted,
                upvotes: wasVoted === upvoted ? q.upvotes : q.upvotes + (upvoted ? 1 : -1),
              }
            : it,
        ),
      );
    } catch {
      // Revert on failure
      setItems((prev) =>
        prev.map((it) => (it.id === q.id ? { ...it, upvotes: q.upvotes, myVote: q.myVote } : it)),
      );
    }
  };

  const handleAiGenerate = async () => {
    if (!user) {
      toast('로그인 후 이용 가능합니다.', 'error');
      return;
    }
    setAiLoading(true);
    try {
      const res = await aiGenerateJobInterviewQuestions({
        jobPostId,
        curatedJobId,
        companyName,
        position,
        description,
        requirements,
        skills,
        count: 5,
        persist: true,
      });
      toast(`AI가 ${res.questions.length}개 질문을 생성했습니다.`, 'success');
      await load();
    } catch (e) {
      toast(e instanceof Error ? e.message : 'AI 생성에 실패했습니다.', 'error');
    } finally {
      setAiLoading(false);
    }
  };

  const handleCreateQuestion = async () => {
    if (!user) {
      toast('로그인 후 이용 가능합니다.', 'error');
      return;
    }
    if (!addForm.question.trim()) {
      toast('질문을 입력해주세요.', 'error');
      return;
    }
    setSavingAdd(true);
    try {
      await createJobInterviewQuestion({
        jobPostId,
        curatedJobId,
        companyName,
        position,
        question: addForm.question.trim(),
        sampleAnswer: addForm.sampleAnswer.trim() || undefined,
        category: addForm.category,
        difficulty: addForm.difficulty,
        source: 'manual',
      });
      toast('질문이 추가되었습니다.', 'success');
      setShowAdd(false);
      setAddForm({
        question: '',
        sampleAnswer: '',
        category: 'technical',
        difficulty: 'intermediate',
      });
      await load();
    } catch (e) {
      toast(e instanceof Error ? e.message : '추가에 실패했습니다.', 'error');
    } finally {
      setSavingAdd(false);
    }
  };

  const toggleExpand = (id: string) => {
    setExpandedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const mockHref = useMemo(() => {
    const params = new URLSearchParams();
    if (jobPostId) params.set('jobPostId', jobPostId);
    if (curatedJobId) params.set('curatedJobId', curatedJobId);
    params.set('company', companyName);
    params.set('position', position);
    if (randomQuestion?.question) params.set('question', randomQuestion.question);
    return `/mock-interview?${params.toString()}`;
  }, [jobPostId, curatedJobId, companyName, position, randomQuestion]);

  return (
    <div className="space-y-4">
      {/* Action bar */}
      <div className="flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={handleAiGenerate}
          disabled={aiLoading}
          className="imp-btn px-3 py-2 text-xs font-medium bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 hover:bg-slate-800 dark:hover:bg-white disabled:opacity-50"
        >
          {aiLoading ? 'AI 생성 중…' : 'AI 질문 생성'}
        </button>
        <button
          type="button"
          onClick={() => setShowAdd((s) => !s)}
          className="imp-btn px-3 py-2 text-xs border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800"
        >
          {showAdd ? '추가 취소' : '직접 추가'}
        </button>
        <Link
          to={mockHref}
          className="imp-btn ml-auto px-3 py-2 text-xs border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800"
        >
          모의 면접 연습하기
        </Link>
      </div>

      {/* Add form */}
      {showAdd && (
        <div className="imp-card p-4 space-y-3">
          <label className="block text-xs font-medium text-slate-600 dark:text-slate-400">
            질문
            <textarea
              value={addForm.question}
              onChange={(e) => setAddForm((f) => ({ ...f, question: e.target.value }))}
              rows={2}
              className="w-full mt-1 px-3 py-2 text-sm border border-slate-200 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-slate-300 dark:focus:ring-slate-600"
              placeholder="예: 최근 해결한 기술적 문제를 설명해주세요."
            />
          </label>
          <label className="block text-xs font-medium text-slate-600 dark:text-slate-400">
            모범 답변 (선택)
            <textarea
              value={addForm.sampleAnswer}
              onChange={(e) => setAddForm((f) => ({ ...f, sampleAnswer: e.target.value }))}
              rows={3}
              className="w-full mt-1 px-3 py-2 text-sm border border-slate-200 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-slate-300 dark:focus:ring-slate-600"
              placeholder="STAR 구조 등 간결한 답변 예시"
            />
          </label>
          <div className="flex flex-wrap gap-3">
            <label className="text-xs font-medium text-slate-600 dark:text-slate-400">
              카테고리
              <select
                value={addForm.category}
                onChange={(e) => setAddForm((f) => ({ ...f, category: e.target.value }))}
                className="block mt-1 px-2 py-1.5 text-xs border border-slate-200 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100"
              >
                {Object.entries(CATEGORY_LABELS).map(([k, v]) => (
                  <option key={k} value={k}>
                    {v}
                  </option>
                ))}
              </select>
            </label>
            <label className="text-xs font-medium text-slate-600 dark:text-slate-400">
              난이도
              <select
                value={addForm.difficulty}
                onChange={(e) => setAddForm((f) => ({ ...f, difficulty: e.target.value }))}
                className="block mt-1 px-2 py-1.5 text-xs border border-slate-200 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100"
              >
                <option value="beginner">쉬움</option>
                <option value="intermediate">보통</option>
                <option value="advanced">어려움</option>
              </select>
            </label>
          </div>
          <div className="flex gap-2 pt-1">
            <button
              type="button"
              onClick={handleCreateQuestion}
              disabled={savingAdd}
              className="imp-btn px-3 py-1.5 text-xs bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 hover:bg-slate-800 dark:hover:bg-white disabled:opacity-50"
            >
              {savingAdd ? '저장 중…' : '저장'}
            </button>
            <button
              type="button"
              onClick={() => setShowAdd(false)}
              className="imp-btn px-3 py-1.5 text-xs border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200"
            >
              취소
            </button>
          </div>
        </div>
      )}

      {/* List */}
      {loading ? (
        <div className="space-y-2" aria-hidden>
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-16 rounded-lg bg-slate-100 dark:bg-slate-800 animate-pulse" />
          ))}
        </div>
      ) : error ? (
        <div className="imp-card p-6 text-center">
          <p className="text-sm text-rose-600 dark:text-rose-400">{error}</p>
          <button
            type="button"
            onClick={load}
            className="mt-3 imp-btn px-3 py-1.5 text-xs border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200"
          >
            다시 시도
          </button>
        </div>
      ) : items.length === 0 ? (
        <div className="imp-card p-6 text-center">
          <p className="text-sm text-slate-500 dark:text-slate-400">
            아직 등록된 예상 질문이 없습니다. "AI 질문 생성"으로 시작해보세요.
          </p>
        </div>
      ) : (
        <ul className="space-y-2">
          {items.map((q) => {
            const expanded = expandedIds.has(q.id);
            const categoryLabel = CATEGORY_LABELS[q.category] || q.category;
            const difficultyClass =
              DIFFICULTY_COLORS[q.difficulty] ||
              'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300';
            return (
              <li key={q.id} className="imp-card p-4">
                <div className="flex items-start gap-3">
                  <button
                    type="button"
                    onClick={() => handleUpvote(q)}
                    aria-label={q.myVote ? '추천 취소' : '추천'}
                    aria-pressed={!!q.myVote}
                    className={`shrink-0 flex flex-col items-center gap-0.5 px-2 py-1.5 rounded-lg border transition-colors ${
                      q.myVote
                        ? 'border-slate-900 dark:border-slate-100 bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900'
                        : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800'
                    }`}
                  >
                    <svg
                      className="w-3.5 h-3.5"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M5 15l7-7 7 7"
                      />
                    </svg>
                    <span className="text-[11px] font-semibold tabular-nums">{q.upvotes}</span>
                  </button>

                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-1.5 mb-1">
                      <span
                        className={`px-1.5 py-0.5 text-[10px] font-medium rounded ${difficultyClass}`}
                      >
                        {categoryLabel}
                      </span>
                      <span className="text-[10px] text-slate-400">
                        {q.author?.name || (q.source === 'ai' ? 'AI 생성' : '익명')}
                      </span>
                    </div>
                    <p className="text-sm font-medium text-slate-900 dark:text-slate-100 whitespace-pre-wrap">
                      {q.question}
                    </p>
                    {q.sampleAnswer && (
                      <>
                        <button
                          type="button"
                          onClick={() => toggleExpand(q.id)}
                          className="mt-2 text-xs text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 inline-flex items-center gap-1"
                          aria-expanded={expanded}
                        >
                          {expanded ? '답변 접기' : '모범 답변 보기'}
                          <svg
                            className={`w-3 h-3 transition-transform ${expanded ? 'rotate-180' : ''}`}
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M19 9l-7 7-7-7"
                            />
                          </svg>
                        </button>
                        {expanded && (
                          <div className="mt-2 p-3 rounded-lg bg-slate-50 dark:bg-slate-800/60 text-sm text-slate-700 dark:text-slate-300 whitespace-pre-wrap leading-relaxed">
                            {q.sampleAnswer}
                          </div>
                        )}
                      </>
                    )}
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
