import { useState, useEffect, useRef, useCallback, lazy, Suspense, useMemo } from 'react';
import { useForm, useFieldArray, Controller, type UseFormReturn } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import type {
  Experience,
  Education,
  Skill,
  Project,
  Certification,
  Language,
  Award,
  Activity,
  SectionId,
} from '@/types/resume';
import type { Resume } from '@/types/resume';
import { DEFAULT_SECTION_ORDER } from '@/types/resume';
import { toast } from '@/components/Toast';
import { t } from '@/lib/i18n';
import { sectionTips, powerVerbs } from '@/lib/writingTips';
import { resumeFormSchema, type ResumeFormInput } from '@/shared/lib/schemas/resume';

const RichEditor = lazy(() => import('@/components/RichEditor'));
import VoiceInput from '@/components/VoiceInput';
import AiWritingAssist from '@/components/AiWritingAssist';
import {
  SkillSuggestDropdown,
  CompanyRoleSuggest,
  InlineContentTip,
} from '@/components/SkillSuggest';
import AiCoachPanel from '@/components/AiCoachPanel';
import AiSummaryGenerator from '@/components/AiSummaryGenerator';
import SectionOrderPanel from '@/components/SectionOrderPanel';
import ContentSuggestions from '@/components/ContentSuggestions';

type SaveStatus = 'saved' | 'saving' | 'dirty' | 'error' | 'idle';

function SaveStatusPill({ status, lastSaved }: { status: SaveStatus; lastSaved: Date | null }) {
  const config: Record<SaveStatus, { label: string; color: string; icon: string }> = {
    idle: { label: '', color: '', icon: '' },
    saved: {
      label: lastSaved
        ? `저장됨 ${lastSaved.toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' })}`
        : '저장됨',
      color:
        'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 border-green-200 dark:border-green-800',
      icon: 'M5 13l4 4L19 7',
    },
    saving: {
      label: '저장 중...',
      color:
        'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400 border-blue-200 dark:border-blue-800',
      icon: 'M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15',
    },
    dirty: {
      label: '변경사항 있음',
      color:
        'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400 border-amber-200 dark:border-amber-800',
      icon: 'M12 8v4m0 4h.01',
    },
    error: {
      label: '저장 실패',
      color:
        'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400 border-red-200 dark:border-red-800',
      icon: 'M6 18L18 6M6 6l12 12',
    },
  };
  if (status === 'idle') return null;
  const c = config[status];
  return (
    <div
      className={`fixed top-16 right-4 z-40 flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium border shadow-sm transition-all duration-300 ${c.color}`}
      role="status"
      aria-live="polite"
    >
      <svg
        className={`w-3.5 h-3.5 ${status === 'saving' ? 'animate-spin' : ''}`}
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
        strokeWidth={2}
        aria-hidden="true"
      >
        <path strokeLinecap="round" strokeLinejoin="round" d={c.icon} />
      </svg>
      {c.label}
    </div>
  );
}

