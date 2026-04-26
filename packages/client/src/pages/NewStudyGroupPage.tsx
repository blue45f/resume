import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import Header from '@/components/Header';
import FeatureDisabledBanner from '@/components/FeatureDisabledBanner';
import Footer from '@/components/Footer';
import { toast } from '@/components/Toast';
import { createStudyGroup } from '@/lib/api';
import { getUser } from '@/lib/auth';
import { ROUTES } from '@/lib/routes';
import { t, tx } from '@/lib/i18n';
import {
  studyGroupSchema,
  type StudyGroupFormInput,
  type StudyGroupFormOutput,
} from '@/shared/lib/schemas/studyGroup';

const TIER_KEYS = ['public', 'large', 'mid', 'startup', 'foreign', 'sme', 'etc'] as const;
const CAFE_KEYS = [
  { value: 'interview', k: 'interview' },
  { value: 'resume', k: 'resume' },
  { value: 'coding-test', k: 'codingTest' },
  { value: 'study', k: 'study' },
  { value: 'networking', k: 'networking' },
] as const;
const LEVEL_KEYS = ['any', 'new', 'junior', 'mid', 'senior'] as const;
const getTIERS = () => TIER_KEYS.map((v) => ({ value: v, label: tx(`companyTier.${v}`) }));
const getCAFES = () => CAFE_KEYS.map((c) => ({ value: c.value, label: tx(`cafeCategory.${c.k}`) }));
const getLEVELS = () => LEVEL_KEYS.map((v) => ({ value: v, label: tx(`experienceLevel.${v}`) }));

