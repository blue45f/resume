import { useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useQueries, useMutation, useQueryClient } from '@tanstack/react-query';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { getUser } from '@/lib/auth';
import { ROUTES, withQuery } from '@/lib/routes';
import { timeAgo } from '@/lib/time';
import { API_URL } from '@/lib/config';
import { t } from '@/lib/i18n';
import SendMessageButton from '@/components/SendMessageButton';

const PIPELINE_STAGES = [
  {
    key: 'interested',
    label: '관심',
    color: 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400',
    icon: '👀',
  },
  {
    key: 'contacted',
    label: '연락',
    color: 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400',
    icon: '📞',
  },
  {
    key: 'interview',
    label: '면접',
    color: 'bg-sky-100 dark:bg-sky-900/30 text-sky-700 dark:text-sky-400',
    icon: '🗓',
  },
  {
    key: 'hired',
    label: '채용',
    color: 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400',
    icon: '✅',
  },
] as const;

interface Candidate {
  id: string;
  name: string;
  email: string;
  resumeId?: string;
  stage: string;
  position: string;
  updatedAt: string;
}

const authedFetch = async <T,>(url: string, fallback: T): Promise<T> => {
  const token = localStorage.getItem('token');
  const headers: Record<string, string> = token ? { Authorization: `Bearer ${token}` } : {};
  const res = await fetch(`${API_URL}${url}`, { headers });
  if (!res.ok) return fallback;
  const data = await res.json();
  return (data ?? fallback) as T;
};

