import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { toast } from '@/components/Toast';
import { timeAgo } from '@/lib/time';

const API_URL = import.meta.env.VITE_API_URL || '';

interface CoverLetter {
  id: string;
  company: string;
  position: string;
  tone: string;
  content: string;
  resumeId?: string;
  createdAt: string;
  updatedAt: string;
}

export default function MyCoverLettersPage() {
  const [letters, setLetters] = useState<CoverLetter[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  useEffect(() => {
    document.title = '내 자소서 — 이력서공방';
    const token = localStorage.getItem('token');
    if (!token) { setLoading(false); return; }
    fetch(`${API_URL}/api/cover-letters`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then(r => r.ok ? r.json() : [])
      .then(setLetters)
      .catch(() => {})
      .finally(() => setLoading(false));
    return () => { document.title = '이력서공방 - AI 기반 이력서 관리 플랫폼'; };
  }, []);

  const handleDelete = async (id: string) => {
    if (!confirm('이 자소서를 삭제하시겠습니까?')) return;
    const token = localStorage.getItem('token');
    await fetch(`${API_URL}/api/cover-letters/${id}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${token}` },
    });
    setLetters(prev => prev.filter(l => l.id !== id));
    if (selectedId === id) setSelectedId(null);
    toast('자소서가 삭제되었습니다', 'success');
  };

  const handleCopy = (content: string) => {
    navigator.clipboard.writeText(content);
    toast('클립보드에 복사되었습니다', 'success');
  };

  const selected = letters.find(l => l.id === selectedId);
  const toneLabels: Record<string, string> = { formal: '격식체', friendly: '친근체', passionate: '열정체' };

  return (
    <>
      <Header />
      <main id="main-content" className="flex-1 max-w-6xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-6 sm:py-8" role="main">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-slate-100">내 자소서</h1>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">AI로 생성한 자기소개서 목록</p>
          </div>
          <Link to="/cover-letter" className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-xl hover:bg-blue-700 transition-colors">
            + 새 자소서
          </Link>
        </div>

        {loading ? (
          <div className="text-center py-12 text-slate-400">불러오는 중...</div>
        ) : letters.length === 0 ? (
          <div className="text-center py-16 animate-fade-in">
            <svg className="w-16 h-16 mx-auto mb-4 text-slate-300 dark:text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <p className="text-slate-500 dark:text-slate-400 mb-2">아직 생성한 자소서가 없습니다</p>
            <Link to="/cover-letter" className="text-blue-600 dark:text-blue-400 text-sm hover:underline">AI 자소서 생성하기 &rarr;</Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* List */}
            <div className="lg:col-span-1 space-y-2">
              {letters.map(l => (
                <button
                  key={l.id}
                  onClick={() => setSelectedId(l.id)}
                  className={`w-full text-left p-3 rounded-xl border transition-all duration-200 ${
                    selectedId === l.id
                      ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                      : 'border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600 bg-white dark:bg-slate-800'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-medium text-sm text-slate-900 dark:text-slate-100 truncate">{l.company || '회사 미지정'}</span>
                    <span className="text-xs text-slate-400 shrink-0 ml-2">{timeAgo(l.updatedAt)}</span>
                  </div>
                  <p className="text-xs text-slate-500 dark:text-slate-400 truncate">{l.position || '포지션 미지정'}</p>
                  <div className="flex items-center gap-2 mt-1.5">
                    <span className="text-xs px-1.5 py-0.5 bg-slate-100 dark:bg-slate-700 text-slate-500 dark:text-slate-400 rounded">{toneLabels[l.tone] || l.tone}</span>
                  </div>
                </button>
              ))}
            </div>

            {/* Detail */}
            <div className="lg:col-span-2">
              {selected ? (
                <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-5">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h2 className="font-semibold text-slate-900 dark:text-slate-100">{selected.company} — {selected.position}</h2>
                      <p className="text-xs text-slate-400 mt-0.5">{toneLabels[selected.tone]} &middot; {new Date(selected.createdAt).toLocaleDateString('ko-KR')}</p>
                    </div>
                    <div className="flex gap-2">
                      <button onClick={() => handleCopy(selected.content)} className="text-xs px-3 py-1 bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 rounded-lg hover:bg-blue-100 transition-colors">복사</button>
                      <button onClick={() => handleDelete(selected.id)} className="text-xs px-3 py-1 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 rounded-lg hover:bg-red-100 transition-colors">삭제</button>
                    </div>
                  </div>
                  <pre className="text-sm text-slate-700 dark:text-slate-300 whitespace-pre-wrap leading-relaxed font-sans">{selected.content}</pre>
                </div>
              ) : (
                <div className="flex items-center justify-center h-64 text-slate-400 dark:text-slate-500">
                  <p className="text-sm">좌측에서 자소서를 선택하세요</p>
                </div>
              )}
            </div>
          </div>
        )}
      </main>
      <Footer />
    </>
  );
}
