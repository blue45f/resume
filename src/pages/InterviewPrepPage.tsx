import { useState, useEffect } from 'react';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { toast } from '@/components/Toast';
import { fetchResumes } from '@/lib/api';
import type { ResumeSummary } from '@/types/resume';

const API_URL = import.meta.env.VITE_API_URL || '';

export default function InterviewPrepPage() {
  const [resumes, setResumes] = useState<ResumeSummary[]>([]);
  const [selectedResumeId, setSelectedResumeId] = useState('');
  const [jobRole, setJobRole] = useState('');
  const [questions, setQuestions] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [revealedIdx, setRevealedIdx] = useState<Set<number>>(new Set());

  useEffect(() => {
    document.title = '면접 준비 — 이력서공방';
    fetchResumes().then(setResumes).catch(() => {});
    return () => { document.title = '이력서공방 - AI 기반 이력서 관리 플랫폼'; };
  }, []);

  const handleGenerate = async () => {
    if (!selectedResumeId) { toast('이력서를 선택해주세요', 'warning'); return; }
    setLoading(true);
    setQuestions([]);
    setRevealedIdx(new Set());
    try {
      const token = localStorage.getItem('token');
      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      if (token) headers['Authorization'] = `Bearer ${token}`;
      const res = await fetch(`${API_URL}/api/resumes/${selectedResumeId}/transform/interview`, {
        method: 'POST', headers,
        body: JSON.stringify({ jobRole: jobRole || undefined }),
      });
      if (!res.ok) throw new Error('생성에 실패했습니다');
      const data = await res.json();
      // Parse the AI response - try to extract questions
      const text = data.text || data.data?.text || '';
      const parsed = text.split(/\d+[\.\)]\s/).filter(Boolean).map((q: string) => {
        const parts = q.split(/모범\s*답변|샘플\s*답변|답변\s*예시/i);
        return {
          question: parts[0]?.trim() || q.trim(),
          answer: parts[1]?.trim() || '',
        };
      });
      setQuestions(parsed.length > 0 ? parsed : [{ question: text, answer: '' }]);
      toast('면접 질문이 생성되었습니다', 'success');
    } catch (e: any) {
      toast(e.message || '생성에 실패했습니다', 'error');
    } finally {
      setLoading(false);
    }
  };

  const toggleReveal = (idx: number) => {
    setRevealedIdx(prev => {
      const next = new Set(prev);
      if (next.has(idx)) next.delete(idx);
      else next.add(idx);
      return next;
    });
  };

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
          <button onClick={handleGenerate} disabled={loading || !selectedResumeId}
            className="w-full py-3 min-h-[48px] bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-medium rounded-xl hover:from-blue-700 hover:to-indigo-700 disabled:opacity-50 transition-all duration-200 shadow-sm">
            {loading ? 'AI 생성 중...' : '면접 질문 생성'}
          </button>
        </div>

        {/* Questions */}
        {questions.length > 0 && (
          <div className="space-y-3">
            <h2 className="text-sm font-semibold text-slate-700 dark:text-slate-300">예상 질문 ({questions.length}개)</h2>
            {questions.map((q, i) => (
              <div key={i} className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-4 animate-fade-in-up">
                <div className="flex items-start gap-3">
                  <span className="w-7 h-7 bg-blue-100 dark:bg-blue-900/30 text-blue-600 rounded-full flex items-center justify-center text-xs font-bold shrink-0 mt-0.5">{i + 1}</span>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-slate-900 dark:text-slate-100 leading-relaxed">{q.question}</p>
                    {q.answer && (
                      <div className="mt-2">
                        <button onClick={() => toggleReveal(i)} className="text-xs text-blue-600 dark:text-blue-400 hover:underline py-2 min-h-[44px]">
                          {revealedIdx.has(i) ? '답변 숨기기' : '모범 답변 보기'}
                        </button>
                        {revealedIdx.has(i) && (
                          <div className="mt-2 p-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg animate-fade-in">
                            <p className="text-sm text-green-800 dark:text-green-300 whitespace-pre-wrap leading-relaxed">{q.answer}</p>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
      <Footer />
    </>
  );
}
