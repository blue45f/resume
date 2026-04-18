import { useCallback, useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { toast } from '@/components/Toast';
import CameraInterview from '@/features/interview-prep/ui/CameraInterview';
import { useJobInterviewQuestions } from '@/hooks/useResources';

/**
 * MockInterviewPage
 * 카메라 기반 모의 면접 페이지.
 * - 랜덤 질문 제공(하드코딩 풀 + 새로고침)
 * - searchParams로 jobPostId/curatedJobId 전달 시 해당 공고의 질문 우선 사용
 * - 타이머 프리셋(30s/1min/2min/3min) 선택
 * - 녹화 후 메모 작성 → localStorage 저장
 */

interface SavedAnswer {
  id: string;
  question: string;
  note: string;
  durationSec: number;
  createdAt: number;
  fileSizeBytes: number;
  /** 다운로드 파일명 가이드 (Blob은 저장하지 않음) */
  filename: string;
}

const STORAGE_KEY = 'mock-interview-answers';

const QUESTION_POOL: string[] = [
  '본인에 대해 1분 내로 소개해주세요.',
  '최근 1년간 가장 도전적이었던 프로젝트와 해결 과정을 말씀해주세요.',
  '팀에서 의견 충돌이 있었을 때 어떻게 해결했나요?',
  '실패한 경험과 거기서 배운 점을 들려주세요.',
  '본인의 가장 큰 강점과 약점은 무엇인가요?',
  '왜 이 직무/회사에 지원하셨나요?',
  '우선순위가 다른 여러 업무가 몰렸을 때 어떻게 처리하나요?',
  '5년 뒤 본인의 커리어 목표는 무엇인가요?',
  '가장 자랑스러운 성과와 그 성과를 낸 방법을 말해주세요.',
  '피드백을 받고 개선한 경험을 구체적으로 들려주세요.',
];

const TIMER_PRESETS: { label: string; sec: number }[] = [
  { label: '30초', sec: 30 },
  { label: '1분', sec: 60 },
  { label: '2분', sec: 120 },
  { label: '3분', sec: 180 },
];

function loadSaved(): SavedAnswer[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as SavedAnswer[]) : [];
  } catch {
    return [];
  }
}

function persistSaved(list: SavedAnswer[]) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
  } catch {
    // localStorage full or unavailable
  }
}

