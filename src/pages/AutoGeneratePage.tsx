import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { API_URL } from '@/lib/config';


const EXAMPLES = [
  '경력 메모, 자기소개 텍스트',
  'LinkedIn 프로필 복사 붙여넣기',
  '이전 이력서 내용 복사',
  '채용공고 + 내 경력 메모',
];

export default function AutoGeneratePage() {
  const navigate = useNavigate();
  const [rawText, setRawText] = useState('');
  const [instruction, setInstruction] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [preview, setPreview] = useState<{ resume: Record<string, any>; tokensUsed?: number; provider?: string } | null>(null);

  useEffect(() => {
    document.title = 'AI 자동 생성 — 이력서공방';
    return () => { document.title = '이력서공방 - AI 기반 이력서 관리 플랫폼'; };
  }, []);

  const handlePreview = async () => {
    if (!rawText.trim()) return;
    setLoading(true);
    setError('');
    setPreview(null);
    try {
      const token = localStorage.getItem('token');
      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      if (token) headers['Authorization'] = `Bearer ${token}`;

      const res = await fetch(`${API_URL}/api/auto-generate/preview`, {
        method: 'POST',
        headers,
        body: JSON.stringify({ rawText, instruction: instruction || undefined }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.message || '생성에 실패했습니다');
      }
      const data = await res.json();
      setPreview(data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!rawText.trim()) return;
    setLoading(true);
    setError('');
    try {
      const token = localStorage.getItem('token');
      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      if (token) headers['Authorization'] = `Bearer ${token}`;

      const res = await fetch(`${API_URL}/api/auto-generate/create`, {
        method: 'POST',
        headers,
        body: JSON.stringify({ rawText, instruction: instruction || undefined }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.message || '저장에 실패했습니다');
      }
      const data = await res.json();
      navigate(`/resumes/${data.resume.id}/edit`);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Header />
      <main id="main-content" className="flex-1 max-w-4xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-6 sm:py-8" role="main">
        <h1 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-slate-100 mb-2">AI 이력서 자동 생성</h1>
        <p className="text-sm text-slate-500 dark:text-slate-400 mb-6">경력 관련 아무 자료나 붙여넣으면 AI가 자동으로 이력서를 생성합니다.</p>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Input */}
          <div className="space-y-4">
            <div>
              <label htmlFor="raw-text" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                원본 텍스트 *
              </label>
              <textarea
                id="raw-text"
                value={rawText}
                onChange={e => setRawText(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 h-64 resize-none bg-white dark:bg-slate-700 dark:text-slate-100"
                placeholder={`아무 형식으로 경력/학력/기술 정보를 입력하세요.\n\n예시:\n- 경력 메모\n- LinkedIn 프로필 복사\n- 이전 이력서 텍스트\n- 자기소개 + 경력 나열\n\nAI가 자동으로 파싱하여 구조화된 이력서를 생성합니다.`}
              />
              <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">{rawText.length.toLocaleString()}자</p>
            </div>

            <div>
              <label htmlFor="instruction" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                추가 지시 (선택)
              </label>
              <input
                id="instruction"
                value={instruction}
                onChange={e => setInstruction(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-slate-700 dark:text-slate-100"
                placeholder="예: 개발자 이력서로 만들어줘, 성과 중심으로 작성해줘"
              />
            </div>

            <div className="flex gap-2">
              <button
                onClick={handlePreview}
                disabled={loading || !rawText.trim()}
                className="flex-1 py-2.5 bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 font-medium rounded-lg hover:bg-slate-200 dark:hover:bg-slate-600 disabled:opacity-50 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors text-sm"
              >
                {loading && !preview ? '분석 중...' : '미리보기'}
              </button>
              <button
                onClick={handleSave}
                disabled={loading || !rawText.trim()}
                className="flex-1 py-2.5 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 disabled:opacity-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors text-sm"
              >
                {loading && preview ? '저장 중...' : '바로 생성 + 저장'}
              </button>
            </div>

            {error && <div role="alert" className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">{error}</div>}

            {/* Examples */}
            <div className="p-4 bg-slate-50 dark:bg-slate-900 rounded-lg">
              <p className="text-xs font-medium text-slate-500 dark:text-slate-400 mb-2">이런 것들을 입력할 수 있어요:</p>
              <ul className="text-xs text-slate-400 dark:text-slate-500 space-y-1">
                {EXAMPLES.map((ex, i) => <li key={i}>- {ex}</li>)}
              </ul>
            </div>
          </div>

          {/* Preview */}
          <div>
            {preview ? (
              <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-4 sm:p-6 space-y-4">
                <div className="flex items-center justify-between">
                  <h2 className="font-semibold text-slate-900 dark:text-slate-100">생성 결과</h2>
                  <span className="text-xs text-slate-400 dark:text-slate-500">{preview.tokensUsed?.toLocaleString()} tokens ({preview.provider})</span>
                </div>

                {preview.resume?.personalInfo?.name && (
                  <div className="p-3 bg-blue-50 dark:bg-blue-900/30 rounded-lg">
                    <p className="font-medium text-slate-900 dark:text-slate-100">{preview.resume.personalInfo.name}</p>
                    <p className="text-xs text-slate-500 dark:text-slate-400">{preview.resume.personalInfo.email} {preview.resume.personalInfo.phone}</p>
                    {preview.resume.personalInfo.summary && (
                      <p className="text-sm text-slate-600 dark:text-slate-400 mt-2">{preview.resume.personalInfo.summary}</p>
                    )}
                  </div>
                )}

                {[
                  { key: 'experiences', label: '경력', render: (e: any) => `${e.company} - ${e.position}` },
                  { key: 'educations', label: '학력', render: (e: any) => `${e.school} ${e.degree} ${e.field}` },
                  { key: 'skills', label: '기술', render: (s: any) => `${s.category}: ${s.items}` },
                  { key: 'certifications', label: '자격증', render: (c: any) => `${c.name} (${c.issuer})` },
                  { key: 'languages', label: '어학', render: (l: any) => `${l.name} ${l.testName} ${l.score}` },
                  { key: 'projects', label: '프로젝트', render: (p: any) => p.name },
                  { key: 'awards', label: '수상', render: (a: any) => a.name },
                  { key: 'activities', label: '활동', render: (a: any) => a.name },
                ].map(({ key, label, render }) => {
                  const items = preview.resume?.[key];
                  if (!items?.length) return null;
                  return (
                    <div key={key}>
                      <h3 className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">{label} ({items.length})</h3>
                      <ul className="text-sm text-slate-600 dark:text-slate-400 space-y-0.5">
                        {items.map((item: any, i: number) => (
                          <li key={i} className="truncate">- {render(item)}</li>
                        ))}
                      </ul>
                    </div>
                  );
                })}

                <button
                  onClick={handleSave}
                  disabled={loading}
                  className="w-full py-2.5 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 disabled:opacity-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors text-sm"
                >
                  이 내용으로 이력서 저장
                </button>
              </div>
            ) : loading ? (
              <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-12 text-center">
                <div className="inline-block w-10 h-10 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin mb-4" />
                <p className="text-sm text-slate-600 dark:text-slate-400 font-medium">AI가 이력서를 분석하고 있습니다...</p>
                <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">보통 10~30초 정도 소요됩니다</p>
              </div>
            ) : (
              <div className="bg-white dark:bg-slate-800 rounded-xl border border-dashed border-slate-300 dark:border-slate-600 p-8 text-center text-slate-400 dark:text-slate-500">
                <p className="text-4xl mb-3" aria-hidden="true">🤖</p>
                <p className="text-sm">원본 텍스트를 입력하고 미리보기를 누르면</p>
                <p className="text-sm">AI가 자동으로 이력서를 구성합니다</p>
              </div>
            )}
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
