import { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { type CoachProfile } from '@/lib/api';
import { useCoaches } from '@/hooks/useResources';
import { ROUTES } from '@/lib/routes';

type SortKey = 'rating' | 'rateAsc' | 'rateDesc';

const SPECIALTIES = [
  '이력서 첨삭',
  '자기소개서',
  '면접 코칭',
  '커리어 상담',
  '포트폴리오',
  '연봉 협상',
  '이직 전략',
  '기타',
];

export default function CoachesPage() {
  const [specialty, setSpecialty] = useState('');
  const [minRate, setMinRate] = useState('');
  const [maxRate, setMaxRate] = useState('');
  const [sortBy, setSortBy] = useState<SortKey>('rating');

  const {
    data,
    isLoading: loading,
    error: queryError,
  } = useCoaches({
    specialty: specialty || undefined,
    minRate: minRate ? Number(minRate) : undefined,
    maxRate: maxRate ? Number(maxRate) : undefined,
  });
  const coaches: CoachProfile[] = Array.isArray(data) ? data : [];
  const error = queryError
    ? (queryError as Error)?.message || '코치 목록을 불러오지 못했습니다'
    : null;

  useEffect(() => {
    document.title = '코치 찾기 — 이력서공방';
    return () => {
      document.title = '이력서공방 - AI 기반 이력서 관리 플랫폼';
    };
  }, []);

  const sortedCoaches = useMemo(() => {
    const arr = [...coaches];
    if (sortBy === 'rating') arr.sort((a, b) => (b.avgRating || 0) - (a.avgRating || 0));
    else if (sortBy === 'rateAsc') arr.sort((a, b) => (a.hourlyRate || 0) - (b.hourlyRate || 0));
    else if (sortBy === 'rateDesc') arr.sort((a, b) => (b.hourlyRate || 0) - (a.hourlyRate || 0));
    return arr;
  }, [coaches, sortBy]);

  const resetFilters = () => {
    setSpecialty('');
    setMinRate('');
    setMaxRate('');
    setSortBy('rating');
  };

  return (
    <>
      <Header />
      <main
        id="main-content"
        className="flex-1 max-w-6xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-6 sm:py-8"
        role="main"
      >
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-cyan-600 rounded-xl flex items-center justify-center shadow-sm">
              <svg
                className="w-5 h-5 text-white"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                aria-hidden="true"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M17 20h5v-2a4 4 0 00-3-3.87M9 20H4v-2a4 4 0 013-3.87m6 0a4 4 0 10-4-4 4 4 0 004 4z"
                />
              </svg>
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-slate-100">
                전문 코치 찾기
              </h1>
              <p className="text-sm text-slate-500 dark:text-slate-400">
                이력서, 면접, 커리어 전문가와 1:1 매칭
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Link
              to={ROUTES.coaching.profileEdit}
              className="inline-flex items-center justify-center gap-1 px-3.5 py-2 text-xs font-semibold rounded-lg bg-gradient-to-br from-blue-600 to-cyan-600 text-white shadow-sm hover:shadow-md transition-all whitespace-nowrap"
            >
              🎓 나도 코치 되기
            </Link>
            <Link
              to={ROUTES.coaching.sessions}
              className="inline-flex items-center justify-center px-3.5 py-2 text-xs font-medium rounded-lg border border-slate-200 dark:border-slate-600 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700/50 whitespace-nowrap"
            >
              내 세션 관리 →
            </Link>
          </div>
        </div>

        {/* 코치 되기 안내 배너 */}
        <div className="mb-5 p-4 rounded-xl bg-gradient-to-r from-blue-50 to-cyan-50 dark:from-blue-900/20 dark:to-cyan-900/20 border border-blue-100 dark:border-blue-900/40">
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 justify-between">
            <div className="flex items-start gap-3">
              <div className="shrink-0 w-10 h-10 rounded-lg bg-white dark:bg-slate-800 flex items-center justify-center text-xl">
                🎓
              </div>
              <div>
                <h2 className="text-sm font-semibold text-slate-900 dark:text-slate-100 mb-0.5">
                  나도 코치로 활동하고 싶다면?
                </h2>
                <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                  전문 분야 · 시급 · 가능 시간만 입력하면 몇 분 안에 코치 프로필이 완성됩니다.
                  수수료는 15% (플랫폼 유지비)로 업계 최저 수준입니다.
                </p>
              </div>
            </div>
            <Link
              to={ROUTES.coaching.profileEdit}
              className="shrink-0 inline-flex items-center gap-1 px-4 py-2 text-xs font-semibold rounded-lg bg-white dark:bg-slate-800 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800 hover:bg-blue-50 dark:hover:bg-blue-900/30 transition-colors whitespace-nowrap"
            >
              프로필 등록 →
            </Link>
          </div>
        </div>

        {/* Filter bar */}
        <div className="imp-card p-4 mb-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            <div>
              <label className="block text-[11px] font-medium text-slate-500 dark:text-slate-400 mb-1">
                전문 분야
              </label>
              <select
                value={specialty}
                onChange={(e) => setSpecialty(e.target.value)}
                className="w-full px-3 py-2 text-sm border border-slate-200 dark:border-slate-600 rounded-lg dark:bg-slate-900 dark:text-slate-100"
              >
                <option value="">전체</option>
                {SPECIALTIES.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-[11px] font-medium text-slate-500 dark:text-slate-400 mb-1">
                최소 시급 (원)
              </label>
              <input
                type="number"
                inputMode="numeric"
                min={0}
                step={1000}
                placeholder="예: 30000"
                value={minRate}
                onChange={(e) => setMinRate(e.target.value)}
                className="w-full px-3 py-2 text-sm border border-slate-200 dark:border-slate-600 rounded-lg dark:bg-slate-900 dark:text-slate-100"
              />
            </div>
            <div>
              <label className="block text-[11px] font-medium text-slate-500 dark:text-slate-400 mb-1">
                최대 시급 (원)
              </label>
              <input
                type="number"
                inputMode="numeric"
                min={0}
                step={1000}
                placeholder="예: 150000"
                value={maxRate}
                onChange={(e) => setMaxRate(e.target.value)}
                className="w-full px-3 py-2 text-sm border border-slate-200 dark:border-slate-600 rounded-lg dark:bg-slate-900 dark:text-slate-100"
              />
            </div>
            <div>
              <label className="block text-[11px] font-medium text-slate-500 dark:text-slate-400 mb-1">
                정렬
              </label>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as SortKey)}
                className="w-full px-3 py-2 text-sm border border-slate-200 dark:border-slate-600 rounded-lg dark:bg-slate-900 dark:text-slate-100"
              >
                <option value="rating">평점순</option>
                <option value="rateAsc">시급 낮은순</option>
                <option value="rateDesc">시급 높은순</option>
              </select>
            </div>
          </div>
          {(specialty || minRate || maxRate || sortBy !== 'rating') && (
            <div className="mt-3 flex justify-end">
              <button
                onClick={resetFilters}
                className="text-xs text-slate-400 hover:text-slate-600 dark:text-slate-500 dark:hover:text-slate-300"
              >
                필터 초기화
              </button>
            </div>
          )}
        </div>

        {/* Coach grid */}
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="imp-card p-5 animate-pulse">
                <div className="flex items-center gap-3">
                  <div className="w-14 h-14 bg-slate-200 dark:bg-slate-700 rounded-full" />
                  <div className="flex-1 space-y-2">
                    <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-2/3" />
                    <div className="h-3 bg-slate-200 dark:bg-slate-700 rounded w-1/2" />
                  </div>
                </div>
                <div className="mt-4 space-y-2">
                  <div className="h-3 bg-slate-200 dark:bg-slate-700 rounded" />
                  <div className="h-3 bg-slate-200 dark:bg-slate-700 rounded w-5/6" />
                </div>
              </div>
            ))}
          </div>
        ) : error ? (
          <div className="imp-card p-8 text-center">
            <p className="text-sm text-red-500 mb-2">{error}</p>
            <button
              onClick={() => {
                setSpecialty('');
                setMinRate('');
                setMaxRate('');
              }}
              className="text-xs text-blue-600 hover:text-blue-800"
            >
              다시 시도
            </button>
          </div>
        ) : sortedCoaches.length === 0 ? (
          <div className="imp-card p-10 text-center">
            <p className="text-4xl mb-3">🎯</p>
            <h3 className="text-sm font-semibold text-slate-800 dark:text-slate-200 mb-1">
              조건에 맞는 코치가 없습니다
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mb-4">
              필터를 조정하거나 모든 코치를 확인해보세요
            </p>
            <button
              onClick={resetFilters}
              className="px-4 py-2 text-xs font-medium rounded-lg bg-blue-600 hover:bg-blue-700 text-white transition-colors"
            >
              필터 초기화
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {sortedCoaches.map((coach) => (
              <CoachCard key={coach.id} coach={coach} />
            ))}
          </div>
        )}
      </main>
      <Footer />
    </>
  );
}

