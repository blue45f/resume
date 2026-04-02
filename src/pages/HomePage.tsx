import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import Header from '@/components/Header';
import { CardGridSkeleton } from '@/components/Skeleton';
import { toast } from '@/components/Toast';
import QuickImportModal from '@/components/QuickImportModal';
import Footer from '@/components/Footer';
import { timeAgo } from '@/lib/time';
import type { ResumeSummary, Tag } from '@/types/resume';
import { fetchResumes, deleteResume, duplicateResume, fetchTags, fetchBookmarks } from '@/lib/api';
import DashboardStats from '@/components/DashboardStats';
import RecentActivity from '@/components/RecentActivity';
import OnboardingBanner from '@/components/OnboardingBanner';

const API_URL = import.meta.env.VITE_API_URL || '';

function SiteStatsBar() {
  const [stats, setStats] = useState<{ users: number; resumes: number; views: number; templates: number } | null>(null);

  useEffect(() => {
    fetch(`${API_URL}/api/health/admin/stats`)
      .then(r => r.ok ? r.json() : null)
      .then(d => {
        if (d) setStats({ users: d.users.total, resumes: d.resumes.total, views: d.activity.totalViews, templates: d.content.templates });
      })
      .catch(() => {});
  }, []);

  return (
    <div className="flex flex-wrap justify-center gap-6 text-center text-xs text-slate-400 dark:text-slate-500 mt-6">
      <span><strong className="text-slate-700 dark:text-slate-300 text-sm">{stats?.users || '—'}</strong> 회원</span>
      <span><strong className="text-slate-700 dark:text-slate-300 text-sm">{stats?.resumes || '—'}</strong> 이력서</span>
      <span><strong className="text-slate-700 dark:text-slate-300 text-sm">{stats?.views?.toLocaleString() || '—'}</strong> 조회</span>
      <span><strong className="text-slate-700 dark:text-slate-300 text-sm">{stats?.templates || 26}</strong> 템플릿</span>
    </div>
  );
}

