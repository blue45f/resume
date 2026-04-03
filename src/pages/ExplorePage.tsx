import { useEffect, useState, useCallback, useRef, useMemo } from 'react';
import { Link, useSearchParams, useNavigate } from 'react-router-dom';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { CardGridSkeleton } from '@/components/Skeleton';
import EmptyState from '@/components/EmptyState';
import type { ResumeSummary, Tag } from '@/types/resume';
import { fetchTags } from '@/lib/api';
import { getUser } from '@/lib/auth';
import BookmarkButton from '@/components/BookmarkButton';
import { API_URL } from '@/lib/config';
import { timeAgo } from '@/lib/time';
import { fetchResumes } from '@/lib/api';

const THEME_COLORS = [
  'from-blue-500 to-indigo-500',
  'from-emerald-500 to-teal-500',
  'from-purple-500 to-pink-500',
  'from-orange-500 to-red-500',
  'from-cyan-500 to-blue-500',
  'from-rose-500 to-fuchsia-500',
  'from-amber-500 to-orange-500',
  'from-lime-500 to-emerald-500',
];

const THEME_DOT_COLORS = [
  'bg-blue-500', 'bg-emerald-500', 'bg-purple-500', 'bg-orange-500',
  'bg-cyan-500', 'bg-rose-500', 'bg-amber-500', 'bg-lime-500',
];

function getThemeIndex(id: string): number {
  let hash = 0;
  for (let i = 0; i < id.length; i++) hash = ((hash << 5) - hash + id.charCodeAt(i)) | 0;
  return Math.abs(hash) % THEME_COLORS.length;
}

function extractSkillNames(skills?: { category: string; items: string }[]): string[] {
  if (!skills?.length) return [];
  const all: string[] = [];
  for (const s of skills) {
    const items = s.items.split(',').map(i => i.trim()).filter(Boolean);
    all.push(...items);
  }
  return all.slice(0, 6);
}


interface SearchResult {
  data: ResumeSummary[];
  total: number;
  page: number;
  totalPages: number;
}

interface UserProfile {
  userId: string;
  name: string;
  resumes: { id: string; title: string; updatedAt: string }[];
  skills: string[];
  resumeCount: number;
}

function aggregateUsers(resumes: ResumeSummary[]): UserProfile[] {
  const map = new Map<string, UserProfile>();
  for (const r of resumes) {
    const key = r.userId || r.personalInfo?.name || r.id;
    const name = r.personalInfo?.name || '이름 미입력';
    if (!map.has(key)) {
      map.set(key, { userId: key, name, resumes: [], skills: [], resumeCount: 0 });
    }
    const user = map.get(key)!;
    user.resumes.push({ id: r.id, title: r.title || '제목 없음', updatedAt: r.updatedAt });
    user.resumeCount++;
    const skillNames = extractSkillNames(r.skills);
    for (const s of skillNames) {
      if (!user.skills.includes(s)) user.skills.push(s);
    }
  }
  return Array.from(map.values());
}

const AVATAR_COLORS = [
  'bg-blue-500', 'bg-emerald-500', 'bg-purple-500', 'bg-orange-500',
  'bg-cyan-500', 'bg-rose-500', 'bg-amber-500', 'bg-teal-500',
  'bg-indigo-500', 'bg-pink-500',
];

function getAvatarColor(name: string): string {
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = ((hash << 5) - hash + name.charCodeAt(i)) | 0;
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length];
}

