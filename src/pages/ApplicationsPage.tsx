import { useEffect, useState } from 'react';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { toast } from '@/components/Toast';
import EmptyState from '@/components/EmptyState';
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

export default function ApplicationsPage() {
  const [apps, setApps] = useState<JobApplication[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ company: '', position: '', url: '', status: 'applied', notes: '', salary: '', location: '' });
  const [filter, setFilter] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<'recent' | 'company'>('recent');

  const load = () => {
    fetchApplications().then(setApps).catch(() => {}).finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

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
      setForm({ company: '', position: '', url: '', status: 'applied', notes: '', salary: '', location: '' });
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

  const filtered = apps
    .filter(a => !filter || a.status === filter)
    .filter(a => !searchQuery ||
      a.company.toLowerCase().includes(searchQuery.toLowerCase()) ||
      a.position.toLowerCase().includes(searchQuery.toLowerCase())
    )
    .sort((a, b) => {
      if (sortBy === 'company') return a.company.localeCompare(b.company, 'ko');
      return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
    });
  const stats = STATUSES.map(s => ({ ...s, count: apps.filter(a => a.status === s.value).length }));

  return (
    <>
      <Header />
      <main id="main-content" className="flex-1 max-w-6xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-6 sm:py-8" role="main">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-slate-100">지원 관리</h1>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">총 {apps.length}건의 지원 내역</p>
          </div>
          <button
            onClick={() => setShowForm(!showForm)}
            className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-xl hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-all duration-200"
          >
            + 지원 추가
          </button>
        </div>

        {/* Stats */}
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
            </div>
            <div className="flex gap-2 justify-end">
              <button type="button" onClick={() => setShowForm(false)} className="px-4 py-2 text-sm text-slate-600 dark:text-slate-400 hover:text-slate-800">취소</button>
              <button type="submit" className="px-5 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700">추가</button>
            </div>
          </form>
        )}

        {/* Application List */}
        {loading ? (
          <div className="text-center py-12 text-slate-500">불러오는 중...</div>
        ) : filtered.length === 0 ? (
          <EmptyState type={searchQuery ? 'search' : 'application'} query={searchQuery || undefined} />
        ) : (
          <div className="space-y-3">
            {filtered.map(app => {
              const statusInfo = STATUSES.find(s => s.value === app.status) || STATUSES[0];
              return (
                <div key={app.id} className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-4 hover:shadow-md transition-all duration-200 animate-fade-in-up">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <h3 className="font-semibold text-slate-900 dark:text-slate-100 truncate">{app.company}</h3>
                      <p className="text-sm text-slate-600 dark:text-slate-400">{app.position}</p>
                      <div className="flex flex-wrap items-center gap-2 mt-2 text-xs text-slate-400">
                        {app.location && <span>{app.location}</span>}
                        {app.salary && <span>· {app.salary}</span>}
                        {app.appliedDate && <span>· {app.appliedDate}</span>}
                      </div>
                      {app.notes && <p className="text-xs text-slate-500 dark:text-slate-400 mt-2 line-clamp-2">{app.notes}</p>}
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
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
                  {app.url && (
                    <a href={app.url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-xs text-blue-600 dark:text-blue-400 mt-2 hover:underline">
                      공고 보기 &rarr;
                    </a>
                  )}
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
