import { useEffect, useMemo } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { toast } from '@/components/Toast';
import { bookCoachingSession, type CoachProfile } from '@/lib/api';
import { useCoach, useResumes } from '@/hooks/useResources';
import { getUser } from '@/lib/auth';
import { ROUTES } from '@/lib/routes';
import { tx } from '@/lib/i18n';
import {
  bookingSchema,
  type BookingFormInput,
  type BookingFormOutput,
} from '@/shared/lib/schemas/coach';

const DURATION_OPTIONS = [30, 45, 60, 90, 120];

const PLATFORM_FEE_RATE = 0.15;

function getDefaultDateTime() {
  const d = new Date();
  d.setDate(d.getDate() + 1);
  d.setHours(19, 0, 0, 0);
  // datetime-local expects YYYY-MM-DDTHH:mm
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export default function CoachDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const coachQuery = useCoach(id);
  const coach: CoachProfile | null = (coachQuery.data as CoachProfile | undefined) ?? null;
  const loading = coachQuery.isLoading;
  const error: string | null = coachQuery.error
    ? ((coachQuery.error as any)?.message ?? '코치 정보를 불러오지 못했습니다')
    : null;
  const user = getUser();

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<BookingFormInput, unknown, BookingFormOutput>({
    resolver: zodResolver(bookingSchema),
    defaultValues: {
      scheduledAt: getDefaultDateTime(),
      duration: 60,
      note: '',
      resumeId: '',
    },
  });

  // 로그인 유저의 이력서 목록 (예약 시 첨부할 이력서 선택용)
  const { data: resumesData } = useResumes(!!user);
  const myResumes: Array<{ id: string; title?: string }> = Array.isArray(resumesData)
    ? resumesData
    : ((resumesData as { data?: Array<{ id: string; title?: string }> } | undefined)?.data ?? []);

  const durationValue = watch('duration');

  useEffect(() => {
    document.title = coach?.user?.name
      ? `${coach.user.name} 코치 — 이력서공방`
      : '코치 상세 — 이력서공방';
    return () => {
      document.title = '이력서공방 - AI 기반 이력서 관리 플랫폼';
    };
  }, [coach?.user?.name]);

  const priceBreakdown = useMemo(() => {
    const rate = coach?.hourlyRate || 0;
    const duration = Number(durationValue) || 0;
    const base = Math.round((rate * duration) / 60);
    const fee = Math.round(base * PLATFORM_FEE_RATE);
    const total = base + fee;
    return { base, fee, total };
  }, [coach?.hourlyRate, durationValue]);

  const onSubmit = async (data: BookingFormOutput) => {
    if (!user) {
      toast('로그인이 필요합니다', 'error');
      navigate(ROUTES.login);
      return;
    }
    if (!coach) return;
    try {
      const isoDate = new Date(data.scheduledAt).toISOString();
      await bookCoachingSession({
        coachId: coach.id,
        scheduledAt: isoDate,
        duration: Number(data.duration),
        note: data.note?.trim() || undefined,
        resumeId: data.resumeId?.trim() || undefined,
      });
      toast('세션 예약이 요청되었습니다', 'success');
      navigate(ROUTES.coaching.sessions);
    } catch (err) {
      toast(err instanceof Error ? err.message : '세션 예약에 실패했습니다', 'error');
    }
  };

  if (loading) {
    return (
      <>
        <Header />
        <main className="flex-1 max-w-5xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-8">
          <div className="animate-pulse space-y-4">
            <div className="h-8 bg-slate-200 dark:bg-slate-700 rounded w-1/3" />
            <div className="imp-card p-6 space-y-3">
              <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-1/2" />
              <div className="h-3 bg-slate-200 dark:bg-slate-700 rounded" />
              <div className="h-3 bg-slate-200 dark:bg-slate-700 rounded w-5/6" />
            </div>
          </div>
        </main>
        <Footer />
      </>
    );
  }

  if (error || !coach) {
    return (
      <>
        <Header />
        <main className="flex-1 max-w-2xl mx-auto w-full px-4 sm:px-6 py-12">
          <div className="imp-card p-8 text-center">
            <p className="text-4xl mb-3">⚠️</p>
            <h1 className="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-2">
              코치를 찾을 수 없습니다
            </h1>
            <p className="text-sm text-slate-500 dark:text-slate-400 mb-4">
              {error || '요청하신 코치 정보가 존재하지 않거나 비활성 상태입니다.'}
            </p>
            <Link
              to={ROUTES.coaching.coaches}
              className="inline-block px-4 py-2 text-sm font-medium rounded-lg bg-blue-600 hover:bg-blue-700 text-white"
            >
              코치 목록으로
            </Link>
          </div>
        </main>
        <Footer />
      </>
    );
  }

  const name = coach.user?.name || '익명 코치';
  const avatar = coach.user?.avatar || '';
  const initials = (name || 'C').slice(0, 1).toUpperCase();
  const languages = (coach.languages || '')
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);

  return (
    <>
      <Header />
      <main
        id="main-content"
        className="flex-1 max-w-5xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-6 sm:py-8"
        role="main"
      >
        <nav aria-label="경로" className="mb-4 text-xs text-slate-400 dark:text-slate-500">
          <Link
            to={ROUTES.coaching.coaches}
            className="hover:text-slate-600 dark:hover:text-slate-300"
          >
            코치 찾기
          </Link>
          <span className="mx-1">/</span>
          <span className="text-slate-600 dark:text-slate-300">{name}</span>
        </nav>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Profile */}
          <section className="lg:col-span-2 space-y-6">
            <div className="imp-card p-6">
              <div className="flex flex-col sm:flex-row sm:items-start gap-4">
                {avatar ? (
                  <img
                    src={avatar}
                    alt={name}
                    className="w-20 h-20 rounded-full object-cover bg-slate-100 dark:bg-slate-700"
                  />
                ) : (
                  <div className="w-20 h-20 rounded-full bg-gradient-to-br from-blue-500 to-cyan-600 flex items-center justify-center text-white font-bold text-2xl shadow-sm">
                    {initials}
                  </div>
                )}
                <div className="flex-1">
                  <h1 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-slate-100">
                    {name}
                  </h1>
                  <p className="text-sm text-blue-700 dark:text-blue-400 font-medium mt-0.5">
                    {coach.specialty || '전문 분야 미설정'}
                  </p>
                  <div className="flex flex-wrap items-center gap-3 mt-2 text-xs text-slate-500 dark:text-slate-400">
                    <span className="inline-flex items-center gap-1">
                      <svg
                        className="w-3.5 h-3.5 text-amber-400 fill-current"
                        viewBox="0 0 20 20"
                        aria-hidden="true"
                      >
                        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.176 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                      </svg>
                      <span className="font-semibold text-slate-700 dark:text-slate-200">
                        {coach.avgRating > 0 ? coach.avgRating.toFixed(1) : '신규 코치'}
                      </span>
                    </span>
                    <span aria-hidden="true">·</span>
                    <span>총 {coach.totalSessions || 0}회 세션</span>
                    {coach.yearsExp > 0 && (
                      <>
                        <span aria-hidden="true">·</span>
                        <span>경력 {coach.yearsExp}년</span>
                      </>
                    )}
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-5 pt-5 border-t border-slate-100 dark:border-slate-700/60">
                <Stat
                  label={tx('coach.hourlyRate')}
                  value={`${(coach.hourlyRate || 0).toLocaleString()}원`}
                  tone="rose"
                />
                <Stat
                  label={tx('coach.rating')}
                  value={coach.avgRating > 0 ? coach.avgRating.toFixed(1) : '—'}
                  tone="amber"
                />
                <Stat
                  label={tx('coach.sessions')}
                  value={`${coach.totalSessions || 0}`}
                  tone="blue"
                />
                <Stat
                  label={tx('coach.yearsExp')}
                  value={`${coach.yearsExp || 0}`}
                  tone="emerald"
                />
              </div>
            </div>

            <div className="imp-card p-6">
              <h2 className="text-sm font-semibold text-slate-900 dark:text-slate-100 mb-3 flex items-center gap-2">
                <span className="w-1.5 h-4 bg-blue-600 rounded" />
                코치 소개
              </h2>
              <p className="text-sm text-slate-600 dark:text-slate-400 whitespace-pre-line leading-relaxed">
                {coach.bio || '아직 소개글이 작성되지 않았습니다.'}
              </p>
            </div>

            <div className="imp-card p-6">
              <h2 className="text-sm font-semibold text-slate-900 dark:text-slate-100 mb-3 flex items-center gap-2">
                <span className="w-1.5 h-4 bg-blue-500 rounded" />
                코칭 정보
              </h2>
              <dl className="space-y-3 text-sm">
                <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-3">
                  <dt className="w-24 text-xs font-medium text-slate-400 dark:text-slate-500">
                    가능 시간
                  </dt>
                  <dd className="text-slate-700 dark:text-slate-300">
                    {coach.availableHours || '협의 필요'}
                  </dd>
                </div>
                <div className="flex flex-col sm:flex-row sm:items-start gap-1 sm:gap-3">
                  <dt className="w-24 text-xs font-medium text-slate-400 dark:text-slate-500">
                    언어
                  </dt>
                  <dd className="text-slate-700 dark:text-slate-300">
                    {languages.length > 0 ? (
                      <span className="flex flex-wrap gap-2">
                        {languages.map((l) => (
                          <span
                            key={l}
                            className="px-2 py-0.5 text-[11px] rounded-full bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300"
                          >
                            {l}
                          </span>
                        ))}
                      </span>
                    ) : (
                      <span className="text-slate-400 dark:text-slate-500">미입력</span>
                    )}
                  </dd>
                </div>
              </dl>
            </div>
          </section>

          {/* Booking form */}
          <aside className="space-y-4">
            <form onSubmit={handleSubmit(onSubmit)} className="imp-card p-6 sticky top-20">
              <h2 className="text-sm font-semibold text-slate-900 dark:text-slate-100 mb-4 flex items-center gap-2">
                <span className="w-1.5 h-4 bg-blue-600 rounded" />
                세션 예약
              </h2>

              <div className="mb-3">
                <label
                  htmlFor="scheduledAt"
                  className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1"
                >
                  일정 *
                </label>
                <input
                  id="scheduledAt"
                  type="datetime-local"
                  {...register('scheduledAt')}
                  className="w-full px-3 py-2 text-sm border border-slate-200 dark:border-slate-600 rounded-lg dark:bg-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-blue-500"
                />
                {errors.scheduledAt && (
                  <p className="text-xs text-red-500 mt-1">{errors.scheduledAt.message}</p>
                )}
              </div>

              <div className="mb-3">
                <label
                  htmlFor="duration"
                  className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1"
                >
                  세션 시간 *
                </label>
                <select
                  id="duration"
                  {...register('duration')}
                  className="w-full px-3 py-2 text-sm border border-slate-200 dark:border-slate-600 rounded-lg dark:bg-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-blue-500"
                >
                  {DURATION_OPTIONS.map((d) => (
                    <option key={d} value={d}>
                      {d}분
                    </option>
                  ))}
                </select>
                {errors.duration && (
                  <p className="text-xs text-red-500 mt-1">{errors.duration.message}</p>
                )}
              </div>

              <div className="mb-4">
                <label
                  htmlFor="note"
                  className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1"
                >
                  요청사항
                </label>
                <textarea
                  id="note"
                  rows={4}
                  placeholder="원하시는 코칭 주제나 준비 자료를 적어주세요"
                  {...register('note')}
                  className="w-full px-3 py-2 text-sm border border-slate-200 dark:border-slate-600 rounded-lg dark:bg-slate-900 dark:text-slate-100 resize-none focus:ring-2 focus:ring-blue-500"
                />
                {errors.note && <p className="text-xs text-red-500 mt-1">{errors.note.message}</p>}
              </div>

              {/* 이력서 공유 (선택) — 코치가 예약 확정 후 열람 가능 */}
              {myResumes.length > 0 && (
                <div className="mb-4">
                  <label
                    htmlFor="resumeId"
                    className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1"
                  >
                    공유할 이력서 (선택)
                  </label>
                  <select
                    id="resumeId"
                    {...register('resumeId')}
                    className="w-full px-3 py-2 text-sm border border-slate-200 dark:border-slate-600 rounded-lg dark:bg-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">이력서 공유하지 않음</option>
                    {myResumes.map((r) => (
                      <option key={r.id} value={r.id}>
                        {r.title || '제목 없음'}
                      </option>
                    ))}
                  </select>
                  <p className="mt-1 text-[11px] text-slate-400 dark:text-slate-500 leading-relaxed">
                    선택한 이력서는 비공개 상태여도 예약 확정 후 코치가 열람할 수 있습니다. 세션
                    취소·환불 시 즉시 차단됩니다.
                  </p>
                </div>
              )}

              {/* Price preview */}
              <div className="rounded-xl border border-blue-100 dark:border-blue-900/40 bg-blue-50/60 dark:bg-blue-900/10 p-3 text-sm mb-4 space-y-1.5">
                <div className="flex items-center justify-between text-slate-600 dark:text-slate-400 text-xs">
                  <span>
                    코칭료 ({(coach.hourlyRate || 0).toLocaleString()}원 × {String(durationValue)}
                    분)
                  </span>
                  <span className="font-medium text-slate-700 dark:text-slate-200">
                    {priceBreakdown.base.toLocaleString()}원
                  </span>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="inline-flex items-center gap-1 text-blue-700 dark:text-blue-300 font-medium">
                    플랫폼 수수료{' '}
                    <span className="px-1.5 py-0.5 rounded-full bg-blue-100 dark:bg-blue-900/40 text-[10px]">
                      15%
                    </span>
                  </span>
                  <span className="font-medium text-blue-700 dark:text-blue-300">
                    {priceBreakdown.fee.toLocaleString()}원
                  </span>
                </div>
                <div className="flex items-center justify-between pt-2 border-t border-blue-100 dark:border-blue-900/40">
                  <span className="text-sm font-semibold text-slate-800 dark:text-slate-200">
                    총 결제 예정
                  </span>
                  <span className="text-base font-bold text-blue-700 dark:text-blue-400">
                    {priceBreakdown.total.toLocaleString()}원
                  </span>
                </div>
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full px-4 py-2.5 text-sm font-semibold rounded-lg bg-sky-700 text-white hover:from-blue-700 hover:to-cyan-700 disabled:opacity-50 transition-all shadow-sm"
              >
                {isSubmitting ? '예약 요청 중...' : '매칭 요청 보내기'}
              </button>
              <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-2 text-center">
                코치 확정 후 결제가 진행됩니다
              </p>

              {/* Cancellation policy */}
              <div className="mt-3 rounded-lg border border-amber-200/70 dark:border-amber-900/40 bg-amber-50/60 dark:bg-amber-900/10 p-2.5">
                <p className="text-[11px] font-semibold text-amber-700 dark:text-amber-300 mb-0.5 flex items-center gap-1">
                  <span aria-hidden="true">⚠️</span> 취소 정책
                </p>
                <ul className="text-[11px] text-amber-700/80 dark:text-amber-200/80 space-y-0.5 list-disc pl-4">
                  <li>세션 시작 24시간 이전 취소: 전액 환불</li>
                  <li>24시간 이내 취소: 환불 불가</li>
                  <li>노쇼(No-show): 환불 불가</li>
                </ul>
              </div>
            </form>
          </aside>
        </div>
      </main>
      <Footer />
    </>
  );
}

const TONE_MAP: Record<string, string> = {
  rose: 'text-blue-700 dark:text-blue-400',
  amber: 'text-amber-600 dark:text-amber-400',
  blue: 'text-blue-600 dark:text-blue-400',
  emerald: 'text-emerald-600 dark:text-emerald-400',
};

function Stat({
  label,
  value,
  tone,
}: {
  label: string;
  value: string;
  tone: keyof typeof TONE_MAP;
}) {
  return (
    <div className="text-center">
      <p className={`text-base font-bold ${TONE_MAP[tone]}`}>{value}</p>
      <p className="text-[10px] uppercase tracking-wider text-slate-400 dark:text-slate-500 mt-0.5">
        {label}
      </p>
    </div>
  );
}
