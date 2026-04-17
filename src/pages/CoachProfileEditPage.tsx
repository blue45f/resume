import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { toast } from '@/components/Toast';
import { upsertCoachProfile, fetchMyCoachingSessions } from '@/lib/api';
import { fetchMe, getUser, setAuth, getToken } from '@/lib/auth';

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

const coachProfileSchema = z.object({
  specialty: z
    .string()
    .min(2, '전문 분야를 입력해주세요')
    .max(100, '전문 분야는 100자 이내로 입력해주세요'),
  bio: z
    .string()
    .max(2000, '소개글은 2000자 이내로 입력해주세요')
    .optional()
    .or(z.literal('')),
  hourlyRate: z
    .coerce.number({ invalid_type_error: '시급을 숫자로 입력해주세요' })
    .int('시급은 정수로 입력해주세요')
    .min(0, '시급은 0 이상이어야 합니다')
    .max(10000000, '시급이 너무 높습니다'),
  yearsExp: z
    .coerce.number({ invalid_type_error: '경력 연차를 숫자로 입력해주세요' })
    .int('경력은 정수로 입력해주세요')
    .min(0, '경력은 0년 이상이어야 합니다')
    .max(80, '경력이 너무 높습니다'),
  languages: z
    .string()
    .max(200, '언어는 200자 이내로 입력해주세요')
    .optional()
    .or(z.literal('')),
  availableHours: z
    .string()
    .max(500, '가능 시간은 500자 이내로 입력해주세요')
    .optional()
    .or(z.literal('')),
  isActive: z.boolean().optional(),
});

type CoachProfileFormValues = z.infer<typeof coachProfileSchema>;