export default function ExplorePage() {
  const [params, setParams] = useSearchParams();
  const navigate = useNavigate();
  const [result, setResult] = useState<SearchResult | null>(null);
  const [activeTab, setActiveTab] = useState<'resumes' | 'people'>('resumes');
  const [followedUsers, setFollowedUsers] = useState<Set<string>>(() => {
    try { return new Set(JSON.parse(localStorage.getItem('followed-users') || '[]')); } catch { return new Set(); }
  });

  useEffect(() => {
    document.title = '공개 이력서 탐색 — 이력서공방';
    return () => { document.title = '이력서공방 - AI 기반 이력서 관리 플랫폼'; };
  }, []);
  const [tags, setTags] = useState<(Tag & { resumeCount: number })[]>([]);
  const [popularSkills, setPopularSkills] = useState<{ name: string; count: number }[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchInput, setSearchInput] = useState(params.get('q') || '');
  const [sortBy, setSortBy] = useState<'recent' | 'views'>('recent');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [recentSearches, setRecentSearches] = useState<string[]>(() => {
    try { return JSON.parse(localStorage.getItem('recent-searches') || '[]'); } catch { return []; }
  });

  const [searchFocused, setSearchFocused] = useState(false);
  const searchWrapperRef = useRef<HTMLDivElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout>>();

  const debouncedSearch = useCallback((value: string) => {
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      const next = new URLSearchParams(params);
      if (value) {
        next.set('q', value);
      } else {
        next.delete('q');
      }
      next.delete('page');
      setParams(next);
    }, 300);
  }, [params, setParams]);

  useEffect(() => {
    return () => clearTimeout(debounceRef.current);
  }, []);

  const query = params.get('q') || '';
  const tag = params.get('tag') || '';
  const page = parseInt(params.get('page') || '1');

  const search = async (signal?: AbortSignal) => {
    setLoading(true);
    try {
      const qs = new URLSearchParams();
      if (query) qs.set('q', query);
      if (tag) qs.set('tag', tag);
      if (sortBy === 'views') qs.set('sort', 'views');
      qs.set('page', String(page));
      qs.set('limit', params.get('limit') || '12');

      const res = await fetch(`${API_URL}/api/resumes/public?${qs}`, { signal });
      if (res.ok && !signal?.aborted) setResult(await res.json());
    } catch (err) {
      if (signal?.aborted) return;
    } finally {
      if (!signal?.aborted) setLoading(false);
    }
  };

  useEffect(() => {
    const ac = new AbortController();
    search(ac.signal);
    return () => ac.abort();
  }, [query, tag, page, sortBy, params.get('limit')]);

  useEffect(() => {
    let cancelled = false;
    fetchTags().then(t => { if (!cancelled) setTags(t); }).catch(() => {});
    return () => { cancelled = true; };
  }, []);

  useEffect(() => {
    const API = import.meta.env.VITE_API_URL || '';
    fetch(`${API}/api/resumes/popular-skills`)
      .then(r => r.ok ? r.json() : [])
      .then(setPopularSkills)
      .catch(() => {});
  }, []);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const next = new URLSearchParams(params);
    if (searchInput) {
      next.set('q', searchInput);
      const updated = [searchInput, ...recentSearches.filter(s => s !== searchInput)].slice(0, 5);
      setRecentSearches(updated);
      localStorage.setItem('recent-searches', JSON.stringify(updated));
    } else next.delete('q');
    next.delete('page');
    setParams(next);
  };

  const toggleTag = (tagName: string) => {
    const next = new URLSearchParams(params);
    if (tag === tagName) next.delete('tag');
    else next.set('tag', tagName);
    next.delete('page');
    setParams(next);
  };

  const goPage = (p: number) => {
    const next = new URLSearchParams(params);
    next.set('page', String(p));
    setParams(next);
  };

  const users = useMemo(() => result ? aggregateUsers(result.data) : [], [result]);

  // Recommended connections: compare current user's skills against public users
  const [mySkills, setMySkills] = useState<string[]>([]);
  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) return;
    fetchResumes()
      .then(myResumes => {
        const skills: string[] = [];
        for (const r of myResumes) {
          const names = extractSkillNames(r.skills);
          for (const s of names) {
            if (!skills.includes(s)) skills.push(s);
          }
        }
        setMySkills(skills);
      })
      .catch(() => {});
  }, []);

  const currentUserId = useMemo(() => {
    try { return JSON.parse(localStorage.getItem('user') || '{}').id; } catch { return null; }
  }, []);

  const recommendedUsers = useMemo(() => {
    if (mySkills.length === 0 || users.length === 0) return [];
    return users
      .filter(u => u.userId !== currentUserId)
      .map(u => {
        const overlap = u.skills.filter(s => mySkills.some(ms => ms.toLowerCase() === s.toLowerCase()));
        return { ...u, matchCount: overlap.length, matchedSkills: overlap };
      })
      .filter(u => u.matchCount > 0)
      .sort((a, b) => b.matchCount - a.matchCount)
      .slice(0, 6);
  }, [users, mySkills, currentUserId]);

  const toggleFollow = (userId: string) => {
    setFollowedUsers(prev => {
      const next = new Set(prev);
      if (next.has(userId)) next.delete(userId);
      else next.add(userId);
      localStorage.setItem('followed-users', JSON.stringify(Array.from(next)));
      return next;
    });
  };

  return (
    <>
      <Header />
      <main id="main-content" className="flex-1 max-w-6xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-6 sm:py-8" role="main">
        <h1 className="text-xl sm:text-2xl font-bold text-slate-900 mb-2">공개 이력서 탐색</h1>
        <p className="text-sm text-slate-500 mb-6">공개 설정된 이력서를 검색하고 열람할 수 있습니다.</p>

        {(() => { const u = getUser(); return u && (u.userType === 'recruiter' || u.userType === 'company') ? (
          <div className="mb-4 p-3 bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800 rounded-xl flex items-center gap-3">
            <span className="text-lg">🔍</span>
            <div>
              <p className="text-sm font-medium text-emerald-800 dark:text-emerald-300">인재 검색 모드</p>
              <p className="text-xs text-emerald-600 dark:text-emerald-400">관심있는 이력서를 클릭하여 상세 확인 후 스카우트 제안을 보내세요</p>
            </div>
          </div>
        ) : null; })()}

        {(() => { const u = getUser(); return u && (!u?.plan || u.plan === 'free') ? (
          <div className="mb-4 p-3 bg-gradient-to-r from-purple-50 to-blue-50 dark:from-purple-900/20 dark:to-blue-900/20 border border-purple-200 dark:border-purple-800 rounded-xl flex flex-col sm:flex-row items-center justify-between gap-2">
            <p className="text-sm text-purple-800 dark:text-purple-300">
              ⭐ <strong>프로 플랜</strong>으로 AI 무제한, 번역, 자소서 기능을 사용하세요
            </p>
            <Link to="/pricing" className="shrink-0 px-3 py-1 bg-purple-600 text-white text-xs font-medium rounded-lg hover:bg-purple-700 transition-colors">
              업그레이드
            </Link>
          </div>
        ) : null; })()}

        {/* 검색바 + 최근 검색 드롭다운 */}
        <div className="relative mb-4" ref={searchWrapperRef}>
          <form onSubmit={handleSearch} className="flex gap-2">
            <input
              type="search"
              role="searchbox"
              value={searchInput}
              onChange={e => { setSearchInput(e.target.value); debouncedSearch(e.target.value); }}
              onFocus={() => setSearchFocused(true)}
              onBlur={() => setTimeout(() => setSearchFocused(false), 200)}
              placeholder="이름, 제목, 기술 키워드로 검색..."
              aria-label="공개 이력서 검색"
              className="flex-1 px-4 py-2.5 border border-slate-200 rounded-xl text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-300 dark:bg-slate-800 dark:border-slate-600 dark:text-slate-100 transition-colors duration-200"
            />
            <button type="submit" className="px-6 py-2.5 bg-blue-600 text-white text-sm font-medium rounded-xl hover:bg-blue-700 shadow-sm hover:shadow focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-all duration-200">
              검색
            </button>
          </form>

          {/* 최근 검색어 드롭다운 */}
          {searchFocused && !searchInput && recentSearches.length > 0 && (
            <div className="absolute z-20 top-full left-0 right-12 mt-1 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl shadow-lg overflow-hidden animate-fade-in-up">
              <div className="flex items-center justify-between px-4 py-2.5 border-b border-slate-100 dark:border-slate-700">
                <span className="text-xs font-medium text-slate-500 dark:text-slate-400">최근 검색어</span>
                <button
                  onMouseDown={e => { e.preventDefault(); setRecentSearches([]); localStorage.removeItem('recent-searches'); }}
                  className="text-xs text-slate-400 dark:text-slate-500 hover:text-red-500 transition-colors"
                >
                  전체 삭제
                </button>
              </div>
              {recentSearches.map(s => (
                <div key={s} className="flex items-center justify-between px-4 py-2 hover:bg-slate-50 dark:hover:bg-slate-750 transition-colors group">
                  <button
                    onMouseDown={e => {
                      e.preventDefault();
                      setSearchInput(s);
                      const next = new URLSearchParams(params);
                      next.set('q', s);
                      next.delete('page');
                      setParams(next);
                      setSearchFocused(false);
                    }}
                    className="flex items-center gap-2 flex-1 text-left"
                  >
                    <svg className="w-3.5 h-3.5 text-slate-400 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <span className="text-sm text-slate-700 dark:text-slate-300">{s}</span>
                  </button>
                  <button
                    onMouseDown={e => {
                      e.preventDefault();
                      const updated = recentSearches.filter(r => r !== s);
                      setRecentSearches(updated);
                      localStorage.setItem('recent-searches', JSON.stringify(updated));
                    }}
                    className="p-1 text-slate-300 dark:text-slate-600 hover:text-slate-500 opacity-0 group-hover:opacity-100 transition-opacity"
                    aria-label={`"${s}" 삭제`}
                  >
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* 탭: 이력서 | 사람 */}
        <div className="flex items-center gap-0 mb-4 border-b border-slate-200 dark:border-slate-700" role="tablist" aria-label="탐색 탭">
          <button
            role="tab"
            id="tab-resumes"
            aria-selected={activeTab === 'resumes'}
            aria-controls="tabpanel-resumes"
            onClick={() => setActiveTab('resumes')}
            className={`px-4 py-2.5 text-sm font-medium border-b-2 transition-colors ${
              activeTab === 'resumes'
                ? 'border-blue-600 text-blue-600 dark:text-blue-400 dark:border-blue-400'
                : 'border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300'
            }`}
          >
            <span className="flex items-center gap-1.5">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
              이력서
            </span>
          </button>
          <button
            role="tab"
            id="tab-people"
            aria-selected={activeTab === 'people'}
            aria-controls="tabpanel-people"
            onClick={() => setActiveTab('people')}
            className={`px-4 py-2.5 text-sm font-medium border-b-2 transition-colors ${
              activeTab === 'people'
                ? 'border-blue-600 text-blue-600 dark:text-blue-400 dark:border-blue-400'
                : 'border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300'
            }`}
          >
            <span className="flex items-center gap-1.5">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
              사람
              {users.length > 0 && <span className="ml-1 px-1.5 py-0.5 text-xs bg-slate-100 dark:bg-slate-700 rounded-full">{users.length}</span>}
            </span>
          </button>
        </div>

        {/* 정렬 + 보기 모드 */}
        <div className="flex items-center gap-2 mb-4 overflow-x-auto scrollbar-none">
          <span className="text-xs text-slate-500 dark:text-slate-400">정렬:</span>
          <button
            onClick={() => setSortBy('recent')}
            className={`px-3 py-1.5 text-xs rounded-lg transition-colors ${sortBy === 'recent' ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 font-medium' : 'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400'}`}
          >
            최신순
          </button>
          <button
            onClick={() => setSortBy('views')}
            className={`px-3 py-1.5 text-xs rounded-lg transition-colors ${sortBy === 'views' ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 font-medium' : 'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400'}`}
          >
            인기순
          </button>
          <div className="ml-auto flex items-center gap-1">
            <button
              onClick={() => setViewMode('grid')}
              className={`p-1.5 rounded-lg transition-colors ${viewMode === 'grid' ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-600' : 'text-slate-400 hover:text-slate-600'}`}
              aria-label="그리드 보기"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" /></svg>
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`p-1.5 rounded-lg transition-colors ${viewMode === 'list' ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-600' : 'text-slate-400 hover:text-slate-600'}`}
              aria-label="리스트 보기"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" /></svg>
            </button>
          </div>
        </div>

        {/* 태그 필터 */}
        {tags.length > 0 && (
          <div className="flex gap-2 mb-6 overflow-x-auto py-1 -my-1 px-1 -mx-1" role="group" aria-label="태그 필터">
            {tags.map(t => (
              <button
                key={t.id}
                onClick={() => toggleTag(t.name)}
                className={`px-3 py-1.5 text-xs font-medium rounded-full whitespace-nowrap transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  tag === t.name ? 'text-white' : 'text-slate-600 hover:opacity-80'
                }`}
                style={{
                  backgroundColor: tag === t.name ? t.color : `${t.color}20`,
                }}
                aria-pressed={tag === t.name}
              >
                {t.name}
              </button>
            ))}
          </div>
        )}

        {/* 직종 카테고리 빠른 필터 */}
        <div className="flex gap-2 mb-4 overflow-x-auto pb-1">
          {['전체', '개발', '디자인', '기획/PM', '데이터', '마케팅'].map(cat => (
            <button
              key={cat}
              onClick={() => {
                if (cat === '전체') {
                  const next = new URLSearchParams(params);
                  next.delete('q');
                  next.delete('page');
                  setSearchInput('');
                  setParams(next);
                } else {
                  setSearchInput(cat);
                  const next = new URLSearchParams(params);
                  next.set('q', cat);
                  next.delete('page');
                  setParams(next);
                }
              }}
              className={`px-3 py-1.5 text-xs font-medium rounded-full whitespace-nowrap transition-colors ${
                (cat === '전체' && !query) || query === cat
                  ? 'bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* 인기 기술 */}
        {popularSkills.length > 0 && (
          <div className="mb-6">
            <h3 className="text-xs font-medium text-slate-500 dark:text-slate-400 mb-2">인기 기술</h3>
            <div className="flex flex-wrap gap-1.5">
              {popularSkills.slice(0, 15).map((skill, i) => {
                const size = i < 3 ? 'text-sm font-medium' : i < 8 ? 'text-xs' : 'text-xs opacity-70';
                return (
                  <button
                    key={skill.name}
                    onClick={() => { setSearchInput(skill.name); const next = new URLSearchParams(params); next.set('q', skill.name); next.delete('page'); setParams(next); }}
                    className={`px-2.5 py-1 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 rounded-full hover:bg-blue-100 dark:hover:bg-blue-900/30 hover:text-blue-600 dark:hover:text-blue-400 transition-colors ${size}`}
                  >
                    {skill.name}
                    <span className="ml-1 text-slate-400 dark:text-slate-500">({skill.count})</span>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* 결과 */}
        {loading ? (
          <div aria-busy="true" aria-label="검색 결과 불러오는 중"><CardGridSkeleton count={6} /></div>
        ) : !result || result.data.length === 0 ? (
          (query || tag) ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <svg className="w-16 h-16 text-slate-300 dark:text-slate-600 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <h3 className="text-lg font-semibold text-slate-700 dark:text-slate-300 mb-2">검색 결과 없음</h3>
              <p className="text-sm text-slate-500 dark:text-slate-400 max-w-md">
                {query && <>"<span className="font-medium">{query}</span>"에 대한 검색 결과가 없습니다.<br /></>}
                {tag && <>태그 "<span className="font-medium">{tag}</span>"에 해당하는 이력서가 없습니다.<br /></>}
                다른 키워드나 필터로 다시 검색해 보세요.
              </p>
              <button
                onClick={() => { setSearchInput(''); const next = new URLSearchParams(); setParams(next); }}
                className="mt-4 px-4 py-2 text-sm bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors"
              >
                필터 초기화
              </button>
            </div>
          ) : (
            <EmptyState type="resume" />
          )
        ) : activeTab === 'people' ? (
          /* ===== 사람 탭 ===== */
          <div role="tabpanel" id="tabpanel-people" aria-labelledby="tab-people">
            {/* 추천 연결 */}
            {recommendedUsers.length > 0 && !query && (
              <div className="mb-6">
                <div className="flex items-center gap-2 mb-3">
                  <svg className="w-4 h-4 text-amber-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                  <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-300">추천 연결</h3>
                  <span className="text-xs text-slate-400 dark:text-slate-500">나와 비슷한 기술 스택을 가진 사용자</span>
                </div>
                <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-none">
                  {recommendedUsers.map(user => {
                    const initial = user.name.charAt(0).toUpperCase();
                    const avatarColor = getAvatarColor(user.name);
                    const isFollowed = followedUsers.has(user.userId);
                    return (
                      <div
                        key={`rec-${user.userId}`}
                        className="shrink-0 w-56 bg-gradient-to-br from-white to-slate-50 dark:from-slate-800 dark:to-slate-800/80 rounded-2xl border border-amber-200 dark:border-amber-800/50 p-4 hover:shadow-md hover:border-amber-300 dark:hover:border-amber-700 transition-all duration-200"
                      >
                        <div className="flex items-center gap-2.5 mb-2.5">
                          <div className={`w-9 h-9 rounded-full ${avatarColor} flex items-center justify-center text-white font-bold text-sm shrink-0`}>
                            {initial}
                          </div>
                          <div className="min-w-0 flex-1">
                            <h4 className="text-sm font-semibold text-slate-900 dark:text-slate-100 truncate">{user.name}</h4>
                            <p className="text-[10px] text-amber-600 dark:text-amber-400 font-medium">
                              {user.matchCount}개 기술 일치
                            </p>
                          </div>
                        </div>
                        <div className="flex flex-wrap gap-1 mb-3">
                          {user.matchedSkills.slice(0, 3).map(s => (
                            <span key={s} className="px-1.5 py-0.5 text-[10px] bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-400 rounded font-medium">
                              {s}
                            </span>
                          ))}
                          {user.matchedSkills.length > 3 && (
                            <span className="px-1.5 py-0.5 text-[10px] text-slate-400">+{user.matchedSkills.length - 3}</span>
                          )}
                        </div>
                        <button
                          onClick={() => toggleFollow(user.userId)}
                          className={`w-full px-3 py-1.5 text-xs font-medium rounded-lg transition-colors ${
                            isFollowed
                              ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400'
                              : 'bg-amber-500 text-white hover:bg-amber-600'
                          }`}
                        >
                          {isFollowed ? '팔로잉' : '+ 연결하기'}
                        </button>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            <p className="text-sm text-slate-500 dark:text-slate-400 mb-4">
              <span className="font-medium text-slate-700 dark:text-slate-300">{users.length}명</span>의 사용자
              {query && <> · "<span className="font-medium text-slate-700 dark:text-slate-300">{query}</span>" 검색 결과</>}
            </p>

            {users.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 text-center">
                <svg className="w-16 h-16 text-slate-300 dark:text-slate-600 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                <h3 className="text-lg font-semibold text-slate-700 dark:text-slate-300 mb-2">사용자 없음</h3>
                <p className="text-sm text-slate-500 dark:text-slate-400">검색 조건에 맞는 사용자가 없습니다.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-5">
                {users.map(user => {
                  const initial = user.name.charAt(0).toUpperCase();
                  const avatarColor = getAvatarColor(user.name);
                  const isFollowed = followedUsers.has(user.userId);

                  return (
                    <div
                      key={user.userId}
                      className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-5 hover:shadow-md hover:border-blue-200 dark:hover:border-blue-800 transition-all duration-200 animate-fade-in-up"
                    >
                      {/* User header */}
                      <div className="flex items-center gap-3 mb-3">
                        <div className={`w-11 h-11 rounded-full ${avatarColor} flex items-center justify-center text-white font-bold text-lg shrink-0`}>
                          {initial}
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className="font-semibold text-slate-900 dark:text-slate-100 truncate">{user.name}</h3>
                          <p className="text-xs text-slate-500 dark:text-slate-400">
                            이력서 {user.resumeCount}개
                          </p>
                        </div>
                      </div>

                      {/* Skills summary */}
                      {user.skills.length > 0 && (
                        <div className="flex flex-wrap gap-1 mb-3">
                          {user.skills.slice(0, 5).map(s => (
                            <span key={s} className="px-1.5 py-0.5 text-xs bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 rounded">
                              {s}
                            </span>
                          ))}
                          {user.skills.length > 5 && (
                            <span className="px-1.5 py-0.5 text-xs text-slate-400">+{user.skills.length - 5}</span>
                          )}
                        </div>
                      )}

                      {/* Recent resumes */}
                      <div className="mb-3 space-y-1">
                        {user.resumes.slice(0, 3).map(r => (
                          <Link
                            key={r.id}
                            to={`/resumes/${r.id}/preview`}
                            className="flex items-center gap-2 text-xs text-slate-600 dark:text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors group"
                          >
                            <svg className="w-3 h-3 shrink-0 text-slate-400 group-hover:text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                            </svg>
                            <span className="truncate">{r.title}</span>
                          </Link>
                        ))}
                        {user.resumes.length > 3 && (
                          <p className="text-xs text-slate-400 pl-5">외 {user.resumes.length - 3}개</p>
                        )}
                      </div>

                      {/* Action buttons */}
                      <div className="flex items-center gap-2 pt-3 border-t border-slate-100 dark:border-slate-700">
                        <button
                          onClick={() => toggleFollow(user.userId)}
                          className={`flex-1 px-3 py-1.5 text-xs font-medium rounded-lg transition-colors ${
                            isFollowed
                              ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 hover:bg-blue-200 dark:hover:bg-blue-900/50'
                              : 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-600'
                          }`}
                        >
                          {isFollowed ? (
                            <span className="flex items-center justify-center gap-1">
                              <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 24 24"><path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41L9 16.17z" /></svg>
                              팔로잉
                            </span>
                          ) : (
                            <span className="flex items-center justify-center gap-1">
                              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
                              팔로우
                            </span>
                          )}
                        </button>
                        <button
                          onClick={() => navigate(`/messages?to=${user.userId}`)}
                          className="px-3 py-1.5 text-xs font-medium bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-400 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors"
                          title="쪽지 보내기"
                        >
                          <span className="flex items-center justify-center gap-1">
                            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                            </svg>
                            쪽지
                          </span>
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </>
        ) : (
          /* ===== 이력서 탭 ===== */
          <>
            {/* 인기 이력서 */}
            {!query && !tag && page === 1 && result.data.length > 0 && (
              <div className="mb-6">
                <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">인기 이력서</h3>
                <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-none">
                  {[...result.data].sort((a, b) => (b.viewCount || 0) - (a.viewCount || 0)).slice(0, 5).map(r => (
                    <Link
                      key={`trending-${r.id}`}
                      to={`/resumes/${r.id}/preview`}
                      className="card-hover shrink-0 w-48 p-3 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700"
                    >
                      <p className="text-sm font-medium text-slate-900 dark:text-slate-100 truncate">{r.title || '제목 없음'}</p>
                      <p className="text-xs text-slate-500 dark:text-slate-400 truncate">{r.personalInfo?.name}</p>
                      <div className="flex items-center gap-1 mt-1.5 text-xs text-slate-400">
                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
                        {r.viewCount || 0}
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            )}

            <p className="text-sm text-slate-500 dark:text-slate-400 mb-4">
              {(() => {
                const limit = parseInt(params.get('limit') || '12');
                const start = (result.page - 1) * limit + 1;
                const end = Math.min(result.page * limit, result.total);
                return <><span className="font-medium text-slate-700 dark:text-slate-300">{result.total}개</span> 중 {start}-{end}</>;
              })()}
              {query && <> · "<span className="font-medium text-slate-700 dark:text-slate-300">{query}</span>" 검색 결과</>}
              {tag && <> · 태그: <span className="font-medium text-slate-700 dark:text-slate-300">{tag}</span></>}
            </p>

            <div className={viewMode === 'grid' ? 'grid grid-cols-1 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-5' : 'space-y-3'}>
              {result.data.map(resume => {
                const themeIdx = getThemeIndex(resume.id);
                const skillNames = extractSkillNames(resume.skills);

                if (viewMode === 'list') {
                  return (
                    <Link
                      key={resume.id}
                      to={`/resumes/${resume.id}/preview`}
                      className="flex items-center gap-4 bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-4 hover:shadow-md hover:border-blue-200 dark:hover:border-blue-800 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 animate-fade-in-up"
                    >
                      {/* Theme dot */}
                      <div className={`w-2 h-2 rounded-full shrink-0 ${THEME_DOT_COLORS[themeIdx]}`} />

                      {/* Main info */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <h2 className="font-semibold text-slate-900 dark:text-slate-100 truncate">
                            {resume.title || '제목 없음'}
                          </h2>
                          <span className="text-xs text-slate-400 dark:text-slate-500 shrink-0">
                            {resume.personalInfo?.name || '이름 미입력'}
                          </span>
                        </div>
                        {resume.personalInfo?.summary && (
                          <p className="text-xs text-slate-400 line-clamp-1 mt-0.5">
                            {resume.personalInfo.summary.replace(/<[^>]*>/g, '')}
                          </p>
                        )}
                        <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                          {resume.tags?.slice(0, 3).map(t => (
                            <span key={t.id} className="px-1.5 py-0.5 text-xs rounded-full" style={{ backgroundColor: `${t.color}20`, color: t.color }}>
                              {t.name}
                            </span>
                          ))}
                          {skillNames.slice(0, 4).map(s => (
                            <span key={s} className="px-1.5 py-0.5 text-xs bg-slate-100 dark:bg-slate-700 text-slate-500 dark:text-slate-400 rounded">
                              {s}
                            </span>
                          ))}
                        </div>
                      </div>

                      {/* Right side: meta + bookmark */}
                      <div className="flex items-center gap-3 shrink-0">
                        <div className="text-right hidden sm:block">
                          <span className="text-xs text-slate-400 dark:text-slate-500 block">
                            {timeAgo(resume.updatedAt)}
                          </span>
                          {resume.viewCount != null && resume.viewCount > 0 && (
                            <span className="text-xs text-slate-400 dark:text-slate-500 flex items-center gap-0.5 justify-end mt-0.5">
                              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
                              {resume.viewCount}
                            </span>
                          )}
                        </div>
                        <BookmarkButton resumeId={resume.id} size="sm" />
                      </div>
                    </Link>
                  );
                }

                // Grid view
                return (
                  <Link
                    key={resume.id}
                    to={`/resumes/${resume.id}/preview`}
                    className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-5 hover:shadow-md hover:border-blue-200 dark:hover:border-blue-800 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 animate-fade-in-up"
                  >
                    {/* Theme color bar */}
                    <div className={`h-1 -mx-5 -mt-5 mb-4 rounded-t-2xl bg-gradient-to-r ${THEME_COLORS[themeIdx]}`} />

                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-2 flex-1 min-w-0">
                        <div className={`w-2 h-2 rounded-full shrink-0 ${THEME_DOT_COLORS[themeIdx]}`} />
                        <h2 className="font-semibold text-slate-900 dark:text-slate-100 truncate">
                          {resume.title || '제목 없음'}
                        </h2>
                      </div>
                      <BookmarkButton resumeId={resume.id} size="sm" />
                    </div>
                    <p className="text-sm text-slate-600 dark:text-slate-400 mb-1 ml-4">
                      {resume.personalInfo?.name || '이름 미입력'}
                    </p>
                    {resume.personalInfo?.summary && (
                      <p className="text-xs text-slate-400 line-clamp-2 mb-2">
                        {resume.personalInfo.summary.replace(/<[^>]*>/g, '')}
                      </p>
                    )}

                    {/* Skill tags */}
                    {skillNames.length > 0 && (
                      <div className="flex flex-wrap gap-1 mb-2">
                        {skillNames.slice(0, 4).map(s => (
                          <span key={s} className="px-1.5 py-0.5 text-xs bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 rounded">
                            {s}
                          </span>
                        ))}
                        {skillNames.length > 4 && (
                          <span className="px-1.5 py-0.5 text-xs text-slate-400">+{skillNames.length - 4}</span>
                        )}
                      </div>
                    )}

                    {/* Tags */}
                    {resume.tags?.length > 0 && (
                      <div className="flex flex-wrap gap-1 mb-2">
                        {resume.tags.map(t => (
                          <span key={t.id} className="px-1.5 py-0.5 text-xs rounded-full" style={{ backgroundColor: `${t.color}20`, color: t.color }}>
                            {t.name}
                          </span>
                        ))}
                      </div>
                    )}

                    {/* Footer: view count + relative time */}
                    <div className="flex items-center justify-between mt-2 text-xs text-slate-400 dark:text-slate-500">
                      <span>{timeAgo(resume.updatedAt)}</span>
                      {resume.viewCount != null && resume.viewCount > 0 && (
                        <span className="flex items-center gap-1">
                          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                          </svg>
                          {resume.viewCount}
                        </span>
                      )}
                    </div>
                  </Link>
                );
              })}
            </div>

            {/* 페이지네이션 */}
            {result.totalPages > 1 && (
              <div className="flex flex-wrap items-center justify-between gap-2 mt-8">
                <div className="flex items-center gap-2 text-sm text-slate-500 dark:text-slate-400">
                  <span className="text-xs">표시</span>
                  <select
                    value={params.get('limit') || '12'}
                    onChange={e => {
                      const next = new URLSearchParams(params);
                      next.set('limit', e.target.value);
                      next.set('page', '1');
                      setParams(next);
                    }}
                    className="px-2 py-1 text-xs border border-slate-200 dark:border-slate-600 rounded-lg dark:bg-slate-800 dark:text-slate-300 focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="6">6개</option>
                    <option value="12">12개</option>
                    <option value="24">24개</option>
                  </select>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => goPage(page - 1)}
                    disabled={page <= 1}
                    className="px-3 py-1.5 text-sm font-medium bg-slate-100 rounded-xl hover:bg-slate-200 disabled:opacity-30 transition-colors"
                  >
                    이전
                  </button>
                  <span className="text-sm text-slate-500">
                    {result.page} / {result.totalPages}
                  </span>
                  <button
                    onClick={() => goPage(page + 1)}
                    disabled={page >= result.totalPages}
                    className="px-3 py-1.5 text-sm font-medium bg-slate-100 rounded-xl hover:bg-slate-200 disabled:opacity-30 transition-colors"
                  >
                    다음
                  </button>
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
