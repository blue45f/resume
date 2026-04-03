import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { toast } from '@/components/Toast';
import EmptyState from '@/components/EmptyState';
import AppCommentSection from '@/components/AppCommentSection';
import ApplicationTimeline from '@/components/ApplicationTimeline';
import InterviewReview from '@/components/InterviewReview';
import { fetchApplications, createApplication, updateApplication, deleteApplication } from '@/lib/api';
import type { JobApplication } from '@/lib/api';

const STATUSES = [
  { value: 'applied', label: '지원완료', color: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400' },
  { value: 'screening', label: '서류심사', color: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400' },
  { value: 'interview', label: '면접', color: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400' },
  { value: 'offer', label: '합격', color: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' },
  { value: 'rejected', label: '불합격', color: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400' },
  { value: 'withdrawn', label: '취소', color: 'bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-400' },
];

const KANBAN_COLUMNS = [
  { value: 'applied', label: '지원완료', headerColor: 'bg-blue-500', nextStatus: 'screening' },
  { value: 'screening', label: '서류통과', headerColor: 'bg-purple-500', nextStatus: 'interview', prevStatus: 'applied' },
  { value: 'interview', label: '면접', headerColor: 'bg-amber-500', nextStatus: 'offer', prevStatus: 'screening' },
  { value: 'offer', label: '최종합격', headerColor: 'bg-green-500', prevStatus: 'interview' },
  { value: 'rejected', label: '탈락', headerColor: 'bg-red-500' },
];

function daysSince(dateStr?: string): number {
  if (!dateStr) return 0;
  const diff = Date.now() - new Date(dateStr).getTime();
  return Math.max(0, Math.floor(diff / 86400000));
}

export default function ApplicationsPage() {
  const [params] = useSearchParams();
  const [apps, setApps] = useState<JobApplication[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ company: '', position: '', url: '', status: 'applied', notes: '', salary: '', location: '', visibility: 'private' });
  const [filter, setFilter] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<'recent' | 'company'>('recent');
  const [yearFilter, setYearFilter] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'list' | 'kanban'>('list');

  const load = () => {
    fetchApplications().then(setApps).catch(() => {}).finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  useEffect(() => {
    const company = params.get('company');
    const position = params.get('position');
    if (company || position) {
      setForm(f => ({
        ...f,
        company: company || f.company,
        position: position || f.position,
      }));
      setShowForm(true);
    }
  }, []);

  useEffect(() => {
    document.title = '지원 관리 — 이력서공방';
    return () => { document.title = '이력서공방 - AI 기반 이력서 관리 플랫폼'; };
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.company || !form.position) return;
    try {
      await createApplication({ ...form, appliedDate: new Date().toISOString().slice(0, 10) });
      toast('지원 내역이 추가되었습니다', 'success');
      setShowForm(false);
      setForm({ company: '', position: '', url: '', status: 'applied', notes: '', salary: '', location: '', visibility: 'private' });
      load();
    } catch { toast('추가에 실패했습니다', 'error'); }
  };

  const handleStatusChange = async (id: string, status: string) => {
    try {
      await updateApplication(id, { status });
      load();
    } catch { toast('상태 변경에 실패했습니다', 'error'); }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('이 지원 내역을 삭제하시겠습니까?')) return;
    try {
      await deleteApplication(id);
      toast('삭제되었습니다', 'success');
      load();
    } catch { toast('삭제에 실패했습니다', 'error'); }
  };

  // 연도 목록 추출
  const years = [...new Set(apps.map(a => (a.appliedDate || a.createdAt)?.slice(0, 4)).filter(Boolean))].sort().reverse();

  const filtered = apps
    .filter(a => !filter || a.status === filter)
    .filter(a => !yearFilter || (a.appliedDate || a.createdAt)?.startsWith(yearFilter))
    .filter(a => !searchQuery ||
      a.company.toLowerCase().includes(searchQuery.toLowerCase()) ||
      a.position.toLowerCase().includes(searchQuery.toLowerCase())
    )
    .sort((a, b) => {
      if (sortBy === 'company') return a.company.localeCompare(b.company, 'ko');
      return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
    });
  const stats = STATUSES.map(s => ({ ...s, count: apps.filter(a => a.status === s.value).length }));

  // Kanban: group filtered apps by status
  const kanbanGroups: Record<string, JobApplication[]> = {};
  for (const col of KANBAN_COLUMNS) {
    kanbanGroups[col.value] = filtered.filter(a => a.status === col.value);
  }
  // Also add withdrawn to rejected column display
  kanbanGroups['rejected'] = [...(kanbanGroups['rejected'] || []), ...filtered.filter(a => a.status === 'withdrawn')];

  return (
    <>
      <Header />
      <main id="main-content" className="flex-1 max-w-6xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-6 sm:py-8" role="main">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-slate-100">지원 관리</h1>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">총 {apps.length}건의 지원 내역</p>
          </div>
          <div className="flex items-center gap-2">
            {/* View toggle */}
            <div className="flex items-center bg-slate-100 dark:bg-slate-800 rounded-lg p-0.5">
              <button
                onClick={() => setViewMode('list')}
                className={`px-2.5 py-1.5 text-xs font-medium rounded-md transition-colors ${viewMode === 'list' ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 shadow-sm' : 'text-slate-500 dark:text-slate-400'}`}
                aria-label="목록 보기"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" /></svg>
              </button>
              <button
                onClick={() => setViewMode('kanban')}
                className={`px-2.5 py-1.5 text-xs font-medium rounded-md transition-colors ${viewMode === 'kanban' ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 shadow-sm' : 'text-slate-500 dark:text-slate-400'}`}
                aria-label="칸반 보기"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17V7m0 10a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2h2a2 2 0 012 2m0 10a2 2 0 002 2h2a2 2 0 002-2M9 7a2 2 0 012-2h2a2 2 0 012 2m0 10V7m0 10a2 2 0 002 2h2a2 2 0 002-2V7a2 2 0 00-2-2h-2a2 2 0 00-2 2" /></svg>
              </button>
            </div>
            <button
              onClick={() => setShowForm(!showForm)}
              className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-xl hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-all duration-200"
            >
              + 지원 추가
            </button>
          </div>
        </div>

        {/* Application Statistics Bar */}
        <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-4 mb-6">
          <div className="flex flex-wrap items-center gap-3">
            <div className="text-sm font-semibold text-slate-700 dark:text-slate-300 mr-2">
              전체 <span className="text-lg text-blue-600 dark:text-blue-400">{apps.length}</span>건
            </div>
            <div className="h-5 w-px bg-slate-200 dark:bg-slate-600" />
            {stats.map(s => (
              <span key={s.value} className={`inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium rounded-full ${s.color}`}>
                {s.label}
                <span className="font-bold">{s.count}</span>
              </span>
            ))}
            {apps.length > 0 && (
              <>
                <div className="h-5 w-px bg-slate-200 dark:bg-slate-600" />
                <span className="text-xs text-slate-500 dark:text-slate-400">
                  합격률 {apps.filter(a => a.status === 'offer').length > 0
                    ? Math.round((apps.filter(a => a.status === 'offer').length / apps.filter(a => ['offer', 'rejected'].includes(a.status)).length) * 100) || 0
                    : 0}%
                </span>
              </>
            )}
          </div>
        </div>

        {/* Stats filter buttons */}
        <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
          <button
            onClick={() => setFilter(null)}
            className={`px-3 py-1.5 text-xs font-medium rounded-full whitespace-nowrap transition-colors ${!filter ? 'bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900' : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'}`}
          >
            전체 ({apps.length})
          </button>
          {stats.map(s => (
            <button
              key={s.value}
              onClick={() => setFilter(filter === s.value ? null : s.value)}
              className={`px-3 py-1.5 text-xs font-medium rounded-full whitespace-nowrap transition-colors ${filter === s.value ? s.color + ' ring-2 ring-offset-1' : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'}`}
            >
              {s.label} ({s.count})
            </button>
          ))}
        </div>

        {/* Year filter */}
        {years.length > 1 && (
          <div className="flex gap-1.5 mb-3 overflow-x-auto scrollbar-none">
            <button onClick={() => setYearFilter(null)} className={`px-2.5 py-1 text-xs rounded-lg whitespace-nowrap transition-colors ${!yearFilter ? 'bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900' : 'bg-slate-100 dark:bg-slate-800 text-slate-500'}`}>
              전체 연도
            </button>
            {years.map(y => (
              <button key={y} onClick={() => setYearFilter(yearFilter === y ? null : y)} className={`px-2.5 py-1 text-xs rounded-lg whitespace-nowrap transition-colors ${yearFilter === y ? 'bg-blue-600 text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-500'}`}>
                {y}년
              </button>
            ))}
          </div>
        )}

        {/* Search & Sort */}
        <div className="flex items-center gap-2 mb-4">
          <input
            type="search"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder="회사명 또는 포지션 검색..."
            className="flex-1 px-3 py-2 text-sm border border-slate-200 dark:border-slate-600 rounded-xl dark:bg-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <button
            onClick={() => setSortBy(sortBy === 'recent' ? 'company' : 'recent')}
            className="px-3 py-2 text-xs bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 rounded-xl hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
          >
            {sortBy === 'recent' ? '최신순' : '회사순'}
          </button>
        </div>

        {/* Add Form */}
        {showForm && (
          <form onSubmit={handleSubmit} className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-5 mb-6 animate-fade-in-up">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4">
              <div className="relative">
                <input value={form.company} onChange={e => setForm(f => ({ ...f, company: e.target.value }))} placeholder="회사명" required className="px-3 py-2 border border-slate-200 dark:border-slate-600 rounded-lg text-sm dark:bg-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500 w-full" />
                {!form.company && <span className="absolute right-3 top-1/2 -translate-y-1/2 text-red-500 text-sm font-bold" aria-hidden="true">*</span>}
              </div>
              <div className="relative">
                <input value={form.position} onChange={e => setForm(f => ({ ...f, position: e.target.value }))} placeholder="포지션" required className="px-3 py-2 border border-slate-200 dark:border-slate-600 rounded-lg text-sm dark:bg-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500 w-full" />
                {!form.position && <span className="absolute right-3 top-1/2 -translate-y-1/2 text-red-500 text-sm font-bold" aria-hidden="true">*</span>}
              </div>
              <input value={form.url} onChange={e => setForm(f => ({ ...f, url: e.target.value }))} placeholder="공고 URL" className="px-3 py-2 border border-slate-200 dark:border-slate-600 rounded-lg text-sm dark:bg-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500" />
              <input value={form.location} onChange={e => setForm(f => ({ ...f, location: e.target.value }))} placeholder="근무지" className="px-3 py-2 border border-slate-200 dark:border-slate-600 rounded-lg text-sm dark:bg-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500" />
              <input value={form.salary} onChange={e => setForm(f => ({ ...f, salary: e.target.value }))} placeholder="연봉" className="px-3 py-2 border border-slate-200 dark:border-slate-600 rounded-lg text-sm dark:bg-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500" />
              <textarea value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} placeholder="메모" rows={2} className="px-3 py-2 border border-slate-200 dark:border-slate-600 rounded-lg text-sm dark:bg-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500 sm:col-span-2" />
              <select value={form.visibility || 'private'} onChange={e => setForm(f => ({ ...f, visibility: e.target.value }))} className="px-3 py-2 border border-slate-200 dark:border-slate-600 rounded-lg text-sm dark:bg-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500">
                <option value="private">비공개</option>
                <option value="public">공개</option>
              </select>
            </div>
            <div className="flex gap-2 justify-end">
              <button type="button" onClick={() => setShowForm(false)} className="px-4 py-2 text-sm text-slate-600 dark:text-slate-400 hover:text-slate-800">취소</button>
              <button type="submit" className="px-5 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700">추가</button>
            </div>
          </form>
        )}

        {/* Application Views */}
        {loading ? (
          <div className="text-center py-12 text-slate-500">불러오는 중...</div>
        ) : filtered.length === 0 && viewMode === 'list' ? (
          <EmptyState type={searchQuery || filter ? 'search' : 'application'} query={searchQuery || filter || undefined} />
        ) : viewMode === 'kanban' ? (
          /* Kanban Board */
          <div className="flex gap-3 overflow-x-auto pb-4 -mx-4 px-4 sm:mx-0 sm:px-0">
            {KANBAN_COLUMNS.map(col => {
              const colApps = kanbanGroups[col.value] || [];
              return (
                <div key={col.value} className="flex-shrink-0 w-64 sm:w-72">
                  {/* Column header */}
                  <div className={`${col.headerColor} text-white rounded-t-xl px-3 py-2 flex items-center justify-between`}>
                    <span className="text-sm font-semibold">{col.label}</span>
                    <span className="text-xs bg-white/20 rounded-full px-2 py-0.5">{colApps.length}</span>
                  </div>
                  {/* Column body */}
                  <div className="bg-slate-50 dark:bg-slate-900/50 border border-t-0 border-slate-200 dark:border-slate-700 rounded-b-xl p-2 min-h-[200px] space-y-2">
                    {colApps.length === 0 && (
                      <div className="text-center py-8 text-xs text-slate-400">비어 있음</div>
                    )}
                    {colApps.map(app => {
                      const days = daysSince(app.appliedDate || app.createdAt);
                      const colDef = KANBAN_COLUMNS.find(c => c.value === col.value);
                      return (
                        <div
                          key={app.id}
                          className="bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 p-3 shadow-sm hover:shadow-md transition-shadow duration-200"
                        >
                          <h4 className="font-semibold text-sm text-slate-900 dark:text-slate-100 truncate">{app.company}</h4>
                          <p className="text-xs text-slate-500 dark:text-slate-400 truncate mt-0.5">{app.position}</p>
                          <div className="flex items-center justify-between mt-2">
                            <span className="text-xs text-slate-400">
                              {days === 0 ? '오늘 지원' : `${days}일 경과`}
                            </span>
                            {app.url && (
                              <a href={app.url} target="_blank" rel="noopener noreferrer" className="text-xs text-blue-500 hover:underline">공고</a>
                            )}
                          </div>
                          {app.notes && <p className="text-xs text-slate-400 mt-1.5 line-clamp-2">{app.notes}</p>}
                          {/* Status transition buttons */}
                          <div className="flex items-center gap-1 mt-2 pt-2 border-t border-slate-100 dark:border-slate-700">
                            {colDef?.prevStatus && (
                              <button
                                onClick={() => handleStatusChange(app.id, colDef.prevStatus!)}
                                className="flex-1 text-xs px-2 py-1 rounded bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors"
                                title={`${KANBAN_COLUMNS.find(c => c.value === colDef.prevStatus)?.label}(으)로 이동`}
                              >
                                ← {KANBAN_COLUMNS.find(c => c.value === colDef.prevStatus)?.label}
                              </button>
                            )}
                            {colDef?.nextStatus && (
                              <button
                                onClick={() => handleStatusChange(app.id, colDef.nextStatus!)}
                                className="flex-1 text-xs px-2 py-1 rounded bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 hover:bg-blue-100 dark:hover:bg-blue-900/50 transition-colors"
                                title={`${KANBAN_COLUMNS.find(c => c.value === colDef.nextStatus)?.label}(으)로 이동`}
                              >
                                {KANBAN_COLUMNS.find(c => c.value === colDef.nextStatus)?.label} →
                              </button>
                            )}
                            {col.value !== 'rejected' && col.value !== 'offer' && (
                              <button
                                onClick={() => handleStatusChange(app.id, 'rejected')}
                                className="text-xs px-2 py-1 rounded bg-red-50 dark:bg-red-900/20 text-red-500 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-900/40 transition-colors"
                                title="탈락 처리"
                              >
                                ✕
                              </button>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          /* List View */
          <div className="space-y-3">
            {filtered.map(app => {
              const statusInfo = STATUSES.find(s => s.value === app.status) || STATUSES[0];
              return (
                <div key={app.id} className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-4 hover:shadow-md transition-all duration-200 animate-fade-in-up">
                  <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <h3 className="font-semibold text-slate-900 dark:text-slate-100 truncate">{app.company}</h3>
                      <p className="text-sm text-slate-600 dark:text-slate-400">
                        {app.position}
                        {app.visibility === 'public' && (
                          <span className="ml-2 text-xs px-1.5 py-0.5 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 rounded">공개</span>
                        )}
                      </p>
                      <div className="flex flex-wrap items-center gap-2 mt-2 text-xs text-slate-400">
                        {app.location && <span>{app.location}</span>}
                        {app.salary && <span>· {app.salary}</span>}
                        {app.appliedDate && <span>· {app.appliedDate}</span>}
                        <span>· {daysSince(app.appliedDate || app.createdAt) === 0 ? '오늘' : `${daysSince(app.appliedDate || app.createdAt)}일 경과`}</span>
                      </div>
                      {app.notes && <p className="text-xs text-slate-500 dark:text-slate-400 mt-2 line-clamp-2">{app.notes}</p>}
                    </div>
                    <div className="flex items-center gap-2 shrink-0 w-full sm:w-auto">
                      <select
                        value={app.status}
                        onChange={e => handleStatusChange(app.id, e.target.value)}
                        className={`text-xs font-medium px-2 py-1 rounded-lg border-0 cursor-pointer focus:ring-2 focus:ring-blue-500 ${statusInfo.color}`}
                      >
                        {STATUSES.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
                      </select>
                      <button onClick={() => handleDelete(app.id)} className="p-1.5 text-slate-400 hover:text-red-500 rounded-lg transition-colors" aria-label="삭제">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                      </button>
                    </div>
                  </div>
                  {/* Application timeline */}
                  <ApplicationTimeline
                    applicationId={app.id}
                    status={app.status}
                    appliedDate={app.appliedDate}
                    createdAt={app.createdAt}
                    updatedAt={app.updatedAt}
                  />
                  {app.url && (
                    <a href={app.url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-xs text-blue-600 dark:text-blue-400 mt-2 hover:underline">
                      공고 보기 &rarr;
                    </a>
                  )}
                  {/* Interview review section */}
                  <InterviewReview applicationId={app.id} />
                  <AppCommentSection applicationId={app.id} isPublic={app.visibility === 'public'} />
                </div>
              );
            })}
          </div>
        )}
      </main>
      <Footer />
    </>
  );
}