export default function NewStudyGroupPage() {
  const navigate = useNavigate();
  const user = getUser();

  useEffect(() => {
    document.title = '새 스터디 그룹 — 이력서공방';
    if (!user) {
      toast('로그인이 필요합니다', 'error');
      navigate(ROUTES.login);
    }
  }, [user, navigate]);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<StudyGroupFormInput, unknown, StudyGroupFormOutput>({
    resolver: zodResolver(studyGroupSchema),
    defaultValues: {
      name: '',
      description: '',
      isPrivate: false,
      maxMembers: 10,
    },
  });

  const onSubmit = async (data: StudyGroupFormOutput) => {
    try {
      const tierEl = document.querySelector<HTMLSelectElement>('select[name="companyTier"]');
      const cafeEl = document.querySelector<HTMLSelectElement>('select[name="cafeCategory"]');
      const levelEl = document.querySelector<HTMLSelectElement>('select[name="experienceLevel"]');
      const companyEl = document.querySelector<HTMLInputElement>('input[name="companyName"]');
      const positionEl = document.querySelector<HTMLInputElement>('input[name="position"]');

      const created = await createStudyGroup({
        name: data.name,
        description: data.description || undefined,
        isPrivate: data.isPrivate,
        maxMembers: data.maxMembers,
        companyName: companyEl?.value.trim() || undefined,
        position: positionEl?.value.trim() || undefined,
        // 추가 필드를 아래처럼 래핑해 서버에 같이 전달
        ...({
          companyTier: tierEl?.value,
          cafeCategory: cafeEl?.value,
          experienceLevel: levelEl?.value,
        } as any),
      });
      toast('스터디 그룹이 생성됐습니다', 'success');
      navigate(ROUTES.interview.studyGroup(created.id));
    } catch (err) {
      toast(err instanceof Error ? err.message : '생성 실패', 'error');
    }
  };

  return (
    <>
      <Header />
      <main
        id="main-content"
        className="flex-1 max-w-2xl mx-auto w-full px-4 sm:px-6 py-6 sm:py-10"
        role="main"
      >
        <div className="mb-6">
          <button
            onClick={() => navigate(ROUTES.interview.studyGroups)}
            className="text-sm text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 mb-2 inline-flex items-center gap-1 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-accent)] focus-visible:ring-offset-2 rounded"
          >
            ← 스터디 목록
          </button>
          <h1 className="heading-accent text-2xl font-bold text-slate-900 dark:text-slate-100">
            {t('study.create')}
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            면접 준비 · 코딩 테스트 · 이력서 첨삭 등 함께 공부할 동료를 모집하세요.
          </p>
        </div>

        <FeatureDisabledBanner feature="studyGroup.create" label="스터디 그룹 생성">
          <form
            onSubmit={handleSubmit(onSubmit)}
            className="imp-card p-5 sm:p-6 space-y-5 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700"
          >
            <Field label="그룹 이름" error={errors.name?.message} required>
              <input
                {...register('name')}
                className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-900 text-sm text-slate-900 dark:text-slate-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
                placeholder="예: 네이버 프론트엔드 면접 스터디"
                maxLength={100}
              />
            </Field>

            <Field label="소개" error={errors.description?.message}>
              <textarea
                {...register('description')}
                rows={4}
                className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-900 text-sm text-slate-700 dark:text-slate-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 resize-y"
                placeholder="목표 · 일정 · 진행 방식 등을 설명해주세요"
                maxLength={1000}
              />
            </Field>

            <div className="stagger-children grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Field label="기업 카테고리">
                <select
                  name="companyTier"
                  defaultValue="etc"
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-900 text-sm"
                >
                  {getTIERS().map((t) => (
                    <option key={t.value} value={t.value}>
                      {t.label}
                    </option>
                  ))}
                </select>
              </Field>
              <Field label="카페 유형">
                <select
                  name="cafeCategory"
                  defaultValue="interview"
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-900 text-sm"
                >
                  {getCAFES().map((c) => (
                    <option key={c.value} value={c.value}>
                      {c.label}
                    </option>
                  ))}
                </select>
              </Field>
            </div>

            <div className="stagger-children grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Field label="경력 단계">
                <select
                  name="experienceLevel"
                  defaultValue="any"
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-900 text-sm"
                >
                  {getLEVELS().map((l) => (
                    <option key={l.value} value={l.value}>
                      {l.label}
                    </option>
                  ))}
                </select>
              </Field>
              <Field label="정원" error={errors.maxMembers?.message} required>
                <input
                  type="number"
                  {...register('maxMembers', { valueAsNumber: true })}
                  min={2}
                  max={30}
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-900 text-sm"
                />
              </Field>
            </div>

            <div className="stagger-children grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Field label="타겟 회사 (선택)">
                <input
                  name="companyName"
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-900 text-sm"
                  placeholder="예: 네이버"
                />
              </Field>
              <Field label="타겟 직무 (선택)">
                <input
                  name="position"
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-900 text-sm"
                  placeholder="예: 프론트엔드"
                />
              </Field>
            </div>

            <label className="flex items-start gap-2 cursor-pointer">
              <input
                type="checkbox"
                {...register('isPrivate')}
                className="mt-1 w-4 h-4 rounded border-slate-300"
              />
              <div>
                <span className="text-sm font-medium text-slate-800 dark:text-slate-200">
                  비공개 그룹
                </span>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  초대받은 멤버만 가입할 수 있습니다. 공개 검색에 노출되지 않습니다.
                </p>
              </div>
            </label>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-700">
              <button
                type="button"
                onClick={() => navigate(ROUTES.interview.studyGroups)}
                className="px-4 py-2 text-sm text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 rounded-lg transition-colors"
              >
                {t('common.cancel')}
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="imp-btn px-5 py-2 text-sm font-semibold bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
              >
                {isSubmitting ? t('common.loading') : t('study.create')}
              </button>
            </div>
          </form>
        </FeatureDisabledBanner>
      </main>
      <Footer />
    </>
  );
}

function Field({
  label,
  error,
  required,
  children,
}: {
  label: string;
  error?: string;
  required?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
        {label}
        {required && <span className="text-red-500 ml-0.5">*</span>}
      </label>
      {children}
      {error && <p className="text-[11px] text-red-500 mt-1">{error}</p>}
    </div>
  );
}
