import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import Header from '@/components/Header';
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

  const handleDelete = async (id: string, title: string) => {
    if (!confirm(`"${title || '제목 없음'}" 이력서를 삭제하시겠습니까?`)) return;
    await deleteResume(id);
    load();
  };

  const handleDuplicate = async (id: string) => {
    await duplicateResume(id);
    load();
  };

  const filtered = filterTag
    ? resumes.filter(r => r.tags?.some(t => t.id === filterTag))
    : resumes;

  if (loading) {
    return (
      <>
        <Header />
        <main id="main-content" className="flex-1 flex items-center justify-center" role="main">
          <p className="text-slate-500" aria-live="polite">불러오는 중...</p>
        </main>
      </>
    );
  }

  return (
    <>
      <Header />
      <main id="main-content" className="flex-1 max-w-6xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-6 sm:py-8" role="main">
        {resumes.length === 0 ? (
          <div className="text-center py-16 sm:py-20">
            <div className="text-5xl sm:text-6xl mb-4" aria-hidden="true">&#128196;</div>
            <h1 className="text-xl sm:text-2xl font-semibold text-slate-800 mb-2">이력서가 없습니다</h1>
            <p className="text-slate-600 mb-6">첫 번째 이력서를 만들어보세요</p>
            <Link
              to="/resumes/new"
              className="inline-flex items-center px-6 py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors"
            >
              + 새 이력서 만들기
            </Link>
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
              {filtered.map(resume => (
                <article
                  key={resume.id}
                  className="bg-white rounded-xl border border-slate-200 p-4 sm:p-5 hover:shadow-md transition-shadow focus-within:ring-2 focus-within:ring-blue-500"
                >
                  <h2 className="font-semibold text-slate-900 truncate mb-1">
                    {resume.title || '제목 없음'}
                  </h2>
                  <p className="text-sm text-slate-600 mb-1">
                    {resume.personalInfo.name || '이름 미입력'}
                  </p>
                  <p className="text-xs text-slate-500 mb-2">
                    수정일: {new Date(resume.updatedAt).toLocaleDateString('ko-KR')}
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
    </>
  );
}
