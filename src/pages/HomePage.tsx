import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import Header from '@/components/Header';
import { CardGridSkeleton } from '@/components/Skeleton';
import { toast } from '@/components/Toast';
import { timeAgo } from '@/lib/time';
import type { ResumeSummary, Tag } from '@/types/resume';
import { fetchResumes, deleteResume, duplicateResume, fetchTags } from '@/lib/api';

export default function HomePage() {
  const [resumes, setResumes] = useState<ResumeSummary[]>([]);
  const [tags, setTags] = useState<(Tag & { resumeCount: number })[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterTag, setFilterTag] = useState<string | null>(null);

  const load = async (signal?: AbortSignal) => {
    try {
      const [resumeData, tagData] = await Promise.all([fetchResumes(), fetchTags()]);
      if (signal?.aborted) return;
      setResumes(resumeData);
      setTags(tagData);
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

  const filtered = filterTag
    ? resumes.filter(r => r.tags?.some(t => t.id === filterTag))
    : resumes;

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
            <div className="text-center mb-10">
              <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 mb-3">이력서공방에 오신 것을 환영합니다</h1>
              <p className="text-slate-500 max-w-md mx-auto">AI가 도와주는 이력서 작성. 다양한 양식으로 변환하고, 깔끔한 URL로 공유하세요.</p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 max-w-2xl mx-auto mb-10">
              <Link to="/resumes/new" className="flex flex-col items-center p-6 bg-white rounded-xl border-2 border-blue-200 hover:border-blue-400 hover:shadow-lg transition-all group">
                <span className="text-3xl mb-2 group-hover:scale-110 transition-transform">📝</span>
                <span className="font-semibold text-slate-800">직접 작성</span>
                <span className="text-xs text-slate-400 mt-1">템플릿 선택 후 작성</span>
              </Link>
              <Link to="/auto-generate" className="flex flex-col items-center p-6 bg-white rounded-xl border-2 border-purple-200 hover:border-purple-400 hover:shadow-lg transition-all group">
                <span className="text-3xl mb-2 group-hover:scale-110 transition-transform">🤖</span>
                <span className="font-semibold text-slate-800">AI 자동 생성</span>
                <span className="text-xs text-slate-400 mt-1">텍스트 붙여넣기만</span>
              </Link>
              <Link to="/explore" className="flex flex-col items-center p-6 bg-white rounded-xl border-2 border-slate-200 hover:border-slate-400 hover:shadow-lg transition-all group">
                <span className="text-3xl mb-2 group-hover:scale-110 transition-transform">🔍</span>
                <span className="font-semibold text-slate-800">둘러보기</span>
                <span className="text-xs text-slate-400 mt-1">공개 이력서 탐색</span>
              </Link>
            </div>
            <div className="text-center">
              <Link to="/tutorial" className="text-sm text-blue-600 hover:text-blue-800">사용 가이드 보기 &rarr;</Link>
            </div>
          </div>
        ) : (
          <div>
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-6">
              <h1 className="text-xl sm:text-2xl font-bold text-slate-900">
                내 이력서 ({filtered.length})
              </h1>
            </div>

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

            {/* Resume grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
              {filtered.map((resume, index) => (
                <article
                  key={resume.id}
                  className={`bg-white rounded-xl border border-slate-200 p-4 sm:p-5 hover:shadow-md transition-shadow focus-within:ring-2 focus-within:ring-blue-500 animate-fade-in-up stagger-${Math.min(index + 1, 6)}`}
                >
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
      <footer className="no-print border-t border-slate-200 py-6 bg-white">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 flex flex-wrap items-center justify-center gap-4 text-xs text-slate-400">
          <Link to="/about" className="hover:text-slate-600">서비스 소개</Link>
          <Link to="/tutorial" className="hover:text-slate-600">사용 가이드</Link>
          <Link to="/terms" className="hover:text-slate-600">이용약관</Link>
          <span>이력서공방</span>
        </div>
      </footer>
    </>
  );
}
