import { useState, useEffect, useRef, useMemo } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { toast } from '@/components/Toast';
import { getUser } from '@/lib/auth';
import { ROUTES } from '@/lib/routes';
import { tx } from '@/lib/i18n';
import { createJob } from '@/lib/api';
import { useJob } from '@/hooks/useResources';
import {
  jobPostSchema,
  type JobPostFormValues,
  JOB_TYPE_VALUES,
  SALARY_MIN,
  SALARY_MAX,
  SALARY_STEP,
} from '@/shared/lib/schemas/jobPost';

const JOB_TYPES: { value: (typeof JOB_TYPE_VALUES)[number]; label: string }[] = [
  { value: 'fulltime', label: '정규직' },
  { value: 'contract', label: '계약직' },
  { value: 'parttime', label: '파트타임' },
  { value: 'intern', label: '인턴' },
];

const FORMAT_HINTS = [
  { label: '## 제목', desc: '섹션 제목' },
  { label: '- 항목', desc: '목록' },
  { label: '**굵게**', desc: '강조' },
  { label: '> 인용', desc: '인용문' },
];

export default function JobPostPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const copyFromId = searchParams.get('copyFrom');
  const user = getUser();
  const [preview, setPreview] = useState(false);
  const [skillInput, setSkillInput] = useState('');
  const skillInputRef = useRef<HTMLInputElement>(null);

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<JobPostFormValues>({
    resolver: zodResolver(jobPostSchema),
    defaultValues: {
      company: user?.companyName || '',
      position: '',
      location: '',
      salaryMin: 4000,
      salaryMax: 7000,
      salaryText: '',
      description: '',
      requirements: '',
      benefits: '',
      type: 'fulltime',
      skills: '',
    },
  });

  const form = watch();

  const skillTags = useMemo(
    () =>
      (form.skills || '')
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean),
    [form.skills],
  );

  const { data: copyJob, error: copyError } = useJob(copyFromId || undefined);

  useEffect(() => {
    document.title = copyFromId ? '공고 복사하여 등록 — 이력서공방' : '채용 공고 등록 — 이력서공방';
    if (!user || user.userType === 'personal') {
      toast('리크루터 또는 기업 회원만 공고를 등록할 수 있습니다', 'error');
      navigate(ROUTES.jobs.list);
      return;
    }
    return () => {
      document.title = '이력서공방 - AI 기반 이력서 관리 플랫폼';
    };
  }, []);

  useEffect(() => {
    if (copyJob) {
      const job: any = copyJob;
      let salaryMin = 4000,
        salaryMax = 7000;
      const salaryMatch = (job.salary || '').match(/(\d[\d,]*).*?[~\-].*?(\d[\d,]*)/);
      if (salaryMatch) {
        salaryMin = parseInt(salaryMatch[1].replace(/,/g, ''));
        salaryMax = parseInt(salaryMatch[2].replace(/,/g, ''));
      }
      reset({
        company: job.company || user?.companyName || '',
        position: job.position ? `${job.position} (복사본)` : '',
        location: job.location || '',
        salaryMin,
        salaryMax,
        salaryText: job.salary || '',
        description: job.description || '',
        requirements: job.requirements || '',
        benefits: job.benefits || '',
        type: job.type || 'fulltime',
        skills: job.skills || '',
      });
    }
    if (copyError) toast('원본 공고를 불러올 수 없습니다', 'error');
  }, [copyJob, copyError]);

  const onSubmit = async (values: JobPostFormValues) => {
    try {
      const salary =
        values.salaryText ||
        `${values.salaryMin.toLocaleString()}~${values.salaryMax.toLocaleString()}만원`;
      await createJob({ ...values, salary });
      toast('채용 공고가 등록되었습니다', 'success');
      navigate(ROUTES.jobs.list);
    } catch (e: any) {
      toast(e.message || '등록에 실패했습니다', 'error');
    }
  };

  const addSkill = (value: string) => {
    const tag = value.trim();
    if (!tag) return;
    if (skillTags.includes(tag)) return;
    const updated = skillTags.length > 0 ? `${form.skills}, ${tag}` : tag;
    setValue('skills', updated, { shouldValidate: true, shouldDirty: true });
    setSkillInput('');
  };

  const removeSkill = (tag: string) => {
    const updated = skillTags.filter((s) => s !== tag).join(', ');
    setValue('skills', updated, { shouldValidate: true, shouldDirty: true });
  };

  const handleSkillKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      addSkill(skillInput);
    }
    if (e.key === 'Backspace' && !skillInput && skillTags.length > 0) {
      removeSkill(skillTags[skillTags.length - 1]);
    }
  };

  const inputClass =
    'w-full px-4 py-2.5 border border-slate-200 dark:border-slate-600 rounded-xl text-sm dark:bg-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500';
  const errorClass = 'text-xs text-red-500 mt-1';

  const formatSalary = (v: number) => `${v.toLocaleString()}만원`;

  // Simple markdown-like preview renderer
  const renderDescription = (text: string) => {
    return text.split('\n').map((line, i) => {
      if (line.startsWith('## '))
        return (
          <h3 key={i} className="text-base font-bold text-slate-900 dark:text-slate-100 mt-4 mb-1">
            {line.slice(3)}
          </h3>
        );
      if (line.startsWith('# '))
        return (
          <h2 key={i} className="text-lg font-bold text-slate-900 dark:text-slate-100 mt-4 mb-1">
            {line.slice(2)}
          </h2>
        );
      if (line.startsWith('- '))
        return (
          <li key={i} className="ml-4 text-sm text-slate-700 dark:text-slate-300">
            {line.slice(2)}
          </li>
        );
      if (line.startsWith('> '))
        return (
          <blockquote
            key={i}
            className="border-l-2 border-slate-300 dark:border-slate-600 pl-3 text-sm text-slate-500 dark:text-slate-400 italic"
          >
            {line.slice(2)}
          </blockquote>
        );
      if (!line.trim()) return <br key={i} />;
      // Bold
      const parts = line.split(/\*\*(.*?)\*\*/g);
      return (
        <p key={i} className="text-sm text-slate-700 dark:text-slate-300">
          {parts.map((part, j) => (j % 2 === 1 ? <strong key={j}>{part}</strong> : part))}
        </p>
      );
    });
  };

  return (
    <>
      <Header />
      <main
        id="main-content"
        className="flex-1 max-w-3xl mx-auto w-full px-4 sm:px-6 py-6 sm:py-8"
        role="main"
      >
        <div className="flex items-center justify-between mb-6">
          <h1 className="heading-accent text-xl sm:text-2xl font-bold text-slate-900 dark:text-slate-100">
            {copyFromId ? `${tx('jobs.title')} — ${tx('common.copy')}` : tx('jobs.title')}
          </h1>
          <button
            type="button"
            onClick={() => setPreview(!preview)}
            className={`px-3 py-2 text-xs font-medium rounded-xl border transition-colors ${
              preview
                ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 border-blue-200 dark:border-blue-800'
                : 'border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800'
            }`}
          >
            {preview ? '편집 모드' : '미리보기'}
          </button>
        </div>

        {preview ? (
          /* Preview mode */
          <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-6 space-y-5 animate-fade-in">
            <div className="flex items-start justify-between">
              <div>
                <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100">
                  {form.position || '포지션 미입력'}
                </h2>
                <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                  {form.company || '회사명 미입력'}
                </p>
              </div>
              <span className="px-2.5 py-1 text-xs rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 font-medium">
                {JOB_TYPES.find((t) => t.value === form.type)?.label || '정규직'}
              </span>
            </div>

            <div className="flex flex-wrap gap-3 text-sm text-slate-600 dark:text-slate-400">
              {form.location && <span>📍 {form.location}</span>}
              <span>
                💰{' '}
                {form.salaryText ||
                  `${formatSalary(form.salaryMin)} ~ ${formatSalary(form.salaryMax)}`}
              </span>
            </div>

            {skillTags.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {skillTags.map((tag) => (
                  <span
                    key={tag}
                    className="px-2.5 py-1 text-xs rounded-full bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 font-medium"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            )}

            {form.description && (
              <div>
                <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
                  상세 설명
                </h3>
                <div className="prose-sm">{renderDescription(form.description)}</div>
              </div>
            )}
            {form.requirements && (
              <div>
                <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
                  자격 요건
                </h3>
                <div className="prose-sm">{renderDescription(form.requirements)}</div>
              </div>
            )}
            {form.benefits && (
              <div>
                <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
                  복리후생
                </h3>
                <div className="prose-sm">{renderDescription(form.benefits)}</div>
              </div>
            )}

            <div className="flex gap-3 pt-2">
              <button
                type="button"
                onClick={() => setPreview(false)}
                className="px-5 py-2.5 text-sm text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-700 rounded-xl hover:bg-slate-200 transition-colors"
              >
                편집으로 돌아가기
              </button>
              <button
                onClick={handleSubmit(onSubmit)}
                disabled={isSubmitting}
                className="flex-1 py-2.5 bg-blue-600 text-white text-sm font-medium rounded-xl hover:bg-blue-700 disabled:opacity-50 transition-colors"
              >
                {isSubmitting ? '등록 중...' : '채용 공고 등록'}
              </button>
            </div>
          </div>
        ) : (
          /* Edit mode */
          <form
            onSubmit={handleSubmit(onSubmit)}
            className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-6 space-y-4"
          >
            <div className="stagger-children grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-200 mb-1">
                  회사명 *
                </label>
                <input {...register('company')} className={inputClass} placeholder="예: 네이버" />
                {errors.company && <p className={errorClass}>{errors.company.message}</p>}
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-200 mb-1">
                  포지션 *
                </label>
                <input
                  {...register('position')}
                  className={inputClass}
                  placeholder="예: 프론트엔드 개발자"
                />
                {errors.position && <p className={errorClass}>{errors.position.message}</p>}
              </div>
            </div>

            <div className="stagger-children grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-200 mb-1">
                  근무지
                </label>
                <input
                  {...register('location')}
                  className={inputClass}
                  placeholder="예: 서울시 강남구"
                />
                {errors.location && <p className={errorClass}>{errors.location.message}</p>}
              </div>
              <div className="sm:col-span-1">
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-200 mb-1">
                  고용 형태
                </label>
                <select {...register('type')} className={inputClass}>
                  {JOB_TYPES.map((t) => (
                    <option key={t.value} value={t.value}>
                      {t.label}
                    </option>
                  ))}
                </select>
                {errors.type && <p className={errorClass}>{errors.type.message}</p>}
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-200 mb-1">
                  연봉 (직접입력)
                </label>
                <input
                  {...register('salaryText')}
                  className={inputClass}
                  placeholder="비워두면 슬라이더 값 사용"
                />
                {errors.salaryText && <p className={errorClass}>{errors.salaryText.message}</p>}
              </div>
            </div>

            {/* Salary Range Slider */}
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-200 mb-2">
                연봉 범위:{' '}
                <span className="text-blue-600 dark:text-blue-400">
                  {formatSalary(form.salaryMin)} ~ {formatSalary(form.salaryMax)}
                </span>
              </label>
              <div className="flex items-center gap-3">
                <span className="text-xs text-slate-500 dark:text-slate-400 shrink-0 w-16 text-right">
                  {formatSalary(form.salaryMin)}
                </span>
                <div className="flex-1 space-y-1">
                  <input
                    type="range"
                    min={SALARY_MIN}
                    max={SALARY_MAX}
                    step={SALARY_STEP}
                    value={form.salaryMin}
                    onChange={(e) => {
                      const v = Number(e.target.value);
                      setValue('salaryMin', Math.min(v, form.salaryMax - SALARY_STEP), {
                        shouldValidate: true,
                        shouldDirty: true,
                      });
                    }}
                    className="w-full accent-blue-600"
                  />
                  <input
                    type="range"
                    min={SALARY_MIN}
                    max={SALARY_MAX}
                    step={SALARY_STEP}
                    value={form.salaryMax}
                    onChange={(e) => {
                      const v = Number(e.target.value);
                      setValue('salaryMax', Math.max(v, form.salaryMin + SALARY_STEP), {
                        shouldValidate: true,
                        shouldDirty: true,
                      });
                    }}
                    className="w-full accent-blue-600"
                  />
                </div>
                <span className="text-xs text-slate-500 dark:text-slate-400 shrink-0 w-16">
                  {formatSalary(form.salaryMax)}
                </span>
              </div>
              {errors.salaryMin && <p className={errorClass}>{errors.salaryMin.message}</p>}
              {errors.salaryMax && <p className={errorClass}>{errors.salaryMax.message}</p>}
            </div>

            {/* Skill Tags Input */}
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-200 mb-1">
                기술 스택
              </label>
              <div
                className="flex flex-wrap gap-2 p-2 border border-slate-200 dark:border-slate-600 rounded-xl dark:bg-slate-800 min-h-[44px] cursor-text"
                onClick={() => skillInputRef.current?.focus()}
              >
                {skillTags.map((tag) => (
                  <span
                    key={tag}
                    className="inline-flex items-center gap-1 px-2.5 py-1 text-xs rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 font-medium"
                  >
                    {tag}
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        removeSkill(tag);
                      }}
                      className="hover:text-red-500 transition-colors ml-0.5"
                      aria-label={`${tag} 삭제`}
                    >
                      ×
                    </button>
                  </span>
                ))}
                <input
                  ref={skillInputRef}
                  value={skillInput}
                  onChange={(e) => setSkillInput(e.target.value)}
                  onKeyDown={handleSkillKeyDown}
                  onBlur={() => addSkill(skillInput)}
                  className="flex-1 min-w-[100px] px-1 py-0.5 text-sm bg-transparent outline-none dark:text-slate-100"
                  placeholder={
                    skillTags.length === 0 ? 'Enter 또는 쉼표로 추가 (예: React, TypeScript)' : ''
                  }
                />
              </div>
              {errors.skills && <p className={errorClass}>{errors.skills.message}</p>}
            </div>

            {/* Description with formatting hints */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-200">
                  상세 설명
                </label>
                <div className="flex gap-2">
                  {FORMAT_HINTS.map((h) => (
                    <span
                      key={h.label}
                      className="text-[10px] text-slate-500 dark:text-slate-400"
                      title={h.desc}
                    >
                      <code className="bg-slate-100 dark:bg-slate-700 px-1 rounded">{h.label}</code>
                    </span>
                  ))}
                </div>
              </div>
              <textarea
                {...register('description')}
                rows={6}
                className={inputClass + ' resize-none font-mono text-xs'}
                placeholder="## 업무 내용\n- 주요 업무 1\n- 주요 업무 2\n\n## 팀 소개\n우리 팀은..."
              />
              {errors.description && <p className={errorClass}>{errors.description.message}</p>}
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-200">
                  자격 요건
                </label>
              </div>
              <textarea
                {...register('requirements')}
                rows={4}
                className={inputClass + ' resize-none font-mono text-xs'}
                placeholder="## 필수\n- 3년 이상 경력\n\n## 우대\n- 관련 자격증"
              />
              {errors.requirements && <p className={errorClass}>{errors.requirements.message}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-200 mb-1">
                복리후생
              </label>
              <textarea
                {...register('benefits')}
                rows={3}
                className={inputClass + ' resize-none font-mono text-xs'}
                placeholder="- 자유로운 연차 사용\n- 교육비 지원\n- 유연근무제"
              />
              {errors.benefits && <p className={errorClass}>{errors.benefits.message}</p>}
            </div>

            <div className="flex gap-3 pt-2">
              <button
                type="button"
                onClick={() => navigate(ROUTES.jobs.list)}
                className="px-5 py-2.5 text-sm text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-700 rounded-xl hover:bg-slate-200 transition-colors"
              >
                취소
              </button>
              <button
                type="button"
                onClick={() => setPreview(true)}
                className="px-5 py-2.5 text-sm text-blue-600 bg-blue-50 dark:bg-blue-900/20 rounded-xl hover:bg-blue-100 transition-colors"
              >
                미리보기
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="flex-1 py-2.5 bg-blue-600 text-white text-sm font-medium rounded-xl hover:bg-blue-700 disabled:opacity-50 transition-colors"
              >
                {isSubmitting ? '등록 중...' : '채용 공고 등록'}
              </button>
            </div>
          </form>
        )}
      </main>
      <Footer />
    </>
  );
}
