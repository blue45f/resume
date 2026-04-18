import { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import * as RadixDialog from '@radix-ui/react-dialog';
import { API_URL } from '@/lib/config';
import { tx } from '@/lib/i18n';

interface SearchResult {
  type: 'resume' | 'job' | 'community' | 'user';
  id: string;
  title: string;
  subtitle?: string;
  link: string;
}

const TYPE_META: Record<string, { icon: string; label: string; color: string }> = {
  resume: {
    icon: '📄',
    label: '이력서',
    color: 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400',
  },
  job: {
    icon: '💼',
    label: '채용',
    color: 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400',
  },
  community: {
    icon: '💬',
    label: '커뮤니티',
    color: 'bg-sky-100 dark:bg-sky-900/30 text-sky-700 dark:text-sky-400',
  },
  user: {
    icon: '👤',
    label: '사용자',
    color: 'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400',
  },
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
    try {
      return JSON.parse(localStorage.getItem('recent-searches') || '[]');
    } catch {
      return [];
    }
  });
  const [trendingSkills, setTrendingSkills] = useState<string[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();

  useEffect(() => {
    fetch(`${API_URL}/api/resumes/popular-skills`)
      .then((r) => (r.ok ? r.json() : []))
      .then((skills: any[]) =>
        setTrendingSkills(skills.slice(0, 8).map((s: any) => s.skill || s.name || s)),
      )
      .catch(() => {});
  }, []);

  const search = useCallback(async (q: string) => {
    if (q.trim().length < 2) {
      setResults([]);
      return;
    }
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const headers: Record<string, string> = {};
      if (token) headers['Authorization'] = `Bearer ${token}`;

      const [resumes, jobs, posts] = await Promise.all([
        fetch(`${API_URL}/api/resumes?search=${encodeURIComponent(q)}&limit=3&visibility=public`, {
          headers,
        })
          .then((r) => (r.ok ? r.json() : { items: [] }))
          .catch(() => ({ items: [] })),
        fetch(`${API_URL}/api/jobs?search=${encodeURIComponent(q)}&limit=3`, { headers })
          .then((r) => (r.ok ? r.json() : { items: [] }))
          .catch(() => ({ items: [] })),
        fetch(`${API_URL}/api/community?search=${encodeURIComponent(q)}&limit=3`, { headers })
          .then((r) => (r.ok ? r.json() : { items: [] }))
          .catch(() => ({ items: [] })),
      ]);

      const items: SearchResult[] = [];
      for (const r of resumes.items || []) {
        items.push({
          type: 'resume',
          id: r.id,
          title: r.personalInfo?.name ? `${r.personalInfo.name}의 이력서` : r.title || '이력서',
          subtitle: r.personalInfo?.email,
          link: `/resumes/${r.id}/preview`,
        });
      }
      for (const j of jobs.items || []) {
        items.push({
          type: 'job',
          id: j.id,
          title: j.position || j.title,
          subtitle: j.company,
          link: `/jobs`,
        });
      }
      for (const p of posts.items || []) {
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
    } catch {
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => search(query), 300);
    return () => clearTimeout(timer);
  }, [query, search]);

  const saveRecent = (q: string) => {
    const updated = [q, ...recentSearches.filter((s) => s !== q)].slice(0, 5);
    setRecentSearches(updated);
    localStorage.setItem('recent-searches', JSON.stringify(updated));
  };

  const handleSelect = (link: string) => {
    if (query.trim()) saveRecent(query.trim());
    onClose();
    navigate(link);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    const items = results.length > 0 ? results : query ? [] : QUICK_LINKS;
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex((i) => Math.min(i + 1, items.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex((i) => Math.max(i - 1, 0));
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
    <RadixDialog.Root
      open
      onOpenChange={(o) => {
        if (!o) onClose();
      }}
    >
      <RadixDialog.Portal>
        <RadixDialog.Overlay className="fixed inset-0 z-[100] bg-black/40 backdrop-blur-sm animate-fade-in" />
        <RadixDialog.Content
          aria-describedby={undefined}
          onOpenAutoFocus={(e) => {
            e.preventDefault();
            inputRef.current?.focus();
          }}
          className="fixed z-[101] top-[12vh] left-1/2 -translate-x-1/2 w-[calc(100%-2rem)] max-w-lg rounded-2xl shadow-2xl overflow-hidden animate-fade-in focus:outline-none max-h-[80vh] flex flex-col"
          style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)' }}
        >
          <RadixDialog.Title className="sr-only">{tx('common.search')}</RadixDialog.Title>
          <div
            className="flex items-center gap-3 px-4 py-3.5"
            style={{ borderBottom: '1px solid var(--color-border-subtle)' }}
          >
            <svg
              className="w-5 h-5 text-neutral-400 shrink-0"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
              />
            </svg>
            <input
              ref={inputRef}
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={tx('form.placeholder.search')}
              className="flex-1 text-sm bg-transparent text-neutral-900 dark:text-neutral-100 placeholder-neutral-400 focus:outline-none"
            />
            {loading && (
              <div className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin shrink-0" />
            )}
            <kbd className="hidden sm:inline-flex items-center px-1.5 py-0.5 text-[10px] text-neutral-400 border border-neutral-200 dark:border-neutral-600 rounded font-mono">
              ESC
            </kbd>
          </div>

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
                          ? 'bg-blue-50 dark:bg-blue-900/20'
                          : 'hover:bg-neutral-50 dark:hover:bg-neutral-700/50'
                      }`}
                    >
                      <span
                        className={`w-8 h-8 rounded-lg ${meta.color} flex items-center justify-center text-sm shrink-0`}
                      >
                        {meta.icon}
                      </span>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-neutral-900 dark:text-neutral-100 truncate">
                          {r.title}
                        </p>
                        {r.subtitle && (
                          <p className="text-xs text-neutral-500 dark:text-neutral-400 truncate">
                            {r.subtitle}
                          </p>
                        )}
                      </div>
                      <span
                        className={`text-[10px] px-2 py-0.5 rounded-full ${meta.color} font-medium shrink-0`}
                      >
                        {meta.label}
                      </span>
                    </button>
                  );
                })}
              </div>
            ) : query.trim().length >= 2 && !loading ? (
              <div className="text-center py-8">
                <p className="text-sm text-neutral-400 dark:text-neutral-500">
                  {tx('common.empty')}
                </p>
                <p className="text-xs text-neutral-400 dark:text-neutral-500 mt-1">
                  {tx('common.retry')}
                </p>
              </div>
            ) : (
              <div className="p-3 space-y-4">
                {recentSearches.length > 0 && (
                  <div>
                    <div className="flex items-center justify-between mb-2 px-1">
                      <span className="text-[10px] font-semibold text-neutral-400 dark:text-neutral-500 uppercase tracking-wider">
                        최근 검색
                      </span>
                      <button
                        onClick={clearRecent}
                        className="text-[10px] text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-300"
                      >
                        전체 삭제
                      </button>
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      {recentSearches.map((s) => (
                        <button
                          key={s}
                          onClick={() => setQuery(s)}
                          className="inline-flex items-center gap-1 px-2.5 py-1 text-xs bg-neutral-100 dark:bg-neutral-700 text-neutral-600 dark:text-neutral-300 rounded-lg hover:bg-neutral-200 dark:hover:bg-neutral-600 transition-colors"
                        >
                          <svg
                            className="w-3 h-3 text-neutral-400"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                            />
                          </svg>
                          {s}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {trendingSkills.length > 0 && (
                  <div>
                    <span className="text-[10px] font-semibold text-neutral-400 dark:text-neutral-500 uppercase tracking-wider px-1 block mb-2">
                      인기 기술
                    </span>
                    <div className="flex flex-wrap gap-1.5 px-1">
                      {trendingSkills.map((s) => (
                        <button
                          key={s}
                          onClick={() => setQuery(s)}
                          className="px-2.5 py-1 text-xs bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 rounded-lg hover:bg-blue-100 dark:hover:bg-blue-900/40 transition-colors"
                        >
                          {s}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                <div>
                  <span className="text-[10px] font-semibold text-neutral-400 dark:text-neutral-500 uppercase tracking-wider px-1 block mb-2">
                    바로가기
                  </span>
                  <div className="space-y-0.5">
                    {QUICK_LINKS.map((link, i) => (
                      <button
                        key={link.link}
                        onClick={() => handleSelect(link.link)}
                        className={`w-full flex items-center gap-3 px-3 py-2 rounded-xl text-left transition-colors ${
                          !query && i === selectedIndex
                            ? 'bg-blue-50 dark:bg-blue-900/20'
                            : 'hover:bg-neutral-50 dark:hover:bg-neutral-700/50'
                        }`}
                      >
                        <span className="text-base">{link.icon}</span>
                        <span className="text-sm text-neutral-700 dark:text-neutral-300">
                          {link.label}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>

          <div className="px-4 py-2 border-t border-neutral-100 dark:border-neutral-700 flex items-center justify-between">
            <div className="flex items-center gap-3 text-[10px] text-neutral-400">
              <span className="flex items-center gap-1">
                <kbd className="px-1 py-0.5 border border-neutral-200 dark:border-neutral-600 rounded font-mono">
                  ↑↓
                </kbd>
                이동
              </span>
              <span className="flex items-center gap-1">
                <kbd className="px-1 py-0.5 border border-neutral-200 dark:border-neutral-600 rounded font-mono">
                  ↵
                </kbd>
                선택
              </span>
            </div>
            <span className="text-[10px] text-neutral-400 hidden sm:inline">⌘K로 열기</span>
          </div>
        </RadixDialog.Content>
      </RadixDialog.Portal>
    </RadixDialog.Root>
  );
}
