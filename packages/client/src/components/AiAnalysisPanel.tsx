import { useState } from 'react';
import * as RadixDialog from '@radix-ui/react-dialog';
import { API_URL } from '@/lib/config';

interface Props {
  resumeId: string;
  onClose: () => void;
}

type Tab = 'feedback' | 'jobmatch' | 'interview';

function getHeaders() {
  const token = localStorage.getItem('token');
  const h: Record<string, string> = { 'Content-Type': 'application/json' };
  if (token) h['Authorization'] = `Bearer ${token}`;
  return h;
}

export default function AiAnalysisPanel({ resumeId, onClose }: Props) {
  const [tab, setTab] = useState<Tab>('feedback');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Feedback state
  const [feedback, setFeedback] = useState<any>(null);

  // Job match state
  const [jd, setJd] = useState('');
  const [jobMatch, setJobMatch] = useState<any>(null);

  // Interview state
  const [jobRole, setJobRole] = useState('');
  const [interview, setInterview] = useState<any>(null);

  const runFeedback = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await fetch(`${API_URL}/api/resumes/${resumeId}/transform/feedback`, {
        method: 'POST',
        headers: getHeaders(),
        body: '{}',
      });
      if (!res.ok) throw new Error((await res.json().catch(() => ({}))).message || '분석 실패');
      const data = await res.json();
      setFeedback(data.feedback);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  const runJobMatch = async () => {
    if (!jd.trim()) return;
    setLoading(true);
    setError('');
    try {
      const res = await fetch(`${API_URL}/api/resumes/${resumeId}/transform/job-match`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify({ jobDescription: jd }),
      });
      if (!res.ok) throw new Error((await res.json().catch(() => ({}))).message || '분석 실패');
      const data = await res.json();
      setJobMatch(data.analysis);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  const runInterview = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await fetch(`${API_URL}/api/resumes/${resumeId}/transform/interview`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify({ jobRole: jobRole || undefined }),
      });
      if (!res.ok) throw new Error((await res.json().catch(() => ({}))).message || '생성 실패');
      const data = await res.json();
      setInterview(data.interview);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  const tabs = [
    { id: 'feedback' as Tab, label: '📊 이력서 피드백', desc: 'AI가 점수와 개선점을 분석' },
    { id: 'jobmatch' as Tab, label: '🎯 JD 매칭', desc: '채용공고와 매칭도 분석' },
    { id: 'interview' as Tab, label: '🎤 면접 질문', desc: '예상 면접 질문 생성' },
  ];

  return (
    <RadixDialog.Root
      open
      onOpenChange={(o) => {
        if (!o) onClose();
      }}
    >
      <RadixDialog.Portal>
        <RadixDialog.Overlay className="fixed inset-0 z-[90] bg-black/30 animate-fade-in" />
        <RadixDialog.Content
          aria-label="AI 분석"
          aria-describedby={undefined}
          className="fixed z-[91] top-0 right-0 w-full max-w-lg h-full bg-white dark:bg-neutral-800 shadow-2xl overflow-y-auto focus:outline-none animate-slide-in-right"
        >
          {/* Header */}
          <div className="sticky top-0 bg-white dark:bg-neutral-800 border-b border-neutral-200 dark:border-neutral-700 px-4 py-3 flex items-center justify-between z-10">
            <RadixDialog.Title className="font-bold text-neutral-900 dark:text-neutral-100">
              AI 분석
            </RadixDialog.Title>
            <RadixDialog.Close asChild>
              <button
                className="p-1 text-neutral-400 dark:text-neutral-500 hover:text-neutral-600 dark:hover:text-neutral-300 rounded"
                aria-label="닫기"
              >
                &times;
              </button>
            </RadixDialog.Close>
          </div>

          {/* Tabs */}
          <div className="flex border-b border-slate-100 dark:border-slate-700">
            {tabs.map((t) => (
              <button
                key={t.id}
                onClick={() => setTab(t.id)}
                className={`flex-1 py-3 text-xs font-medium transition-colors ${tab === t.id ? 'text-blue-600 border-b-2 border-blue-600 bg-blue-50/50 dark:bg-blue-900/30' : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300'}`}
              >
                {t.label}
              </button>
            ))}
          </div>

          <div className="p-4">
            {error && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
                {error}
              </div>
            )}

            {/* ===== Feedback Tab ===== */}
            {tab === 'feedback' && (
              <div className="space-y-4">
                {!feedback ? (
                  <div className="text-center py-8">
                    <p className="text-sm text-slate-500 dark:text-slate-400 mb-4">
                      AI가 이력서를 분석하여 점수, 강점, 개선점을 알려드립니다.
                    </p>
                    <button
                      onClick={runFeedback}
                      disabled={loading}
                      className="px-6 py-2.5 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
                    >
                      {loading ? (
                        <span className="flex items-center gap-2">
                          <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                          분석 중...
                        </span>
                      ) : (
                        '이력서 분석하기'
                      )}
                    </button>
                  </div>
                ) : (
                  <>
                    {/* Score */}
                    <div className="text-center p-6 bg-sky-50 dark:from-blue-900/30 dark:to-sky-900/30 rounded-xl">
                      <div className="text-5xl font-bold text-blue-600">{feedback.score}</div>
                      <div className="text-lg font-semibold text-blue-800 mt-1">
                        {feedback.grade}
                      </div>
                      <p className="text-sm text-slate-600 dark:text-slate-400 mt-2">
                        {feedback.summary}
                      </p>
                    </div>

                    {/* Strengths */}
                    {feedback.strengths?.length > 0 && (
                      <div>
                        <h3 className="text-sm font-semibold text-green-700 dark:text-green-400 mb-2">
                          💪 강점
                        </h3>
                        <ul className="space-y-1">
                          {feedback.strengths.map((s: string, i: number) => (
                            <li
                              key={i}
                              className="text-sm text-slate-600 dark:text-slate-400 flex gap-2"
                            >
                              <span className="text-green-500">✓</span>
                              {s}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {/* Improvements */}
                    {feedback.improvements?.length > 0 && (
                      <div>
                        <h3 className="text-sm font-semibold text-amber-700 dark:text-amber-400 mb-2">
                          📝 개선점
                        </h3>
                        <ul className="space-y-1">
                          {feedback.improvements.map((s: string, i: number) => (
                            <li
                              key={i}
                              className="text-sm text-slate-600 dark:text-slate-400 flex gap-2"
                            >
                              <span className="text-amber-500">!</span>
                              {s}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {/* Section Scores */}
                    {feedback.sectionScores && (
                      <div>
                        <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
                          📋 섹션별 점수
                        </h3>
                        <div className="space-y-2">
                          {Object.entries(feedback.sectionScores).map(
                            ([key, val]: [string, any]) => (
                              <div key={key} className="flex items-center gap-3">
                                <span className="text-xs text-slate-500 dark:text-slate-400 w-20">
                                  {key}
                                </span>
                                <div className="flex-1 bg-slate-100 dark:bg-slate-700 rounded-full h-2">
                                  <div
                                    className="bg-blue-500 rounded-full h-2 transition-all"
                                    style={{ width: `${val.score}%` }}
                                  />
                                </div>
                                <span className="text-xs font-medium text-slate-700 dark:text-slate-300 w-8">
                                  {val.score}
                                </span>
                              </div>
                            ),
                          )}
                        </div>
                      </div>
                    )}

                    {/* Tips */}
                    {feedback.tips?.length > 0 && (
                      <div className="p-3 bg-slate-50 dark:bg-slate-900 rounded-lg">
                        <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
                          💡 개선 팁
                        </h3>
                        <ul className="text-xs text-slate-600 dark:text-slate-400 space-y-1">
                          {feedback.tips.map((t: string, i: number) => (
                            <li key={i}>• {t}</li>
                          ))}
                        </ul>
                      </div>
                    )}

                    <button
                      onClick={() => setFeedback(null)}
                      className="w-full py-2 text-sm text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300"
                    >
                      다시 분석하기
                    </button>
                  </>
                )}
              </div>
            )}

            {/* ===== Job Match Tab ===== */}
            {tab === 'jobmatch' && (
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                    채용공고 (JD) 붙여넣기
                  </label>
                  <textarea
                    value={jd}
                    onChange={(e) => setJd(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg text-sm h-32 resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-slate-700 dark:text-slate-100"
                    placeholder="채용공고의 자격 요건, 우대 사항, 직무 설명을 붙여넣으세요..."
                  />
                  <div className="flex justify-between mt-1">
                    <span className="text-xs text-slate-400 dark:text-slate-500">
                      {jd.length}자
                    </span>
                    <button
                      onClick={runJobMatch}
                      disabled={loading || jd.length < 20}
                      className="px-4 py-1.5 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
                    >
                      {loading ? '분석 중...' : '매칭 분석'}
                    </button>
                  </div>
                </div>

                {jobMatch && (
                  <>
                    <div className="text-center p-5 bg-emerald-50 dark:bg-emerald-900/30 rounded-xl">
                      <div className="text-4xl font-bold text-green-600">
                        {jobMatch.matchScore}%
                      </div>
                      <div className="text-sm font-semibold text-green-800 mt-1">
                        {jobMatch.matchGrade} 매칭
                      </div>
                      <p className="text-sm text-slate-600 dark:text-slate-400 mt-2">
                        {jobMatch.summary}
                      </p>
                    </div>

                    <div className="stagger-children grid grid-cols-2 gap-3">
                      <div className="p-3 bg-green-50 dark:bg-green-900/30 rounded-lg">
                        <h4 className="text-xs font-semibold text-green-700 mb-1">✅ 매칭 스킬</h4>
                        <div className="flex flex-wrap gap-1">
                          {jobMatch.matchedSkills?.map((s: string, i: number) => (
                            <span
                              key={i}
                              className="px-1.5 py-1 text-xs bg-green-100 text-green-700 rounded"
                            >
                              {s}
                            </span>
                          ))}
                        </div>
                      </div>
                      <div className="p-3 bg-red-50 dark:bg-red-900/30 rounded-lg">
                        <h4 className="text-xs font-semibold text-red-700 mb-1">❌ 부족 스킬</h4>
                        <div className="flex flex-wrap gap-1">
                          {jobMatch.missingSkills?.map((s: string, i: number) => (
                            <span
                              key={i}
                              className="px-1.5 py-1 text-xs bg-red-100 text-red-700 rounded"
                            >
                              {s}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>

                    {jobMatch.recommendations?.length > 0 && (
                      <div>
                        <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
                          💡 수정 제안
                        </h3>
                        <ul className="text-sm text-slate-600 dark:text-slate-400 space-y-1">
                          {jobMatch.recommendations.map((r: string, i: number) => (
                            <li key={i}>• {r}</li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {jobMatch.coverLetterPoints?.length > 0 && (
                      <div className="p-3 bg-blue-50 dark:bg-blue-900/30 rounded-lg">
                        <h3 className="text-xs font-semibold text-blue-700 mb-1">
                          📝 자소서 강조 포인트
                        </h3>
                        <ul className="text-xs text-blue-800 space-y-0.5">
                          {jobMatch.coverLetterPoints.map((p: string, i: number) => (
                            <li key={i}>• {p}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </>
                )}
              </div>
            )}

            {/* ===== Interview Tab ===== */}
            {tab === 'interview' && (
              <div className="space-y-4">
                {!interview ? (
                  <div className="text-center py-6">
                    <div className="mb-4">
                      <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                        지원 직무 (선택)
                      </label>
                      <input
                        value={jobRole}
                        onChange={(e) => setJobRole(e.target.value)}
                        className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-slate-700 dark:text-slate-100"
                        placeholder="예: 시니어 프론트엔드 개발자"
                      />
                    </div>
                    <button
                      onClick={runInterview}
                      disabled={loading}
                      className="px-6 py-2.5 bg-sky-600 text-white text-sm font-medium rounded-lg hover:bg-sky-700 disabled:opacity-50 transition-colors"
                    >
                      {loading ? (
                        <span className="flex items-center gap-2">
                          <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                          생성 중...
                        </span>
                      ) : (
                        '면접 질문 생성'
                      )}
                    </button>
                  </div>
                ) : (
                  <>
                    <div className="text-sm text-slate-500 dark:text-slate-400 mb-2">
                      총 {interview.questions?.length || 0}개 예상 질문
                    </div>
                    {interview.questions?.map((q: any, i: number) => (
                      <details
                        key={i}
                        className="group border border-slate-200 dark:border-slate-700 rounded-lg overflow-hidden"
                      >
                        <summary className="flex items-start gap-3 p-3 cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors">
                          <span className="w-6 h-6 bg-sky-100 text-sky-700 rounded-full flex items-center justify-center text-xs font-bold shrink-0 mt-0.5">
                            {i + 1}
                          </span>
                          <div>
                            <span className="text-xs text-sky-600 font-medium">{q.category}</span>
                            <p className="text-sm font-medium text-slate-800 dark:text-slate-200">
                              {q.question}
                            </p>
                          </div>
                        </summary>
                        <div className="px-3 pb-3 ml-9 space-y-2 text-sm">
                          <div className="p-2 bg-slate-50 dark:bg-slate-900 rounded text-xs text-slate-500 dark:text-slate-400">
                            <strong>의도:</strong> {q.intent}
                          </div>
                          <div className="p-2 bg-blue-50 dark:bg-blue-900/30 rounded text-xs text-blue-800 dark:text-blue-300">
                            <strong>모범 답변:</strong> {q.sampleAnswer}
                          </div>
                          {q.tips && (
                            <div className="p-2 bg-amber-50 dark:bg-amber-900/30 rounded text-xs text-amber-800 dark:text-amber-300">
                              <strong>팁:</strong> {q.tips}
                            </div>
                          )}
                        </div>
                      </details>
                    ))}
                    <button
                      onClick={() => setInterview(null)}
                      className="w-full py-2 text-sm text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300"
                    >
                      다시 생성하기
                    </button>
                  </>
                )}
              </div>
            )}
          </div>
        </RadixDialog.Content>
      </RadixDialog.Portal>
    </RadixDialog.Root>
  );
}
