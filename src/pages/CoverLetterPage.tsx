import { useState, useEffect, useCallback } from 'react';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import FeatureGate from '@/components/FeatureGate';
import { toast } from '@/components/Toast';
import { fetchResumes } from '@/lib/api';
import type { ResumeSummary } from '@/types/resume';
import { API_URL } from '@/lib/config';


export default function CoverLetterPage() {
  const [resumes, setResumes] = useState<ResumeSummary[]>([]);
  const [selectedResumeId, setSelectedResumeId] = useState('');
  const [jobDescription, setJobDescription] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [position, setPosition] = useState('');
  const [tone, setTone] = useState<'formal' | 'friendly' | 'confident'>('formal');
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
    { value: 'confident', label: '자신감체', desc: '당당하고 확신에 찬 어조' },
  ] as const;

  const toneKorean: Record<string, string> = { formal: '격식체', friendly: '친근체', confident: '자신감체' };

  const handleGenerate = useCallback(async () => {
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
          jobDescription: `[회사: ${companyName}] [포지션: ${position}] [어조: ${toneKorean[tone]}]\n\n${jobDescription}`,
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
  }, [selectedResumeId, jobDescription, companyName, position, tone]);

  const handleCopy = () => {
    navigator.clipboard.writeText(result);
    toast('클립보드에 복사되었습니다', 'success');
  };

  const handleDownloadPdf = () => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) { toast('팝업이 차단되었습니다. 팝업을 허용해주세요.', 'error'); return; }
    printWindow.document.write(`<!DOCTYPE html><html><head><meta charset="utf-8"><title>자기소개서 - ${companyName || '미지정'}</title><style>
      body { font-family: 'Pretendard', -apple-system, BlinkMacSystemFont, sans-serif; padding: 40px; line-height: 1.8; color: #1e293b; max-width: 800px; margin: 0 auto; font-size: 14px; }
      h1 { font-size: 18px; margin-bottom: 8px; }
      .meta { font-size: 12px; color: #64748b; margin-bottom: 24px; }
      .content { white-space: pre-wrap; }
      @media print { body { padding: 20px; } }
    </style></head><body>
      <h1>${companyName ? companyName + ' - ' : ''}${position || '자기소개서'}</h1>
      <div class="meta">${toneKorean[tone]} | ${new Date().toLocaleDateString('ko-KR')}</div>
      <div class="content">${result.replace(/</g, '&lt;').replace(/>/g, '&gt;')}</div>
    </body></html>`);
    printWindow.document.close();
    setTimeout(() => { printWindow.print(); }, 300);
  };

  const wordCount = result ? result.replace(/\s+/g, ' ').trim().length : 0;
  const charCountNoSpace = result ? result.replace(/\s/g, '').length : 0;

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

            {/* Tone - radio buttons */}
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-200 mb-1.5">어조</label>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                {tones.map(t => (
                  <label
                    key={t.value}
                    className={`p-3 rounded-xl border text-left transition-all duration-200 cursor-pointer ${
                      tone === t.value
                        ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/30 ring-1 ring-blue-500'
                        : 'border-slate-200 dark:border-slate-600 hover:border-slate-300 dark:hover:border-slate-500'
                    }`}
                  >
                    <input
                      type="radio"
                      name="tone"
                      value={t.value}
                      checked={tone === t.value}
                      onChange={() => setTone(t.value)}
                      className="sr-only"
                    />
                    <span className="text-sm font-medium text-slate-900 dark:text-slate-100">{t.label}</span>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{t.desc}</p>
                  </label>
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
                <span className="text-xs text-slate-400 dark:text-slate-500">
                  {charCountNoSpace.toLocaleString()}자 (공백 포함 {wordCount.toLocaleString()}자)
                </span>
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

            {/* Action buttons */}
            {result && (
              <div className="flex flex-wrap gap-2 mt-3">
                <button
                  onClick={handleCopy}
                  className="flex items-center gap-1.5 px-4 py-2 text-sm font-medium bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 rounded-xl hover:bg-blue-100 dark:hover:bg-blue-900/40 transition-colors"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                  </svg>
                  복사하기
                </button>
                <button
                  onClick={handleDownloadPdf}
                  className="flex items-center gap-1.5 px-4 py-2 text-sm font-medium bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400 rounded-xl hover:bg-green-100 dark:hover:bg-green-900/40 transition-colors"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  PDF 다운로드
                </button>
                <button
                  onClick={handleGenerate}
                  disabled={loading}
                  className="flex items-center gap-1.5 px-4 py-2 text-sm font-medium bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 rounded-xl hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors disabled:opacity-50"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                  다시 생성
                </button>
              </div>
            )}
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
