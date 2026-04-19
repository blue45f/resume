import { useEffect, useState, useMemo, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import ErrorRetry from '@/components/ErrorRetry';
import { CardGridSkeleton } from '@/components/Skeleton';
import { toast } from '@/components/Toast';
import EmptyState from '@/components/EmptyState';
import AppCommentSection from '@/components/AppCommentSection';
import ApplicationTimeline from '@/components/ApplicationTimeline';
import InterviewReview from '@/components/InterviewReview';
import { useQueryClient } from '@tanstack/react-query';
import { createApplication, updateApplication, deleteApplication } from '@/lib/api';
import { useApplications, useResumes } from '@/hooks/useResources';
import type { JobApplication } from '@/lib/api';
import type { ResumeSummary } from '@/types/resume';
import { applicationSchema, type ApplicationFormValues } from '@/shared/lib/schemas/application';
import { tx } from '@/lib/i18n';

interface StatusDef {
  value: string;
  key: string;
  color: string;
}
const STATUS_DEFS: StatusDef[] = [
  {
    value: 'applied',
    key: 'applications.status.applied',
    color: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
  },
  {
    value: 'screening',
    key: 'applications.status.screening',
    color: 'bg-sky-100 text-purple-700 dark:bg-sky-900/30 dark:text-sky-400',
  },
  {
    value: 'interview',
    key: 'applications.status.interview',
    color: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
  },
  {
    value: 'offer',
    key: 'applications.status.offer',
    color: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
  },
  {
    value: 'rejected',
    key: 'applications.status.rejected',
    color: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
  },
  {
    value: 'withdrawn',
    key: 'applications.status.withdrawn',
    color: 'bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-400',
  },
];
const getSTATUSES = () => STATUS_DEFS.map((s) => ({ ...s, label: tx(s.key) }));

interface KanbanCol {
  value: string;
  key: string;
  headerColor: string;
  nextStatus?: string;
  prevStatus?: string;
}
const KANBAN_DEFS: KanbanCol[] = [
  {
    value: 'applied',
    key: 'applications.status.applied',
    headerColor: 'bg-blue-500',
    nextStatus: 'screening',
  },
  {
    value: 'screening',
    key: 'applications.status.screening',
    headerColor: 'bg-sky-500',
    nextStatus: 'interview',
    prevStatus: 'applied',
  },
  {
    value: 'interview',
    key: 'applications.status.interview',
    headerColor: 'bg-amber-500',
    nextStatus: 'offer',
    prevStatus: 'screening',
  },
  {
    value: 'offer',
    key: 'applications.status.offer',
    headerColor: 'bg-green-500',
    prevStatus: 'interview',
  },
  { value: 'rejected', key: 'applications.status.rejected', headerColor: 'bg-red-500' },
];
const getKANBAN_COLUMNS = () => KANBAN_DEFS.map((c) => ({ ...c, label: tx(c.key) }));

const PRIORITY_CONFIG_BASE: Record<string, { key: string; color: string; icon: string }> = {
  high: { key: 'priority.high', color: 'text-red-500', icon: '★' },
  medium: { key: 'priority.medium', color: 'text-amber-500', icon: '☆' },
  low: { key: 'priority.low', color: 'text-slate-400', icon: '○' },
};
const getPRIORITY_CONFIG = (): Record<string, { label: string; color: string; icon: string }> => {
  const out: Record<string, { label: string; color: string; icon: string }> = {};
  for (const [k, v] of Object.entries(PRIORITY_CONFIG_BASE)) {
    out[k] = { label: tx(v.key), color: v.color, icon: v.icon };
  }
  return out;
};

const getMONTHS = () => Array.from({ length: 12 }, (_, i) => tx(`datetime.months.${i + 1}`));
const getDAYS = () =>
  ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'].map((k) => tx(`datetime.days.${k}`));

function daysSince(dateStr?: string): number {
  if (!dateStr) return 0;
  const diff = Date.now() - new Date(dateStr).getTime();
  return Math.max(0, Math.floor(diff / 86400000));
}

function daysUntil(dateStr?: string): number | null {
  if (!dateStr) return null;
  const diff = new Date(dateStr).getTime() - Date.now();
  return Math.ceil(diff / 86400000);
}

const DEFAULT_FORM: ApplicationFormValues = {
  company: '',
  position: '',
  url: '',
  status: 'applied',
  notes: '',
  salary: '',
  location: '',
  visibility: 'private',
  resumeId: '',
  priority: 'medium',
  interviewDate: '',
  deadline: '',
};

export default function ApplicationsPage() {
  const queryClient = useQueryClient();
  const [params] = useSearchParams();
  const { data: appsData, isLoading: loading, error: queryError } = useApplications();
  const apps: JobApplication[] = (appsData as JobApplication[] | undefined) ?? [];
  const error = !!queryError;
  const setApps = (updater: JobApplication[] | ((prev: JobApplication[]) => JobApplication[])) => {
    const next = typeof updater === 'function' ? updater(apps) : updater;
    queryClient.setQueryData(['applications'], next);
  };
  const [showForm, setShowForm] = useState(false);
  const appForm = useForm<ApplicationFormValues>({
    resolver: zodResolver(applicationSchema),
    defaultValues: DEFAULT_FORM,
  });
  const [filter, setFilter] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<'recent' | 'company' | 'deadline'>('recent');
  const [yearFilter, setYearFilter] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'list' | 'kanban' | 'calendar' | 'analytics'>('list');
  const { data: resumesData } = useResumes();
  const resumes: ResumeSummary[] = (resumesData as ResumeSummary[] | undefined) ?? [];
  const [dismissedReminders, setDismissedReminders] = useState<Set<string>>(new Set());
  const [priorityFilter, setPriorityFilter] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [calMonth, setCalMonth] = useState(() => {
    const now = new Date();
    return { year: now.getFullYear(), month: now.getMonth() };
  });
  const formRef = useRef<HTMLFormElement>(null);

  const load = () => {
    queryClient.invalidateQueries({ queryKey: ['applications'] });
  };

  useEffect(() => {
    const company = params.get('company');
    const position = params.get('position');
    if (company || position) {
      if (company) appForm.setValue('company', company);
      if (position) appForm.setValue('position', position);
      setShowForm(true);
    }
  }, []);

  useEffect(() => {
    document.title = '지원 관리 — 이력서공방';
    return () => {
      document.title = '이력서공방 - AI 기반 이력서 관리 플랫폼';
    };
  }, []);

  const onSubmitApp = async (data: ApplicationFormValues) => {
    try {
      await createApplication({ ...data, appliedDate: new Date().toISOString().slice(0, 10) });
      toast('지원 내역이 추가되었습니다', 'success');
      setShowForm(false);
      appForm.reset(DEFAULT_FORM);
      load();
    } catch {
      toast('추가에 실패했습니다', 'error');
    }
  };

  const handleStatusChange = async (id: string, status: string) => {
    const prevStatus = apps.find((a) => a.id === id)?.status;
    setApps((prev) => prev.map((a) => (a.id === id ? { ...a, status } : a)));
    try {
      await updateApplication(id, { status });
      // 합격/오퍼 전환 시 축하 + 후기 작성 유도
      if (status === 'offer' && prevStatus !== 'offer') {
        const app = apps.find((a) => a.id === id);
        const successTitle = encodeURIComponent(
          `🎉 ${app?.company ?? ''} ${app?.position ?? ''} 합격 후기`,
        );
        toast(`🎉 축하합니다! 합격 경험을 커뮤니티에 나눠보시겠어요?`, 'success');
        setTimeout(() => {
          const share = window.confirm(
            '합격 후기를 커뮤니티에 작성하면 다른 분들에게 큰 도움이 됩니다. 지금 작성하시겠어요?',
          );
          if (share) {
            window.location.href = `/community/write?category=interview&title=${successTitle}`;
          }
        }, 800);
      }
    } catch {
      load();
      toast('상태 변경에 실패했습니다', 'error');
    }
  };

  const handlePriorityChange = async (id: string, priority: string) => {
    setApps((prev) => prev.map((a) => (a.id === id ? { ...a, priority } : a)));
    try {
      await updateApplication(id, { priority } as any);
    } catch {
      load();
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('이 지원 내역을 삭제하시겠습니까?')) return;
    try {
      await deleteApplication(id);
      toast('삭제되었습니다', 'success');
      load();
    } catch {
      toast('삭제에 실패했습니다', 'error');
    }
  };

  // 연도 목록 추출
  const years = [
    ...new Set(apps.map((a) => (a.appliedDate || a.createdAt)?.slice(0, 4)).filter(Boolean)),
  ]
    .sort()
    .reverse();

  const filtered = apps
    .filter((a) => !filter || a.status === filter)
    .filter((a) => !yearFilter || (a.appliedDate || a.createdAt)?.startsWith(yearFilter))
    .filter((a) => !priorityFilter || (a as any).priority === priorityFilter)
    .filter(
      (a) =>
        !searchQuery ||
        a.company.toLowerCase().includes(searchQuery.toLowerCase()) ||
        a.position.toLowerCase().includes(searchQuery.toLowerCase()),
    )
    .sort((a, b) => {
      if (sortBy === 'company') return a.company.localeCompare(b.company, 'ko');
      if (sortBy === 'deadline') {
        const da = (a as any).deadline || '9999-12-31';
        const db = (b as any).deadline || '9999-12-31';
        return da.localeCompare(db);
      }
      return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
    });

  const stats = getSTATUSES().map((s) => ({
    ...s,
    count: apps.filter((a) => a.status === s.value).length,
  }));

  // Kanban: group filtered apps by status
  const kanbanGroups: Record<string, JobApplication[]> = {};
  for (const col of KANBAN_DEFS) {
    kanbanGroups[col.value] = filtered.filter((a) => a.status === col.value);
  }
  kanbanGroups['rejected'] = [
    ...(kanbanGroups['rejected'] || []),
    ...filtered.filter((a) => a.status === 'withdrawn'),
  ];

  // Success rate
  const offerCount = apps.filter((a) => a.status === 'offer').length;
  const decidedCount = apps.filter((a) => ['offer', 'rejected'].includes(a.status)).length;
  const successRate = decidedCount > 0 ? Math.round((offerCount / decidedCount) * 100) : 0;

  // Calendar data
  const calendarData = useMemo(() => {
    const { year, month } = calMonth;
    const firstDay = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const appsByDate: Record<string, JobApplication[]> = {};
    filtered.forEach((app) => {
      const date = (app.appliedDate || app.createdAt)?.slice(0, 10);
      if (date) {
        if (!appsByDate[date]) appsByDate[date] = [];
        appsByDate[date].push(app);
      }
      const interviewDate = (app as any).interviewDate;
      if (interviewDate && interviewDate !== date) {
        if (!appsByDate[interviewDate]) appsByDate[interviewDate] = [];
        appsByDate[interviewDate].push({ ...app, _isInterview: true } as any);
      }
    });
    return { year, month, firstDay, daysInMonth, appsByDate };
  }, [filtered, calMonth]);

  // Interview reminders
  const interviewApps = useMemo(
    () => apps.filter((a) => a.status === 'interview' && !dismissedReminders.has(a.id)),
    [apps, dismissedReminders],
  );

  // Upcoming deadlines
  const upcomingDeadlines = useMemo(
    () =>
      apps
        .filter(
          (a) =>
            (a as any).deadline &&
            daysUntil((a as any).deadline) !== null &&
            daysUntil((a as any).deadline)! <= 7 &&
            daysUntil((a as any).deadline)! >= 0,
        )
        .sort((a, b) => ((a as any).deadline || '').localeCompare((b as any).deadline || '')),
    [apps],
  );

  return (
    <>
      <Header />
      <main
        id="main-content"
        className="flex-1 max-w-6xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-6 sm:py-8"
        role="main"
      >
        {/* Alerts row */}
        {(interviewApps.length > 0 || upcomingDeadlines.length > 0) && (
          <div className="space-y-2 mb-5">
            {interviewApps.slice(0, 2).map((app) => (
              <div
                key={app.id}
                className="flex items-center gap-3 px-4 py-3 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-700 rounded-xl text-sm text-amber-800 dark:text-amber-300"
              >
                <span className="text-base">📋</span>
                <span className="flex-1 font-medium">
                  {app.company} — {app.position} 면접 진행 중
                </span>
                <button
                  onClick={() => setDismissedReminders((prev) => new Set([...prev, app.id]))}
                  className="text-amber-500 hover:text-amber-700 dark:hover:text-amber-200 text-lg leading-none"
                  aria-label="알림 닫기"
                >
                  ×
                </button>
              </div>
            ))}
            {upcomingDeadlines.slice(0, 2).map((app) => {
              const d = daysUntil((app as any).deadline);
              return (
                <div
                  key={`dl-${app.id}`}
                  className="flex items-center gap-3 px-4 py-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-700 rounded-xl text-sm text-red-800 dark:text-red-300"
                >
                  <span className="text-base">⏰</span>
                  <span className="flex-1 font-medium">
                    {app.company} — {app.position} 마감 {d === 0 ? '오늘' : `${d}일 후`} (
                    {(app as any).deadline})
                  </span>
                </div>
              );
            })}
          </div>
        )}

        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-slate-100">
              {tx('applications.title')}
            </h1>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
              총 {apps.length}건의 지원 내역
            </p>
          </div>
          <div className="flex items-center gap-2">
            {/* View toggle */}
            <div className="flex items-center bg-slate-100 dark:bg-slate-800 rounded-lg p-0.5">
              <button
                onClick={() => setViewMode('list')}
                className={`px-2.5 py-1.5 text-xs font-medium rounded-md transition-colors ${viewMode === 'list' ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 shadow-sm' : 'text-slate-500 dark:text-slate-400'}`}
                aria-label="목록 보기"
                title="목록 보기"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4 6h16M4 12h16M4 18h16"
                  />
                </svg>
              </button>
              <button
                onClick={() => setViewMode('kanban')}
                className={`px-2.5 py-1.5 text-xs font-medium rounded-md transition-colors ${viewMode === 'kanban' ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 shadow-sm' : 'text-slate-500 dark:text-slate-400'}`}
                aria-label="칸반 보기"
                title="칸반 보기"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 17V7m0 10a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2h2a2 2 0 012 2m0 10a2 2 0 002 2h2a2 2 0 002-2M9 7a2 2 0 012-2h2a2 2 0 012 2m0 10V7m0 10a2 2 0 002 2h2a2 2 0 002-2V7a2 2 0 00-2-2h-2a2 2 0 00-2 2"
                  />
                </svg>
              </button>
              <button
                onClick={() => setViewMode('calendar')}
                className={`px-2.5 py-1.5 text-xs font-medium rounded-md transition-colors ${viewMode === 'calendar' ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 shadow-sm' : 'text-slate-500 dark:text-slate-400'}`}
                aria-label="캘린더 보기"
                title="캘린더 보기"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                  />
                </svg>
              </button>
              <button
                onClick={() => setViewMode('analytics')}
                className={`px-2.5 py-1.5 text-xs font-medium rounded-md transition-colors ${viewMode === 'analytics' ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 shadow-sm' : 'text-slate-500 dark:text-slate-400'}`}
                aria-label="분석 보기"
                title="분석 보기"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
                  />
                </svg>
              </button>
            </div>
            <button
              onClick={() => {
                setShowForm(!showForm);
                if (!showForm)
                  setTimeout(
                    () => formRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }),
                    50,
                  );
              }}
              className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-xl hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-all duration-200 flex items-center gap-1.5"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 4v16m8-8H4"
                />
              </svg>
              지원 추가
            </button>
          </div>
        </div>

        {/* Statistics Bar */}
        <div className="imp-card p-4 mb-5">
          <div className="flex flex-wrap items-center gap-3">
            <div className="text-sm font-semibold text-slate-700 dark:text-slate-300 mr-2">
              전체 <span className="text-lg text-blue-600 dark:text-blue-400">{apps.length}</span>건
            </div>
            <div className="h-5 w-px bg-slate-200 dark:bg-slate-600" />
            {stats.map((s) => (
              <span
                key={s.value}
                className={`inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium rounded-full ${s.color}`}
              >
                {s.label}
                <span className="font-bold">{s.count}</span>
              </span>
            ))}
            {apps.length > 0 && (
              <>
                <div className="h-5 w-px bg-slate-200 dark:bg-slate-600" />
                <div className="flex items-center gap-1.5">
                  <span className="text-xs text-slate-500 dark:text-slate-400">합격률</span>
                  <span
                    className={`text-xs font-bold ${successRate >= 50 ? 'text-green-600 dark:text-green-400' : successRate >= 20 ? 'text-amber-600 dark:text-amber-400' : 'text-slate-600 dark:text-slate-400'}`}
                  >
                    {successRate}%
                  </span>
                </div>
                {/* Mini progress bar */}
                <div className="flex-1 hidden sm:flex items-center gap-2 min-w-[120px]">
                  <div className="flex-1 h-1.5 bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-blue-400 via-amber-400 to-green-500 rounded-full transition-all duration-500"
                      style={{ width: `${apps.length > 0 ? 100 : 0}%` }}
                    >
                      {/* Segmented bar */}
                    </div>
                  </div>
                </div>
              </>
            )}
          </div>
          {/* Status progress segments */}
          {apps.length > 0 && (
            <div className="flex h-1.5 rounded-full overflow-hidden mt-3 gap-px">
              {stats
                .filter((s) => s.count > 0)
                .map((s) => (
                  <div
                    key={s.value}
                    className={`h-full transition-all duration-500 ${
                      s.value === 'applied'
                        ? 'bg-blue-400'
                        : s.value === 'screening'
                          ? 'bg-purple-400'
                          : s.value === 'interview'
                            ? 'bg-amber-400'
                            : s.value === 'offer'
                              ? 'bg-green-500'
                              : s.value === 'rejected'
                                ? 'bg-red-400'
                                : 'bg-slate-300'
                    }`}
                    style={{ width: `${(s.count / apps.length) * 100}%` }}
                    title={`${s.label}: ${s.count}건`}
                  />
                ))}
            </div>
          )}
        </div>

        {/* Filter row */}
        <div className="flex flex-wrap gap-2 mb-4">
          <button
            onClick={() => setFilter(null)}
            className={`px-3 py-1.5 text-xs font-medium rounded-full whitespace-nowrap transition-colors ${!filter ? 'bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900' : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'}`}
          >
            전체 ({apps.length})
          </button>
          {stats
            .filter((s) => s.count > 0)
            .map((s) => (
              <button
                key={s.value}
                onClick={() => setFilter(filter === s.value ? null : s.value)}
                className={`px-3 py-1.5 text-xs font-medium rounded-full whitespace-nowrap transition-colors ${filter === s.value ? s.color + ' ring-2 ring-offset-1 dark:ring-offset-slate-900' : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'}`}
              >
                {s.label} ({s.count})
              </button>
            ))}
          <div className="h-6 w-px bg-slate-200 dark:bg-slate-600 self-center mx-1" />
          {Object.entries(getPRIORITY_CONFIG()).map(([key, cfg]) => (
            <button
              key={key}
              onClick={() => setPriorityFilter(priorityFilter === key ? null : key)}
              className={`px-3 py-1.5 text-xs font-medium rounded-full whitespace-nowrap transition-colors flex items-center gap-1 ${priorityFilter === key ? 'bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900' : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'}`}
            >
              <span className={cfg.color}>{cfg.icon}</span>
              {cfg.label}
            </button>
          ))}
        </div>

        {/* Year filter + Search + Sort */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 mb-5">
          {years.length > 1 && (
            <div className="flex gap-1 flex-wrap">
              <button
                onClick={() => setYearFilter(null)}
                className={`px-2.5 py-1 text-xs rounded-lg whitespace-nowrap transition-colors ${!yearFilter ? 'bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900' : 'bg-slate-100 dark:bg-slate-800 text-slate-500'}`}
              >
                전체
              </button>
              {years.map((y) => (
                <button
                  key={y}
                  onClick={() => setYearFilter(yearFilter === y ? null : y)}
                  className={`px-2.5 py-1 text-xs rounded-lg whitespace-nowrap transition-colors ${yearFilter === y ? 'bg-blue-600 text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-500'}`}
                >
                  {y}년
                </button>
              ))}
            </div>
          )}
          <div className="flex items-center gap-2 flex-1 w-full sm:w-auto">
            <div className="relative flex-1">
              <svg
                className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                />
              </svg>
              <input
                type="search"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="회사명 또는 포지션 검색..."
                className="w-full pl-8 pr-3 py-2 text-sm border border-slate-200 dark:border-slate-600 rounded-xl dark:bg-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as typeof sortBy)}
              className="px-3 py-2 text-xs bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 rounded-xl border-0 focus:ring-2 focus:ring-blue-500 cursor-pointer"
            >
              <option value="recent">최신순</option>
              <option value="company">회사순</option>
              <option value="deadline">마감순</option>
            </select>
          </div>
        </div>

        {/* Add Form */}
        {showForm && (
          <form
            ref={formRef}
            onSubmit={appForm.handleSubmit(onSubmitApp)}
            className="imp-card p-5 mb-6 animate-fade-in-up"
          >
            <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-4">
              새 지원 추가
            </h3>

            {/* Required fields */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-3">
              <div className="relative">
                <label className="block text-xs text-slate-500 mb-1">
                  회사명 <span className="text-red-500">*</span>
                </label>
                <input
                  {...appForm.register('company')}
                  placeholder="예: 카카오"
                  className="w-full px-3 py-2 border border-slate-200 dark:border-slate-600 rounded-lg text-sm dark:bg-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                {appForm.formState.errors.company && (
                  <p className="mt-1 text-xs text-red-500">
                    {appForm.formState.errors.company.message}
                  </p>
                )}
              </div>
              <div>
                <label className="block text-xs text-slate-500 mb-1">
                  포지션 <span className="text-red-500">*</span>
                </label>
                <input
                  {...appForm.register('position')}
                  placeholder="예: 백엔드 개발자"
                  className="w-full px-3 py-2 border border-slate-200 dark:border-slate-600 rounded-lg text-sm dark:bg-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                {appForm.formState.errors.position && (
                  <p className="mt-1 text-xs text-red-500">
                    {appForm.formState.errors.position.message}
                  </p>
                )}
              </div>
            </div>

            {/* Optional fields */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-3">
              <div>
                <label className="block text-xs text-slate-500 mb-1">공고 URL</label>
                <input
                  {...appForm.register('url')}
                  placeholder="https://..."
                  className="w-full px-3 py-2 border border-slate-200 dark:border-slate-600 rounded-lg text-sm dark:bg-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-xs text-slate-500 mb-1">근무지</label>
                <input
                  {...appForm.register('location')}
                  placeholder="예: 서울 강남구"
                  className="w-full px-3 py-2 border border-slate-200 dark:border-slate-600 rounded-lg text-sm dark:bg-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-xs text-slate-500 mb-1">연봉</label>
                <input
                  {...appForm.register('salary')}
                  placeholder="예: 5,000만원"
                  className="w-full px-3 py-2 border border-slate-200 dark:border-slate-600 rounded-lg text-sm dark:bg-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-xs text-slate-500 mb-1">지원 이력서</label>
                <select
                  {...appForm.register('resumeId')}
                  className="w-full px-3 py-2 border border-slate-200 dark:border-slate-600 rounded-lg text-sm dark:bg-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">선택 안 함</option>
                  {resumes.map((r) => (
                    <option key={r.id} value={r.id}>
                      {r.title || '제목 없음'}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs text-slate-500 mb-1">지원 마감일</label>
                <input
                  type="date"
                  {...appForm.register('deadline')}
                  className="w-full px-3 py-2 border border-slate-200 dark:border-slate-600 rounded-lg text-sm dark:bg-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-xs text-slate-500 mb-1">면접 예정일</label>
                <input
                  type="date"
                  {...appForm.register('interviewDate')}
                  className="w-full px-3 py-2 border border-slate-200 dark:border-slate-600 rounded-lg text-sm dark:bg-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-3">
              <div>
                <label className="block text-xs text-slate-500 mb-1">상태</label>
                <select
                  {...appForm.register('status')}
                  className="w-full px-3 py-2 border border-slate-200 dark:border-slate-600 rounded-lg text-sm dark:bg-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  {getSTATUSES().map((s) => (
                    <option key={s.value} value={s.value}>
                      {s.label}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs text-slate-500 mb-1">우선순위</label>
                <select
                  {...appForm.register('priority')}
                  className="w-full px-3 py-2 border border-slate-200 dark:border-slate-600 rounded-lg text-sm dark:bg-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="high">★ 중요</option>
                  <option value="medium">☆ 보통</option>
                  <option value="low">○ 낮음</option>
                </select>
              </div>
              <div>
                <label className="block text-xs text-slate-500 mb-1">공개 여부</label>
                <select
                  {...appForm.register('visibility')}
                  className="w-full px-3 py-2 border border-slate-200 dark:border-slate-600 rounded-lg text-sm dark:bg-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="private">비공개</option>
                  <option value="public">공개</option>
                </select>
              </div>
            </div>

            <div className="mb-4">
              <label className="block text-xs text-slate-500 mb-1">메모</label>
              <textarea
                {...appForm.register('notes')}
                placeholder="면접 준비 사항, 특이사항 등..."
                rows={3}
                className="w-full px-3 py-2 border border-slate-200 dark:border-slate-600 rounded-lg text-sm dark:bg-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
              />
            </div>

            <div className="flex gap-2 justify-end">
              <button
                type="button"
                onClick={() => setShowForm(false)}
                className="px-4 py-2 text-sm text-slate-600 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 transition-colors"
              >
                취소
              </button>
              <button
                type="submit"
                disabled={appForm.formState.isSubmitting}
                className="px-5 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
              >
                {appForm.formState.isSubmitting ? '추가 중...' : '추가하기'}
              </button>
            </div>
          </form>
        )}

        {/* Application Views */}
        {error ? (
          <ErrorRetry onRetry={load} />
        ) : loading ? (
          <CardGridSkeleton count={4} />
        ) : filtered.length === 0 && viewMode === 'list' ? (
          <EmptyState
            type={searchQuery || filter ? 'search' : 'application'}
            query={searchQuery || filter || undefined}
          />
        ) : viewMode === 'kanban' ? (
          /* Kanban Board */
          <div className="flex gap-3 overflow-x-auto pb-4 -mx-4 px-4 sm:mx-0 sm:px-0">
            {getKANBAN_COLUMNS().map((col) => {
              const colApps = kanbanGroups[col.value] || [];
              return (
                <div key={col.value} className="flex-shrink-0 w-64 sm:w-72">
                  <div
                    className={`${col.headerColor} text-white rounded-t-xl px-3 py-2 flex items-center justify-between`}
                  >
                    <span className="text-sm font-semibold">{col.label}</span>
                    <span className="text-xs bg-white/20 rounded-full px-2 py-0.5">
                      {colApps.length}
                    </span>
                  </div>
                  <div className="bg-slate-50 dark:bg-slate-900/50 border border-t-0 border-slate-200 dark:border-slate-700 rounded-b-xl p-2 min-h-[200px] space-y-2">
                    {colApps.length === 0 && (
                      <div className="text-center py-8 text-xs text-slate-400">비어 있음</div>
                    )}
                    {colApps.map((app) => {
                      const days = daysSince(app.appliedDate || app.createdAt);
                      const colDef = getKANBAN_COLUMNS().find((c) => c.value === col.value);
                      const priority = (app as any).priority as string | undefined;
                      const pCfg = priority ? getPRIORITY_CONFIG()[priority] : null;
                      return (
                        <div
                          key={app.id}
                          className="bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 p-3 shadow-sm hover:shadow-md transition-shadow duration-200"
                        >
                          <div className="flex items-start justify-between gap-1 mb-0.5">
                            <h4 className="font-semibold text-sm text-slate-900 dark:text-slate-100 truncate flex-1">
                              {app.company}
                            </h4>
                            {pCfg && (
                              <span className={`text-sm shrink-0 ${pCfg.color}`} title={pCfg.label}>
                                {pCfg.icon}
                              </span>
                            )}
                          </div>
                          <p className="text-xs text-slate-500 dark:text-slate-400 truncate">
                            {app.position}
                          </p>
                          <div className="flex items-center justify-between mt-2">
                            <span className="text-xs text-slate-400">
                              {days === 0 ? '오늘 지원' : `${days}일 경과`}
                            </span>
                            {app.url && (
                              <a
                                href={app.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-xs text-blue-500 hover:underline"
                              >
                                공고
                              </a>
                            )}
                          </div>
                          {app.notes && (
                            <p className="text-xs text-slate-400 mt-1.5 line-clamp-2">
                              {app.notes}
                            </p>
                          )}
                          <div className="flex items-center gap-1 mt-2 pt-2 border-t border-slate-100 dark:border-slate-700">
                            {colDef?.prevStatus && (
                              <button
                                onClick={() => handleStatusChange(app.id, colDef.prevStatus!)}
                                className="flex-1 text-xs px-2 py-1 rounded bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors"
                              >
                                ←{' '}
                                {
                                  getKANBAN_COLUMNS().find((c) => c.value === colDef.prevStatus)
                                    ?.label
                                }
                              </button>
                            )}
                            {colDef?.nextStatus && (
                              <button
                                onClick={() => handleStatusChange(app.id, colDef.nextStatus!)}
                                className="flex-1 text-xs px-2 py-1 rounded bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 hover:bg-blue-100 dark:hover:bg-blue-900/50 transition-colors"
                              >
                                {
                                  getKANBAN_COLUMNS().find((c) => c.value === colDef.nextStatus)
                                    ?.label
                                }{' '}
                                →
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
        ) : viewMode === 'calendar' ? (
          /* Calendar View */
          <div className="imp-card overflow-hidden">
            {/* Calendar header */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-slate-200 dark:border-slate-700">
              <button
                onClick={() =>
                  setCalMonth((m) => {
                    const d = new Date(m.year, m.month - 1, 1);
                    return { year: d.getFullYear(), month: d.getMonth() };
                  })
                }
                className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors text-slate-500"
                aria-label="이전 달"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M15 19l-7-7 7-7"
                  />
                </svg>
              </button>
              <h3 className="font-semibold text-slate-900 dark:text-slate-100">
                {calendarData.year} {getMONTHS()[calendarData.month]}
              </h3>
              <button
                onClick={() =>
                  setCalMonth((m) => {
                    const d = new Date(m.year, m.month + 1, 1);
                    return { year: d.getFullYear(), month: d.getMonth() };
                  })
                }
                className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors text-slate-500"
                aria-label="다음 달"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 5l7 7-7 7"
                  />
                </svg>
              </button>
            </div>
            {/* Day headers */}
            <div className="grid grid-cols-7 border-b border-slate-200 dark:border-slate-700">
              {getDAYS().map((d, i) => (
                <div
                  key={d}
                  className={`text-center py-2 text-xs font-medium ${i === 0 ? 'text-red-500' : i === 6 ? 'text-blue-500' : 'text-slate-500 dark:text-slate-400'}`}
                >
                  {d}
                </div>
              ))}
            </div>
            {/* Calendar grid */}
            <div className="grid grid-cols-7">
              {/* Empty cells for first day offset */}
              {Array.from({ length: calendarData.firstDay }).map((_, i) => (
                <div
                  key={`empty-${i}`}
                  className="min-h-[80px] sm:min-h-[100px] border-b border-r border-slate-100 dark:border-slate-700/50 bg-slate-50/50 dark:bg-slate-900/30"
                />
              ))}
              {/* Day cells */}
              {Array.from({ length: calendarData.daysInMonth }).map((_, dayIdx) => {
                const day = dayIdx + 1;
                const dateStr = `${calendarData.year}-${String(calendarData.month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
                const dayApps = calendarData.appsByDate[dateStr] || [];
                const isToday = dateStr === new Date().toISOString().slice(0, 10);
                const col = (calendarData.firstDay + dayIdx) % 7;
                return (
                  <div
                    key={day}
                    className={`min-h-[80px] sm:min-h-[100px] border-b border-r border-slate-100 dark:border-slate-700/50 p-1.5 ${isToday ? 'bg-blue-50/50 dark:bg-blue-900/10' : ''}`}
                  >
                    <div
                      className={`text-xs font-medium mb-1 w-6 h-6 flex items-center justify-center rounded-full ${isToday ? 'bg-blue-600 text-white' : col === 0 ? 'text-red-500' : col === 6 ? 'text-blue-500' : 'text-slate-600 dark:text-slate-400'}`}
                    >
                      {day}
                    </div>
                    <div className="space-y-0.5">
                      {dayApps.slice(0, 3).map((app, i) => {
                        const isInterview = (app as any)._isInterview;
                        return (
                          <div
                            key={`${app.id}-${i}`}
                            className={`text-[9px] sm:text-[10px] truncate rounded px-1 py-0.5 leading-tight ${isInterview ? 'bg-amber-100 dark:bg-amber-900/30 text-amber-800 dark:text-amber-300' : 'bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300'}`}
                            title={`${app.company} — ${app.position}${isInterview ? ' (면접)' : ''}`}
                          >
                            {isInterview ? '📋 ' : ''}
                            {app.company}
                          </div>
                        );
                      })}
                      {dayApps.length > 3 && (
                        <div className="text-[9px] text-slate-400 pl-1">
                          +{dayApps.length - 3}건
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
            {/* Calendar legend */}
            <div className="flex items-center gap-4 px-5 py-3 border-t border-slate-200 dark:border-slate-700 text-xs text-slate-500 dark:text-slate-400">
              <div className="flex items-center gap-1.5">
                <div className="w-3 h-3 rounded bg-blue-100 dark:bg-blue-900/30" />
                지원일
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-3 h-3 rounded bg-amber-100 dark:bg-amber-900/30" />
                면접일
              </div>
            </div>
          </div>
        ) : viewMode === 'analytics' ? (
          /* Analytics Dashboard */
          <div className="space-y-5">
            {apps.length === 0 ? (
              <div className="text-center py-16 text-slate-400">
                지원 데이터가 없습니다. 지원을 추가해보세요!
              </div>
            ) : (
              <>
                {/* Funnel */}
                <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl p-5">
                  <h3 className="text-sm font-semibold text-slate-800 dark:text-slate-200 mb-4 flex items-center gap-2">
                    <span className="w-5 h-5 bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-md flex items-center justify-center text-xs">
                      📊
                    </span>
                    전형 단계별 전환율
                  </h3>
                  <div className="space-y-3">
                    {[
                      {
                        label: '지원완료',
                        key: 'applied',
                        color: 'bg-blue-500',
                        total: apps.length,
                      },
                      {
                        label: '서류심사',
                        key: 'screening',
                        color: 'bg-sky-500',
                        total: apps.filter((a) =>
                          ['screening', 'interview', 'offer'].includes(a.status),
                        ).length,
                      },
                      {
                        label: '면접',
                        key: 'interview',
                        color: 'bg-amber-500',
                        total: apps.filter((a) => ['interview', 'offer'].includes(a.status)).length,
                      },
                      {
                        label: '최종합격',
                        key: 'offer',
                        color: 'bg-green-500',
                        total: apps.filter((a) => a.status === 'offer').length,
                      },
                    ].map((stage, i, arr) => {
                      const base = i === 0 ? apps.length : arr[i - 1].total;
                      const pct = base > 0 ? Math.round((stage.total / base) * 100) : 0;
                      const widthPct = apps.length > 0 ? (stage.total / apps.length) * 100 : 0;
                      return (
                        <div key={stage.key} className="flex items-center gap-3">
                          <div className="w-20 text-xs text-right text-slate-500 dark:text-slate-400 flex-shrink-0">
                            {stage.label}
                          </div>
                          <div className="flex-1 h-7 bg-slate-100 dark:bg-slate-700 rounded-lg overflow-hidden relative">
                            <div
                              className={`h-full ${stage.color} transition-all duration-700 flex items-center justify-end pr-2`}
                              style={{ width: `${Math.max(widthPct, 2)}%` }}
                            >
                              <span className="text-[10px] text-white font-semibold">
                                {stage.total}
                              </span>
                            </div>
                          </div>
                          {i > 0 && (
                            <span
                              className={`text-xs font-bold flex-shrink-0 w-12 text-right ${pct >= 50 ? 'text-green-600 dark:text-green-400' : pct >= 20 ? 'text-amber-600 dark:text-amber-400' : 'text-red-500 dark:text-red-400'}`}
                            >
                              {pct}%
                            </span>
                          )}
                          {i === 0 && (
                            <span className="text-xs text-slate-400 flex-shrink-0 w-12 text-right">
                              기준
                            </span>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Key stats grid */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  {[
                    {
                      label: '총 지원',
                      value: apps.length,
                      unit: '건',
                      icon: '📝',
                      color: 'text-blue-600 dark:text-blue-400',
                      bg: 'bg-blue-50 dark:bg-blue-900/20',
                    },
                    {
                      label: '면접 진행중',
                      value: apps.filter((a) => a.status === 'interview').length,
                      unit: '건',
                      icon: '🎤',
                      color: 'text-amber-600 dark:text-amber-400',
                      bg: 'bg-amber-50 dark:bg-amber-900/20',
                    },
                    {
                      label: '최종합격',
                      value: apps.filter((a) => a.status === 'offer').length,
                      unit: '건',
                      icon: '🎉',
                      color: 'text-green-600 dark:text-green-400',
                      bg: 'bg-green-50 dark:bg-green-900/20',
                    },
                    {
                      label: '합격률',
                      value: successRate,
                      unit: '%',
                      icon: '📈',
                      color:
                        successRate >= 30
                          ? 'text-green-600 dark:text-green-400'
                          : 'text-orange-600 dark:text-orange-400',
                      bg:
                        successRate >= 30
                          ? 'bg-green-50 dark:bg-green-900/20'
                          : 'bg-orange-50 dark:bg-orange-900/20',
                    },
                  ].map((s) => (
                    <div
                      key={s.label}
                      className={`${s.bg} border border-slate-200/50 dark:border-slate-700 rounded-2xl p-4 flex flex-col items-center justify-center text-center`}
                    >
                      <span className="text-2xl mb-1">{s.icon}</span>
                      <span className={`text-2xl font-extrabold ${s.color}`}>
                        {s.value}
                        <span className="text-sm ml-0.5">{s.unit}</span>
                      </span>
                      <span className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                        {s.label}
                      </span>
                    </div>
                  ))}
                </div>

                {/* Monthly trend */}
                {(() => {
                  const monthlyMap: Record<string, number> = {};
                  apps.forEach((a) => {
                    const m = (a.appliedDate || a.createdAt || '').slice(0, 7);
                    if (m) monthlyMap[m] = (monthlyMap[m] || 0) + 1;
                  });
                  const months = Object.keys(monthlyMap).sort().slice(-6);
                  if (months.length < 2) return null;
                  const max = Math.max(...months.map((m) => monthlyMap[m]));
                  return (
                    <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl p-5">
                      <h3 className="text-sm font-semibold text-slate-800 dark:text-slate-200 mb-4 flex items-center gap-2">
                        <span className="w-5 h-5 bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 rounded-md flex items-center justify-center text-xs">
                          📅
                        </span>
                        월별 지원 추이 (최근 6개월)
                      </h3>
                      <div className="flex items-end gap-2 h-32">
                        {months.map((m) => {
                          const count = monthlyMap[m];
                          const heightPct = max > 0 ? (count / max) * 100 : 0;
                          const [, mo] = m.split('-');
                          return (
                            <div key={m} className="flex-1 flex flex-col items-center gap-1">
                              <span className="text-xs font-semibold text-blue-600 dark:text-blue-400">
                                {count}
                              </span>
                              <div
                                className="w-full bg-slate-100 dark:bg-slate-700 rounded-t-md relative overflow-hidden"
                                style={{ height: '80px' }}
                              >
                                <div
                                  className="absolute bottom-0 left-0 right-0 bg-blue-500 dark:bg-blue-600 rounded-t-md transition-all duration-700"
                                  style={{ height: `${Math.max(heightPct, 5)}%` }}
                                />
                              </div>
                              <span className="text-[10px] text-slate-400">{parseInt(mo)}월</span>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  );
                })()}

                {/* Top companies & status breakdown */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Top companies */}
                  <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl p-5">
                    <h3 className="text-sm font-semibold text-slate-800 dark:text-slate-200 mb-3 flex items-center gap-2">
                      <span className="text-base">🏢</span> 자주 지원한 기업
                    </h3>
                    {(() => {
                      const companyCounts: Record<string, number> = {};
                      apps.forEach((a) => {
                        companyCounts[a.company] = (companyCounts[a.company] || 0) + 1;
                      });
                      return Object.entries(companyCounts)
                        .sort((a, b) => b[1] - a[1])
                        .slice(0, 5)
                        .map(([company, count], i) => (
                          <div key={company} className="flex items-center gap-2 py-1.5">
                            <span className="text-xs font-bold text-slate-400 w-4">{i + 1}</span>
                            <span className="flex-1 text-sm text-slate-700 dark:text-slate-300 truncate">
                              {company}
                            </span>
                            <span className="text-xs font-semibold text-blue-600 dark:text-blue-400">
                              {count}회
                            </span>
                          </div>
                        ));
                    })()}
                  </div>
                  {/* Status distribution */}
                  <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl p-5">
                    <h3 className="text-sm font-semibold text-slate-800 dark:text-slate-200 mb-3 flex items-center gap-2">
                      <span className="text-base">📋</span> 상태별 분포
                    </h3>
                    {stats
                      .filter((s) => s.count > 0)
                      .map((s) => (
                        <div key={s.value} className="flex items-center gap-2 py-1.5">
                          <span
                            className={`inline-block w-2 h-2 rounded-full flex-shrink-0 ${
                              s.value === 'applied'
                                ? 'bg-blue-500'
                                : s.value === 'screening'
                                  ? 'bg-sky-500'
                                  : s.value === 'interview'
                                    ? 'bg-amber-500'
                                    : s.value === 'offer'
                                      ? 'bg-green-500'
                                      : s.value === 'rejected'
                                        ? 'bg-red-400'
                                        : 'bg-slate-400'
                            }`}
                          />
                          <span className="flex-1 text-sm text-slate-600 dark:text-slate-400">
                            {s.label}
                          </span>
                          <div className="flex items-center gap-2">
                            <div className="w-16 h-1.5 bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden">
                              <div
                                className={`h-full rounded-full ${
                                  s.value === 'applied'
                                    ? 'bg-blue-500'
                                    : s.value === 'screening'
                                      ? 'bg-sky-500'
                                      : s.value === 'interview'
                                        ? 'bg-amber-500'
                                        : s.value === 'offer'
                                          ? 'bg-green-500'
                                          : s.value === 'rejected'
                                            ? 'bg-red-400'
                                            : 'bg-slate-400'
                                }`}
                                style={{ width: `${(s.count / apps.length) * 100}%` }}
                              />
                            </div>
                            <span className="text-xs font-semibold text-slate-700 dark:text-slate-300 w-6 text-right">
                              {s.count}
                            </span>
                          </div>
                        </div>
                      ))}
                  </div>
                </div>
              </>
            )}
          </div>
        ) : (
          /* List View */
          <div className="space-y-3">
            {filtered.map((app) => {
              const all = getSTATUSES();
              const statusInfo = all.find((s) => s.value === app.status) || all[0];
              const priority = (app as any).priority as string | undefined;
              const pCfg = priority ? getPRIORITY_CONFIG()[priority] : null;
              const deadline = (app as any).deadline as string | undefined;
              const deadlineDays = deadline ? daysUntil(deadline) : null;
              const isExpanded = expandedId === app.id;

              return (
                <div
                  key={app.id}
                  className="imp-card overflow-hidden hover:shadow-md transition-all duration-200 animate-fade-in-up"
                >
                  {/* Main row */}
                  <div className="p-4">
                    <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          {pCfg && (
                            <button
                              onClick={() => {
                                const next =
                                  priority === 'high'
                                    ? 'medium'
                                    : priority === 'medium'
                                      ? 'low'
                                      : 'high';
                                handlePriorityChange(app.id, next);
                              }}
                              className={`text-lg shrink-0 leading-none ${pCfg.color} hover:scale-125 transition-transform`}
                              title={`우선순위: ${pCfg.label}`}
                              aria-label="우선순위 변경"
                            >
                              {pCfg.icon}
                            </button>
                          )}
                          {!pCfg && (
                            <button
                              onClick={() => handlePriorityChange(app.id, 'medium')}
                              className="text-lg shrink-0 leading-none text-slate-300 hover:text-amber-400 hover:scale-125 transition-all"
                              title="우선순위 설정"
                              aria-label="우선순위 설정"
                            >
                              ☆
                            </button>
                          )}
                          <h3 className="font-semibold text-slate-900 dark:text-slate-100 truncate">
                            {app.company}
                          </h3>
                          {app.visibility === 'public' && (
                            <span className="text-xs px-1.5 py-0.5 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 rounded shrink-0">
                              공개
                            </span>
                          )}
                        </div>
                        <p className="text-sm text-slate-600 dark:text-slate-400 mt-0.5 ml-7">
                          {app.position}
                        </p>
                        <div className="flex flex-wrap items-center gap-2 mt-2 ml-7 text-xs text-slate-400">
                          {app.location && <span>{app.location}</span>}
                          {app.salary && <span>· {app.salary}</span>}
                          {app.appliedDate && <span>· {app.appliedDate}</span>}
                          <span>
                            ·{' '}
                            {daysSince(app.appliedDate || app.createdAt) === 0
                              ? '오늘'
                              : `${daysSince(app.appliedDate || app.createdAt)}일 경과`}
                          </span>
                          {deadlineDays !== null && (
                            <span
                              className={`font-medium ${deadlineDays <= 3 ? 'text-red-500' : deadlineDays <= 7 ? 'text-amber-500' : 'text-slate-400'}`}
                            >
                              · 마감 {deadlineDays === 0 ? '오늘' : `${deadlineDays}일 후`}
                            </span>
                          )}
                        </div>
                        {app.notes && !isExpanded && (
                          <p className="text-xs text-slate-500 dark:text-slate-400 mt-2 ml-7 line-clamp-1">
                            {app.notes}
                          </p>
                        )}
                      </div>

                      <div className="flex items-center gap-2 shrink-0 ml-7 sm:ml-0">
                        <select
                          value={app.status}
                          onChange={(e) => handleStatusChange(app.id, e.target.value)}
                          className={`text-xs font-medium px-2 py-1.5 rounded-lg border-0 cursor-pointer focus:ring-2 focus:ring-blue-500 ${statusInfo.color}`}
                        >
                          {getSTATUSES().map((s) => (
                            <option key={s.value} value={s.value}>
                              {s.label}
                            </option>
                          ))}
                        </select>
                        <button
                          onClick={() => setExpandedId(isExpanded ? null : app.id)}
                          className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 rounded-lg transition-colors"
                          aria-label={isExpanded ? '접기' : '펼치기'}
                        >
                          <svg
                            className={`w-4 h-4 transition-transform duration-200 ${isExpanded ? 'rotate-180' : ''}`}
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M19 9l-7 7-7-7"
                            />
                          </svg>
                        </button>
                        <button
                          onClick={() => handleDelete(app.id)}
                          className="p-1.5 text-slate-400 hover:text-red-500 rounded-lg transition-colors"
                          aria-label="삭제"
                        >
                          <svg
                            className="w-4 h-4"
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

                    {/* Quick links */}
                    {app.url && (
                      <a
                        href={app.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 text-xs text-blue-600 dark:text-blue-400 mt-2 ml-7 hover:underline"
                      >
                        공고 보기
                        <svg
                          className="w-3 h-3"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
                          />
                        </svg>
                      </a>
                    )}
                  </div>

                  {/* Expanded details */}
                  {isExpanded && (
                    <div className="border-t border-slate-100 dark:border-slate-700 animate-fade-in-up">
                      {app.notes && (
                        <div className="px-4 py-3 bg-slate-50 dark:bg-slate-900/30">
                          <p className="text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">
                            메모
                          </p>
                          <p className="text-sm text-slate-700 dark:text-slate-300 whitespace-pre-wrap">
                            {app.notes}
                          </p>
                        </div>
                      )}
                      <div className="px-4 py-3">
                        <ApplicationTimeline
                          applicationId={app.id}
                          status={app.status}
                          appliedDate={app.appliedDate}
                          createdAt={app.createdAt}
                          updatedAt={app.updatedAt}
                        />
                      </div>
                      <div className="px-4 pb-3">
                        <InterviewReview applicationId={app.id} />
                      </div>
                      <div className="px-4 pb-4">
                        <AppCommentSection
                          applicationId={app.id}
                          isPublic={app.visibility === 'public'}
                        />
                      </div>
                    </div>
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
