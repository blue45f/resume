import { useState, useEffect, useMemo } from 'react';

export interface JobAlertConfig {
  id: string;
  keywords: string;
  jobType: string;
  salaryMin: string;
  salaryMax: string;
  location: string;
  enabled: boolean;
  createdAt: string;
}

const STORAGE_KEY = 'job-alerts';

function loadAlerts(): JobAlertConfig[] {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
  } catch {
    return [];
  }
}

function saveAlerts(alerts: JobAlertConfig[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(alerts));
}

interface JobPost {
  id: string;
  company: string;
  position: string;
  location: string;
  salary: string;
  type: string;
  skills: string;
  description: string;
}

/** Count how many jobs match the user's alerts */
export function countAlertMatches(jobs: JobPost[]): number {
  const alerts = loadAlerts().filter((a) => a.enabled);
  if (alerts.length === 0) return 0;
  const matched = new Set<string>();
  for (const alert of alerts) {
    const keywords = alert.keywords
      .toLowerCase()
      .split(',')
      .map((k) => k.trim())
      .filter(Boolean);
    for (const job of jobs) {
      if (matched.has(job.id)) continue;
      const text = `${job.position} ${job.company} ${job.skills} ${job.description}`.toLowerCase();
      const keywordMatch = keywords.length === 0 || keywords.some((kw) => text.includes(kw));
      const typeMatch = !alert.jobType || alert.jobType === 'all' || job.type === alert.jobType;
      const locationMatch = !alert.location || job.location.includes(alert.location);
      if (keywordMatch && typeMatch && locationMatch) {
        matched.add(job.id);
      }
    }
  }
  return matched.size;
}

interface Props {
  jobs: JobPost[];
}