export default function RecruiterDashboardPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const user = getUser();
  const isRecruiterUser = !!user && user.userType !== 'personal';

  useEffect(() => {
    document.title = '리크루터 대시보드 — 이력서공방';
    if (!user || user.userType === 'personal') {
      navigate(ROUTES.home);
    }
    return () => {
      document.title = '이력서공방 - AI 기반 이력서 관리 플랫폼';
    };
  }, []);

  const results = useQueries({
    queries: [
      {
        queryKey: ['recruiter', 'jobs', 'my'],
        queryFn: () => authedFetch<any[]>('/api/jobs/my', []),
        enabled: isRecruiterUser,
        staleTime: 30_000,
      },
      {
        queryKey: ['recruiter', 'scouts'],
        queryFn: () => authedFetch<any[]>('/api/social/scouts', []),
        enabled: isRecruiterUser,
        staleTime: 30_000,
      },
      {
        queryKey: ['recruiter', 'applicants'],
        queryFn: () => authedFetch<any[]>('/api/jobs/applicants', []),
        enabled: isRecruiterUser,
        staleTime: 30_000,
      },
      {
        queryKey: ['recruiter', 'pipeline'],
        queryFn: () => authedFetch<Candidate[]>('/api/jobs/pipeline', []),
        enabled: isRecruiterUser,
        staleTime: 30_000,
      },
      {
        queryKey: ['recruiter', 'recommended'],
        queryFn: () => authedFetch<any[]>('/api/jobs/recommended-candidates', []),
        enabled: isRecruiterUser,
        staleTime: 30_000,
      },
      {
        queryKey: ['recruiter', 'pipelineStats'],
        queryFn: () =>
          authedFetch<{
            total: number;
            byStage: Record<string, number>;
            conversionRates: { contactRate?: number; interviewRate?: number; hireRate?: number };
            avgResponseHours: number | null;
          }>('/api/jobs/pipeline-stats', {
            total: 0,
            byStage: {},
            conversionRates: {},
            avgResponseHours: null,
          }),
        enabled: isRecruiterUser,
        staleTime: 30_000,
      },
    ],
  });
  const [jobsQ, scoutsQ, applicantsQ, pipelineQ, recommendedQ, pipelineStatsQ] = results;
  const pipelineStats = (pipelineStatsQ.data as any) ?? {
    total: 0,
    byStage: {},
    conversionRates: {},
    avgResponseHours: null,
  };
  const jobs: any[] = (jobsQ.data as any[] | undefined) ?? [];
  const scouts: any[] = (scoutsQ.data as any[] | undefined) ?? [];
  const applicants: any[] = Array.isArray(applicantsQ.data) ? (applicantsQ.data as any[]) : [];
  const candidates: Candidate[] = Array.isArray(pipelineQ.data)
    ? (pipelineQ.data as Candidate[])
    : [];
  const recommended: any[] = Array.isArray(recommendedQ.data) ? (recommendedQ.data as any[]) : [];
  const loading = results.some((r) => r.isLoading);

  const stageMutation = useMutation({
    mutationFn: async ({ candidateId, newStage }: { candidateId: string; newStage: string }) => {
      const token = localStorage.getItem('token');
      const res = await fetch(`${API_URL}/api/jobs/pipeline/${candidateId}`, {
        method: 'PATCH',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ stage: newStage }),
      });
      if (!res.ok) throw new Error();
      return { candidateId, newStage };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['recruiter', 'pipeline'] });
    },
  });

  if (!user || user.userType === 'personal') return null;

  const activeJobCount = jobs.filter((j: any) => j.status === 'active').length;
  const thisMonthApplicants = applicants.filter((a: any) => {
    const d = new Date(a.createdAt);
    const now = new Date();
    return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
  });
  const scoutResponseRate =
    scouts.length > 0
      ? Math.round(
          (scouts.filter((s: any) => s.status === 'accepted' || s.status === 'rejected').length /
            scouts.length) *
            100,
        )
      : 0;

  const getPipelineCandidates = (stage: string) => candidates.filter((c) => c.stage === stage);

  const updateCandidateStage = (candidateId: string, newStage: string) => {
    stageMutation.mutate({ candidateId, newStage });
  };

  return (
    <>
      <Header />
      <main
        id="main-content"
        className="flex-1 max-w-6xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-6 sm:py-8"
        role="main"
      >
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
          <div>
            <h1 className="heading-accent text-xl sm:text-2xl font-bold text-slate-900 dark:text-slate-100">
              {t('nav.recruiterDashboard')}
            </h1>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
              {user.companyName || user.name}
            </p>
          </div>
          <Link
            to={ROUTES.jobs.new}
            className="px-4 py-2.5 min-h-[44px] flex items-center bg-blue-600 text-white text-sm font-medium rounded-xl hover:bg-blue-700 transition-colors"
          >
            + 공고 등록
          </Link>
        </div>

        {loading ? (
          <div className="text-center py-12 text-slate-400">불러오는 중...</div>
        ) : (
          <div className="space-y-6">
            {/* First-time recruiter hero — only when no jobs posted yet */}
            {jobs.length === 0 && (
              <section
                aria-label="시작하기"
                className="bg-sky-900 rounded-2xl p-5 sm:p-6 text-white relative overflow-hidden animate-fade-in-up"
              >
                <div
                  aria-hidden="true"
                  className="absolute inset-0 pointer-events-none opacity-15"
                  style={{
                    backgroundImage:
                      'radial-gradient(circle, rgb(255 255 255 / 0.6) 1px, transparent 1px)',
                    backgroundSize: '22px 22px',
                  }}
                />
                <div className="relative z-10">
                  <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-sky-300 mb-2">
                    시작하기
                  </p>
                  <h2 className="text-xl font-black mb-1.5 tracking-tight">
                    리크루터로 시작하셨네요
                  </h2>
                  <p className="text-sky-200 text-sm mb-5">
                    첫 공고를 등록하면 추천 인재 매칭과 스카우트가 활성화됩니다
                  </p>
                  <div className="stagger-children grid grid-cols-1 sm:grid-cols-3 gap-3">
                    {[
                      {
                        num: 1,
                        title: '공고 등록',
                        desc: '포지션·요구 기술·복지',
                        href: ROUTES.jobs.new,
                      },
                      {
                        num: 2,
                        title: '추천 인재 매칭',
                        desc: '공고 기술 스택과 일치하는 후보 자동 매칭',
                        href: ROUTES.resume.explore,
                      },
                      {
                        num: 3,
                        title: '스카우트 보내기',
                        desc: '관심 후보에게 1:1 메시지',
                        href: ROUTES.jobs.scouts,
                      },
                    ].map((step) => (
                      <Link
                        key={step.num}
                        to={step.href}
                        className="group flex items-center gap-3 p-3.5 bg-sky-800/60 hover:bg-sky-700 border border-sky-700 hover:border-sky-500 rounded-xl transition-colors duration-200"
                      >
                        <span className="shrink-0 w-9 h-9 bg-white text-sky-900 rounded-full flex items-center justify-center text-sm font-black tabular-nums">
                          {step.num}
                        </span>
                        <div className="min-w-0">
                          <p className="text-sm font-semibold flex items-center gap-2">
                            {step.title}
                            <svg
                              className="w-3.5 h-3.5 opacity-0 group-hover:opacity-100 group-hover:translate-x-0.5 transition-all"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                              aria-hidden="true"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M9 5l7 7-7 7"
                              />
                            </svg>
                          </p>
                          <p className="text-xs text-sky-200 truncate">{step.desc}</p>
                        </div>
                      </Link>
                    ))}
                  </div>
                </div>
              </section>
            )}

            {/* Quick Stats */}
            <div className="stagger-children grid grid-cols-2 sm:grid-cols-4 gap-3">
              {[
                {
                  label: '활성 공고 수',
                  value: activeJobCount,
                  icon: '✅',
                  color: 'text-green-600',
                },
                {
                  label: '이번 달 지원자',
                  value: thisMonthApplicants.length,
                  icon: '📥',
                  color: 'text-blue-600',
                },
                {
                  label: '스카우트 응답률',
                  value: `${scoutResponseRate}%`,
                  icon: '📊',
                  color: 'text-sky-600',
                },
                {
                  label: '보낸 스카우트',
                  value: scouts.length,
                  icon: '📨',
                  color: 'text-amber-600',
                },
              ].map((s) => (
                <div key={s.label} className="imp-card p-4 text-center">
                  <span className="text-lg block mb-1">{s.icon}</span>
                  <span className={`text-2xl font-bold ${s.color} block`}>{s.value}</span>
                  <span className="text-xs text-slate-500 dark:text-slate-400">{s.label}</span>
                </div>
              ))}
            </div>

            {/* Pipeline conversion stats — pipelineStats.total > 0 일 때만 */}
            {pipelineStats.total > 0 && (
              <section>
                <h2 className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-3">
                  파이프라인 통계
                </h2>
                <div className="stagger-children grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <div className="imp-card p-4 text-center">
                    <p className="text-2xl font-bold text-blue-600 dark:text-blue-400 tabular-nums">
                      {pipelineStats.conversionRates.contactRate ?? 0}%
                    </p>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">연락 전환율</p>
                  </div>
                  <div className="imp-card p-4 text-center">
                    <p className="text-2xl font-bold text-sky-600 dark:text-sky-400 tabular-nums">
                      {pipelineStats.conversionRates.interviewRate ?? 0}%
                    </p>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">면접 전환율</p>
                  </div>
                  <div className="imp-card p-4 text-center">
                    <p className="text-2xl font-bold text-emerald-600 dark:text-emerald-400 tabular-nums">
                      {pipelineStats.conversionRates.hireRate ?? 0}%
                    </p>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">채용 전환율</p>
                  </div>
                  <div className="imp-card p-4 text-center">
                    <p className="text-2xl font-bold text-amber-600 dark:text-amber-400 tabular-nums">
                      {pipelineStats.avgResponseHours != null
                        ? pipelineStats.avgResponseHours < 24
                          ? `${pipelineStats.avgResponseHours}h`
                          : `${Math.round(pipelineStats.avgResponseHours / 24)}d`
                        : '—'}
                    </p>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                      평균 응답 시간
                    </p>
                  </div>
                </div>
              </section>
            )}

            {/* Pipeline */}
            <section>
              <h2 className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-3">
                채용 파이프라인
              </h2>
              <div className="stagger-children grid grid-cols-2 lg:grid-cols-4 gap-3">
                {PIPELINE_STAGES.map((stage) => {
                  const stCandidates = getPipelineCandidates(stage.key);
                  return (
                    <div key={stage.key} className="imp-card p-4">
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-2">
                          <span>{stage.icon}</span>
                          <span className="text-sm font-medium text-slate-700 dark:text-slate-300">
                            {stage.label}
                          </span>
                        </div>
                        <span
                          className={`text-xs px-2 py-0.5 rounded-full font-medium ${stage.color}`}
                        >
                          {stCandidates.length}
                        </span>
                      </div>
                      <div className="space-y-2 max-h-48 overflow-y-auto">
                        {stCandidates.length === 0 ? (
                          <p className="text-xs text-slate-500 dark:text-slate-400 text-center py-3">
                            비어 있음
                          </p>
                        ) : (
                          stCandidates.map((c) => (
                            <div
                              key={c.id}
                              className="p-2 bg-slate-50 dark:bg-slate-900 rounded-lg"
                            >
                              <p className="text-xs font-medium text-slate-800 dark:text-slate-200 truncate">
                                {c.name}
                              </p>
                              <p className="text-[10px] text-slate-500 dark:text-slate-400 truncate">
                                {c.position}
                              </p>
                              <div className="flex gap-1 mt-1.5">
                                {PIPELINE_STAGES.filter((s) => s.key !== stage.key).map((s) => (
                                  <button
                                    key={s.key}
                                    onClick={() => updateCandidateStage(c.id, s.key)}
                                    title={`${s.label}(으)로 이동`}
                                    className="text-[10px] px-1.5 py-0.5 rounded bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-400 hover:bg-slate-300 dark:hover:bg-slate-600 transition-colors"
                                  >
                                    {s.icon}
                                  </button>
                                ))}
                              </div>
                            </div>
                          ))
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </section>

            {/* Recent Applicants */}
            <section>
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                  최근 지원자
                </h2>
              </div>
              {applicants.length === 0 ? (
                <div className="text-center py-8 imp-card">
                  <p className="text-sm text-slate-400">아직 지원자가 없습니다</p>
                </div>
              ) : (
                <div className="imp-card divide-y divide-slate-100 dark:divide-slate-700">
                  {applicants.slice(0, 8).map((a: any) => {
                    const stageMeta: Record<string, { label: string; color: string }> = {
                      interested: {
                        label: '👀 검토',
                        color: 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400',
                      },
                      contacted: {
                        label: '📞 연락',
                        color:
                          'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400',
                      },
                      interview: {
                        label: '🗓 면접',
                        color: 'bg-sky-100 dark:bg-sky-900/30 text-sky-700 dark:text-sky-400',
                      },
                      hired: {
                        label: '✅ 채용',
                        color:
                          'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400',
                      },
                      rejected: {
                        label: '✗ 거절',
                        color: 'bg-rose-100 dark:bg-rose-900/30 text-rose-700 dark:text-rose-400',
                      },
                    };
                    const meta = stageMeta[a.stage] || stageMeta.interested;
                    return (
                      <div
                        key={a.id}
                        className="flex items-center justify-between p-3 min-h-[56px]"
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <div className="w-8 h-8 rounded-full bg-slate-200 dark:bg-slate-700 flex items-center justify-center text-xs font-medium text-slate-600 dark:text-slate-300 shrink-0">
                            {(a.name || '?')[0]}
                          </div>
                          <div className="min-w-0">
                            <div className="flex items-center gap-1.5 min-w-0">
                              <p className="text-sm font-medium text-slate-900 dark:text-slate-100 truncate">
                                {a.name || '익명'}
                              </p>
                              <SendMessageButton
                                variant="mini"
                                targetUserId={a.userId || a.id}
                                targetUserName={a.name || '지원자'}
                              />
                              <span
                                className={`text-[10px] px-1.5 py-0.5 rounded font-medium ${meta.color}`}
                                title={`현재 stage: ${a.stage}`}
                              >
                                {meta.label}
                              </span>
                            </div>
                            <p className="text-xs text-slate-500 dark:text-slate-400 truncate">
                              {a.position || '미지정'} · {timeAgo(a.createdAt)}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2 shrink-0 ml-2">
                          {a.resumeId && (
                            <Link
                              to={ROUTES.resume.preview(a.resumeId)}
                              className="text-xs px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors"
                            >
                              이력서
                            </Link>
                          )}
                          <button
                            onClick={() =>
                              navigate(withQuery(ROUTES.jobs.scouts, { target: a.userId || a.id }))
                            }
                            className="text-xs px-2.5 py-1 rounded-lg bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-100 dark:hover:bg-emerald-900/40 transition-colors"
                          >
                            스카우트
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </section>

            {/* Recommended Candidates */}
            <section>
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                  추천 후보
                </h2>
                <Link to={ROUTES.resume.explore} className="text-xs text-blue-600 hover:underline">
                  더 보기
                </Link>
              </div>
              {recommended.length === 0 ? (
                <div className="text-center py-8 imp-card">
                  <p className="text-sm text-slate-400">
                    공고의 기술 스택과 일치하는 공개 이력서가 없습니다
                  </p>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                    활성 공고에 기술 스택을 추가해보세요
                  </p>
                </div>
              ) : (
                <div className="stagger-children grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  {recommended.slice(0, 6).map((r: any) => (
                    <div key={r.id} className="imp-card p-4">
                      <div className="flex items-start justify-between mb-2">
                        <div className="min-w-0">
                          <div className="flex items-center gap-1.5 min-w-0">
                            <p className="text-sm font-medium text-slate-900 dark:text-slate-100 truncate">
                              {r.name || '익명'}
                            </p>
                            <SendMessageButton
                              variant="mini"
                              targetUserId={r.userId || r.id}
                              targetUserName={r.name || '후보자'}
                            />
                          </div>
                          <p className="text-xs text-slate-500 dark:text-slate-400 truncate">
                            {r.title || '제목 없음'}
                          </p>
                        </div>
                        {r.matchScore != null && (
                          <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 font-medium shrink-0 ml-2">
                            {r.matchScore}% 매칭
                          </span>
                        )}
                      </div>
                      {r.skills && r.skills.length > 0 && (
                        <div className="flex flex-wrap gap-1 mb-3">
                          {(r.skills as string[]).slice(0, 5).map((skill: string) => (
                            <span key={skill} className="badge-xs badge-neutral">
                              {skill}
                            </span>
                          ))}
                        </div>
                      )}
                      <div className="flex gap-2">
                        {r.resumeId && (
                          <Link
                            to={ROUTES.resume.preview(r.resumeId)}
                            className="text-xs px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-200 transition-colors"
                          >
                            이력서 보기
                          </Link>
                        )}
                        <button
                          onClick={() =>
                            navigate(withQuery(ROUTES.jobs.scouts, { target: r.userId || r.id }))
                          }
                          className="text-xs px-2.5 py-1 rounded-lg bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-100 transition-colors"
                        >
                          스카우트
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </section>

            {/* My Job Posts */}
            <section>
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                  내 채용 공고
                </h2>
                <Link to={ROUTES.jobs.list} className="text-xs text-blue-600 hover:underline">
                  전체 보기
                </Link>
              </div>
              {jobs.length === 0 ? (
                <div className="text-center py-8 imp-card">
                  <p className="text-sm text-slate-400">등록된 공고가 없습니다</p>
                  <Link
                    to={ROUTES.jobs.new}
                    className="text-sm text-blue-600 hover:underline mt-2 inline-block"
                  >
                    첫 공고 등록하기
                  </Link>
                </div>
              ) : (
                <div className="space-y-2">
                  {jobs.slice(0, 5).map((j: any) => (
                    <div
                      key={j.id}
                      className="flex items-center justify-between p-3 min-h-[56px] imp-card"
                    >
                      <div className="min-w-0">
                        <Link
                          to={j.id ? ROUTES.jobs.detail(j.id) : ROUTES.jobs.list}
                          className="text-sm font-medium text-slate-900 dark:text-slate-100 hover:text-blue-600 truncate block"
                        >
                          {j.position}
                        </Link>
                        <span className="text-xs text-slate-500 dark:text-slate-400">
                          {j.company} · {timeAgo(j.createdAt)}
                        </span>
                      </div>
                      <span
                        className={`text-xs px-2 py-0.5 rounded-full ${j.status === 'active' ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400' : 'bg-slate-100 dark:bg-slate-700 text-slate-500'}`}
                      >
                        {j.status === 'active' ? '활성' : j.status === 'closed' ? '마감' : '임시'}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </section>

            {/* Quick Actions */}
            <section>
              <h2 className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-3">
                빠른 작업
              </h2>
              <div className="stagger-children grid grid-cols-2 sm:grid-cols-4 gap-3">
                {[
                  { label: '인재 검색', to: '/explore', icon: '🔍' },
                  { label: '공고 등록', to: '/jobs/new', icon: '📝' },
                  { label: '스카우트 현황', to: '/scouts', icon: '📨' },
                  { label: '쪽지함', to: '/messages', icon: '💬' },
                ].map((a) => (
                  <Link
                    key={a.to}
                    to={a.to}
                    className="flex items-center gap-2 p-3 min-h-[44px] imp-card hover:shadow-sm transition-all duration-200 text-sm text-slate-700 dark:text-slate-300"
                  >
                    <span>{a.icon}</span>
                    {a.label}
                  </Link>
                ))}
              </div>
            </section>
          </div>
        )}
      </main>
      <Footer />
    </>
  );
}
