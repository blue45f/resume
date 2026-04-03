import { useEffect, useState, useCallback, useRef } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
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

export default function ExplorePage() {
  const [params, setParams] = useSearchParams();
  const [result, setResult] = useState<SearchResult | null>(null);

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
              value={searchInput}
              onChange={e => { setSearchInput(e.target.value); debouncedSearch(e.target.value); }}
              onFocus={() => setSearchFocused(true)}
              onBlur={() => setTimeout(() => setSearchFocused(false), 200)}
              placeholder="이름, 제목, 기술 키워드로 검색..."
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
          <CardGridSkeleton count={6} />
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
        ) : (
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

            <div className={viewMode === 'grid' ? 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4' : 'space-y-3'}>
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
