import { useState, useEffect } from 'react';

interface InterviewReviewData {
  difficulty: number;
  questions: string;
  result: 'pass' | 'fail' | 'pending';
  tips: string;
  createdAt: string;
  updatedAt: string;
}

interface Props {
  applicationId: string;
}

const RESULT_OPTIONS = [
  {
    value: 'pass',
    label: '합격',
    color: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
    icon: 'O',
  },
  {
    value: 'fail',
    label: '불합격',
    color: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
    icon: 'X',
  },
  {
    value: 'pending',
    label: '대기',
    color: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
    icon: '...',
  },
] as const;

function getStorageKey(appId: string) {
  return `interview_review_${appId}`;
}

function loadReview(appId: string): InterviewReviewData | null {
  try {
    const raw = localStorage.getItem(getStorageKey(appId));
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function saveReview(appId: string, data: InterviewReviewData) {
  localStorage.setItem(getStorageKey(appId), JSON.stringify(data));
}

export default function InterviewReview({ applicationId }: Props) {
  const [expanded, setExpanded] = useState(false);
  const [editing, setEditing] = useState(false);
  const [review, setReview] = useState<InterviewReviewData | null>(null);
  const [form, setForm] = useState({
    difficulty: 3,
    questions: '',
    result: 'pending' as 'pass' | 'fail' | 'pending',
    tips: '',
  });

  useEffect(() => {
    const saved = loadReview(applicationId);
    if (saved) {
      setReview(saved);
      setForm({
        difficulty: saved.difficulty,
        questions: saved.questions,
        result: saved.result,
        tips: saved.tips,
      });
    }
  }, [applicationId]);

  const handleSave = () => {
    const now = new Date().toISOString();
    const data: InterviewReviewData = {
      ...form,
      createdAt: review?.createdAt || now,
      updatedAt: now,
    };
    saveReview(applicationId, data);
    setReview(data);
    setEditing(false);
  };

  const handleDelete = () => {
    if (!confirm('면접 후기를 삭제하시겠습니까?')) return;
    localStorage.removeItem(getStorageKey(applicationId));
    setReview(null);
    setEditing(false);
    setForm({ difficulty: 3, questions: '', result: 'pending', tips: '' });
  };

  const resultInfo = RESULT_OPTIONS.find((r) => r.value === (review?.result || form.result));

  return (
    <div className="mt-3 border-t border-slate-100 dark:border-slate-700 pt-3">
      <button
        onClick={() => setExpanded(!expanded)}
        className="flex items-center gap-2 text-xs font-medium text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300 transition-colors"
      >
        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
          />
        </svg>
        면접 후기
        {review && (
          <span className={`ml-1 px-1.5 py-1 text-xs rounded ${resultInfo?.color}`}>
            {resultInfo?.label}
          </span>
        )}
        <svg
          className={`w-3 h-3 transition-transform ${expanded ? 'rotate-180' : ''}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {expanded && (
        <div className="mt-2 animate-fade-in">
          {!review && !editing ? (
            <button
              onClick={() => setEditing(true)}
              className="w-full py-3 border-2 border-dashed border-slate-200 dark:border-slate-600 rounded-lg text-sm text-slate-400 dark:text-slate-500 hover:border-blue-300 dark:hover:border-blue-600 hover:text-blue-500 transition-colors"
            >
              + 면접 후기 작성
            </button>
          ) : editing ? (
            <div className="bg-slate-50 dark:bg-slate-900/50 rounded-lg p-3 space-y-3">
              {/* Difficulty */}
              <div>
                <label className="text-xs font-medium text-slate-600 dark:text-slate-400 mb-1 block">
                  면접 난이도
                </label>
                <div className="flex gap-1">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      onClick={() => setForm((f) => ({ ...f, difficulty: star }))}
                      className={`w-8 h-8 rounded-lg text-sm font-bold transition-colors ${
                        star <= form.difficulty
                          ? 'bg-amber-400 text-white'
                          : 'bg-slate-200 dark:bg-slate-700 text-slate-400'
                      }`}
                    >
                      {star}
                    </button>
                  ))}
                  <span className="ml-2 text-xs text-slate-400 self-center">
                    {form.difficulty <= 1
                      ? '매우 쉬움'
                      : form.difficulty <= 2
                        ? '쉬움'
                        : form.difficulty <= 3
                          ? '보통'
                          : form.difficulty <= 4
                            ? '어려움'
                            : '매우 어려움'}
                  </span>
                </div>
              </div>

              {/* Questions */}
              <div>
                <label className="text-xs font-medium text-slate-600 dark:text-slate-400 mb-1 block">
                  면접 질문
                </label>
                <textarea
                  value={form.questions}
                  onChange={(e) => setForm((f) => ({ ...f, questions: e.target.value }))}
                  placeholder="어떤 질문을 받았나요? (줄바꿈으로 구분)"
                  rows={3}
                  className="w-full px-3 py-2 text-sm border border-slate-200 dark:border-slate-600 rounded-lg dark:bg-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                />
              </div>

              {/* Result */}
              <div>
                <label className="text-xs font-medium text-slate-600 dark:text-slate-400 mb-1 block">
                  결과
                </label>
                <div className="flex gap-2">
                  {RESULT_OPTIONS.map((opt) => (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() => setForm((f) => ({ ...f, result: opt.value }))}
                      className={`flex-1 py-1.5 text-xs font-medium rounded-lg transition-colors border-2 ${
                        form.result === opt.value
                          ? `${opt.color} border-current`
                          : 'bg-slate-100 dark:bg-slate-700 text-slate-400 border-transparent'
                      }`}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Tips */}
              <div>
                <label className="text-xs font-medium text-slate-600 dark:text-slate-400 mb-1 block">
                  면접 팁
                </label>
                <textarea
                  value={form.tips}
                  onChange={(e) => setForm((f) => ({ ...f, tips: e.target.value }))}
                  placeholder="다른 지원자에게 도움이 될 팁을 공유해주세요"
                  rows={2}
                  className="w-full px-3 py-2 text-sm border border-slate-200 dark:border-slate-600 rounded-lg dark:bg-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                />
              </div>

              {/* Actions */}
              <div className="flex gap-2 justify-end">
                <button
                  type="button"
                  onClick={() => {
                    setEditing(false);
                    if (!review)
                      setForm({ difficulty: 3, questions: '', result: 'pending', tips: '' });
                  }}
                  className="px-3 py-1.5 text-xs text-slate-500 hover:text-slate-700 transition-colors"
                >
                  취소
                </button>
                <button
                  type="button"
                  onClick={handleSave}
                  className="px-4 py-1.5 text-xs font-medium bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  저장
                </button>
              </div>
            </div>
          ) : review ? (
            <div className="bg-slate-50 dark:bg-slate-900/50 rounded-lg p-3 space-y-2.5">
              {/* Difficulty display */}
              <div className="flex items-center gap-2">
                <span className="text-xs text-slate-500 dark:text-slate-400 w-16">난이도</span>
                <div className="flex gap-0.5">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <div
                      key={star}
                      className={`w-5 h-5 rounded text-xs flex items-center justify-center font-bold ${
                        star <= review.difficulty
                          ? 'bg-amber-400 text-white'
                          : 'bg-slate-200 dark:bg-slate-700 text-slate-300'
                      }`}
                    >
                      {star}
                    </div>
                  ))}
                </div>
                <span className="text-xs text-slate-400">
                  (
                  {review.difficulty <= 1
                    ? '매우 쉬움'
                    : review.difficulty <= 2
                      ? '쉬움'
                      : review.difficulty <= 3
                        ? '보통'
                        : review.difficulty <= 4
                          ? '어려움'
                          : '매우 어려움'}
                  )
                </span>
              </div>

              {/* Result */}
              <div className="flex items-center gap-2">
                <span className="text-xs text-slate-500 dark:text-slate-400 w-16">결과</span>
                <span className={`px-2 py-1 text-xs font-medium rounded ${resultInfo?.color}`}>
                  {resultInfo?.label}
                </span>
              </div>

              {/* Questions */}
              {review.questions && (
                <div>
                  <span className="text-xs text-slate-500 dark:text-slate-400 block mb-1">
                    면접 질문
                  </span>
                  <div className="text-sm text-slate-700 dark:text-slate-300 whitespace-pre-wrap bg-white dark:bg-slate-800 rounded-lg p-2.5 border border-slate-100 dark:border-slate-700">
                    {review.questions}
                  </div>
                </div>
              )}

              {/* Tips */}
              {review.tips && (
                <div>
                  <span className="text-xs text-slate-500 dark:text-slate-400 block mb-1">
                    면접 팁
                  </span>
                  <div className="text-sm text-slate-700 dark:text-slate-300 whitespace-pre-wrap bg-white dark:bg-slate-800 rounded-lg p-2.5 border border-slate-100 dark:border-slate-700">
                    {review.tips}
                  </div>
                </div>
              )}

              {/* Meta & Actions */}
              <div className="flex items-center justify-between pt-1">
                <span className="text-xs text-slate-400">
                  {new Date(review.updatedAt).toLocaleDateString('ko-KR')} 작성
                </span>
                <div className="flex gap-2">
                  <button
                    onClick={() => setEditing(true)}
                    className="text-xs text-blue-500 hover:text-blue-700 transition-colors"
                  >
                    수정
                  </button>
                  <button
                    onClick={handleDelete}
                    className="text-xs text-red-400 hover:text-red-600 transition-colors"
                  >
                    삭제
                  </button>
                </div>
              </div>
            </div>
          ) : null}
        </div>
      )}
    </div>
  );
}
