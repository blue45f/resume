import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { toast } from '@/components/Toast';
import { upsertCoachProfile } from '@/lib/api';
import { useMyCoachingSessions } from '@/hooks/useResources';
import { fetchMe, getUser, setAuth, getToken } from '@/lib/auth';
import { ROUTES } from '@/lib/routes';
import {
  coachProfileSchema,
  type CoachProfileFormInput,
  type CoachProfileFormOutput,
} from '@/shared/lib/schemas/coach';

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

export default function CoachProfileEditPage() {
  const navigate = useNavigate();
  const sessionsQuery = useMyCoachingSessions();
  const loading = sessionsQuery.isLoading;
  const [hasProfile, setHasProfile] = useState(false);
  const user = getUser();

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<CoachProfileFormInput, unknown, CoachProfileFormOutput>({
    resolver: zodResolver(coachProfileSchema),
    defaultValues: {
      specialty: '',
      bio: '',
      hourlyRate: 50000,
      yearsExp: 1,
      languages: '한국어',
      availableHours: '',
      isActive: true,
    },
  });

  const specialtyValue = watch('specialty');
  const isActive = watch('isActive');
  const bioValue = watch('bio');
  const hourlyRateValue = watch('hourlyRate');
  const yearsExpValue = watch('yearsExp');
  const languagesValue = watch('languages');
  const availableHoursValue = watch('availableHours');

  // 프로필 완성도 점수 — 각 필드가 채워졌는지에 따라 0~100%
  const completeness = (() => {
    const items = [
      { label: '전문분야', done: !!specialtyValue && String(specialtyValue).trim().length >= 2 },
      { label: '시급', done: Number(hourlyRateValue) > 0 },
      { label: '경력', done: Number(yearsExpValue) > 0 },
      { label: '소개글', done: !!bioValue && String(bioValue).trim().length >= 50 },
      {
        label: '가능 시간',
        done: !!availableHoursValue && String(availableHoursValue).trim().length > 0,
      },
      { label: '언어', done: !!languagesValue && String(languagesValue).trim().length > 0 },
    ];
    const doneCount = items.filter((i) => i.done).length;
    const percent = Math.round((doneCount / items.length) * 100);
    return { items, doneCount, total: items.length, percent };
  })();

  useEffect(() => {
    document.title = '코치 프로필 — 이력서공방';
    return () => {
      document.title = '이력서공방 - AI 기반 이력서 관리 플랫폼';
    };
  }, []);

  useEffect(() => {
    const res = sessionsQuery.data;
    if (!res) {
      if (sessionsQuery.isError) {
        // fallback: userType === 'coach' but no session yet means profile may still exist
        setHasProfile(user?.userType === 'coach');
      }
      return;
    }
    const coachProfile = res.asCoach?.[0]?.coach;
    if (coachProfile) {
      setHasProfile(true);
      reset({
        specialty: coachProfile.specialty || '',
        bio: coachProfile.bio || '',
        hourlyRate: coachProfile.hourlyRate || 50000,
        yearsExp: coachProfile.yearsExp || 0,
        languages: coachProfile.languages || '한국어',
        availableHours: coachProfile.availableHours || '',
        isActive: coachProfile.isActive ?? true,
      });
    } else {
      setHasProfile(user?.userType === 'coach');
    }
  }, [sessionsQuery.data, sessionsQuery.isError, reset, user?.userType]);

  const onSubmit = async (data: CoachProfileFormOutput) => {
    try {
      await upsertCoachProfile({
        specialty: data.specialty.trim(),
        bio: data.bio?.trim() || undefined,
        hourlyRate: Number(data.hourlyRate),
        yearsExp: Number(data.yearsExp),
        languages: data.languages?.trim() || undefined,
        availableHours: data.availableHours?.trim() || undefined,
        isActive: data.isActive ?? true,
      });
      toast('코치 프로필이 저장되었습니다', 'success');

      // Sync userType from server (auto-promotion to coach)
      try {
        const updated = await fetchMe();
        const token = getToken();
        if (updated && token) setAuth(token, updated);
      } catch {
        /* noop */
      }

      navigate(ROUTES.coaching.sessions);
    } catch (err) {
      toast(err instanceof Error ? err.message : '프로필 저장에 실패했습니다', 'error');
    }
  };

  return (
    <>
      <Header />
      <main
        id="main-content"
        className="flex-1 max-w-3xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-6 sm:py-8"
        role="main"
      >
        <div className="flex items-center gap-3 mb-6">
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
                d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
              />
            </svg>
          </div>
          <div className="flex-1">
            <h1 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-slate-100">
              코치 프로필
            </h1>
            <p className="text-sm text-slate-500 dark:text-slate-400">
              {hasProfile
                ? '프로필을 수정하거나 대시보드로 이동하세요'
                : '전문성을 소개하고 예약을 받아보세요'}
            </p>
          </div>
          {hasProfile && (
            <Link
              to={ROUTES.coaching.dashboard}
              className="px-3.5 py-2 text-xs font-medium rounded-lg bg-gradient-to-r from-blue-600 to-cyan-600 text-white hover:from-blue-700 hover:to-cyan-700 shadow-sm whitespace-nowrap"
            >
              코치 대시보드 →
            </Link>
          )}
        </div>

        {!loading && !hasProfile && (
          <div className="imp-card p-4 mb-4 bg-gradient-to-r from-blue-50 to-cyan-50 dark:from-blue-900/20 dark:to-cyan-900/20 border-blue-200/60 dark:border-blue-800/40">
            <div className="flex items-start gap-3">
              <span className="text-2xl">👋</span>
              <div>
                <p className="text-sm font-semibold text-slate-800 dark:text-slate-100 mb-1">
                  코치로 활동을 시작해보세요
                </p>
                <p className="text-xs text-slate-600 dark:text-slate-300">
                  아래 프로필을 작성하면 코치 목록에 공개되며, 예약을 받을 수 있습니다.
                </p>
              </div>
            </div>
          </div>
        )}

        {loading ? (
          <div className="imp-card p-6 animate-pulse space-y-4">
            <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-1/3" />
            <div className="h-10 bg-slate-200 dark:bg-slate-700 rounded" />
            <div className="h-24 bg-slate-200 dark:bg-slate-700 rounded" />
          </div>
        ) : (
          <form onSubmit={handleSubmit(onSubmit)} className="imp-card p-6 space-y-5">
            {/* 프로필 완성도 바 */}
            <div className="p-4 rounded-lg bg-gradient-to-br from-blue-50 to-cyan-50 dark:from-blue-900/15 dark:to-cyan-900/15 border border-blue-100 dark:border-blue-900/30">
              <div className="flex items-center justify-between mb-2">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wider text-blue-700 dark:text-blue-300">
                    프로필 완성도
                  </p>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                    완성도가 높을수록 고객에게 더 잘 노출됩니다
                  </p>
                </div>
                <div className="text-right">
                  <div className="text-2xl font-bold text-blue-700 dark:text-blue-300">
                    {completeness.percent}%
                  </div>
                  <div className="text-[10px] text-slate-500 dark:text-slate-400">
                    {completeness.doneCount}/{completeness.total}
                  </div>
                </div>
              </div>
              <div className="h-2 bg-white dark:bg-slate-800 rounded-full overflow-hidden border border-slate-100 dark:border-slate-700">
                <div
                  className="h-full bg-gradient-to-r from-blue-500 to-cyan-500 transition-all duration-500"
                  style={{ width: `${completeness.percent}%` }}
                />
              </div>
              <div className="mt-3 flex flex-wrap gap-1.5">
                {completeness.items.map((it) => (
                  <span
                    key={it.label}
                    className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium ${
                      it.done
                        ? 'bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300'
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-400 dark:text-slate-500'
                    }`}
                  >
                    {it.done ? '✓' : '○'} {it.label}
                  </span>
                ))}
              </div>
            </div>

            {/* Active toggle */}
            <div className="flex items-center justify-between p-3 rounded-lg bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-700/60">
              <div>
                <p className="text-sm font-medium text-slate-800 dark:text-slate-200">
                  프로필 공개
                </p>
                <p className="text-[11px] text-slate-500 dark:text-slate-400">
                  체크 해제 시 코치 목록에서 숨겨집니다
                </p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  className="sr-only peer"
                  checked={!!isActive}
                  onChange={(e) => setValue('isActive', e.target.checked, { shouldDirty: true })}
                />
                <div className="w-11 h-6 bg-slate-300 dark:bg-slate-600 peer-checked:bg-blue-600 rounded-full peer transition-colors" />
                <div className="absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full transition-transform peer-checked:translate-x-5" />
              </label>
            </div>

            {/* Specialty */}
            <div>
              <label
                htmlFor="specialty"
                className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1"
              >
                전문 분야 *
              </label>
              <input
                id="specialty"
                list="coach-specialty-presets"
                placeholder="예: 이력서 첨삭, 면접 코칭"
                {...register('specialty')}
                className="w-full px-3 py-2 text-sm border border-slate-200 dark:border-slate-600 rounded-lg dark:bg-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-blue-500"
              />
              <datalist id="coach-specialty-presets">
                {SPECIALTIES.map((s) => (
                  <option key={s} value={s} />
                ))}
              </datalist>
              <div className="mt-1.5 flex flex-wrap gap-1.5">
                {SPECIALTIES.map((s) => (
                  <button
                    key={s}
                    type="button"
                    onClick={() =>
                      setValue('specialty', s, { shouldValidate: true, shouldDirty: true })
                    }
                    className={`px-2 py-0.5 text-[11px] rounded-full border transition-colors ${
                      specialtyValue === s
                        ? 'bg-blue-600 border-blue-600 text-white'
                        : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-600 text-slate-600 dark:text-slate-300 hover:bg-blue-50 dark:hover:bg-blue-900/20'
                    }`}
                  >
                    {s}
                  </button>
                ))}
              </div>
              {errors.specialty && (
                <p className="text-xs text-red-500 mt-1">{errors.specialty.message}</p>
              )}
            </div>

            {/* Hourly rate + years */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label
                  htmlFor="hourlyRate"
                  className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1"
                >
                  시급 (원) *
                </label>
                <input
                  id="hourlyRate"
                  type="number"
                  inputMode="numeric"
                  min={0}
                  step={1000}
                  {...register('hourlyRate')}
                  className="w-full px-3 py-2 text-sm border border-slate-200 dark:border-slate-600 rounded-lg dark:bg-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-blue-500"
                />
                {errors.hourlyRate && (
                  <p className="text-xs text-red-500 mt-1">{errors.hourlyRate.message}</p>
                )}
              </div>
              <div>
                <label
                  htmlFor="yearsExp"
                  className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1"
                >
                  경력 연차
                </label>
                <input
                  id="yearsExp"
                  type="number"
                  inputMode="numeric"
                  min={0}
                  step={1}
                  {...register('yearsExp')}
                  className="w-full px-3 py-2 text-sm border border-slate-200 dark:border-slate-600 rounded-lg dark:bg-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-blue-500"
                />
                {errors.yearsExp && (
                  <p className="text-xs text-red-500 mt-1">{errors.yearsExp.message}</p>
                )}
              </div>
            </div>

            {/* Languages */}
            <div>
              <label
                htmlFor="languages"
                className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1"
              >
                사용 언어 (콤마로 구분)
              </label>
              <input
                id="languages"
                placeholder="예: 한국어, English"
                {...register('languages')}
                className="w-full px-3 py-2 text-sm border border-slate-200 dark:border-slate-600 rounded-lg dark:bg-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-blue-500"
              />
              {errors.languages && (
                <p className="text-xs text-red-500 mt-1">{errors.languages.message}</p>
              )}
            </div>

            {/* Available hours */}
            <div>
              <label
                htmlFor="availableHours"
                className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1"
              >
                가능 시간
              </label>
              <input
                id="availableHours"
                placeholder="예: 평일 19:00~22:00 / 주말 10:00~17:00"
                {...register('availableHours')}
                className="w-full px-3 py-2 text-sm border border-slate-200 dark:border-slate-600 rounded-lg dark:bg-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-blue-500"
              />
              {errors.availableHours && (
                <p className="text-xs text-red-500 mt-1">{errors.availableHours.message}</p>
              )}
            </div>

            {/* Bio */}
            <div>
              <label
                htmlFor="bio"
                className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1"
              >
                소개글
              </label>
              <textarea
                id="bio"
                rows={6}
                maxLength={2000}
                placeholder="어떤 분야의 전문가이신가요? 어떤 경험을 바탕으로 코칭하시나요?"
                {...register('bio')}
                className="w-full px-3 py-2 text-sm border border-slate-200 dark:border-slate-600 rounded-lg dark:bg-slate-900 dark:text-slate-100 resize-none focus:ring-2 focus:ring-blue-500"
              />
              {errors.bio && <p className="text-xs text-red-500 mt-1">{errors.bio.message}</p>}
            </div>

            <div className="flex items-center justify-between gap-3 pt-2 border-t border-slate-100 dark:border-slate-700/60">
              <p className="text-[11px] text-slate-400 dark:text-slate-500">
                {user?.userType === 'coach'
                  ? '코치 계정으로 활동 중'
                  : '저장 시 코치 계정으로 자동 전환됩니다'}
              </p>
              <button
                type="submit"
                disabled={isSubmitting}
                className="px-5 py-2 text-sm font-semibold rounded-lg bg-gradient-to-r from-blue-600 to-cyan-600 text-white hover:from-blue-700 hover:to-cyan-700 disabled:opacity-50 shadow-sm"
              >
                {isSubmitting ? '저장 중...' : '프로필 저장'}
              </button>
            </div>
          </form>
        )}
      </main>
      <Footer />
    </>
  );
}
