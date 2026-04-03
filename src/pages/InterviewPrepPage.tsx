import { useState, useEffect, useCallback, useRef } from 'react';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { toast } from '@/components/Toast';
import { fetchResumes } from '@/lib/api';
import type { ResumeSummary } from '@/types/resume';
import { API_URL } from '@/lib/config';


type Difficulty = 'beginner' | 'intermediate' | 'advanced';
type Category = '전체' | '기술' | '행동' | '상황' | '인성';

interface Question {
  question: string;
  answer: string;
  category?: Category;
}

const STORAGE_KEY = 'interview-prep-answers';

function loadSavedAnswers(): Record<string, string> {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch { return {}; }
}

function saveAnswers(answers: Record<string, string>) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(answers));
}

function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
}

export default function InterviewPrepPage() {
  const [resumes, setResumes] = useState<ResumeSummary[]>([]);
  const [selectedResumeId, setSelectedResumeId] = useState('');
  const [jobRole, setJobRole] = useState('');
  const [difficulty, setDifficulty] = useState<Difficulty>('intermediate');
  const [categoryFilter, setCategoryFilter] = useState<Category>('전체');
  const [questions, setQuestions] = useState<Question[]>([]);
  const [loading, setLoading] = useState(false);
  const [revealedIdx, setRevealedIdx] = useState<Set<number>>(new Set());

  // User answers
  const [userAnswers, setUserAnswers] = useState<Record<string, string>>(loadSavedAnswers());
  const [editingIdx, setEditingIdx] = useState<number | null>(null);

  // Timer
  const [timerActive, setTimerActive] = useState(false);
  const [timerSeconds, setTimerSeconds] = useState(0);
  const [timerDuration, setTimerDuration] = useState(120); // default 2 min per question
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    document.title = '면접 준비 — 이력서공방';
    fetchResumes().then(setResumes).catch(() => {});
    return () => { document.title = '이력서공방 - AI 기반 이력서 관리 플랫폼'; };
  }, []);

  // Timer effect
  useEffect(() => {
    if (timerActive) {
      timerRef.current = setInterval(() => {
        setTimerSeconds(prev => {
          if (prev >= timerDuration) {
            setTimerActive(false);
            toast('시간이 종료되었습니다!', 'warning');
            return 0;
          }
          return prev + 1;
        });
      }, 1000);
    } else if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [timerActive, timerDuration]);

  const difficultyLabels: Record<Difficulty, string> = {
    beginner: '초급',
    intermediate: '중급',
    advanced: '고급',
  };

  const difficultyDescriptions: Record<Difficulty, string> = {
    beginner: '기본적인 개념과 자기소개 중심',
    intermediate: '실무 경험과 문제 해결 중심',
    advanced: '심층 기술 및 리더십 역량 중심',
  };

  const categories: Category[] = ['전체', '기술', '행동', '상황', '인성'];

  const classifyCategory = (q: string): Category => {
    if (/기술|코드|구현|아키텍처|설계|프레임워크|언어|알고리즘|데이터|시스템/.test(q)) return '기술';
    if (/경험|했던|상황|프로젝트에서|팀에서|갈등|실패|성공/.test(q)) return '행동';
    if (/만약|가정|어떻게.*할|상황이.*라면|대처/.test(q)) return '상황';
    if (/가치관|동기|목표|장단점|성격|왜.*지원|비전/.test(q)) return '인성';
    return '기술';
  };

  const handleGenerate = useCallback(async () => {
    if (!selectedResumeId) { toast('이력서를 선택해주세요', 'warning'); return; }
    setLoading(true);
    setQuestions([]);
    setRevealedIdx(new Set());
    setEditingIdx(null);
    try {
      const token = localStorage.getItem('token');
      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      if (token) headers['Authorization'] = `Bearer ${token}`;
      const res = await fetch(`${API_URL}/api/resumes/${selectedResumeId}/transform/interview`, {
        method: 'POST', headers,
        body: JSON.stringify({
          jobRole: jobRole || undefined,
          difficulty,
        }),
      });
      if (!res.ok) throw new Error('생성에 실패했습니다');
      const data = await res.json();
      const text = data.text || data.data?.text || '';
      const parsed: Question[] = text.split(/\d+[\.\)]\s/).filter(Boolean).map((q: string) => {
        const parts = q.split(/모범\s*답변|샘플\s*답변|답변\s*예시/i);
        const question = parts[0]?.trim() || q.trim();
        return {
          question,
          answer: parts[1]?.trim() || '',
          category: classifyCategory(question),
        };
      });
      setQuestions(parsed.length > 0 ? parsed : [{ question: text, answer: '', category: '기술' }]);
      toast('면접 질문이 생성되었습니다', 'success');
    } catch (e: any) {
      toast(e.message || '생성에 실패했습니다', 'error');
    } finally {
      setLoading(false);
    }
  }, [selectedResumeId, jobRole, difficulty]);

  const toggleReveal = (idx: number) => {
    setRevealedIdx(prev => {
      const next = new Set(prev);
      if (next.has(idx)) next.delete(idx);
      else next.add(idx);
      return next;
    });
  };

  const handleSaveAnswer = (questionKey: string, answer: string) => {
    const updated = { ...userAnswers, [questionKey]: answer };
    setUserAnswers(updated);
    saveAnswers(updated);
    setEditingIdx(null);
    toast('답변이 저장되었습니다', 'success');
  };

  const getQuestionKey = (q: Question, idx: number) => `${selectedResumeId}-${idx}-${q.question.slice(0, 30)}`;

  const filteredQuestions = categoryFilter === '전체'
    ? questions
    : questions.filter(q => q.category === categoryFilter);

  const answeredCount = questions.filter((q, i) => userAnswers[getQuestionKey(q, i)]).length;

  const startTimer = () => {
    setTimerSeconds(0);
    setTimerActive(true);
  };

  const stopTimer = () => {
    setTimerActive(false);
    setTimerSeconds(0);
  };

  const timerProgress = timerDuration > 0 ? (timerSeconds / timerDuration) * 100 : 0;

  return (
    <>
      <Header />
      <main id="main-content" className="flex-1 max-w-4xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-6 sm:py-8" role="main">
        <div className="mb-6">
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-slate-100">면접 준비</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">AI가 이력서 기반으로 예상 면접 질문과 모범 답변을 생성합니다</p>
        </div>

        {/* Setup */}
        <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-6 mb-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-200 mb-1">이력서 선택 *</label>
              <select value={selectedResumeId} onChange={e => setSelectedResumeId(e.target.value)}
                className="w-full px-3 py-2.5 min-h-[44px] border border-slate-200 dark:border-slate-600 rounded-xl text-sm dark:bg-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-blue-500">
                <option value="">이력서를 선택하세요</option>
                {resumes.map(r => <option key={r.id} value={r.id}>{r.title || '제목 없음'}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-200 mb-1">지원 직무 (선택)</label>
              <input value={jobRole} onChange={e => setJobRole(e.target.value)} placeholder="예: 프론트엔드 개발자"
                className="w-full px-3 py-2.5 min-h-[44px] border border-slate-200 dark:border-slate-600 rounded-xl text-sm dark:bg-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-blue-500" />
            </div>
          </div>

          {/* Difficulty selector */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-200 mb-1.5">난이도</label>
            <div className="grid grid-cols-3 gap-2">
              {(Object.keys(difficultyLabels) as Difficulty[]).map(d => (
                <button
                  key={d}
                  onClick={() => setDifficulty(d)}
                  className={`p-2.5 rounded-xl border text-left transition-all duration-200 ${
                    difficulty === d
                      ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/30 ring-1 ring-blue-500'
                      : 'border-slate-200 dark:border-slate-600 hover:border-slate-300 dark:hover:border-slate-500'
                  }`}
                >
                  <span className="text-sm font-medium text-slate-900 dark:text-slate-100">{difficultyLabels[d]}</span>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{difficultyDescriptions[d]}</p>
                </button>
              ))}
            </div>
          </div>

          {/* Timer option */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-200 mb-1.5">모의 면접 타이머</label>
            <div className="flex items-center gap-3">
              <select
                value={timerDuration}
                onChange={e => setTimerDuration(Number(e.target.value))}
                className="px-3 py-2 border border-slate-200 dark:border-slate-600 rounded-xl text-sm dark:bg-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-blue-500"
              >
                <option value={60}>1분</option>
                <option value={120}>2분</option>
                <option value={180}>3분</option>
                <option value={300}>5분</option>
              </select>
              <span className="text-xs text-slate-500 dark:text-slate-400">질문당 답변 시간</span>
            </div>
          </div>

          <button onClick={handleGenerate} disabled={loading || !selectedResumeId}
            className="w-full py-3 min-h-[48px] bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-medium rounded-xl hover:from-blue-700 hover:to-indigo-700 disabled:opacity-50 transition-all duration-200 shadow-sm">
            {loading ? 'AI 생성 중...' : '면접 질문 생성'}
          </button>
        </div>

        {/* Questions */}
        {questions.length > 0 && (
          <div className="space-y-4">
            {/* Header with tracker, filters, timer */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <h2 className="text-sm font-semibold text-slate-700 dark:text-slate-300">예상 질문 ({questions.length}개)</h2>
                <span className="text-xs px-2 py-1 bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400 rounded-lg font-medium">
                  {answeredCount}/{questions.length} 완료
                </span>
              </div>

              {/* Timer display */}
              <div className="flex items-center gap-2">
                {timerActive ? (
                  <>
                    <div className="flex items-center gap-2 px-3 py-1.5 bg-orange-50 dark:bg-orange-900/20 rounded-xl">
                      <div className="relative w-6 h-6">
                        <svg className="w-6 h-6 -rotate-90" viewBox="0 0 24 24">
                          <circle cx="12" cy="12" r="10" fill="none" stroke="currentColor" strokeWidth="2" className="text-orange-200 dark:text-orange-900" />
                          <circle cx="12" cy="12" r="10" fill="none" stroke="currentColor" strokeWidth="2"
                            className="text-orange-500"
                            strokeDasharray={`${(1 - timerProgress / 100) * 62.83} 62.83`}
                            strokeLinecap="round"
                          />
                        </svg>
                      </div>
                      <span className={`text-sm font-mono font-bold ${timerSeconds > timerDuration * 0.8 ? 'text-red-600 dark:text-red-400' : 'text-orange-600 dark:text-orange-400'}`}>
                        {formatTime(timerDuration - timerSeconds)}
                      </span>
                    </div>
                    <button onClick={stopTimer} className="text-xs px-2 py-1 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors">
                      중지
                    </button>
                  </>
                ) : (
                  <button onClick={startTimer} className="flex items-center gap-1.5 text-xs px-3 py-1.5 bg-orange-50 dark:bg-orange-900/20 text-orange-600 dark:text-orange-400 rounded-xl hover:bg-orange-100 dark:hover:bg-orange-900/40 transition-colors font-medium">
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    타이머 시작
                  </button>
                )}
              </div>
            </div>

            {/* Category filter */}
            <div className="flex flex-wrap gap-1.5">
              {categories.map(cat => (
                <button
                  key={cat}
                  onClick={() => setCategoryFilter(cat)}
                  className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors ${
                    categoryFilter === cat
                      ? 'bg-blue-600 text-white'
                      : 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-600'
                  }`}
                >
                  {cat}
                  {cat !== '전체' && (
                    <span className="ml-1 opacity-70">
                      ({questions.filter(q => q.category === cat).length})
                    </span>
                  )}
                </button>
              ))}
            </div>

            {/* Progress bar */}
            <div className="w-full bg-slate-100 dark:bg-slate-700 rounded-full h-1.5">
              <div
                className="bg-green-500 h-1.5 rounded-full transition-all duration-500"
                style={{ width: `${questions.length > 0 ? (answeredCount / questions.length) * 100 : 0}%` }}
              />
            </div>

            {/* Question cards */}
            {filteredQuestions.map((q, filteredIdx) => {
              const originalIdx = questions.indexOf(q);
              const questionKey = getQuestionKey(q, originalIdx);
              const savedAnswer = userAnswers[questionKey] || '';

              return (
                <div key={originalIdx} className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-4 animate-fade-in-up">
                  <div className="flex items-start gap-3">
                    <span className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold shrink-0 mt-0.5 ${
                      savedAnswer
                        ? 'bg-green-100 dark:bg-green-900/30 text-green-600'
                        : 'bg-blue-100 dark:bg-blue-900/30 text-blue-600'
                    }`}>{originalIdx + 1}</span>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <p className="text-sm font-medium text-slate-900 dark:text-slate-100 leading-relaxed">{q.question}</p>
                        {q.category && (
                          <span className="text-xs px-1.5 py-0.5 bg-slate-100 dark:bg-slate-700 text-slate-500 dark:text-slate-400 rounded shrink-0">
                            {q.category}
                          </span>
                        )}
                      </div>

                      {/* Model answer */}
                      {q.answer && (
                        <div className="mt-2">
                          <button onClick={() => toggleReveal(originalIdx)} className="text-xs text-blue-600 dark:text-blue-400 hover:underline py-1">
                            {revealedIdx.has(originalIdx) ? '모범 답변 숨기기' : '모범 답변 보기'}
                          </button>
                          {revealedIdx.has(originalIdx) && (
                            <div className="mt-2 p-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg animate-fade-in">
                              <p className="text-sm text-green-800 dark:text-green-300 whitespace-pre-wrap leading-relaxed">{q.answer}</p>
                            </div>
                          )}
                        </div>
                      )}

                      {/* User answer section */}
                      <div className="mt-3">
                        {editingIdx === originalIdx ? (
                          <div className="space-y-2">
                            <textarea
                              defaultValue={savedAnswer}
                              id={`answer-${originalIdx}`}
                              rows={4}
                              placeholder="나의 답변을 작성하세요..."
                              className="w-full px-3 py-2 border border-slate-200 dark:border-slate-600 rounded-lg text-sm dark:bg-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-blue-500 focus:outline-none resize-none"
                            />
                            <div className="flex gap-2">
                              <button
                                onClick={() => {
                                  const el = document.getElementById(`answer-${originalIdx}`) as HTMLTextAreaElement;
                                  if (el && el.value.trim()) handleSaveAnswer(questionKey, el.value.trim());
                                  else toast('답변을 입력해주세요', 'warning');
                                }}
                                className="text-xs px-3 py-1.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
                              >
                                답변 저장
                              </button>
                              <button
                                onClick={() => setEditingIdx(null)}
                                className="text-xs px-3 py-1.5 bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors"
                              >
                                취소
                              </button>
                            </div>
                          </div>
                        ) : savedAnswer ? (
                          <div className="p-3 bg-blue-50 dark:bg-blue-900/10 border border-blue-200 dark:border-blue-800/50 rounded-lg">
                            <div className="flex items-center justify-between mb-1">
                              <span className="text-xs font-medium text-blue-600 dark:text-blue-400">내 답변</span>
                              <button
                                onClick={() => setEditingIdx(originalIdx)}
                                className="text-xs text-blue-600 dark:text-blue-400 hover:underline"
                              >
                                수정
                              </button>
                            </div>
                            <p className="text-sm text-slate-700 dark:text-slate-300 whitespace-pre-wrap leading-relaxed">{savedAnswer}</p>
                          </div>
                        ) : (
                          <button
                            onClick={() => setEditingIdx(originalIdx)}
                            className="text-xs text-slate-500 dark:text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 hover:underline py-1 transition-colors"
                          >
                            + 내 답변 작성
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>
      <Footer />
    </>
  );
}