export default function HomePage() {
  const [resumes, setResumes] = useState<ResumeSummary[]>([]);
  const [tags, setTags] = useState<(Tag & { resumeCount: number })[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterTag, setFilterTag] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState<'updatedAt' | 'title' | 'viewCount'>('updatedAt');
  const [sortOrder, setSortOrder] = useState<'desc' | 'asc'>('desc');
  const [showImport, setShowImport] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [selectMode, setSelectMode] = useState(false);
  const [bookmarks, setBookmarks] = useState<{ id: string; resumeId: string; title: string; name: string }[]>([]);
  const navigate = useNavigate();

  const load = async (signal?: AbortSignal) => {
    try {
      const [resumeData, tagData] = await Promise.all([fetchResumes(), fetchTags()]);
      if (signal?.aborted) return;
      setResumes(resumeData);
      setTags(tagData);
      fetchBookmarks().then(setBookmarks).catch(() => {});
    } catch (err) {
      if (signal?.aborted) return;
    } finally {
      if (!signal?.aborted) setLoading(false);
    }
  };

  useEffect(() => {
    const ac = new AbortController();
    load(ac.signal);
    return () => ac.abort();
  }, []);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA') return;
      if (e.key === 'n' && !e.ctrlKey && !e.metaKey) {
        window.location.href = '/resumes/new';
      }
    };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, []);

  const handleDelete = async (id: string, title: string) => {
    if (!confirm(`"${title || '제목 없음'}" 이력서를 삭제하시겠습니까?`)) return;
    try {
      await deleteResume(id);
      toast('이력서가 삭제되었습니다', 'success');
      load();
    } catch {
      toast('삭제에 실패했습니다', 'error');
    }
  };

  const handleDuplicate = async (id: string) => {
    try {
      await duplicateResume(id);
      toast('이력서가 복제되었습니다', 'success');
      load();
    } catch {
      toast('복제에 실패했습니다', 'error');
    }
  };

  const toggleSelect = (id: string) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const selectAll = () => {
    if (selectedIds.size === filtered.length) setSelectedIds(new Set());
    else setSelectedIds(new Set(filtered.map(r => r.id)));
  };

  const handleBulkDelete = async () => {
    if (!confirm(`선택한 ${selectedIds.size}개의 이력서를 삭제하시겠습니까?`)) return;
    for (const id of selectedIds) {
      try { await deleteResume(id); } catch {}
    }
    toast(`${selectedIds.size}개 이력서가 삭제되었습니다`, 'success');
    setSelectedIds(new Set());
    setSelectMode(false);
    load();
  };

  const filtered = filterTag
    ? resumes.filter(r => r.tags?.some(t => t.id === filterTag))
    : resumes;

  const sorted = [...filtered].sort((a, b) => {
    let cmp = 0;
    switch (sortBy) {
      case 'title':
        cmp = (a.title || '').localeCompare(b.title || '', 'ko');
        break;
      case 'viewCount':
        cmp = (a.viewCount || 0) - (b.viewCount || 0);
        break;
      case 'updatedAt':
      default:
        cmp = new Date(a.updatedAt).getTime() - new Date(b.updatedAt).getTime();
        break;
    }
    return sortOrder === 'desc' ? -cmp : cmp;
  });

  if (loading) {
    return (
      <>
        <Header />
        <main id="main-content" className="flex-1 max-w-6xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-6 sm:py-8" role="main">
          <div className="h-8 bg-slate-200 rounded w-48 mb-6 animate-pulse" />
          <CardGridSkeleton count={6} />
        </main>
      </>
    );
  }

  return (
    <>
      <Header />
      <main id="main-content" className="flex-1 max-w-6xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-6 sm:py-8" role="main">
        {resumes.length === 0 ? (
          <div className="py-12 sm:py-16 animate-fade-in">
            <div className="text-center mb-12">
              <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-full text-xs font-medium mb-4 animate-fade-in">
                <span className="w-2 h-2 bg-blue-500 rounded-full animate-pulse" />
                AI 기반 이력서 관리 플랫폼
              </div>
              <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 dark:text-slate-100 mb-4 tracking-tight">
                이력서를 <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-600">스마트하게</span> 관리하세요
              </h1>
              <p className="text-slate-500 dark:text-slate-400 max-w-lg mx-auto leading-relaxed">
                AI가 도와주는 이력서 작성. 10가지 테마로 미리보기하고,
                ATS 호환성을 검사하고, 다양한 양식으로 변환하세요.
              </p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 max-w-3xl mx-auto mb-10">
              <Link to="/resumes/new" className="flex flex-col items-center p-6 bg-white dark:bg-slate-800 rounded-xl border-2 border-blue-200 dark:border-blue-800 hover:border-blue-400 hover:shadow-lg hover:-translate-y-1 transition-all duration-200 group">
                <span className="text-3xl mb-2 group-hover:scale-110 transition-transform">📝</span>
                <span className="font-semibold text-slate-800 dark:text-slate-200">직접 작성</span>
                <span className="text-xs text-slate-400 mt-1">템플릿 선택 후 작성</span>
              </Link>
              <Link to="/auto-generate" className="flex flex-col items-center p-6 bg-white dark:bg-slate-800 rounded-xl border-2 border-purple-200 dark:border-purple-800 hover:border-purple-400 hover:shadow-lg hover:-translate-y-1 transition-all duration-200 group">
                <span className="text-3xl mb-2 group-hover:scale-110 transition-transform">🤖</span>
                <span className="font-semibold text-slate-800 dark:text-slate-200">AI 자동 생성</span>
                <span className="text-xs text-slate-400 mt-1">텍스트 붙여넣기만</span>
              </Link>
              <button onClick={() => setShowImport(true)} className="flex flex-col items-center p-6 bg-white dark:bg-slate-800 rounded-xl border-2 border-green-200 dark:border-green-800 hover:border-green-400 hover:shadow-lg hover:-translate-y-1 transition-all duration-200 group">
                <span className="text-3xl mb-2 group-hover:scale-110 transition-transform">📋</span>
                <span className="font-semibold text-slate-800 dark:text-slate-200">빠른 가져오기</span>
                <span className="text-xs text-slate-400 mt-1">텍스트 붙여넣기</span>
              </button>
              <Link to="/explore" className="flex flex-col items-center p-6 bg-white dark:bg-slate-800 rounded-xl border-2 border-slate-200 dark:border-slate-700 hover:border-slate-400 hover:shadow-lg hover:-translate-y-1 transition-all duration-200 group">
                <span className="text-3xl mb-2 group-hover:scale-110 transition-transform">🔍</span>
                <span className="font-semibold text-slate-800 dark:text-slate-200">둘러보기</span>
                <span className="text-xs text-slate-400 mt-1">공개 이력서 탐색</span>
              </Link>
            </div>

            {/* Feature highlights */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 max-w-3xl mx-auto mt-12 mb-8">
              {[
                { icon: '🤖', title: 'AI 분석 5종', desc: '피드백, JD매칭, 면접질문, ATS검사, 자소서' },
                { icon: '🎨', title: '테마 10종', desc: '클래식부터 테크까지 실시간 전환' },
                { icon: '🔒', title: '완전 무료', desc: '무료 LLM 활용, 비용 0원' },
              ].map(f => (
                <div key={f.title} className="text-center p-4 animate-fade-in-up">
                  <span className="text-2xl mb-2 block">{f.icon}</span>
                  <h3 className="text-sm font-semibold text-slate-800 dark:text-slate-200">{f.title}</h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">{f.desc}</p>
                </div>
              ))}
            </div>

            <div className="text-center">
              <Link to="/tutorial" className="text-sm text-blue-600 hover:text-blue-800">사용 가이드 보기 &rarr;</Link>
            </div>

            <SiteStatsBar />
          </div>
        ) : (
          <div>
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-6">
              <h1 className="text-xl sm:text-2xl font-bold text-slate-900">
                내 이력서 ({filtered.length})
              </h1>
            </div>

            <OnboardingBanner />

            <DashboardStats />

            {bookmarks.length > 0 && (
              <div className="mb-6">
                <h3 className="text-sm font-medium text-slate-600 dark:text-slate-400 mb-2">북마크한 이력서</h3>
                <div className="flex gap-2 overflow-x-auto pb-2">
                  {bookmarks.slice(0, 5).map(b => (
                    <Link
                      key={b.id}
                      to={`/resumes/${b.resumeId}/preview`}
                      className="shrink-0 px-3 py-2 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg text-sm text-amber-700 dark:text-amber-400 hover:bg-amber-100 dark:hover:bg-amber-900/30 transition-colors"
                    >
                      {b.title || b.name || '이력서'}
                    </Link>
                  ))}
                </div>
              </div>
            )}

            <RecentActivity />

            {/* Tag filter */}
            {tags.length > 0 && (
              <div className="flex gap-2 mb-4 overflow-x-auto pb-2" role="group" aria-label="태그 필터">
                <button
                  onClick={() => setFilterTag(null)}
                  className={`px-3 py-1.5 text-xs font-medium rounded-full whitespace-nowrap transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                    !filterTag ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                  aria-pressed={!filterTag}
                >
                  전체
                </button>
                {tags.map(tag => (
                  <button
                    key={tag.id}
                    onClick={() => setFilterTag(filterTag === tag.id ? null : tag.id)}
                    className={`px-3 py-1.5 text-xs font-medium rounded-full whitespace-nowrap transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                      filterTag === tag.id ? 'text-white' : 'text-slate-700 hover:opacity-80'
                    }`}
                    style={{
                      backgroundColor: filterTag === tag.id ? tag.color : `${tag.color}20`,
                      borderColor: tag.color,
                    }}
                    aria-pressed={filterTag === tag.id}
                  >
                    {tag.name} ({tag.resumeCount})
                  </button>
                ))}
              </div>
            )}

            {/* Sort */}
            <div className="flex items-center gap-2 mb-4">
              <span className="text-xs text-slate-500 dark:text-slate-400">정렬:</span>
              {[
                { value: 'updatedAt', label: '최근 수정' },
                { value: 'title', label: '이름순' },
                { value: 'viewCount', label: '조회수' },
              ].map(opt => (
                <button
                  key={opt.value}
                  onClick={() => {
                    if (sortBy === opt.value) setSortOrder(prev => prev === 'desc' ? 'asc' : 'desc');
                    else { setSortBy(opt.value as any); setSortOrder('desc'); }
                  }}
                  className={`px-2.5 py-1 text-xs rounded-lg transition-colors ${
                    sortBy === opt.value
                      ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 font-medium'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'
                  }`}
                >
                  {opt.label}
                  {sortBy === opt.value && (
                    <span className="ml-1">{sortOrder === 'desc' ? '\u2193' : '\u2191'}</span>
                  )}
                </button>
              ))}
            </div>

            {/* Bulk actions toolbar */}
            <div className="flex items-center gap-3 mb-4">
              <button
                onClick={() => { setSelectMode(!selectMode); setSelectedIds(new Set()); }}
                className={`text-xs px-3 py-1.5 rounded-lg transition-colors ${
                  selectMode ? 'bg-blue-600 text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200'
                }`}
              >
                {selectMode ? '선택 취소' : '선택'}
              </button>
              {selectMode && (
                <>
                  <button onClick={selectAll} className="text-xs px-3 py-1.5 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 rounded-lg hover:bg-slate-200">
                    {selectedIds.size === filtered.length ? '전체 해제' : '전체 선택'}
                  </button>
                  {selectedIds.size > 0 && (
                    <button onClick={handleBulkDelete} className="text-xs px-3 py-1.5 bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 rounded-lg hover:bg-red-200">
                      {selectedIds.size}개 삭제
                    </button>
                  )}
                </>
              )}
            </div>

            {/* Resume grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
              {sorted.map((resume, index) => (
                <article
                  key={resume.id}
                  className={`bg-white rounded-xl border border-slate-200 p-4 sm:p-5 hover:shadow-md transition-shadow duration-200 focus-within:ring-2 focus-within:ring-blue-500 animate-fade-in-up stagger-${Math.min(index + 1, 6)} border-l-4 ${resume.visibility === 'public' ? 'border-l-emerald-400' : resume.visibility === 'link-only' ? 'border-l-blue-400' : 'border-l-slate-300'}`}
                >
                  {selectMode && (
                    <div className="mb-2">
                      <input
                        type="checkbox"
                        checked={selectedIds.has(resume.id)}
                        onChange={() => toggleSelect(resume.id)}
                        className="w-4 h-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                        aria-label={`${resume.title} 선택`}
                      />
                    </div>
                  )}
                  <h2 className="font-semibold text-slate-900 truncate mb-1">
                    {resume.title || '제목 없음'}
                  </h2>
                  <p className="text-sm text-slate-600 mb-1">
                    {resume.personalInfo.name || '이름 미입력'}
                  </p>
                  <p className="text-xs text-slate-400 mb-2" title={new Date(resume.updatedAt).toLocaleString('ko-KR')}>
                    {timeAgo(resume.updatedAt)}
                  </p>

                  {/* Tags */}
                  {resume.tags?.length > 0 && (
                    <div className="flex flex-wrap gap-1 mb-3">
                      {resume.tags.map(tag => (
                        <span
                          key={tag.id}
                          className="px-2 py-0.5 text-xs rounded-full"
                          style={{ backgroundColor: `${tag.color}20`, color: tag.color }}
                        >
                          {tag.name}
                        </span>
                      ))}
                    </div>
                  )}

                  {/* Stats row */}
                  <div className="flex items-center gap-3 mb-3 text-xs text-slate-400">
                    {resume.viewCount != null && resume.viewCount > 0 && (
                      <span className="flex items-center gap-1" title="조회수">
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
                        {resume.viewCount}
                      </span>
                    )}
                    <span className="flex items-center gap-1" title={`공개: ${resume.visibility || 'private'}`}>
                      {resume.visibility === 'public' ? '🌐 공개' : resume.visibility === 'link-only' ? '🔗 링크' : '🔒 비공개'}
                    </span>
                  </div>

                  {/* Actions - stack on small mobile */}
                  <div className="flex flex-wrap gap-2">
                    <Link
                      to={`/resumes/${resume.id}/edit`}
                      className="flex-1 min-w-[60px] text-center px-3 py-1.5 text-sm bg-blue-50 text-blue-700 rounded-lg hover:bg-blue-100 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors"
                    >
                      편집
                    </Link>
                    <Link
                      to={`/resumes/${resume.id}/preview`}
                      className="flex-1 min-w-[60px] text-center px-3 py-1.5 text-sm bg-slate-50 text-slate-700 rounded-lg hover:bg-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors"
                    >
                      미리보기
                    </Link>
                    <button
                      onClick={() => handleDuplicate(resume.id)}
                      className="px-3 py-1.5 text-sm bg-slate-50 text-slate-600 rounded-lg hover:bg-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors"
                      aria-label={`${resume.title} 복제`}
                    >
                      복제
                    </button>
                    <button
                      onClick={(e) => {
                        e.preventDefault();
                        const url = `${window.location.origin}/resumes/${resume.id}/preview`;
                        navigator.clipboard.writeText(url);
                        toast('링크가 복사되었습니다', 'success');
                      }}
                      className="px-3 py-1.5 text-sm bg-slate-50 dark:bg-slate-700 text-slate-600 dark:text-slate-300 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors"
                      aria-label={`${resume.title} 링크 복사`}
                    >
                      공유
                    </button>
                    <button
                      onClick={() => handleDelete(resume.id, resume.title)}
                      className="px-3 py-1.5 text-sm bg-red-50 text-red-600 rounded-lg hover:bg-red-100 focus:outline-none focus:ring-2 focus:ring-red-500 transition-colors"
                      aria-label={`${resume.title} 삭제`}
                    >
                      삭제
                    </button>
                  </div>
                </article>
              ))}
            </div>
          </div>
        )}
      </main>
      <Footer />
      {showImport && (
        <QuickImportModal
          onClose={() => setShowImport(false)}
          onSuccess={(id) => { setShowImport(false); navigate(`/resumes/${id}/edit`); }}
        />
      )}
    </>
  );
}
