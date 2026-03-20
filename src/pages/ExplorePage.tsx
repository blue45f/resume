import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import Header from '@/components/Header';
import { CardGridSkeleton } from '@/components/Skeleton';
import type { ResumeSummary, Tag } from '@/types/resume';
import { fetchTags } from '@/lib/api';

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
  const [tags, setTags] = useState<(Tag & { resumeCount: number })[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchInput, setSearchInput] = useState(params.get('q') || '');
  const [sortBy, setSortBy] = useState<'recent' | 'views'>('recent');

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
      qs.set('limit', '12');

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
  }, [query, tag, page, sortBy]);

  useEffect(() => {
    let cancelled = false;
    fetchTags().then(t => { if (!cancelled) setTags(t); }).catch(() => {});
    return () => { cancelled = true; };
  }, []);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const next = new URLSearchParams(params);
    if (searchInput) next.set('q', searchInput);
    else next.delete('q');
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

        {/* 정렬 */}
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

        {/* 결과 */}
        {loading ? (
          <CardGridSkeleton count={6} />
        ) : !result || result.data.length === 0 ? (
          <div className="text-center py-16">
            <p className="text-4xl mb-3" aria-hidden="true">🔍</p>
            <p className="text-slate-500">
              {query || tag ? '검색 결과가 없습니다' : '공개된 이력서가 없습니다'}
            </p>
            <p className="text-xs text-slate-400 mt-1">이력서 편집에서 공개 설정을 하면 여기에 노출됩니다.</p>
          </div>
        ) : (
          <>
            <p className="text-sm text-slate-500 mb-4">
              총 {result.total}개의 공개 이력서
              {query && <> · "<span className="font-medium text-slate-700">{query}</span>" 검색 결과</>}
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {result.data.map(resume => (
                <Link
                  key={resume.id}
                  to={`/resumes/${resume.id}/preview`}
                  className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-5 hover:shadow-md hover:border-blue-200 dark:hover:border-blue-800 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 animate-fade-in-up"
                >
                  <h2 className="font-semibold text-slate-900 truncate mb-1">
                    {resume.title || '제목 없음'}
                  </h2>
                  <p className="text-sm text-slate-600 mb-1">
                    {resume.personalInfo?.name || '이름 미입력'}
                  </p>
                  {resume.personalInfo?.summary && (
                    <p className="text-xs text-slate-400 line-clamp-2 mb-2">
                      {resume.personalInfo.summary}
                    </p>
                  )}
                  {resume.tags?.length > 0 && (
                    <div className="flex flex-wrap gap-1">
                      {resume.tags.map(t => (
                        <span key={t.id} className="px-1.5 py-0.5 text-xs rounded-full" style={{ backgroundColor: `${t.color}20`, color: t.color }}>
                          {t.name}
                        </span>
                      ))}
                    </div>
                  )}
                </Link>
              ))}
            </div>

            {/* 페이지네이션 */}
            {result.totalPages > 1 && (
              <div className="flex items-center justify-center gap-2 mt-8">
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
            )}
          </>
        )}
      </main>
    </>
  );
}
