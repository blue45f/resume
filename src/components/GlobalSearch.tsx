import { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { API_URL } from '@/lib/config';

interface SearchResult {
  type: 'resume' | 'job' | 'community' | 'user';
  id: string;
  title: string;
  subtitle?: string;
  link: string;
}

const TYPE_META: Record<string, { icon: string; label: string; color: string }> = {
  resume: { icon: '📄', label: '이력서', color: 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400' },
  job: { icon: '💼', label: '채용', color: 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400' },
  community: { icon: '💬', label: '커뮤니티', color: 'bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-400' },
  user: { icon: '👤', label: '사용자', color: 'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400' },
};

const QUICK_LINKS = [
  { label: '이력서 작성', link: '/resumes/new', icon: '✍️' },
  { label: '채용정보', link: '/jobs', icon: '💼' },
  { label: '커뮤니티', link: '/community', icon: '💬' },
  { label: '면접 준비', link: '/interview-prep', icon: '🎤' },
  { label: '통계', link: '/stats', icon: '📊' },
  { label: '도움말', link: '/help', icon: '?' },
];

export default function GlobalSearch({ onClose }: { onClose: () => void }) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [recentSearches, setRecentSearches] = useState<string[]>(() => {
    try { return JSON.parse(localStorage.getItem('recent-searches') || '[]'); } catch { return []; }
  });
  const [trendingSkills, setTrendingSkills] = useState<string[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();

  useEffect(() => {
    fetch(`${API_URL}/api/resumes/popular-skills`)
      .then(r => r.ok ? r.json() : [])
      .then((skills: any[]) => setTrendingSkills(skills.slice(0, 8).map((s: any) => s.skill || s.name || s)))
      .catch(() => {});
  }, []);

  useEffect(() => {
    inputRef.current?.focus();
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  const search = useCallback(async (q: string) => {
    if (q.trim().length < 2) { setResults([]); return; }
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const headers: Record<string, string> = {};
      if (token) headers['Authorization'] = `Bearer ${token}`;

      const [resumes, jobs, posts] = await Promise.all([
        fetch(`${API_URL}/api/resumes?search=${encodeURIComponent(q)}&limit=3&visibility=public`, { headers })
          .then(r => r.ok ? r.json() : { items: [] }).catch(() => ({ items: [] })),
        fetch(`${API_URL}/api/jobs?search=${encodeURIComponent(q)}&limit=3`, { headers })
          .then(r => r.ok ? r.json() : { items: [] }).catch(() => ({ items: [] })),
        fetch(`${API_URL}/api/community?search=${encodeURIComponent(q)}&limit=3`, { headers })
          .then(r => r.ok ? r.json() : { items: [] }).catch(() => ({ items: [] })),
      ]);

      const items: SearchResult[] = [];
      for (const r of (resumes.items || [])) {
        items.push({
          type: 'resume',
          id: r.id,
          title: r.personalInfo?.name ? `${r.personalInfo.name}의 이력서` : r.title || '이력서',
          subtitle: r.personalInfo?.email,
          link: `/resumes/${r.id}/preview`,
        });
      }
      for (const j of (jobs.items || [])) {
        items.push({
          type: 'job',
          id: j.id,
          title: j.position || j.title,
          subtitle: j.company,
          link: `/jobs`,
        });
      }
      for (const p of (posts.items || [])) {
        items.push({
          type: 'community',
          id: p.id,
          title: p.title,
          subtitle: p.user?.name,
          link: `/community/${p.id}`,
        });
      }
      setResults(items);
      setSelectedIndex(0);
    } catch {}
    finally { setLoading(false); }
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => search(query), 300);
    return () => clearTimeout(timer);
  }, [query, search]);

  const saveRecent = (q: string) => {
    const updated = [q, ...recentSearches.filter(s => s !== q)].slice(0, 5);
    setRecentSearches(updated);
    localStorage.setItem('recent-searches', JSON.stringify(updated));
  };

  const handleSelect = (link: string) => {
    if (query.trim()) saveRecent(query.trim());
    onClose();
    navigate(link);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    const items = results.length > 0 ? results : (query ? [] : QUICK_LINKS);
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex(i => Math.min(i + 1, items.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex(i => Math.max(i - 1, 0));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (results.length > 0 && results[selectedIndex]) {
        handleSelect(results[selectedIndex].link);
      } else if (!query && QUICK_LINKS[selectedIndex]) {
        handleSelect(QUICK_LINKS[selectedIndex].link);
      }
    }
  };

  const clearRecent = () => {
    setRecentSearches([]);
    localStorage.removeItem('recent-searches');
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-start justify-center pt-[15vh]" onClick={onClose}>
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" />
      <div
        className="relative w-full max-w-lg mx-4 bg-white dark:bg-slate-800 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-700 overflow-hidden animate-fade-in"
        onClick={e => e.stopPropagation()}
      >
        {/* Search input */}
        <div className="flex items-center gap-3 px-4 py-3 border-b border-slate-100 dark:border-slate-700">
          <svg className="w-5 h-5 text-slate-400 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={e => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="이력서, 채용정보, 커뮤니티 검색..."
            className="flex-1 text-sm bg-transparent text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none"
          />
          {loading && (
            <div className="w-4 h-4 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin shrink-0" />
          )}
          <kbd className="hidden sm:inline-flex items-center px-1.5 py-0.5 text-[10px] text-slate-400 border border-slate-200 dark:border-slate-600 rounded font-mono">
            ESC
          </kbd>
        </div>

        {/* Results */}
        <div className="max-h-[50vh] overflow-y-auto">
          {query.trim().length >= 2 && results.length > 0 ? (
            <div className="p-2">
              {results.map((r, i) => {
                const meta = TYPE_META[r.type];
                return (
                  <button
                    key={`${r.type}-${r.id}`}
                    onClick={() => handleSelect(r.link)}
                    className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left transition-colors ${
                      i === selectedIndex
                        ? 'bg-indigo-50 dark:bg-indigo-900/20'
                        : 'hover:bg-slate-50 dark:hover:bg-slate-700/50'
                    }`}
                  >
                    <span className={`w-8 h-8 rounded-lg ${meta.color} flex items-center justify-center text-sm shrink-0`}>
                      {meta.icon}
                    </span>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-slate-900 dark:text-slate-100 truncate">{r.title}</p>
                      {r.subtitle && <p className="text-xs text-slate-500 dark:text-slate-400 truncate">{r.subtitle}</p>}
                    </div>
                    <span className={`text-[10px] px-2 py-0.5 rounded-full ${meta.color} font-medium shrink-0`}>
                      {meta.label}
                    </span>
                  </button>
                );
              })}
            </div>
          ) : query.trim().length >= 2 && !loading ? (
            <div className="text-center py-8">
              <p className="text-sm text-slate-400 dark:text-slate-500">검색 결과가 없습니다</p>
              <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">다른 키워드로 검색해보세요</p>
            </div>
          ) : (
            <div className="p-3 space-y-4">
              {/* Recent searches */}
              {recentSearches.length > 0 && (
                <div>
                  <div className="flex items-center justify-between mb-2 px-1">
                    <span className="text-[10px] font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider">최근 검색</span>
                    <button onClick={clearRecent} className="text-[10px] text-slate-400 hover:text-slate-600 dark:hover:text-slate-300">
                      전체 삭제
                    </button>
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {recentSearches.map(s => (
                      <button
                        key={s}
                        onClick={() => setQuery(s)}
                        className="inline-flex items-center gap-1 px-2.5 py-1 text-xs bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors"
                      >
                        <svg className="w-3 h-3 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        {s}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Trending skills */}
              {trendingSkills.length > 0 && (
                <div>
                  <span className="text-[10px] font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider px-1 block mb-2">인기 기술</span>
                  <div className="flex flex-wrap gap-1.5 px-1">
                    {trendingSkills.map(s => (
                      <button key={s} onClick={() => setQuery(s)} className="px-2.5 py-1 text-xs bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400 rounded-lg hover:bg-indigo-100 dark:hover:bg-indigo-900/40 transition-colors">
                        {s}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Quick links */}
              <div>
                <span className="text-[10px] font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider px-1 block mb-2">바로가기</span>
                <div className="space-y-0.5">
                  {QUICK_LINKS.map((link, i) => (
                    <button
                      key={link.link}
                      onClick={() => handleSelect(link.link)}
                      className={`w-full flex items-center gap-3 px-3 py-2 rounded-xl text-left transition-colors ${
                        !query && i === selectedIndex
                          ? 'bg-indigo-50 dark:bg-indigo-900/20'
                          : 'hover:bg-slate-50 dark:hover:bg-slate-700/50'
                      }`}
                    >
                      <span className="text-base">{link.icon}</span>
                      <span className="text-sm text-slate-700 dark:text-slate-300">{link.label}</span>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-4 py-2 border-t border-slate-100 dark:border-slate-700 flex items-center justify-between">
          <div className="flex items-center gap-3 text-[10px] text-slate-400">
            <span className="flex items-center gap-1">
              <kbd className="px-1 py-0.5 border border-slate-200 dark:border-slate-600 rounded font-mono">↑↓</kbd>
              이동
            </span>
            <span className="flex items-center gap-1">
              <kbd className="px-1 py-0.5 border border-slate-200 dark:border-slate-600 rounded font-mono">↵</kbd>
              선택
            </span>
          </div>
          <span className="text-[10px] text-slate-400 hidden sm:inline">⌘K로 열기</span>
        </div>
      </div>
    </div>
  );
}
