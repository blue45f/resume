import { useState, useEffect } from 'react';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import FeatureGate from '@/components/FeatureGate';
import { toast } from '@/components/Toast';
import { fetchResumes } from '@/lib/api';
import type { ResumeSummary } from '@/types/resume';

const API_URL = import.meta.env.VITE_API_URL || '';

const TARGET_LANGUAGES = [
  { code: 'en', name: 'English', flag: '\u{1F1FA}\u{1F1F8}', desc: '영문 이력서 (미국/글로벌)' },
  { code: 'ja', name: '日本語', flag: '\u{1F1EF}\u{1F1F5}', desc: '일본어 이력서 (일본 취업용)' },
  { code: 'zh', name: '中文', flag: '\u{1F1E8}\u{1F1F3}', desc: '중국어 이력서' },
  { code: 'ko', name: '한국어', flag: '\u{1F1F0}\u{1F1F7}', desc: '한국어로 번역' },
];

export default function TranslatePage() {
  const [resumes, setResumes] = useState<ResumeSummary[]>([]);
  const [selectedResumeId, setSelectedResumeId] = useState('');
  const [targetLang, setTargetLang] = useState('en');
  const [result, setResult] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    document.title = '이력서 번역 — 이력서공방';
    fetchResumes().then(setResumes).catch(() => {});
    return () => { document.title = '이력서공방 - AI 기반 이력서 관리 플랫폼'; };
  }, []);

  const handleTranslate = async () => {
    if (!selectedResumeId) { toast('이력서를 선택해주세요', 'error'); return; }

    setLoading(true);
    setResult('');
    try {
      const token = localStorage.getItem('token');
      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      if (token) headers['Authorization'] = `Bearer ${token}`;

      const langName = TARGET_LANGUAGES.find(l => l.code === targetLang)?.name || targetLang;

      const res = await fetch(`${API_URL}/api/resumes/${selectedResumeId}/transform`, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          templateType: 'english',
          targetLanguage: targetLang,
          jobDescription: `이 이력서를 ${langName}(으)로 완전히 번역해주세요. 현지 이력서 형식에 맞게 변환하되, 원본의 모든 정보를 유지해주세요. 날짜 형식, 학위 표기 등도 해당 언어권 관습에 맞게 변환해주세요.`,
        }),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.message || '번역에 실패했습니다');
      }
      const data = await res.json();
      setResult(data.text || data.data?.text || JSON.stringify(data));
      toast('번역이 완료되었습니다', 'success');
    } catch (e: any) {
      toast(e.message || '번역에 실패했습니다', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(result);
    toast('클립보드에 복사되었습니다', 'success');
  };

  const handleDownload = () => {
    const blob = new Blob([result], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `resume_${targetLang}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <>
      <Header />
      <main id="main-content" className="flex-1 max-w-5xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-6 sm:py-8" role="main">
        <div className="mb-6">
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-slate-100">이력서 번역</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">AI가 이력서를 다른 언어로 번역합니다. 현지 형식에 맞게 변환됩니다.</p>
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
                  <option key={r.id} value={r.id}>{r.title || '제목 없음'} — {r.personalInfo?.name || ''}</option>
                ))}
              </select>
            </div>

            {/* Target language */}
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-200 mb-1.5">번역 언어</label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {TARGET_LANGUAGES.map(lang => (
                  <button
                    key={lang.code}
                    onClick={() => setTargetLang(lang.code)}
                    className={`p-3 rounded-xl border text-left transition-all duration-200 ${
                      targetLang === lang.code
                        ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/30 ring-1 ring-blue-500'
                        : 'border-slate-200 dark:border-slate-600 hover:border-slate-300 dark:hover:border-slate-500'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <span className="text-lg">{lang.flag}</span>
                      <span className="text-sm font-medium text-slate-900 dark:text-slate-100">{lang.name}</span>
                    </div>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{lang.desc}</p>
                  </button>
                ))}
              </div>
            </div>

            <FeatureGate feature="translation">
              <button
                onClick={handleTranslate}
                disabled={loading || !selectedResumeId}
                className="w-full py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-medium rounded-xl hover:from-blue-700 hover:to-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 shadow-sm hover:shadow"
              >
                {loading ? 'AI 번역 중...' : `${TARGET_LANGUAGES.find(l => l.code === targetLang)?.name || ''}(으)로 번역`}
              </button>
            </FeatureGate>
          </div>

          {/* Result */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-sm font-medium text-slate-700 dark:text-slate-200">번역 결과</label>
              {result && (
                <div className="flex gap-2">
                  <button onClick={handleCopy} className="text-xs text-blue-600 dark:text-blue-400 hover:underline">복사</button>
                  <button onClick={handleDownload} className="text-xs text-blue-600 dark:text-blue-400 hover:underline">다운로드</button>
                  <button
                    onClick={async () => {
                      try {
                        const token = localStorage.getItem('token');
                        const headers: Record<string, string> = { 'Content-Type': 'application/json' };
                        if (token) headers['Authorization'] = `Bearer ${token}`;
                        const res = await fetch(`${API_URL}/api/auto-generate/create`, {
                          method: 'POST', headers,
                          body: JSON.stringify({ text: result }),
                        });
                        if (res.ok) {
                          const data = await res.json();
                          toast('번역된 이력서가 저장되었습니다', 'success');
                          window.location.href = `/resumes/${data.id}/edit`;
                        } else {
                          toast('저장에 실패했습니다', 'error');
                        }
                      } catch {
                        toast('저장에 실패했습니다', 'error');
                      }
                    }}
                    className="text-xs text-green-600 dark:text-green-400 hover:underline"
                  >
                    새 이력서로 저장
                  </button>
                </div>
              )}
            </div>
            <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-5 min-h-[400px]">
              {loading ? (
                <div className="flex flex-col items-center justify-center h-64 gap-3">
                  <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
                  <p className="text-sm text-slate-500 dark:text-slate-400">AI가 이력서를 번역하고 있습니다...</p>
                </div>
              ) : result ? (
                <pre className="text-sm text-slate-700 dark:text-slate-300 whitespace-pre-wrap leading-relaxed font-sans">{result}</pre>
              ) : (
                <div className="flex flex-col items-center justify-center h-64 text-slate-400 dark:text-slate-500">
                  <svg className="w-12 h-12 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 5h12M9 3v2m1.048 9.5A18.022 18.022 0 016.412 9m6.088 9h7M11 21l5-10 5 10M12.751 5C11.783 10.77 8.07 15.61 3 18.129" />
                  </svg>
                  <p className="text-sm">이력서와 언어를 선택하면</p>
                  <p className="text-sm">AI가 현지 형식으로 번역합니다</p>
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
