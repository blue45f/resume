import { useState, useEffect } from 'react';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import FeatureGate from '@/components/FeatureGate';
import { toast } from '@/components/Toast';
import { fetchResumes } from '@/lib/api';
import type { ResumeSummary } from '@/types/resume';

const API_URL = import.meta.env.VITE_API_URL || '';

export default function CoverLetterPage() {
  const [resumes, setResumes] = useState<ResumeSummary[]>([]);
  const [selectedResumeId, setSelectedResumeId] = useState('');
  const [jobDescription, setJobDescription] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [position, setPosition] = useState('');
  const [tone, setTone] = useState<'formal' | 'friendly' | 'passionate'>('formal');
  const [result, setResult] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchResumes().then(setResumes).catch(() => {});
  }, []);

  useEffect(() => {
    document.title = '자기소개서 생성 — 이력서공방';
    return () => { document.title = '이력서공방 - AI 기반 이력서 관리 플랫폼'; };
  }, []);

  const tones = [
    { value: 'formal', label: '격식체', desc: '공식적이고 전문적인 어조' },
    { value: 'friendly', label: '친근체', desc: '따뜻하고 열정적인 어조' },
    { value: 'passionate', label: '열정체', desc: '강한 동기와 포부를 강조' },
  ];

  const handleGenerate = async () => {
    if (!selectedResumeId) { toast('이력서를 선택해주세요', 'error'); return; }
    if (!jobDescription.trim()) { toast('채용 공고를 입력해주세요', 'error'); return; }

    setLoading(true);
    setResult('');
    setError('');
    try {
      const token = localStorage.getItem('token');
      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      if (token) headers['Authorization'] = `Bearer ${token}`;

      const res = await fetch(`${API_URL}/api/resumes/${selectedResumeId}/transform`, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          templateType: 'cover-letter',
          jobDescription: `[회사: ${companyName}] [포지션: ${position}] [어조: ${tone === 'formal' ? '격식체' : tone === 'friendly' ? '친근체' : '열정체'}]\n\n${jobDescription}`,
        }),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.message || '생성에 실패했습니다');
      }
      const data = await res.json();
      const generatedText = data.text || data.data?.text || JSON.stringify(data);
      setResult(generatedText);
      toast('자기소개서가 생성되었습니다', 'success');

      // Auto-save the cover letter
      if (generatedText) {
        const saveToken = localStorage.getItem('token');
        if (saveToken) {
          fetch(`${API_URL}/api/cover-letters`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${saveToken}` },
            body: JSON.stringify({
              resumeId: selectedResumeId,
              company: companyName,
              position,
              tone,
              jobDescription,
              content: generatedText,
            }),
          }).catch(() => {});
        }
      }
    } catch (e: any) {
      const msg = e.message || '생성에 실패했습니다';
      setError(msg);
      toast(msg, 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(result);
    toast('클립보드에 복사되었습니다', 'success');
  };

  return (
    <>
      <Header />
      <main id="main-content" className="flex-1 max-w-5xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-6 sm:py-8" role="main">
        <div className="mb-6">
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-slate-100">자기소개서 생성기</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">이력서와 채용 공고를 기반으로 AI가 맞춤 자기소개서를 작성합니다</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Input */}
          <div className="space-y-4">
            {/* Resume selection */}
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-200 mb-1">이력서 선택 *</label>
              <select
                value={selectedResumeId}
                onChange={e => setSelectedResumeId(e.target.value)}
                className="w-full px-3 py-2.5 border border-slate-200 dark:border-slate-600 rounded-xl text-sm dark:bg-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">이력서를 선택하세요</option>
                {resumes.map(r => (
                  <option key={r.id} value={r.id}>{r.title || '제목 없음'} — {r.personalInfo?.name || '이름 없음'}</option>
                ))}
              </select>
            </div>

            {/* Company & Position */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-200 mb-1">회사명</label>
                <input value={companyName} onChange={e => setCompanyName(e.target.value)} placeholder="예: 네이버" className="w-full px-3 py-2.5 border border-slate-200 dark:border-slate-600 rounded-xl text-sm dark:bg-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-200 mb-1">포지션</label>
                <input value={position} onChange={e => setPosition(e.target.value)} placeholder="예: 프론트엔드 개발자" className="w-full px-3 py-2.5 border border-slate-200 dark:border-slate-600 rounded-xl text-sm dark:bg-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
            </div>

            {/* Tone */}
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-200 mb-1.5">어조</label>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                {tones.map(t => (
                  <button
                    key={t.value}
                    onClick={() => setTone(t.value as any)}
                    className={`p-3 rounded-xl border text-left transition-all duration-200 ${
                      tone === t.value
                        ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/30 ring-1 ring-blue-500'
                        : 'border-slate-200 dark:border-slate-600 hover:border-slate-300'
                    }`}
                  >
                    <span className="text-sm font-medium text-slate-900 dark:text-slate-100">{t.label}</span>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{t.desc}</p>
                  </button>
                ))}
              </div>
            </div>

            {/* Job Description */}
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-200 mb-1">채용 공고 *</label>
              <textarea
                value={jobDescription}
                onChange={e => setJobDescription(e.target.value)}
                placeholder="채용 공고 내용을 붙여넣으세요..."
                rows={10}
                className="w-full px-3 py-2.5 border border-slate-200 dark:border-slate-600 rounded-xl text-sm dark:bg-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
              />
            </div>

            <FeatureGate feature="coverLetter">
              <button
                onClick={handleGenerate}
                disabled={loading || !selectedResumeId || !jobDescription.trim()}
                className="w-full py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-medium rounded-xl hover:from-blue-700 hover:to-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 shadow-sm hover:shadow"
              >
                {loading ? '생성 중...' : '자기소개서 생성'}
              </button>
            </FeatureGate>
          </div>

          {/* Result */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-sm font-medium text-slate-700 dark:text-slate-200">생성 결과</label>
              {result && (
                <button onClick={handleCopy} className="text-xs text-blue-600 hover:text-blue-800 dark:text-blue-400">
                  복사
                </button>
              )}
            </div>
            {error && (
              <div className="p-4 mb-2 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl text-sm text-red-600 dark:text-red-400">
                {error}
              </div>
            )}
            <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-5 min-h-[400px]">
              {loading ? (
                <div className="flex items-center justify-center h-64">
                  <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
                </div>
              ) : result ? (
                <div className="prose prose-sm dark:prose-invert max-w-none whitespace-pre-wrap text-sm text-slate-700 dark:text-slate-300 leading-relaxed">
                  {result}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center h-64 text-slate-400 dark:text-slate-500">
                  <svg className="w-12 h-12 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  <p className="text-sm">이력서와 채용 공고를 입력하면</p>
                  <p className="text-sm">AI가 맞춤 자기소개서를 생성합니다</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
