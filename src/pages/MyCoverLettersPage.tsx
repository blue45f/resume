import { getUser } from '@/lib/auth';
import { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { CardGridSkeleton } from '@/components/Skeleton';
import EmptyState from '@/components/EmptyState';
import { toast } from '@/components/Toast';
import { timeAgo } from '@/lib/time';
import { API_URL } from '@/lib/config';


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

type SortMode = 'recent' | 'name';

export default function MyCoverLettersPage() {
  const [letters, setLetters] = useState<CoverLetter[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortMode, setSortMode] = useState<SortMode>('recent');
  const [batchMode, setBatchMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

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

  const filteredLetters = useMemo(() => {
    let result = letters;

    // Search filter
    if (searchQuery.trim()) {
      const q = searchQuery.trim().toLowerCase();
      result = result.filter(l =>
        (l.company || '').toLowerCase().includes(q) ||
        (l.position || '').toLowerCase().includes(q)
      );
    }

    // Sort
    if (sortMode === 'recent') {
      result = [...result].sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
    } else {
      result = [...result].sort((a, b) => (a.company || '').localeCompare(b.company || '', 'ko'));
    }

    return result;
  }, [letters, searchQuery, sortMode]);

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

  const handleBatchDelete = async () => {
    if (selectedIds.size === 0) { toast('삭제할 자소서를 선택해주세요', 'warning'); return; }
    if (!confirm(`선택한 ${selectedIds.size}개의 자소서를 삭제하시겠습니까?`)) return;
    const token = localStorage.getItem('token');
    const promises = Array.from(selectedIds).map(id =>
      fetch(`${API_URL}/api/cover-letters/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      })
    );
    await Promise.allSettled(promises);
    setLetters(prev => prev.filter(l => !selectedIds.has(l.id)));
    if (selectedId && selectedIds.has(selectedId)) setSelectedId(null);
    toast(`${selectedIds.size}개의 자소서가 삭제되었습니다`, 'success');
    setSelectedIds(new Set());
    setBatchMode(false);
  };

  const toggleBatchSelect = (id: string) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleCopy = (content: string) => {
    navigator.clipboard.writeText(content);
    toast('클립보드에 복사되었습니다', 'success');
  };

  const getSnippet = (content: string) => {
    if (!content) return '';
    const clean = content.replace(/\s+/g, ' ').trim();
    return clean.length > 100 ? clean.slice(0, 100) + '...' : clean;
  };

  const selected = letters.find(l => l.id === selectedId);
  const toneLabels: Record<string, string> = { formal: '격식체', friendly: '친근체', passionate: '열정체', confident: '자신감체' };

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
          <CardGridSkeleton count={3} />
        ) : letters.length === 0 ? (
          <EmptyState type="cover-letter" />
        ) : (
          <>
            {/* Search, Sort, Batch controls */}
            <div className="flex flex-col sm:flex-row gap-3 mb-4">
              <div className="relative flex-1">
                <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                <input
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  placeholder="회사명 또는 포지션으로 검색..."
                  className="w-full pl-9 pr-3 py-2 border border-slate-200 dark:border-slate-600 rounded-xl text-sm dark:bg-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div className="flex gap-2">
                <select
                  value={sortMode}
                  onChange={e => setSortMode(e.target.value as SortMode)}
                  className="px-3 py-2 border border-slate-200 dark:border-slate-600 rounded-xl text-sm dark:bg-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="recent">최근순</option>
                  <option value="name">이름순</option>
                </select>
                <button
                  onClick={() => { setBatchMode(!batchMode); setSelectedIds(new Set()); }}
                  className={`px-3 py-2 text-sm font-medium rounded-xl border transition-colors ${
                    batchMode
                      ? 'border-red-300 dark:border-red-700 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400'
                      : 'border-slate-200 dark:border-slate-600 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700'
                  }`}
                >
                  {batchMode ? '취소' : '선택 삭제'}
                </button>
                {batchMode && selectedIds.size > 0 && (
                  <button
                    onClick={handleBatchDelete}
                    className="px-3 py-2 text-sm font-medium rounded-xl bg-red-600 text-white hover:bg-red-700 transition-colors"
                  >
                    {selectedIds.size}개 삭제
                  </button>
                )}
              </div>
            </div>

            {filteredLetters.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-slate-400 dark:text-slate-500 text-sm">검색 결과가 없습니다</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* List */}
                <div className="lg:col-span-1 space-y-2">
                  {filteredLetters.map(l => (
                    <div key={l.id} className="flex items-start gap-2">
                      {batchMode && (
                        <input
                          type="checkbox"
                          checked={selectedIds.has(l.id)}
                          onChange={() => toggleBatchSelect(l.id)}
                          className="mt-3.5 w-4 h-4 rounded border-slate-300 dark:border-slate-600 text-blue-600 focus:ring-blue-500 shrink-0"
                        />
                      )}
                      <button
                        onClick={() => !batchMode && setSelectedId(l.id)}
                        className={`flex-1 text-left p-3 rounded-xl border transition-all duration-200 ${
                          selectedId === l.id && !batchMode
                            ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                            : 'border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600 bg-white dark:bg-slate-800'
                        }`}
                      >
                        <div className="flex items-center justify-between mb-1">
                          <span className="font-medium text-sm text-slate-900 dark:text-slate-100 truncate">{l.company || '회사 미지정'}</span>
                          <span className="text-xs text-slate-400 shrink-0 ml-2">{timeAgo(l.updatedAt)}</span>
                        </div>
                        <p className="text-xs text-slate-500 dark:text-slate-400 truncate">{l.position || '포지션 미지정'}</p>
                        <p className="text-xs text-slate-400 dark:text-slate-500 mt-1 line-clamp-2">{getSnippet(l.content)}</p>
                        <div className="flex items-center gap-2 mt-1.5">
                          <span className="text-xs px-1.5 py-0.5 bg-slate-100 dark:bg-slate-700 text-slate-500 dark:text-slate-400 rounded">{toneLabels[l.tone] || l.tone}</span>
                        </div>
                      </button>
                    </div>
                  ))}
                </div>

                {/* Detail */}
                <div className="lg:col-span-2">
                  {selected ? (
                    <div className="imp-card p-5">
                      <div className="flex items-center justify-between mb-4">
                        <div>
                          <h2 className="font-semibold text-slate-900 dark:text-slate-100">{selected.company} — {selected.position}</h2>
                          <p className="text-xs text-slate-400 mt-0.5">{toneLabels[selected.tone]} &middot; {new Date(selected.createdAt).toLocaleDateString('ko-KR')}</p>
                        </div>
                        <div className="flex gap-2">
                          <button onClick={() => handleCopy(selected.content)} className="text-xs px-3 py-1 bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 rounded-lg hover:bg-blue-100 dark:hover:bg-blue-900/40 transition-colors">복사</button>
                          <button onClick={() => handleDelete(selected.id)} className="text-xs px-3 py-1 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 rounded-lg hover:bg-red-100 dark:hover:bg-red-900/40 transition-colors">삭제</button>
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
          </>
        )}
      </main>
      <Footer />
    </>
  );
}