function CoachCard({ coach }: { coach: CoachProfile }) {
  const name = coach.user?.name || '익명 코치';
  const avatar = coach.user?.avatar || '';
  const initials = (name || 'C').slice(0, 1).toUpperCase();
  const bioExcerpt =
    (coach.bio || '').length > 90
      ? (coach.bio || '').slice(0, 90).trim() + '...'
      : coach.bio || '소개글이 아직 없습니다';
  const rating = coach.avgRating || 0;
  const rate = coach.hourlyRate || 0;
  const sessions = coach.totalSessions || 0;

  return (
    <article className="imp-card p-5 flex flex-col card-hover">
      <div className="flex items-start gap-3">
        {avatar ? (
          <img
            src={avatar}
            alt={name}
            className="w-14 h-14 rounded-full object-cover bg-slate-100 dark:bg-slate-700"
          />
        ) : (
          <div className="w-14 h-14 rounded-full bg-gradient-to-br from-blue-500 to-cyan-600 flex items-center justify-center text-white font-bold text-lg shadow-sm">
            {initials}
          </div>
        )}
        <div className="flex-1 min-w-0">
          <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 truncate">{name}</h3>
          <p className="text-xs text-blue-700 dark:text-blue-400 font-medium truncate">
            {coach.specialty || '전문 분야 미설정'}
          </p>
          <div className="flex items-center gap-2 mt-1 text-[11px] text-slate-400 dark:text-slate-500">
            <span className="inline-flex items-center gap-0.5">
              <svg
                className="w-3 h-3 text-amber-400 fill-current"
                viewBox="0 0 20 20"
                aria-hidden="true"
              >
                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.176 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
              </svg>
              <span className="text-slate-600 dark:text-slate-300 font-medium">
                {rating > 0 ? rating.toFixed(1) : '신규'}
              </span>
            </span>
            <span className="w-px h-3 bg-slate-200 dark:bg-slate-700" aria-hidden="true" />
            <span>총 {sessions}회 세션</span>
          </div>
        </div>
      </div>

      <p className="text-xs text-slate-600 dark:text-slate-400 mt-3 line-clamp-3 flex-1">
        {bioExcerpt}
      </p>

      <div className="mt-4 flex items-center justify-between pt-3 border-t border-slate-100 dark:border-slate-700/60">
        <div>
          <p className="text-[10px] text-slate-400 dark:text-slate-500 uppercase tracking-wider">
            시급
          </p>
          <p className="text-base font-bold text-slate-900 dark:text-slate-100">
            {rate.toLocaleString()}원
          </p>
        </div>
        <Link
          to={`/coaches/${coach.id}`}
          className="inline-flex items-center gap-1 px-3.5 py-2 text-xs font-medium rounded-lg bg-gradient-to-r from-blue-600 to-cyan-600 text-white hover:from-blue-700 hover:to-cyan-700 transition-all shadow-sm"
        >
          매칭 요청
          <svg
            className="w-3 h-3"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            aria-hidden="true"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </Link>
      </div>
    </article>
  );
}