function formatDate(ts: number): string {
  const d = new Date(ts);
  const pad = (n: number) => n.toString().padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function formatDuration(sec: number): string {
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  if (m === 0) return `${s}초`;
  return `${m}분 ${s}초`;
}

function pickFromPool(pool: string[], exclude?: string): string {
  if (pool.length === 0) return '';
  if (pool.length === 1) return pool[0];
  let q = pool[Math.floor(Math.random() * pool.length)];
  let attempts = 0;
  while (q === exclude && attempts < 8) {
    q = pool[Math.floor(Math.random() * pool.length)];
    attempts += 1;
  }
  return q;
}

function pickRandomQuestion(exclude?: string): string {
  return pickFromPool(QUESTION_POOL, exclude);
}

export default function MockInterviewPage() {
  const [searchParams] = useSearchParams();
  const jobPostId = searchParams.get('jobPostId') || undefined;
  const curatedJobId = searchParams.get('curatedJobId') || undefined;
  const presetQuestion = searchParams.get('question') || '';
  const company = searchParams.get('company') || '';
  const position = searchParams.get('position') || '';

  const [jobQuestions, setJobQuestions] = useState<string[] | null>(null);
  const [question, setQuestion] = useState<string>(() => presetQuestion || pickRandomQuestion());
  const [maxSec, setMaxSec] = useState<number | undefined>(60);
  const [pendingBlob, setPendingBlob] = useState<Blob | null>(null);
  const [pendingDuration, setPendingDuration] = useState<number>(0);
  const [note, setNote] = useState<string>('');
  const [saved, setSaved] = useState<SavedAnswer[]>(() => loadSaved());
  const [sessionKey, setSessionKey] = useState<number>(0);

  useEffect(() => {
    document.title =
      company && position
        ? `${company} ${position} 모의 면접 - Resume`
        : '카메라 모의 면접 - Resume';
  }, [company, position]);

  // Load questions tied to a specific job post / curated job
  const jobQuestionsQuery = useJobInterviewQuestions(
    jobPostId || curatedJobId ? { jobPostId, curatedJobId, limit: 50 } : {},
  );
  useEffect(() => {
    if (!jobPostId && !curatedJobId) return;
    if (jobQuestionsQuery.data) {
      const pool = jobQuestionsQuery.data.map((q) => q.question).filter(Boolean);
      setJobQuestions(pool);
      if (!presetQuestion && pool.length > 0) {
        setQuestion(pickFromPool(pool));
      }
    } else if (jobQuestionsQuery.isError) {
      setJobQuestions([]);
    }
  }, [jobPostId, curatedJobId, presetQuestion, jobQuestionsQuery.data, jobQuestionsQuery.isError]);

  const handleRecordingComplete = useCallback((blob: Blob, duration: number) => {
    setPendingBlob(blob);
    setPendingDuration(duration);
    setNote('');
  }, []);

  const handleSaveNote = useCallback(() => {
    if (!pendingBlob) return;
    const ext = pendingBlob.type.includes('mp4') ? 'mp4' : 'webm';
    const entry: SavedAnswer = {
      id: `mi-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      question,
      note: note.trim(),
      durationSec: pendingDuration,
      createdAt: Date.now(),
      fileSizeBytes: pendingBlob.size,
      filename: `mock-interview-${Date.now()}.${ext}`,
    };
    const next = [entry, ...saved].slice(0, 50); // 최대 50건 보관
    setSaved(next);
    persistSaved(next);
    setPendingBlob(null);
    setPendingDuration(0);
    setNote('');
    toast('메모가 저장되었습니다.', 'success');
  }, [pendingBlob, pendingDuration, question, note, saved]);

  const handleDiscardPending = useCallback(() => {
    setPendingBlob(null);
    setPendingDuration(0);
    setNote('');
  }, []);

  const handleNewQuestion = useCallback(() => {
    setQuestion((prev) => {
      const pool = jobQuestions && jobQuestions.length > 0 ? jobQuestions : QUESTION_POOL;
      return pickFromPool(pool, prev);
    });
    setPendingBlob(null);
    setPendingDuration(0);
    setNote('');
    setSessionKey((k) => k + 1);
  }, [jobQuestions]);

  const handleDeleteSaved = useCallback(
    (id: string) => {
      const next = saved.filter((s) => s.id !== id);
      setSaved(next);
      persistSaved(next);
    },
    [saved],
  );

  const totalBytes = useMemo(
    () => saved.reduce((sum, s) => sum + (s.fileSizeBytes || 0), 0),
    [saved],
  );

  return (
    <>
      <Header />

      <main id="main-content" className="flex-1 max-w-4xl w-full mx-auto px-4 sm:px-6 py-6 sm:py-8">
        {/* Title */}
        <div className="mb-6">
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-slate-100">
            카메라 모의 면접
          </h1>
          {company && position ? (
            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
              <span className="font-medium text-slate-700 dark:text-slate-300">{company}</span>
              <span className="mx-1.5 text-slate-300">·</span>
              <span>{position}</span>
              {jobQuestions !== null && (
                <span className="ml-2 text-xs text-slate-400">
                  (해당 공고의 예상 질문 {jobQuestions.length}개)
                </span>
              )}
            </p>
          ) : (
            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
              질문을 읽고 카메라로 답변을 녹화하세요. 영상은 브라우저에 잠시 보관되며 메모만 로컬에
              저장됩니다.
            </p>
          )}
        </div>

        {/* Controls */}
        <div className="imp-card p-4 sm:p-5 mb-5">
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-2">
              <label className="text-xs font-medium text-slate-500 dark:text-slate-400">
                답변 시간
              </label>
              <div className="flex gap-1" role="radiogroup" aria-label="답변 시간 프리셋">
                {TIMER_PRESETS.map((p) => {
                  const active = maxSec === p.sec;
                  return (
                    <button
                      key={p.sec}
                      type="button"
                      role="radio"
                      aria-checked={active}
                      onClick={() => setMaxSec(p.sec)}
                      className={`imp-btn px-2.5 py-1.5 text-xs ${
                        active
                          ? 'bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900'
                          : 'border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800'
                      }`}
                    >
                      {p.label}
                    </button>
                  );
                })}
                <button
                  type="button"
                  role="radio"
                  aria-checked={maxSec === undefined}
                  onClick={() => setMaxSec(undefined)}
                  className={`imp-btn px-2.5 py-1.5 text-xs ${
                    maxSec === undefined
                      ? 'bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900'
                      : 'border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800'
                  }`}
                >
                  제한 없음
                </button>
              </div>
            </div>

            <button
              type="button"
              onClick={handleNewQuestion}
              className="imp-btn ml-auto px-3 py-1.5 text-xs border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800"
            >
              다른 질문 받기
            </button>
          </div>
        </div>

        {/* Camera component */}
        <CameraInterview
          key={sessionKey}
          question={question}
          maxDurationSec={maxSec}
          onRecordingComplete={handleRecordingComplete}
        />

        {/* Post-recording note editor */}
        {pendingBlob && (
          <section className="imp-card p-5 mt-5" aria-label="녹화 후 메모">
            <h2 className="text-base font-semibold text-slate-900 dark:text-slate-100 mb-1">
              답변을 되돌아보며 메모하기
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mb-3">
              녹화 시간 {formatDuration(pendingDuration)} · 용량{' '}
              {(pendingBlob.size / 1024 / 1024).toFixed(2)} MB
            </p>
            <label htmlFor="mock-note" className="sr-only">
              메모
            </label>
            <textarea
              id="mock-note"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              rows={4}
              placeholder="잘한 점, 개선할 점, 사용한 STAR 구조 등을 자유롭게 적어보세요."
              className="w-full px-3 py-2 text-sm border border-slate-200 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-slate-300 dark:focus:ring-slate-600"
            />
            <div className="mt-3 flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={handleSaveNote}
                className="imp-btn px-4 py-2 text-sm bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 hover:bg-slate-800 dark:hover:bg-white"
              >
                메모 저장
              </button>
              <button
                type="button"
                onClick={handleDiscardPending}
                className="imp-btn px-4 py-2 text-sm border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800"
              >
                저장 안 함
              </button>
              <p className="ml-auto text-[11px] text-slate-400 dark:text-slate-500">
                영상 파일은 &quot;다운로드&quot; 버튼으로 저장해주세요 (브라우저에는 보관되지
                않습니다).
              </p>
            </div>
          </section>
        )}

        {/* Saved history */}
        <section className="mt-8" aria-label="저장된 모의 면접 기록">
          <div className="flex items-end justify-between mb-3">
            <h2 className="text-base font-semibold text-slate-900 dark:text-slate-100">
              저장된 기록 <span className="text-slate-400 font-normal">({saved.length})</span>
            </h2>
            {saved.length > 0 && (
              <p className="text-xs text-slate-400 dark:text-slate-500">
                누적 녹화 용량 {(totalBytes / 1024 / 1024).toFixed(1)} MB
              </p>
            )}
          </div>

          {saved.length === 0 ? (
            <div className="imp-card p-6 text-center">
              <p className="text-sm text-slate-500 dark:text-slate-400">
                아직 저장된 기록이 없습니다. 첫 번째 답변을 녹화해보세요.
              </p>
            </div>
          ) : (
            <ul className="space-y-3">
              {saved.map((s) => (
                <li key={s.id} className="imp-card p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="text-[11px] text-slate-400 dark:text-slate-500">
                        {formatDate(s.createdAt)} · {formatDuration(s.durationSec)} ·{' '}
                        {(s.fileSizeBytes / 1024 / 1024).toFixed(2)} MB
                      </p>
                      <p className="mt-1 text-sm font-medium text-slate-900 dark:text-slate-100">
                        {s.question}
                      </p>
                      {s.note && (
                        <p className="mt-2 text-sm text-slate-600 dark:text-slate-400 whitespace-pre-wrap">
                          {s.note}
                        </p>
                      )}
                    </div>
                    <button
                      type="button"
                      onClick={() => handleDeleteSaved(s.id)}
                      className="shrink-0 text-xs text-slate-400 hover:text-rose-600"
                      aria-label="기록 삭제"
                    >
                      삭제
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>
      </main>

      <Footer />
    </>
  );
}
