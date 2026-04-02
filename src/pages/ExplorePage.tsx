import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { CardGridSkeleton } from '@/components/Skeleton';
import EmptyState from '@/components/EmptyState';
import type { ResumeSummary, Tag } from '@/types/resume';
import { fetchTags } from '@/lib/api';
import BookmarkButton from '@/components/BookmarkButton';

const API_URL = import.meta.env.VITE_API_URL || '';

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

        {/* 검색바 */}
        <form onSubmit={handleSearch} className="flex gap-2 mb-4">
          <input
            type="search"
            value={searchInput}
            onChange={e => setSearchInput(e.target.value)}
            placeholder="이름, 제목, 기술 키워드로 검색..."
            className="flex-1 px-4 py-2.5 border border-slate-200 rounded-xl text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-300 dark:bg-slate-800 dark:border-slate-600 dark:text-slate-100 transition-colors duration-200"
          />
          <button type="submit" className="px-6 py-2.5 bg-blue-600 text-white text-sm font-medium rounded-xl hover:bg-blue-700 shadow-sm hover:shadow focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-all duration-200">
            검색
          </button>
        </form>

        {/* 최근 검색 */}
        {!query && recentSearches.length > 0 && (
          <div className="flex items-center gap-2 mb-3">
            <span className="text-xs text-slate-400 dark:text-slate-500 shrink-0">최근</span>
            <div className="flex gap-1.5 overflow-x-auto">
              {recentSearches.map(s => (
                <button
                  key={s}
                  onClick={() => { setSearchInput(s); const next = new URLSearchParams(params); next.set('q', s); next.delete('page'); setParams(next); }}
                  className="px-2.5 py-1 text-xs bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 rounded-full hover:bg-blue-100 dark:hover:bg-blue-900/30 hover:text-blue-600 transition-colors whitespace-nowrap"
                >
                  {s}
                </button>
              ))}
              <button
                onClick={() => { setRecentSearches([]); localStorage.removeItem('recent-searches'); }}
                className="text-xs text-slate-300 dark:text-slate-600 hover:text-slate-500 shrink-0"
                aria-label="검색 기록 삭제"
              >
                &times;
              </button>
            </div>
          </div>
        )}

        {/* 정렬 + 보기 모드 */}
        <div className="flex items-center gap-2 mb-4">
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
          <div className="flex gap-2 mb-6 overflow-x-auto pb-2" role="group" aria-label="태그 필터">
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
          <EmptyState type={query || tag ? 'search' : 'resume'} query={query || undefined} />
        ) : (
          <>
            <p className="text-sm text-slate-500 mb-4">
              총 {result.total}개의 공개 이력서
              {query && <> · "<span className="font-medium text-slate-700">{query}</span>" 검색 결과</>}
            </p>

            <div className={viewMode === 'grid' ? 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4' : 'space-y-3'}>
              {result.data.map(resume => (
                <Link
                  key={resume.id}
                  to={`/resumes/${resume.id}/preview`}
                  className={`bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-5 hover:shadow-md hover:border-blue-200 dark:hover:border-blue-800 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 animate-fade-in-up ${viewMode === 'list' ? 'flex items-center gap-4' : ''}`}
                >
                  <div className={viewMode === 'list' ? 'flex-1 min-w-0' : ''}>
                    <div className="flex items-start justify-between">
                      <h2 className="font-semibold text-slate-900 dark:text-slate-100 truncate mb-1 flex-1">
                        {resume.title || '제목 없음'}
                      </h2>
                      <BookmarkButton resumeId={resume.id} size="sm" />
                    </div>
                    <p className="text-sm text-slate-600 mb-1">
                      {resume.personalInfo?.name || '이름 미입력'}
                    </p>
                    {resume.personalInfo?.summary && (
                      <p className={`text-xs text-slate-400 ${viewMode === 'list' ? 'line-clamp-1' : 'line-clamp-2'} mb-2`}>
                        {resume.personalInfo.summary.replace(/<[^>]*>/g, '')}
                      </p>
                    )}
                  </div>
                  {resume.tags?.length > 0 && (
                    <div className={`flex flex-wrap gap-1 ${viewMode === 'list' ? 'shrink-0' : ''}`}>
                      {(viewMode === 'list' ? resume.tags.slice(0, 3) : resume.tags).map(t => (
                        <span key={t.id} className="px-1.5 py-0.5 text-xs rounded-full" style={{ backgroundColor: `${t.color}20`, color: t.color }}>
                          {t.name}
                        </span>
                      ))}
                    </div>
                  )}
                  {resume.viewCount != null && resume.viewCount > 0 && (
                    <div className="flex items-center gap-1 mt-2 text-xs text-slate-400 dark:text-slate-500">
                      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                      </svg>
                      {resume.viewCount}
                    </div>
                  )}
                </Link>
              ))}
            </div>

            {/* 페이지네이션 */}
            {result.totalPages > 1 && (
              <div className="flex items-center justify-between gap-2 mt-8">
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