function CollapsibleSection({
  id,
  title,
  defaultExpanded = true,
  children,
}: {
  id: string;
  title: string;
  defaultExpanded?: boolean;
  children: React.ReactNode;
}) {
  const storageKey = `resume-section-${id}`;
  const [expanded, setExpanded] = useState(() => {
    const stored = sessionStorage.getItem(storageKey);
    return stored !== null ? stored === 'true' : defaultExpanded;
  });
  const toggle = () => {
    const next = !expanded;
    setExpanded(next);
    sessionStorage.setItem(storageKey, String(next));
  };
  return (
    <div>
      <button
        type="button"
        onClick={toggle}
        className="flex items-center gap-2 w-full py-2 text-left text-sm font-semibold text-slate-700 dark:text-slate-300 hover:text-blue-600 dark:hover:text-blue-400 transition-colors group"
        aria-expanded={expanded}
        aria-controls={`collapse-${id}`}
      >
        <svg
          className={`w-4 h-4 text-slate-400 group-hover:text-blue-500 transition-transform duration-200 ${expanded ? 'rotate-90' : ''}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
          strokeWidth={2}
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
        </svg>
        {title}
      </button>
      {expanded && <div id={`collapse-${id}`}>{children}</div>}
    </div>
  );
}

type ResumeData = Omit<Resume, 'id' | 'createdAt' | 'updatedAt'>;

function ReorderButtons({
  index,
  total,
  onMove,
}: {
  index: number;
  total: number;
  onMove: (from: number, to: number) => void;
}) {
  if (total <= 1) return null;
  return (
    <div className="flex gap-0.5">
      <button
        type="button"
        onClick={() => onMove(index, index - 1)}
        disabled={index === 0}
        className="p-1 text-slate-400 hover:text-blue-600 disabled:opacity-20 rounded transition-colors"
        aria-label="위로"
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
        </svg>
      </button>
      <button
        type="button"
        onClick={() => onMove(index, index + 1)}
        disabled={index === total - 1}
        className="p-1 text-slate-400 hover:text-blue-600 disabled:opacity-20 rounded transition-colors"
        aria-label="아래로"
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>
    </div>
  );
}

/** Power Words helper: shows categorized action verbs that can be clicked to copy */
function PowerWordsHelper() {
  const [open, setOpen] = useState(false);
  const [copied, setCopied] = useState<string | null>(null);
  const [activeCategory, setActiveCategory] = useState(Object.keys(powerVerbs)[0]);

  const handleCopy = (verb: string) => {
    navigator.clipboard.writeText(verb).then(() => {
      setCopied(verb);
      setTimeout(() => setCopied(null), 1500);
    });
  };

  return (
    <div className="mt-1">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="flex items-center gap-1 text-[11px] text-sky-700 dark:text-sky-400 hover:text-sky-800 dark:hover:text-sky-300 transition-colors font-medium"
      >
        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M13 10V3L4 14h7v7l9-11h-7z"
          />
        </svg>
        파워 동사 {open ? '접기' : '보기'}
      </button>

      {open && (
        <div className="mt-1.5 p-2.5 bg-sky-50 dark:bg-sky-900/20 border border-sky-200 dark:border-sky-800 rounded-lg animate-fade-in">
          <p className="text-[10px] text-sky-700 dark:text-sky-400 mb-1.5 font-medium">
            클릭하면 클립보드에 복사됩니다
          </p>
          <div className="flex flex-wrap gap-1 mb-1.5">
            {Object.keys(powerVerbs).map((cat) => (
              <button
                key={cat}
                type="button"
                onClick={() => setActiveCategory(cat)}
                className={`text-[10px] px-1.5 py-0.5 rounded-full transition-colors ${
                  activeCategory === cat
                    ? 'bg-sky-700 text-white'
                    : 'bg-white dark:bg-slate-800 text-sky-700 dark:text-sky-400 border border-sky-200 dark:border-sky-700 hover:bg-sky-100 dark:hover:bg-sky-900/30'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
          <div className="flex flex-wrap gap-1">
            {(powerVerbs[activeCategory] || []).map((verb) => (
              <button
                key={verb}
                type="button"
                onClick={() => handleCopy(verb)}
                className={`text-xs px-2 py-0.5 rounded-md border transition-all ${
                  copied === verb
                    ? 'bg-green-500 text-white border-green-500'
                    : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:border-sky-400 hover:text-sky-700 dark:hover:text-sky-400'
                }`}
              >
                {copied === verb ? '복사됨!' : verb}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

interface Props {
  resumeId?: string;
  initialData: ResumeData;
  onSave: (data: ResumeData) => void;
  onAutoSave?: (data: ResumeData) => Promise<void>;
  onDataChange?: (data: ResumeData) => void;
  saving?: boolean;
}

const inputClass =
  'w-full px-3 py-2 border border-slate-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors';
const labelClass = 'block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1';
const deleteBtn =
  'text-red-600 text-sm hover:text-red-800 focus:outline-none focus:ring-2 focus:ring-red-500 rounded px-2 py-1 transition-colors';
const addBtn =
  'w-full py-3 border-2 border-dashed border-slate-300 dark:border-slate-600 rounded-xl text-sm text-slate-500 dark:text-slate-400 hover:border-blue-400 hover:text-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all duration-200';

// Normalize form values -> ResumeData payload (callers expect backwards compatible shape)
function toResumeData(values: ResumeFormInput): ResumeData {
  return values as unknown as ResumeData;
}

export default function ResumeForm({
  resumeId,
  initialData,
  onSave,
  onAutoSave,
  onDataChange,
  saving,
}: Props) {
  const [activeTab, setActiveTab] = useState('personal');
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [saveStatus, setSaveStatus] = useState<SaveStatus>('idle');
  const autoSaveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const initialDataRef = useRef(initialData);

  const defaultValues = useMemo<ResumeFormInput>(
    () => ({
      title: initialData.title || '',
      personalInfo: {
        name: initialData.personalInfo?.name || '',
        email: initialData.personalInfo?.email || '',
        phone: initialData.personalInfo?.phone || '',
        address: initialData.personalInfo?.address || '',
        website: initialData.personalInfo?.website || '',
        github: initialData.personalInfo?.github || '',
        summary: initialData.personalInfo?.summary || '',
        photo: initialData.personalInfo?.photo || '',
        birthYear: initialData.personalInfo?.birthYear || '',
        military: initialData.personalInfo?.military || '',
        links: initialData.personalInfo?.links || [],
      },
      experiences: (initialData.experiences || []) as ResumeFormInput['experiences'],
      educations: (initialData.educations || []) as ResumeFormInput['educations'],
      skills: (initialData.skills || []) as ResumeFormInput['skills'],
      projects: (initialData.projects || []) as ResumeFormInput['projects'],
      certifications: (initialData.certifications || []) as ResumeFormInput['certifications'],
      languages: (initialData.languages || []) as ResumeFormInput['languages'],
      awards: (initialData.awards || []) as ResumeFormInput['awards'],
      activities: (initialData.activities || []) as ResumeFormInput['activities'],
      sectionOrder: initialData.sectionOrder?.length
        ? initialData.sectionOrder
        : [...DEFAULT_SECTION_ORDER],
      hiddenSections: initialData.hiddenSections || [],
    }),
    [initialData],
  );

  const form: UseFormReturn<ResumeFormInput> = useForm<ResumeFormInput>({
    resolver: zodResolver(resumeFormSchema),
    defaultValues,
    mode: 'onSubmit',
  });

  const { control, register, handleSubmit, watch, setValue, getValues, reset, formState } = form;
  const { errors, isDirty } = formState;

  // Re-sync when initial data changes (e.g. AI auto-fill)
  useEffect(() => {
    if (initialDataRef.current !== initialData) {
      initialDataRef.current = initialData;
      reset(defaultValues);
    }
  }, [initialData, defaultValues, reset]);

  const experiencesArr = useFieldArray({ control, name: 'experiences', keyName: '_rhfId' });
  const educationsArr = useFieldArray({ control, name: 'educations', keyName: '_rhfId' });
  const skillsArr = useFieldArray({ control, name: 'skills', keyName: '_rhfId' });
  const projectsArr = useFieldArray({ control, name: 'projects', keyName: '_rhfId' });
  const certificationsArr = useFieldArray({ control, name: 'certifications', keyName: '_rhfId' });
  const languagesArr = useFieldArray({ control, name: 'languages', keyName: '_rhfId' });
  const awardsArr = useFieldArray({ control, name: 'awards', keyName: '_rhfId' });
  const activitiesArr = useFieldArray({ control, name: 'activities', keyName: '_rhfId' });

  const watchedData = watch();
  const sectionOrder: SectionId[] = watchedData.sectionOrder?.length
    ? (watchedData.sectionOrder as SectionId[])
    : [...DEFAULT_SECTION_ORDER];
  const hiddenSections: SectionId[] = (watchedData.hiddenSections || []) as SectionId[];

  // Notify parent of data changes for live completeness tracking
  useEffect(() => {
    onDataChange?.(toResumeData(watchedData));
  }, [watchedData, onDataChange]);

  const doAutoSave = useCallback(async () => {
    const handler = onAutoSave || onSave;
    if (!handler) return;
    setSaveStatus('saving');
    try {
      await (handler as (data: ResumeData) => Promise<void>)(toResumeData(getValues()));
      setLastSaved(new Date());
      setSaveStatus('saved');
      setTimeout(() => setSaveStatus((prev) => (prev === 'saved' ? 'idle' : prev)), 3000);
    } catch {
      setSaveStatus('error');
      setTimeout(() => setSaveStatus((prev) => (prev === 'error' ? 'dirty' : prev)), 3000);
    }
  }, [onAutoSave, onSave, getValues]);

  const submitForm = useCallback(() => {
    handleSubmit(
      (values) => {
        onSave(toResumeData(values));
      },
      (formErrors) => {
        // Surface first error message
        const firstMessage =
          formErrors.title?.message ||
          formErrors.personalInfo?.name?.message ||
          formErrors.personalInfo?.email?.message ||
          formErrors.personalInfo?.website?.message ||
          '입력값을 확인해주세요';
        toast(String(firstMessage), 'warning');
        if (formErrors.personalInfo?.name && activeTab !== 'personal') {
          setActiveTab('personal');
        }
      },
    )();
  }, [handleSubmit, onSave, activeTab]);

  // Ctrl+S / Cmd+S keyboard save
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 's') {
        e.preventDefault();
        if (!saving) submitForm();
      }
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [saving, submitForm]);

  // Unsaved changes warning
  useEffect(() => {
    if (!isDirty) return;
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      e.preventDefault();
    };
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [isDirty]);

  // Auto-save after 5 seconds of inactivity (watch on dirty subtree)
  useEffect(() => {
    if (!isDirty) return;
    setSaveStatus('dirty');
    if (autoSaveTimerRef.current) clearTimeout(autoSaveTimerRef.current);
    autoSaveTimerRef.current = setTimeout(() => {
      if (!saving) doAutoSave();
    }, 5000);
    return () => {
      if (autoSaveTimerRef.current) clearTimeout(autoSaveTimerRef.current);
    };
  }, [watchedData, isDirty, saving, doAutoSave]);

  const sectionTabMap: Record<string, { id: string; label: string }> = {
    experience: { id: 'experience', label: t('resume.experience') },
    education: { id: 'education', label: t('resume.education') },
    skills: { id: 'skills', label: t('resume.skills') },
    projects: { id: 'projects', label: t('resume.projects') },
    certifications: { id: 'certifications', label: t('resume.certifications') },
    languages: { id: 'languages', label: t('resume.languages') },
    awards: { id: 'awards', label: t('resume.awards') },
    activities: { id: 'activities', label: t('resume.activities') },
  };

  const tabs = [
    { id: 'personal', label: t('resume.personal') },
    ...sectionOrder.filter((s) => !hiddenSections.includes(s)).map((s) => sectionTabMap[s]),
  ];

  const handleSectionOrderChange = (newOrder: SectionId[]) => {
    setValue('sectionOrder', newOrder, { shouldDirty: true });
  };

  const handleHiddenSectionsChange = (newHidden: SectionId[]) => {
    if (newHidden.includes(activeTab as SectionId)) {
      setActiveTab('personal');
    }
    setValue('hiddenSections', newHidden, { shouldDirty: true });
  };

  const requiredMark = (
    <span className="text-red-500 ml-0.5" aria-hidden="true">
      *
    </span>
  );

  const titleError = errors.title?.message;
  const nameError = errors.personalInfo?.name?.message;

  // Helpers to update personal info summary programmatically
  const setSummary = (value: string) =>
    setValue('personalInfo.summary', value, { shouldDirty: true });
  const getSummary = () => getValues('personalInfo.summary') || '';

  // Helpers to update experience description/achievements programmatically
  const setExpField = (index: number, field: keyof Experience, value: unknown) => {
    setValue(`experiences.${index}.${field}` as any, value as any, { shouldDirty: true });
  };
  const setSkillField = (index: number, field: keyof Skill, value: unknown) => {
    setValue(`skills.${index}.${field}` as any, value as any, { shouldDirty: true });
  };

  return (
    <form
      className="space-y-6 relative"
      onSubmit={(e) => {
        e.preventDefault();
        submitForm();
      }}
      aria-label="이력서 편집 폼"
    >
      <SaveStatusPill status={saveStatus} lastSaved={lastSaved} />

      {/* Section Order Panel */}
      <SectionOrderPanel
        sectionOrder={sectionOrder}
        hiddenSections={hiddenSections}
        onOrderChange={handleSectionOrderChange}
        onHiddenChange={handleHiddenSectionsChange}
      />

      <div>
        <label htmlFor="resume-title" className={labelClass}>
          이력서 제목{requiredMark}
        </label>
        <input
          id="resume-title"
          type="text"
          className={`${inputClass} ${titleError ? 'border-red-400 focus:ring-red-500' : ''}`}
          placeholder="예: 2026 상반기 이력서"
          {...register('title')}
          aria-required="true"
          aria-invalid={!!titleError}
          aria-describedby={titleError ? 'title-error' : undefined}
        />
        {titleError && (
          <p id="title-error" className="mt-1 text-xs text-red-500" role="alert">
            {String(titleError)}
          </p>
        )}
      </div>

      {/* Tabs */}
      <div className="border-b border-slate-200" role="tablist" aria-label="이력서 섹션">
        <nav className="flex gap-1 overflow-x-auto pb-2 scrollbar-none -mx-1 px-1 -mb-px">
          {tabs.map((tab, idx) => (
            <button
              key={tab.id}
              type="button"
              role="tab"
              tabIndex={activeTab === tab.id ? 0 : -1}
              aria-selected={activeTab === tab.id}
              aria-controls={`panel-${tab.id}`}
              onClick={() => setActiveTab(tab.id)}
              onKeyDown={(e) => {
                let nextIdx = idx;
                if (e.key === 'ArrowRight') nextIdx = (idx + 1) % tabs.length;
                else if (e.key === 'ArrowLeft') nextIdx = (idx - 1 + tabs.length) % tabs.length;
                else return;
                e.preventDefault();
                setActiveTab(tabs[nextIdx].id);
                (e.currentTarget.parentElement?.children[nextIdx] as HTMLElement)?.focus();
              }}
              className={`shrink-0 py-2.5 sm:py-2 min-h-[44px] sm:min-h-0 px-2 sm:px-3 text-sm font-medium border-b-2 whitespace-nowrap transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-inset ${
                activeTab === tab.id
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-slate-500 hover:text-slate-700'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      {/* Writing Tips */}
      {sectionTips[activeTab] && (
        <div className="mb-4 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-xl border border-blue-100 dark:border-blue-800">
          <p className="text-xs font-semibold text-blue-700 dark:text-blue-400 mb-1.5">
            💡 작성 팁
          </p>
          <ul className="text-xs text-blue-600 dark:text-blue-300 space-y-0.5">
            {sectionTips[activeTab].map((tip, i) => (
              <li key={i}>• {tip}</li>
            ))}
          </ul>
        </div>
      )}

      {/* Personal Info */}
      {activeTab === 'personal' && (
        <fieldset id="panel-personal" role="tabpanel" aria-label="인적사항">
          <CollapsibleSection id="personal" title={t('resume.personal')}>
            {/* 증명사진 */}
            <Controller
              control={control}
              name="personalInfo.photo"
              render={({ field }) => (
                <div className="flex items-start gap-6 mb-6">
                  <div className="shrink-0">
                    {field.value ? (
                      <div className="relative group">
                        <img
                          src={field.value}
                          alt="증명사진"
                          className="w-28 h-36 object-cover rounded-lg border border-slate-200"
                        />
                        <button
                          type="button"
                          onClick={() => field.onChange('')}
                          className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 text-white rounded-full text-xs opacity-0 group-hover:opacity-100 transition-opacity focus:opacity-100"
                          aria-label="사진 삭제"
                        >
                          &times;
                        </button>
                      </div>
                    ) : (
                      <label className="flex flex-col items-center justify-center w-28 h-36 border-2 border-dashed border-slate-300 rounded-lg cursor-pointer hover:border-blue-400 hover:bg-blue-50/30 transition-colors">
                        <span className="text-2xl text-slate-300 mb-1">📷</span>
                        <span className="text-xs text-slate-400">증명사진</span>
                        <input
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (!file) return;
                            if (file.size > 2 * 1024 * 1024) {
                              alert('사진은 2MB 이하만 가능합니다');
                              return;
                            }
                            const reader = new FileReader();
                            reader.onload = () => {
                              if (typeof reader.result === 'string') field.onChange(reader.result);
                            };
                            reader.readAsDataURL(file);
                          }}
                        />
                      </label>
                    )}
                  </div>
                  <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label htmlFor="pi-name" className={labelClass}>
                        이름{requiredMark}
                      </label>
                      <input
                        id="pi-name"
                        className={`${inputClass} ${nameError ? 'border-red-400 focus:ring-red-500' : ''}`}
                        {...register('personalInfo.name')}
                        aria-required="true"
                        aria-invalid={!!nameError}
                        aria-describedby={nameError ? 'name-error' : undefined}
                      />
                      {nameError && (
                        <p id="name-error" className="mt-1 text-xs text-red-500" role="alert">
                          {String(nameError)}
                        </p>
                      )}
                    </div>
                    <div>
                      <label htmlFor="pi-email" className={labelClass}>
                        이메일
                      </label>
                      <input
                        id="pi-email"
                        type="email"
                        className={inputClass}
                        {...register('personalInfo.email')}
                      />
                      {errors.personalInfo?.email && (
                        <p className="mt-1 text-xs text-red-500" role="alert">
                          {String(errors.personalInfo.email.message)}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              )}
            />
            <div className="stagger-children grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label htmlFor="pi-phone" className={labelClass}>
                  전화번호
                </label>
                <input
                  id="pi-phone"
                  type="tel"
                  className={inputClass}
                  {...register('personalInfo.phone')}
                />
              </div>
              <div>
                <label htmlFor="pi-address" className={labelClass}>
                  주소
                </label>
                <input
                  id="pi-address"
                  className={inputClass}
                  {...register('personalInfo.address')}
                />
              </div>
              <div>
                <label htmlFor="pi-website" className={labelClass}>
                  웹사이트
                </label>
                <input
                  id="pi-website"
                  type="url"
                  className={inputClass}
                  placeholder="https://example.com"
                  {...register('personalInfo.website')}
                />
                {errors.personalInfo?.website && (
                  <p className="mt-1 text-xs text-red-500" role="alert">
                    {String(errors.personalInfo.website.message)}
                  </p>
                )}
              </div>
              <div>
                <label htmlFor="pi-github" className={labelClass}>
                  GitHub
                </label>
                <input
                  id="pi-github"
                  type="url"
                  className={inputClass}
                  placeholder="https://github.com/username"
                  {...register('personalInfo.github')}
                />
              </div>
              <div>
                <label htmlFor="pi-birth" className={labelClass}>
                  생년
                </label>
                <input
                  id="pi-birth"
                  className={inputClass}
                  placeholder="예: 1990"
                  {...register('personalInfo.birthYear')}
                />
              </div>
              <div>
                <label htmlFor="pi-military" className={labelClass}>
                  병역사항
                </label>
                <input
                  id="pi-military"
                  className={inputClass}
                  placeholder="예: 군필 | 육군 병장 제대"
                  {...register('personalInfo.military')}
                />
              </div>
              <div className="sm:col-span-2">
                <div className="flex items-center gap-2">
                  <label className={labelClass}>자기소개</label>
                  <VoiceInput onResult={(text) => setSummary((getSummary() || '') + ' ' + text)} />
                  <AiWritingAssist
                    resumeId={resumeId}
                    value={getSummary()}
                    onAccept={(text) => setSummary(text)}
                  />
                </div>
                <Controller
                  control={control}
                  name="personalInfo.summary"
                  render={({ field }) => (
                    <Suspense
                      fallback={
                        <textarea
                          className={inputClass + ' h-28 resize-none'}
                          value={field.value || ''}
                          readOnly
                        />
                      }
                    >
                      <RichEditor
                        value={field.value || ''}
                        onChange={(v) => field.onChange(v)}
                        placeholder="자기소개를 작성하세요..."
                      />
                    </Suspense>
                  )}
                />
                <p className="mt-1 text-xs text-slate-400 text-right">
                  {(getSummary() || '').replace(/<[^>]*>/g, '').length}자
                </p>
                <InlineContentTip text={getSummary() || ''} section="summary" />
                <AiSummaryGenerator
                  resumeId={resumeId}
                  resume={toResumeData(watchedData)}
                  onAccept={(text) => setSummary(text)}
                />
              </div>
            </div>
          </CollapsibleSection>
        </fieldset>
      )}

      {/* Experience */}
      {activeTab === 'experience' && (
        <div id="panel-experience" role="tabpanel" aria-label="경력">
          <CollapsibleSection id="experience" title={t('resume.experience')}>
            <div className="space-y-4">
              {experiencesArr.fields.map((exp, idx) => (
                <fieldset
                  key={exp._rhfId}
                  className="p-4 border border-slate-200 rounded-lg space-y-3 bg-white"
                >
                  <div className="flex flex-col sm:flex-row sm:justify-between gap-1 items-start">
                    <legend className="text-sm font-medium text-slate-600">경력 {idx + 1}</legend>
                    <div className="flex items-center gap-1">
                      <ReorderButtons
                        index={idx}
                        total={experiencesArr.fields.length}
                        onMove={(from, to) => experiencesArr.move(from, to)}
                      />
                      <button
                        type="button"
                        onClick={() => experiencesArr.remove(idx)}
                        className={deleteBtn + ' w-full sm:w-auto'}
                        aria-label={`경력 ${idx + 1} 삭제`}
                      >
                        삭제
                      </button>
                    </div>
                  </div>
                  <div className="stagger-children grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label htmlFor={`exp-company-${exp._rhfId}`} className={labelClass}>
                        회사명
                      </label>
                      <input
                        id={`exp-company-${exp._rhfId}`}
                        className={inputClass}
                        {...register(`experiences.${idx}.company`)}
                      />
                      <Controller
                        control={control}
                        name={`experiences.${idx}.company`}
                        render={({ field: companyField }) => (
                          <CompanyRoleSuggest
                            company={companyField.value || ''}
                            onSelect={(role) => setExpField(idx, 'position', role)}
                          />
                        )}
                      />
                    </div>
                    <div>
                      <label htmlFor={`exp-position-${exp._rhfId}`} className={labelClass}>
                        직위
                      </label>
                      <input
                        id={`exp-position-${exp._rhfId}`}
                        className={inputClass}
                        {...register(`experiences.${idx}.position`)}
                      />
                    </div>
                    <div className="sm:col-span-2">
                      <label htmlFor={`exp-dept-${exp._rhfId}`} className={labelClass}>
                        부서/팀
                      </label>
                      <input
                        id={`exp-dept-${exp._rhfId}`}
                        className={inputClass}
                        placeholder="예: 배민주문서비스팀"
                        {...register(`experiences.${idx}.department`)}
                      />
                    </div>
                    <div>
                      <label htmlFor={`exp-start-${exp._rhfId}`} className={labelClass}>
                        시작일
                      </label>
                      <input
                        id={`exp-start-${exp._rhfId}`}
                        type="date"
                        className={inputClass}
                        {...register(`experiences.${idx}.startDate`)}
                      />
                    </div>
                    <div>
                      <label htmlFor={`exp-end-${exp._rhfId}`} className={labelClass}>
                        종료일
                      </label>
                      <Controller
                        control={control}
                        name={`experiences.${idx}.current`}
                        render={({ field: currentField }) => (
                          <div className="flex items-center gap-2">
                            <input
                              id={`exp-end-${exp._rhfId}`}
                              type="date"
                              className={inputClass}
                              disabled={!!currentField.value}
                              {...register(`experiences.${idx}.endDate`)}
                            />
                            <label className="flex items-center gap-1 text-sm text-slate-700 whitespace-nowrap cursor-pointer">
                              <input
                                type="checkbox"
                                checked={!!currentField.value}
                                onChange={(e) => currentField.onChange(e.target.checked)}
                                className="rounded"
                              />
                              재직중
                            </label>
                          </div>
                        )}
                      />
                    </div>
                    <div className="sm:col-span-2">
                      <div className="flex items-center gap-2">
                        <label className={labelClass}>업무 내용</label>
                        <Controller
                          control={control}
                          name={`experiences.${idx}.description`}
                          render={({ field }) => (
                            <AiWritingAssist
                              resumeId={resumeId}
                              value={field.value || ''}
                              onAccept={(text) => field.onChange(text)}
                            />
                          )}
                        />
                      </div>
                      <Controller
                        control={control}
                        name={`experiences.${idx}.description`}
                        render={({ field }) => (
                          <>
                            <Suspense
                              fallback={
                                <textarea className={inputClass + ' h-24 resize-none'} readOnly />
                              }
                            >
                              <RichEditor
                                value={field.value || ''}
                                onChange={(v) => field.onChange(v)}
                                placeholder="주요 업무를 작성하세요 (볼드, 리스트 지원)"
                              />
                            </Suspense>
                            <p className="mt-1 text-xs text-slate-400 text-right">
                              {(field.value || '').replace(/<[^>]*>/g, '').length}자
                            </p>
                            <InlineContentTip text={field.value || ''} section="experience" />
                          </>
                        )}
                      />
                      <PowerWordsHelper />
                    </div>
                    <div className="sm:col-span-2">
                      <div className="flex items-center gap-2">
                        <label className={labelClass}>주요 성과</label>
                        <Controller
                          control={control}
                          name={`experiences.${idx}.achievements`}
                          render={({ field }) => (
                            <AiWritingAssist
                              resumeId={resumeId}
                              value={field.value || ''}
                              onAccept={(text) => field.onChange(text)}
                            />
                          )}
                        />
                      </div>
                      <Controller
                        control={control}
                        name={`experiences.${idx}.achievements`}
                        render={({ field }) => (
                          <Suspense
                            fallback={
                              <textarea className={inputClass + ' h-20 resize-none'} readOnly />
                            }
                          >
                            <RichEditor
                              value={field.value || ''}
                              onChange={(v) => field.onChange(v)}
                              placeholder="정량적 성과 (예: 번들 70% 감소)"
                            />
                          </Suspense>
                        )}
                      />
                    </div>
                    <div className="sm:col-span-2">
                      <label htmlFor={`exp-tech-${exp._rhfId}`} className={labelClass}>
                        기술 스택
                      </label>
                      <input
                        id={`exp-tech-${exp._rhfId}`}
                        className={inputClass}
                        {...register(`experiences.${idx}.techStack`)}
                        placeholder="예: React, TypeScript, AWS S3"
                      />
                    </div>
                  </div>
                </fieldset>
              ))}
              <button
                type="button"
                onClick={() =>
                  experiencesArr.append({
                    id: crypto.randomUUID(),
                    company: '',
                    position: '',
                    startDate: '',
                    endDate: '',
                    current: false,
                    description: '',
                  } as Experience)
                }
                className={addBtn}
              >
                + 경력 추가
              </button>

              {/* Content Suggestions by Job Title */}
              <ContentSuggestions
                jobTitle={(watchedData.experiences as Experience[])?.[0]?.position || ''}
                onInsert={(text) => {
                  // Insert into the last experience's description
                  const list = (getValues('experiences') || []) as Experience[];
                  const lastIdx = list.length - 1;
                  if (lastIdx >= 0) {
                    const currentDesc = list[lastIdx].description || '';
                    const newDesc = currentDesc ? `${currentDesc}\n${text}` : text;
                    setExpField(lastIdx, 'description', newDesc);
                  }
                }}
              />
            </div>
          </CollapsibleSection>
        </div>
      )}

      {/* Education */}
      {activeTab === 'education' && (
        <div id="panel-education" role="tabpanel" aria-label="학력">
          <CollapsibleSection id="education" title={t('resume.education')}>
            <div className="space-y-4">
              {educationsArr.fields.map((edu, idx) => (
                <fieldset
                  key={edu._rhfId}
                  className="p-4 border border-slate-200 rounded-lg space-y-3 bg-white"
                >
                  <div className="flex flex-col sm:flex-row sm:justify-between gap-1 items-start">
                    <legend className="text-sm font-medium text-slate-600">학력 {idx + 1}</legend>
                    <div className="flex items-center gap-1">
                      <ReorderButtons
                        index={idx}
                        total={educationsArr.fields.length}
                        onMove={(from, to) => educationsArr.move(from, to)}
                      />
                      <button
                        type="button"
                        onClick={() => educationsArr.remove(idx)}
                        className={deleteBtn + ' w-full sm:w-auto'}
                        aria-label={`학력 ${idx + 1} 삭제`}
                      >
                        삭제
                      </button>
                    </div>
                  </div>
                  <div className="stagger-children grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label htmlFor={`edu-school-${edu._rhfId}`} className={labelClass}>
                        학교명
                      </label>
                      <input
                        id={`edu-school-${edu._rhfId}`}
                        className={inputClass}
                        {...register(`educations.${idx}.school`)}
                      />
                    </div>
                    <div>
                      <label htmlFor={`edu-degree-${edu._rhfId}`} className={labelClass}>
                        학위
                      </label>
                      <input
                        id={`edu-degree-${edu._rhfId}`}
                        className={inputClass}
                        placeholder="예: 학사, 석사"
                        {...register(`educations.${idx}.degree`)}
                      />
                    </div>
                    <div>
                      <label htmlFor={`edu-field-${edu._rhfId}`} className={labelClass}>
                        전공
                      </label>
                      <input
                        id={`edu-field-${edu._rhfId}`}
                        className={inputClass}
                        {...register(`educations.${idx}.field`)}
                      />
                    </div>
                    <div>
                      <label htmlFor={`edu-gpa-${edu._rhfId}`} className={labelClass}>
                        학점
                      </label>
                      <input
                        id={`edu-gpa-${edu._rhfId}`}
                        className={inputClass}
                        placeholder="예: 3.8/4.5"
                        {...register(`educations.${idx}.gpa`)}
                      />
                    </div>
                    <div className="flex gap-3">
                      <div className="flex-1">
                        <label htmlFor={`edu-start-${edu._rhfId}`} className={labelClass}>
                          입학
                        </label>
                        <input
                          id={`edu-start-${edu._rhfId}`}
                          type="date"
                          className={inputClass}
                          {...register(`educations.${idx}.startDate`)}
                        />
                      </div>
                      <div className="flex-1">
                        <label htmlFor={`edu-end-${edu._rhfId}`} className={labelClass}>
                          졸업
                        </label>
                        <input
                          id={`edu-end-${edu._rhfId}`}
                          type="date"
                          className={inputClass}
                          {...register(`educations.${idx}.endDate`)}
                        />
                      </div>
                    </div>
                    <div className="sm:col-span-2">
                      <label htmlFor={`edu-desc-${edu._rhfId}`} className={labelClass}>
                        비고
                      </label>
                      <Controller
                        control={control}
                        name={`educations.${idx}.description`}
                        render={({ field }) => (
                          <>
                            <textarea
                              id={`edu-desc-${edu._rhfId}`}
                              className={inputClass + ' h-20 resize-none'}
                              value={field.value || ''}
                              onChange={(e) => field.onChange(e.target.value)}
                              placeholder="학점, 수상 내역 등"
                            />
                            <p className="mt-1 text-xs text-slate-400 text-right">
                              {(field.value || '').length}자
                            </p>
                          </>
                        )}
                      />
                    </div>
                  </div>
                </fieldset>
              ))}
              <button
                type="button"
                onClick={() =>
                  educationsArr.append({
                    id: crypto.randomUUID(),
                    school: '',
                    degree: '',
                    field: '',
                    startDate: '',
                    endDate: '',
                    description: '',
                  } as Education)
                }
                className={addBtn}
              >
                + 학력 추가
              </button>
            </div>
          </CollapsibleSection>
        </div>
      )}

      {/* Skills */}
      {activeTab === 'skills' && (
        <div id="panel-skills" role="tabpanel" aria-label="기술">
          <CollapsibleSection id="skills" title={t('resume.skills')}>
            <div className="space-y-4">
              {skillsArr.fields.map((skill, idx) => (
                <fieldset
                  key={skill._rhfId}
                  className="p-4 border border-slate-200 rounded-lg space-y-3 bg-white"
                >
                  <div className="flex flex-col sm:flex-row sm:justify-between gap-1 items-start">
                    <legend className="text-sm font-medium text-slate-600">기술 {idx + 1}</legend>
                    <div className="flex items-center gap-1">
                      <ReorderButtons
                        index={idx}
                        total={skillsArr.fields.length}
                        onMove={(from, to) => skillsArr.move(from, to)}
                      />
                      <button
                        type="button"
                        onClick={() => skillsArr.remove(idx)}
                        className={deleteBtn + ' w-full sm:w-auto'}
                        aria-label={`기술 ${idx + 1} 삭제`}
                      >
                        삭제
                      </button>
                    </div>
                  </div>
                  <div className="stagger-children grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label htmlFor={`skill-cat-${skill._rhfId}`} className={labelClass}>
                        카테고리
                      </label>
                      <input
                        id={`skill-cat-${skill._rhfId}`}
                        className={inputClass}
                        placeholder="예: 프로그래밍 언어"
                        {...register(`skills.${idx}.category`)}
                      />
                    </div>
                    <div>
                      <label htmlFor={`skill-items-${skill._rhfId}`} className={labelClass}>
                        기술 목록
                      </label>
                      <input
                        id={`skill-items-${skill._rhfId}`}
                        className={inputClass}
                        placeholder="예: TypeScript, React"
                        {...register(`skills.${idx}.items`)}
                      />
                      <Controller
                        control={control}
                        name={`skills.${idx}.items`}
                        render={({ field }) => (
                          <SkillSuggestDropdown
                            currentItems={field.value || ''}
                            onAdd={(newSkill) => {
                              const current = (field.value || '').trim();
                              const updated = current ? `${current}, ${newSkill}` : newSkill;
                              setSkillField(idx, 'items', updated);
                            }}
                          />
                        )}
                      />
                    </div>
                  </div>
                </fieldset>
              ))}
              <button
                type="button"
                onClick={() =>
                  skillsArr.append({ id: crypto.randomUUID(), category: '', items: '' } as Skill)
                }
                className={addBtn}
              >
                + 기술 추가
              </button>
            </div>
          </CollapsibleSection>
        </div>
      )}

      {/* Projects */}
      {activeTab === 'projects' && (
        <div id="panel-projects" role="tabpanel" aria-label="프로젝트">
          <CollapsibleSection id="projects" title={t('resume.projects')}>
            <div className="space-y-4">
              {projectsArr.fields.map((proj, idx) => (
                <fieldset
                  key={proj._rhfId}
                  className="p-4 border border-slate-200 rounded-lg space-y-3 bg-white"
                >
                  <div className="flex flex-col sm:flex-row sm:justify-between gap-1 items-start">
                    <legend className="text-sm font-medium text-slate-600">
                      프로젝트 {idx + 1}
                    </legend>
                    <div className="flex items-center gap-1">
                      <ReorderButtons
                        index={idx}
                        total={projectsArr.fields.length}
                        onMove={(from, to) => projectsArr.move(from, to)}
                      />
                      <button
                        type="button"
                        onClick={() => projectsArr.remove(idx)}
                        className={deleteBtn + ' w-full sm:w-auto'}
                        aria-label={`프로젝트 ${idx + 1} 삭제`}
                      >
                        삭제
                      </button>
                    </div>
                  </div>
                  <div className="stagger-children grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label htmlFor={`proj-name-${proj._rhfId}`} className={labelClass}>
                        프로젝트명
                      </label>
                      <input
                        id={`proj-name-${proj._rhfId}`}
                        className={inputClass}
                        {...register(`projects.${idx}.name`)}
                      />
                    </div>
                    <div>
                      <label htmlFor={`proj-company-${proj._rhfId}`} className={labelClass}>
                        소속 회사
                      </label>
                      <input
                        id={`proj-company-${proj._rhfId}`}
                        className={inputClass}
                        placeholder="예: 우아한형제들"
                        {...register(`projects.${idx}.company`)}
                      />
                    </div>
                    <div>
                      <label htmlFor={`proj-role-${proj._rhfId}`} className={labelClass}>
                        역할
                      </label>
                      <input
                        id={`proj-role-${proj._rhfId}`}
                        className={inputClass}
                        {...register(`projects.${idx}.role`)}
                      />
                    </div>
                    <div>
                      <label htmlFor={`proj-start-${proj._rhfId}`} className={labelClass}>
                        시작일
                      </label>
                      <input
                        id={`proj-start-${proj._rhfId}`}
                        type="date"
                        className={inputClass}
                        {...register(`projects.${idx}.startDate`)}
                      />
                    </div>
                    <div>
                      <label htmlFor={`proj-end-${proj._rhfId}`} className={labelClass}>
                        종료일
                      </label>
                      <input
                        id={`proj-end-${proj._rhfId}`}
                        type="date"
                        className={inputClass}
                        {...register(`projects.${idx}.endDate`)}
                      />
                    </div>
                    <div className="sm:col-span-2">
                      <label htmlFor={`proj-link-${proj._rhfId}`} className={labelClass}>
                        링크
                      </label>
                      <input
                        id={`proj-link-${proj._rhfId}`}
                        type="url"
                        className={inputClass}
                        placeholder="https://..."
                        {...register(`projects.${idx}.link`)}
                      />
                    </div>
                    <div className="sm:col-span-2">
                      <div className="flex items-center gap-2">
                        <label className={labelClass}>설명</label>
                        <Controller
                          control={control}
                          name={`projects.${idx}.description`}
                          render={({ field }) => (
                            <AiWritingAssist
                              resumeId={resumeId}
                              value={field.value || ''}
                              onAccept={(text) => field.onChange(text)}
                            />
                          )}
                        />
                      </div>
                      <Controller
                        control={control}
                        name={`projects.${idx}.description`}
                        render={({ field }) => (
                          <>
                            <Suspense
                              fallback={
                                <textarea className={inputClass + ' h-24 resize-none'} readOnly />
                              }
                            >
                              <RichEditor
                                value={field.value || ''}
                                onChange={(v) => field.onChange(v)}
                                placeholder="프로젝트 설명 및 기여한 내용"
                              />
                            </Suspense>
                            <InlineContentTip text={field.value || ''} section="project" />
                          </>
                        )}
                      />
                    </div>
                    <div className="sm:col-span-2">
                      <label htmlFor={`proj-tech-${proj._rhfId}`} className={labelClass}>
                        기술 스택
                      </label>
                      <input
                        id={`proj-tech-${proj._rhfId}`}
                        className={inputClass}
                        placeholder="예: React, TypeScript, AWS"
                        {...register(`projects.${idx}.techStack`)}
                      />
                    </div>
                  </div>
                </fieldset>
              ))}
              <button
                type="button"
                onClick={() =>
                  projectsArr.append({
                    id: crypto.randomUUID(),
                    name: '',
                    role: '',
                    startDate: '',
                    endDate: '',
                    description: '',
                    link: '',
                  } as Project)
                }
                className={addBtn}
              >
                + 프로젝트 추가
              </button>
            </div>
          </CollapsibleSection>
        </div>
      )}

      {/* Certifications */}
      {activeTab === 'certifications' && (
        <div id="panel-certifications" role="tabpanel" aria-label="자격증">
          <CollapsibleSection id="certifications" title={t('resume.certifications')}>
            <div className="space-y-4">
              {certificationsArr.fields.map((cert, idx) => (
                <fieldset
                  key={cert._rhfId}
                  className="p-4 border border-slate-200 rounded-lg space-y-3 bg-white"
                >
                  <div className="flex flex-col sm:flex-row sm:justify-between gap-1 items-start">
                    <legend className="text-sm font-medium text-slate-600">자격증 {idx + 1}</legend>
                    <div className="flex items-center gap-1">
                      <ReorderButtons
                        index={idx}
                        total={certificationsArr.fields.length}
                        onMove={(from, to) => certificationsArr.move(from, to)}
                      />
                      <button
                        type="button"
                        onClick={() => certificationsArr.remove(idx)}
                        className={deleteBtn + ' w-full sm:w-auto'}
                        aria-label={`자격증 ${idx + 1} 삭제`}
                      >
                        삭제
                      </button>
                    </div>
                  </div>
                  <div className="stagger-children grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label htmlFor={`cert-name-${cert._rhfId}`} className={labelClass}>
                        자격증명
                      </label>
                      <input
                        id={`cert-name-${cert._rhfId}`}
                        className={inputClass}
                        {...register(`certifications.${idx}.name`)}
                      />
                    </div>
                    <div>
                      <label htmlFor={`cert-issuer-${cert._rhfId}`} className={labelClass}>
                        발급기관
                      </label>
                      <input
                        id={`cert-issuer-${cert._rhfId}`}
                        className={inputClass}
                        {...register(`certifications.${idx}.issuer`)}
                      />
                    </div>
                    <div>
                      <label htmlFor={`cert-issue-${cert._rhfId}`} className={labelClass}>
                        취득일
                      </label>
                      <input
                        id={`cert-issue-${cert._rhfId}`}
                        type="date"
                        className={inputClass}
                        {...register(`certifications.${idx}.issueDate`)}
                      />
                    </div>
                    <div>
                      <label htmlFor={`cert-expiry-${cert._rhfId}`} className={labelClass}>
                        만료일
                      </label>
                      <input
                        id={`cert-expiry-${cert._rhfId}`}
                        type="date"
                        className={inputClass}
                        {...register(`certifications.${idx}.expiryDate`)}
                      />
                    </div>
                    <div className="sm:col-span-2">
                      <label htmlFor={`cert-cred-${cert._rhfId}`} className={labelClass}>
                        자격번호
                      </label>
                      <input
                        id={`cert-cred-${cert._rhfId}`}
                        className={inputClass}
                        {...register(`certifications.${idx}.credentialId`)}
                      />
                    </div>
                    <div className="sm:col-span-2">
                      <label htmlFor={`cert-desc-${cert._rhfId}`} className={labelClass}>
                        비고
                      </label>
                      <textarea
                        id={`cert-desc-${cert._rhfId}`}
                        className={inputClass + ' h-20 resize-none'}
                        {...register(`certifications.${idx}.description`)}
                      />
                    </div>
                  </div>
                </fieldset>
              ))}
              <button
                type="button"
                onClick={() =>
                  certificationsArr.append({
                    id: crypto.randomUUID(),
                    name: '',
                    issuer: '',
                    issueDate: '',
                    expiryDate: '',
                    credentialId: '',
                    description: '',
                  } as Certification)
                }
                className={addBtn}
              >
                + 자격증 추가
              </button>
            </div>
          </CollapsibleSection>
        </div>
      )}

      {/* Languages */}
      {activeTab === 'languages' && (
        <div id="panel-languages" role="tabpanel" aria-label="어학">
          <CollapsibleSection id="languages" title={t('resume.languages')}>
            <div className="space-y-4">
              {languagesArr.fields.map((lang, idx) => (
                <fieldset
                  key={lang._rhfId}
                  className="p-4 border border-slate-200 rounded-lg space-y-3 bg-white"
                >
                  <div className="flex flex-col sm:flex-row sm:justify-between gap-1 items-start">
                    <legend className="text-sm font-medium text-slate-600">어학 {idx + 1}</legend>
                    <div className="flex items-center gap-1">
                      <ReorderButtons
                        index={idx}
                        total={languagesArr.fields.length}
                        onMove={(from, to) => languagesArr.move(from, to)}
                      />
                      <button
                        type="button"
                        onClick={() => languagesArr.remove(idx)}
                        className={deleteBtn + ' w-full sm:w-auto'}
                        aria-label={`어학 ${idx + 1} 삭제`}
                      >
                        삭제
                      </button>
                    </div>
                  </div>
                  <div className="stagger-children grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label htmlFor={`lang-name-${lang._rhfId}`} className={labelClass}>
                        언어
                      </label>
                      <input
                        id={`lang-name-${lang._rhfId}`}
                        className={inputClass}
                        placeholder="예: 영어"
                        {...register(`languages.${idx}.name`)}
                      />
                    </div>
                    <div>
                      <label htmlFor={`lang-test-${lang._rhfId}`} className={labelClass}>
                        시험명
                      </label>
                      <input
                        id={`lang-test-${lang._rhfId}`}
                        className={inputClass}
                        placeholder="예: TOEIC, JLPT"
                        {...register(`languages.${idx}.testName`)}
                      />
                    </div>
                    <div>
                      <label htmlFor={`lang-score-${lang._rhfId}`} className={labelClass}>
                        점수/급수
                      </label>
                      <input
                        id={`lang-score-${lang._rhfId}`}
                        className={inputClass}
                        placeholder="예: 990, N1"
                        {...register(`languages.${idx}.score`)}
                      />
                    </div>
                    <div>
                      <label htmlFor={`lang-date-${lang._rhfId}`} className={labelClass}>
                        응시일
                      </label>
                      <input
                        id={`lang-date-${lang._rhfId}`}
                        type="date"
                        className={inputClass}
                        {...register(`languages.${idx}.testDate`)}
                      />
                    </div>
                  </div>
                </fieldset>
              ))}
              <button
                type="button"
                onClick={() =>
                  languagesArr.append({
                    id: crypto.randomUUID(),
                    name: '',
                    testName: '',
                    score: '',
                    testDate: '',
                  } as Language)
                }
                className={addBtn}
              >
                + 어학 추가
              </button>
            </div>
          </CollapsibleSection>
        </div>
      )}

      {/* Awards */}
      {activeTab === 'awards' && (
        <div id="panel-awards" role="tabpanel" aria-label="수상">
          <CollapsibleSection id="awards" title={t('resume.awards')}>
            <div className="space-y-4">
              {awardsArr.fields.map((award, idx) => (
                <fieldset
                  key={award._rhfId}
                  className="p-4 border border-slate-200 rounded-lg space-y-3 bg-white"
                >
                  <div className="flex flex-col sm:flex-row sm:justify-between gap-1 items-start">
                    <legend className="text-sm font-medium text-slate-600">수상 {idx + 1}</legend>
                    <div className="flex items-center gap-1">
                      <ReorderButtons
                        index={idx}
                        total={awardsArr.fields.length}
                        onMove={(from, to) => awardsArr.move(from, to)}
                      />
                      <button
                        type="button"
                        onClick={() => awardsArr.remove(idx)}
                        className={deleteBtn + ' w-full sm:w-auto'}
                        aria-label={`수상 ${idx + 1} 삭제`}
                      >
                        삭제
                      </button>
                    </div>
                  </div>
                  <div className="stagger-children grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label htmlFor={`award-name-${award._rhfId}`} className={labelClass}>
                        수상명
                      </label>
                      <input
                        id={`award-name-${award._rhfId}`}
                        className={inputClass}
                        {...register(`awards.${idx}.name`)}
                      />
                    </div>
                    <div>
                      <label htmlFor={`award-issuer-${award._rhfId}`} className={labelClass}>
                        수여기관
                      </label>
                      <input
                        id={`award-issuer-${award._rhfId}`}
                        className={inputClass}
                        {...register(`awards.${idx}.issuer`)}
                      />
                    </div>
                    <div>
                      <label htmlFor={`award-date-${award._rhfId}`} className={labelClass}>
                        수상일
                      </label>
                      <input
                        id={`award-date-${award._rhfId}`}
                        type="date"
                        className={inputClass}
                        {...register(`awards.${idx}.awardDate`)}
                      />
                    </div>
                    <div className="sm:col-span-2">
                      <label htmlFor={`award-desc-${award._rhfId}`} className={labelClass}>
                        설명
                      </label>
                      <textarea
                        id={`award-desc-${award._rhfId}`}
                        className={inputClass + ' h-20 resize-none'}
                        placeholder="수상 내용 및 의의"
                        {...register(`awards.${idx}.description`)}
                      />
                    </div>
                  </div>
                </fieldset>
              ))}
              <button
                type="button"
                onClick={() =>
                  awardsArr.append({
                    id: crypto.randomUUID(),
                    name: '',
                    issuer: '',
                    awardDate: '',
                    description: '',
                  } as Award)
                }
                className={addBtn}
              >
                + 수상 추가
              </button>
            </div>
          </CollapsibleSection>
        </div>
      )}

      {/* Activities */}
      {activeTab === 'activities' && (
        <div id="panel-activities" role="tabpanel" aria-label="활동">
          <CollapsibleSection id="activities" title={t('resume.activities')}>
            <div className="space-y-4">
              {activitiesArr.fields.map((act, idx) => (
                <fieldset
                  key={act._rhfId}
                  className="p-4 border border-slate-200 rounded-lg space-y-3 bg-white"
                >
                  <div className="flex flex-col sm:flex-row sm:justify-between gap-1 items-start">
                    <legend className="text-sm font-medium text-slate-600">활동 {idx + 1}</legend>
                    <div className="flex items-center gap-1">
                      <ReorderButtons
                        index={idx}
                        total={activitiesArr.fields.length}
                        onMove={(from, to) => activitiesArr.move(from, to)}
                      />
                      <button
                        type="button"
                        onClick={() => activitiesArr.remove(idx)}
                        className={deleteBtn + ' w-full sm:w-auto'}
                        aria-label={`활동 ${idx + 1} 삭제`}
                      >
                        삭제
                      </button>
                    </div>
                  </div>
                  <div className="stagger-children grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label htmlFor={`act-name-${act._rhfId}`} className={labelClass}>
                        활동명
                      </label>
                      <input
                        id={`act-name-${act._rhfId}`}
                        className={inputClass}
                        {...register(`activities.${idx}.name`)}
                      />
                    </div>
                    <div>
                      <label htmlFor={`act-org-${act._rhfId}`} className={labelClass}>
                        기관/단체
                      </label>
                      <input
                        id={`act-org-${act._rhfId}`}
                        className={inputClass}
                        {...register(`activities.${idx}.organization`)}
                      />
                    </div>
                    <div>
                      <label htmlFor={`act-role-${act._rhfId}`} className={labelClass}>
                        역할
                      </label>
                      <input
                        id={`act-role-${act._rhfId}`}
                        className={inputClass}
                        {...register(`activities.${idx}.role`)}
                      />
                    </div>
                    <div className="flex gap-3">
                      <div className="flex-1">
                        <label htmlFor={`act-start-${act._rhfId}`} className={labelClass}>
                          시작일
                        </label>
                        <input
                          id={`act-start-${act._rhfId}`}
                          type="date"
                          className={inputClass}
                          {...register(`activities.${idx}.startDate`)}
                        />
                      </div>
                      <div className="flex-1">
                        <label htmlFor={`act-end-${act._rhfId}`} className={labelClass}>
                          종료일
                        </label>
                        <input
                          id={`act-end-${act._rhfId}`}
                          type="date"
                          className={inputClass}
                          {...register(`activities.${idx}.endDate`)}
                        />
                      </div>
                    </div>
                    <div className="sm:col-span-2">
                      <label htmlFor={`act-desc-${act._rhfId}`} className={labelClass}>
                        설명
                      </label>
                      <textarea
                        id={`act-desc-${act._rhfId}`}
                        className={inputClass + ' h-24 resize-none'}
                        placeholder="활동 내용 및 성과"
                        {...register(`activities.${idx}.description`)}
                      />
                    </div>
                  </div>
                </fieldset>
              ))}
              <button
                type="button"
                onClick={() =>
                  activitiesArr.append({
                    id: crypto.randomUUID(),
                    name: '',
                    organization: '',
                    role: '',
                    startDate: '',
                    endDate: '',
                    description: '',
                  } as Activity)
                }
                className={addBtn}
              >
                + 활동 추가
              </button>
            </div>
          </CollapsibleSection>
        </div>
      )}

      <div className="flex items-center justify-between pt-4 border-t border-slate-100">
        <span className="text-xs text-slate-400">
          {isDirty
            ? '변경사항이 있습니다'
            : lastSaved
              ? `마지막 자동 저장: ${lastSaved.toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' })}`
              : ''}
        </span>
        <div className="flex items-center gap-3">
          <div className="relative group">
            <button
              type="submit"
              disabled={saving}
              className="px-6 py-2.5 bg-blue-600 text-white font-medium rounded-xl hover:bg-blue-700 disabled:opacity-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-all duration-200 shadow-sm"
              aria-busy={saving}
            >
              {saving ? '저장 중...' : '저장'}
            </button>
            <span className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 text-xs text-white bg-slate-800 rounded shadow-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">
              {navigator.platform?.includes('Mac') ? '\u2318+S' : 'Ctrl+S'}로 저장
            </span>
          </div>
        </div>
      </div>

      <AiCoachPanel resumeId={resumeId} data={toResumeData(watchedData)} activeTab={activeTab} />
    </form>
  );
}