export default function CoachProfileEditPage() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [hasProfile, setHasProfile] = useState(false);
  const user = getUser();

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<CoachProfileFormValues>({
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

  useEffect(() => {
    document.title = '코치 프로필 — 이력서공방';
    return () => { document.title = '이력서공방 - AI 기반 이력서 관리 플랫폼'; };
  }, []);

  useEffect(() => {
    let cancelled = false;
    // Fetch sessions to read existing coach profile from asCoach[0].coach if any
    fetchMyCoachingSessions()
      .then(res => {
        const coachProfile = res.asCoach?.[0]?.coach;
        if (coachProfile && !cancelled) {
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
        } else if (!cancelled) {
          // userType === 'coach' but no session yet means profile may still exist
          setHasProfile(user?.userType === 'coach');
        }
      })
      .catch(() => { /* 기존 프로필이 없을 수 있음 */ })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [reset]);

  const onSubmit = async (data: CoachProfileFormValues) => {
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
      } catch { /* noop */ }

      navigate('/coaching/sessions');
    } catch (err) {
      toast(err instanceof Error ? err.message : '프로필 저장에 실패했습니다', 'error');
    }
  };

  return (
    <>
      <Header />
      <main id="main-content" className="flex-1 max-w-3xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-6 sm:py-8" role="main">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 bg-gradient-to-br from-rose-500 to-pink-600 rounded-xl flex items-center justify-center shadow-sm">
            <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
          </div>
          <div className="flex-1">
            <h1 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-slate-100">코치 프로필</h1>
            <p className="text-sm text-slate-500 dark:text-slate-400">
              {hasProfile ? '프로필을 수정하거나 대시보드로 이동하세요' : '전문성을 소개하고 예약을 받아보세요'}
            </p>
          </div>
          {hasProfile && (
            <Link
              to="/coach/dashboard"
              className="px-3.5 py-2 text-xs font-medium rounded-lg bg-gradient-to-r from-rose-500 to-pink-600 text-white hover:from-rose-600 hover:to-pink-700 shadow-sm whitespace-nowrap"
            >
              코치 대시보드 →
            </Link>
          )}
        </div>

        {!loading && !hasProfile && (
          <div className="imp-card p-4 mb-4 bg-gradient-to-r from-rose-50 to-pink-50 dark:from-rose-900/20 dark:to-pink-900/20 border-rose-200/60 dark:border-rose-800/40">
            <div className="flex items-start gap-3">
              <span className="text-2xl">👋</span>
              <div>
                <p className="text-sm font-semibold text-slate-800 dark:text-slate-100 mb-1">코치로 활동을 시작해보세요</p>
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
            {/* Active toggle */}
            <div className="flex items-center justify-between p-3 rounded-lg bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-700/60">
              <div>
                <p className="text-sm font-medium text-slate-800 dark:text-slate-200">프로필 공개</p>
                <p className="text-[11px] text-slate-500 dark:text-slate-400">체크 해제 시 코치 목록에서 숨겨집니다</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  className="sr-only peer"
                  checked={!!isActive}
                  onChange={e => setValue('isActive', e.target.checked, { shouldDirty: true })}
                />
                <div className="w-11 h-6 bg-slate-300 dark:bg-slate-600 peer-checked:bg-rose-500 rounded-full peer transition-colors" />
                <div className="absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full transition-transform peer-checked:translate-x-5" />
              </label>
            </div>

            {/* Specialty */}
            <div>
              <label htmlFor="specialty" className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">
                전문 분야 *
              </label>
              <input
                id="specialty"
                list="coach-specialty-presets"
                placeholder="예: 이력서 첨삭, 면접 코칭"
                {...register('specialty')}
                className="w-full px-3 py-2 text-sm border border-slate-200 dark:border-slate-600 rounded-lg dark:bg-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-rose-500"
              />
              <datalist id="coach-specialty-presets">
                {SPECIALTIES.map(s => <option key={s} value={s} />)}
              </datalist>
              <div className="mt-1.5 flex flex-wrap gap-1.5">
                {SPECIALTIES.map(s => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => setValue('specialty', s, { shouldValidate: true, shouldDirty: true })}
                    className={`px-2 py-0.5 text-[11px] rounded-full border transition-colors ${
                      specialtyValue === s
                        ? 'bg-rose-500 border-rose-500 text-white'
                        : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-600 text-slate-600 dark:text-slate-300 hover:bg-rose-50 dark:hover:bg-rose-900/20'
                    }`}
                  >
                    {s}
                  </button>
                ))}
              </div>
              {errors.specialty && <p className="text-xs text-red-500 mt-1">{errors.specialty.message}</p>}
            </div>

            {/* Hourly rate + years */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label htmlFor="hourlyRate" className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">
                  시급 (원) *
                </label>
                <input
                  id="hourlyRate"
                  type="number"
                  inputMode="numeric"
                  min={0}
                  step={1000}
                  {...register('hourlyRate')}
                  className="w-full px-3 py-2 text-sm border border-slate-200 dark:border-slate-600 rounded-lg dark:bg-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-rose-500"
                />
                {errors.hourlyRate && <p className="text-xs text-red-500 mt-1">{errors.hourlyRate.message}</p>}
              </div>
              <div>
                <label htmlFor="yearsExp" className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">
                  경력 연차
                </label>
                <input
                  id="yearsExp"
                  type="number"
                  inputMode="numeric"
                  min={0}
                  step={1}
                  {...register('yearsExp')}
                  className="w-full px-3 py-2 text-sm border border-slate-200 dark:border-slate-600 rounded-lg dark:bg-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-rose-500"
                />
                {errors.yearsExp && <p className="text-xs text-red-500 mt-1">{errors.yearsExp.message}</p>}
              </div>
            </div>

            {/* Languages */}
            <div>
              <label htmlFor="languages" className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">
                사용 언어 (콤마로 구분)
              </label>
              <input
                id="languages"
                placeholder="예: 한국어, English"
                {...register('languages')}
                className="w-full px-3 py-2 text-sm border border-slate-200 dark:border-slate-600 rounded-lg dark:bg-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-rose-500"
              />
              {errors.languages && <p className="text-xs text-red-500 mt-1">{errors.languages.message}</p>}
            </div>

            {/* Available hours */}
            <div>
              <label htmlFor="availableHours" className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">
                가능 시간
              </label>
              <input
                id="availableHours"
                placeholder="예: 평일 19:00~22:00 / 주말 10:00~17:00"
                {...register('availableHours')}
                className="w-full px-3 py-2 text-sm border border-slate-200 dark:border-slate-600 rounded-lg dark:bg-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-rose-500"
              />
              {errors.availableHours && <p className="text-xs text-red-500 mt-1">{errors.availableHours.message}</p>}
            </div>

            {/* Bio */}
            <div>
              <label htmlFor="bio" className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">
                소개글
              </label>
              <textarea
                id="bio"
                rows={6}
                maxLength={2000}
                placeholder="어떤 분야의 전문가이신가요? 어떤 경험을 바탕으로 코칭하시나요?"
                {...register('bio')}
                className="w-full px-3 py-2 text-sm border border-slate-200 dark:border-slate-600 rounded-lg dark:bg-slate-900 dark:text-slate-100 resize-none focus:ring-2 focus:ring-rose-500"
              />
              {errors.bio && <p className="text-xs text-red-500 mt-1">{errors.bio.message}</p>}
            </div>

            <div className="flex items-center justify-between gap-3 pt-2 border-t border-slate-100 dark:border-slate-700/60">
              <p className="text-[11px] text-slate-400 dark:text-slate-500">
                {user?.userType === 'coach' ? '코치 계정으로 활동 중' : '저장 시 코치 계정으로 자동 전환됩니다'}
              </p>
              <button
                type="submit"
                disabled={isSubmitting}
                className="px-5 py-2 text-sm font-semibold rounded-lg bg-gradient-to-r from-rose-500 to-pink-600 text-white hover:from-rose-600 hover:to-pink-700 disabled:opacity-50 shadow-sm"
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