export default function JobAlert({ jobs }: Props) {
  const [open, setOpen] = useState(false);
  const [alerts, setAlerts] = useState<JobAlertConfig[]>(loadAlerts);
  const [form, setForm] = useState({
    keywords: '',
    jobType: 'all',
    salaryMin: '',
    salaryMax: '',
    location: '',
  });
  const [editingId, setEditingId] = useState<string | null>(null);

  useEffect(() => {
    saveAlerts(alerts);
  }, [alerts]);

  const matchCount = useMemo(() => countAlertMatches(jobs), [jobs, alerts]);

  const handleSave = () => {
    if (editingId) {
      setAlerts((prev) =>
        prev.map((a) =>
          a.id === editingId
            ? {
                ...a,
                ...form,
                keywords: form.keywords,
                jobType: form.jobType,
                salaryMin: form.salaryMin,
                salaryMax: form.salaryMax,
                location: form.location,
              }
            : a,
        ),
      );
      setEditingId(null);
    } else {
      const newAlert: JobAlertConfig = {
        id: Date.now().toString(),
        ...form,
        enabled: true,
        createdAt: new Date().toISOString(),
      };
      setAlerts((prev) => [...prev, newAlert]);
    }
    setForm({ keywords: '', jobType: 'all', salaryMin: '', salaryMax: '', location: '' });
  };

  const handleEdit = (alert: JobAlertConfig) => {
    setForm({
      keywords: alert.keywords,
      jobType: alert.jobType,
      salaryMin: alert.salaryMin,
      salaryMax: alert.salaryMax,
      location: alert.location,
    });
    setEditingId(alert.id);
  };

  const handleDelete = (id: string) => {
    setAlerts((prev) => prev.filter((a) => a.id !== id));
    if (editingId === id) {
      setEditingId(null);
      setForm({ keywords: '', jobType: 'all', salaryMin: '', salaryMax: '', location: '' });
    }
  };

  const toggleEnabled = (id: string) => {
    setAlerts((prev) => prev.map((a) => (a.id === id ? { ...a, enabled: !a.enabled } : a)));
  };

  return (
    <>
      {/* Alert Bell Button */}
      <button
        onClick={() => setOpen(true)}
        className="relative inline-flex items-center gap-2 px-3 py-2 text-sm font-medium rounded-xl bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-400 hover:bg-amber-100 dark:hover:bg-amber-900/30 transition-colors"
        title="채용 알림 설정"
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
          />
        </svg>
        채용 알림
        {matchCount > 0 && (
          <span className="absolute -top-1.5 -right-1.5 min-w-[18px] h-[18px] flex items-center justify-center px-1 text-[10px] font-bold bg-red-500 text-white rounded-full">
            {matchCount > 99 ? '99+' : matchCount}
          </span>
        )}
      </button>

      {/* Modal */}
      {open && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40"
          onClick={() => setOpen(false)}
        >
          <div
            className="bg-white dark:bg-slate-800 rounded-2xl shadow-xl w-full max-w-lg max-h-[85dvh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between p-5 border-b border-slate-200 dark:border-slate-700">
              <div>
                <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100">
                  채용 알림 설정
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  관심 조건을 설정하면 매칭 공고를 알려드립니다
                </p>
              </div>
              <button
                onClick={() => setOpen(false)}
                className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
              >
                <svg
                  className="w-5 h-5 text-slate-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </div>

            <div className="p-5 space-y-4">
              {/* Form */}
              <div className="space-y-3 bg-slate-50 dark:bg-slate-900/50 rounded-xl p-4">
                <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                  {editingId ? '알림 수정' : '새 알림 추가'}
                </h3>
                <div>
                  <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">
                    키워드 (쉼표로 구분)
                  </label>
                  <input
                    type="text"
                    value={form.keywords}
                    onChange={(e) => setForm((f) => ({ ...f, keywords: e.target.value }))}
                    placeholder="React, 프론트엔드, 백엔드"
                    className="w-full px-3 py-2 text-sm border border-slate-200 dark:border-slate-600 rounded-lg dark:bg-slate-800 dark:text-slate-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <div className="stagger-children grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">
                      채용 형태
                    </label>
                    <select
                      value={form.jobType}
                      onChange={(e) => setForm((f) => ({ ...f, jobType: e.target.value }))}
                      className="w-full px-3 py-2 text-sm border border-slate-200 dark:border-slate-600 rounded-lg dark:bg-slate-800 dark:text-slate-100 focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="all">전체</option>
                      <option value="fulltime">정규직</option>
                      <option value="contract">계약직</option>
                      <option value="parttime">파트타임</option>
                      <option value="intern">인턴</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">
                      지역
                    </label>
                    <input
                      type="text"
                      value={form.location}
                      onChange={(e) => setForm((f) => ({ ...f, location: e.target.value }))}
                      placeholder="서울, 판교"
                      className="w-full px-3 py-2 text-sm border border-slate-200 dark:border-slate-600 rounded-lg dark:bg-slate-800 dark:text-slate-100 focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>
                <div className="stagger-children grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">
                      최소 연봉 (만원)
                    </label>
                    <input
                      type="number"
                      value={form.salaryMin}
                      onChange={(e) => setForm((f) => ({ ...f, salaryMin: e.target.value }))}
                      placeholder="3000"
                      className="w-full px-3 py-2 text-sm border border-slate-200 dark:border-slate-600 rounded-lg dark:bg-slate-800 dark:text-slate-100 focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">
                      최대 연봉 (만원)
                    </label>
                    <input
                      type="number"
                      value={form.salaryMax}
                      onChange={(e) => setForm((f) => ({ ...f, salaryMax: e.target.value }))}
                      placeholder="8000"
                      className="w-full px-3 py-2 text-sm border border-slate-200 dark:border-slate-600 rounded-lg dark:bg-slate-800 dark:text-slate-100 focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={handleSave}
                    disabled={!form.keywords.trim()}
                    className="flex-1 py-2 text-sm font-medium bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                  >
                    {editingId ? '수정' : '추가'}
                  </button>
                  {editingId && (
                    <button
                      onClick={() => {
                        setEditingId(null);
                        setForm({
                          keywords: '',
                          jobType: 'all',
                          salaryMin: '',
                          salaryMax: '',
                          location: '',
                        });
                      }}
                      className="px-4 py-2 text-sm text-slate-600 dark:text-slate-400 bg-slate-100 dark:bg-slate-700 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors"
                    >
                      취소
                    </button>
                  )}
                </div>
              </div>

              {/* Existing Alerts */}
              {alerts.length > 0 && (
                <div>
                  <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
                    설정된 알림 ({alerts.length})
                  </h3>
                  <div className="space-y-2">
                    {alerts.map((alert) => (
                      <div
                        key={alert.id}
                        className={`flex items-center gap-3 p-3 rounded-xl border transition-colors ${alert.enabled ? 'border-blue-200 dark:border-blue-800 bg-blue-50/50 dark:bg-blue-900/10' : 'border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/30 opacity-60'}`}
                      >
                        <button
                          onClick={() => toggleEnabled(alert.id)}
                          className="shrink-0"
                          title={alert.enabled ? '비활성화' : '활성화'}
                        >
                          {alert.enabled ? (
                            <svg
                              className="w-5 h-5 text-blue-600"
                              fill="currentColor"
                              viewBox="0 0 20 20"
                            >
                              <path
                                fillRule="evenodd"
                                d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                                clipRule="evenodd"
                              />
                            </svg>
                          ) : (
                            <svg
                              className="w-5 h-5 text-slate-400"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <circle cx="12" cy="12" r="10" strokeWidth={2} />
                            </svg>
                          )}
                        </button>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-slate-800 dark:text-slate-200 truncate">
                            {alert.keywords}
                          </p>
                          <div className="flex flex-wrap gap-2 mt-1">
                            {alert.jobType && alert.jobType !== 'all' && (
                              <span className="badge-xs badge-neutral">
                                {{
                                  fulltime: '정규직',
                                  contract: '계약직',
                                  parttime: '파트타임',
                                  intern: '인턴',
                                }[alert.jobType] || alert.jobType}
                              </span>
                            )}
                            {alert.location && (
                              <span className="badge-xs badge-neutral">{alert.location}</span>
                            )}
                            {(alert.salaryMin || alert.salaryMax) && (
                              <span className="badge-xs badge-green">
                                {alert.salaryMin || '0'}~{alert.salaryMax || ''}만원
                              </span>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center gap-1 shrink-0">
                          <button
                            onClick={() => handleEdit(alert)}
                            className="p-1 rounded hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors"
                            title="수정"
                          >
                            <svg
                              className="w-3.5 h-3.5 text-slate-400"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"
                              />
                            </svg>
                          </button>
                          <button
                            onClick={() => handleDelete(alert.id)}
                            className="p-1 rounded hover:bg-red-100 dark:hover:bg-red-900/30 transition-colors"
                            title="삭제"
                          >
                            <svg
                              className="w-3.5 h-3.5 text-red-400"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                              />
                            </svg>
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {alerts.length === 0 && (
                <div className="text-center py-6">
                  <svg
                    className="w-12 h-12 text-slate-300 dark:text-slate-600 mx-auto mb-2"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={1.5}
                      d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
                    />
                  </svg>
                  <p className="text-sm text-slate-500 dark:text-slate-400">
                    설정된 알림이 없습니다
                  </p>
                  <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">
                    위에서 키워드와 조건을 설정하세요
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
