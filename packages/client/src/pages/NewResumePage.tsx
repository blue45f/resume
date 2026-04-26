import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { z } from 'zod';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import ResumeForm from '@/components/ResumeForm';
import ThemePreviewCard from '@/components/ThemePreviewCard';
import ThemePreviewModal from '@/components/ThemePreviewModal';
import ContentSuggestions, { JOB_TITLE_LIST } from '@/components/ContentSuggestions';
import { toast } from '@/components/Toast';
import { createEmptyResumeData } from '@/types/resume';
import type { Resume, Template } from '@/types/resume';
import { createResume, fetchResume, duplicateResume } from '@/lib/api';
import { useTemplates, useResumes } from '@/hooks/useResources';
import { ROUTES } from '@/lib/routes';
import { API_URL } from '@/lib/config';
import { getUser } from '@/lib/auth';
import { getPlan } from '@/lib/plans';
import { resumeThemes, THEME_CATEGORY_LABELS, type ResumeTheme } from '@/lib/resumeThemes';

// Zod schema for resume meta (title) validation before save
const newResumeSchema = z.object({
  title: z.string().min(1, '제목을 입력하세요').max(100, '제목은 100자 이내로 입력하세요'),
});

const SECTION_LABELS: Record<string, string> = {
  personalInfo: '인적사항',
  summary: '자기소개',
  experiences: '경력',
  educations: '학력',
  skills: '기술',
  projects: '프로젝트',
  certifications: '자격증',
  languages: '어학',
  awards: '수상',
  activities: '활동',
};

const SAMPLE_DATA: Omit<Resume, 'id' | 'createdAt' | 'updatedAt'> = {
  title: '샘플 이력서',
  personalInfo: {
    name: '홍길동',
    email: 'gildong@example.com',
    phone: '010-1234-5678',
    address: '서울특별시 강남구',
    website: '',
    github: 'https://github.com/gildong',
    summary:
      '5년차 프론트엔드 개발자로서 React, TypeScript 기반의 웹 애플리케이션 개발에 전문성을 갖추고 있습니다. 사용자 경험을 최우선으로 생각하며, 성능 최적화와 접근성 개선에 깊은 관심을 가지고 있습니다.',
    photo: '',
    birthYear: '',
    links: [],
    military: '',
  },
  experiences: [
    {
      id: 'sample-exp-1',
      company: '테크스타트업 주식회사',
      position: '시니어 프론트엔드 개발자',
      department: '프로덕트팀',
      startDate: '2022-03',
      endDate: '',
      current: true,
      description:
        'React/Next.js 기반 SaaS 플랫폼 프론트엔드 개발 리드. 디자인 시스템 구축 및 성능 최적화를 통해 LCP 40% 개선.',
      achievements: 'Core Web Vitals 전 항목 Good 달성, 컴포넌트 라이브러리 오픈소스화',
      techStack: 'React, Next.js, TypeScript, Tailwind CSS',
    },
    {
      id: 'sample-exp-2',
      company: '디지털에이전시',
      position: '프론트엔드 개발자',
      department: '웹개발팀',
      startDate: '2019-07',
      endDate: '2022-02',
      current: false,
      description:
        '다수의 클라이언트 프로젝트에서 반응형 웹 및 SPA 개발. Vue.js에서 React로의 마이그레이션 주도.',
      achievements: '',
      techStack: 'React, Vue.js, JavaScript, SCSS',
    },
  ],
  educations: [
    {
      id: 'sample-edu-1',
      school: '한국대학교',
      degree: '학사',
      field: '컴퓨터공학',
      gpa: '3.8/4.5',
      startDate: '2015-03',
      endDate: '2019-02',
      description: '',
    },
  ],
  skills: [
    {
      id: 'sample-skill-1',
      category: 'Frontend',
      items: 'React, Next.js, TypeScript, Vue.js, HTML/CSS',
    },
    { id: 'sample-skill-2', category: 'Tools', items: 'Git, Figma, Storybook, Jest, Cypress' },
  ],
  projects: [
    {
      id: 'sample-proj-1',
      name: '사내 디자인 시스템',
      company: '테크스타트업',
      role: '리드 개발자',
      startDate: '2023-01',
      endDate: '2023-06',
      description:
        'Headless UI 패턴 기반 30+ 컴포넌트 라이브러리 설계 및 구현. Storybook 문서화 및 npm 패키지 배포.',
      techStack: 'React, TypeScript, Storybook, Rollup',
      link: '',
    },
  ],
  certifications: [],
  languages: [
    { id: 'sample-lang-1', name: '영어', testName: 'TOEIC', score: '920', testDate: '2023-06' },
  ],
  awards: [],
  activities: [],
};

function parseLayout(layout: string) {
  try {
    return JSON.parse(layout);
  } catch {
    return {};
  }
}

const WIZARD_STEPS = [
  {
    label: '직종 선택',
    icon: 'M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z',
  },
  {
    label: '인적사항',
    icon: 'M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z',
  },
  {
    label: '경력',
    icon: 'M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4',
  },
  {
    label: '학력',
    icon: 'M12 14l9-5-9-5-9 5 9 5zm0 0l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14z',
  },
  {
    label: '기술',
    icon: 'M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.066 2.573c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.573 1.066c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.066-2.573c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z M15 12a3 3 0 11-6 0 3 3 0 016 0z',
  },
  {
    label: '미리보기',
    icon: 'M15 12a3 3 0 11-6 0 3 3 0 016 0z M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z',
  },
] as const;

const WIZARD_TIPS: Record<number, string[]> = {
  0: [
    '직종에 맞는 키워드와 문구를 추천받을 수 있습니다',
    '정확한 직종을 선택하면 ATS 통과율이 높아집니다',
    '복수 직종 지원 시 직종별로 이력서를 별도로 만드세요',
  ],
  1: [
    '이름과 이메일은 필수 항목입니다',
    '자기소개는 2-3문장, 150자 내외로 간결하게 작성하세요',
    '지원 직무와 관련된 핵심 역량을 자기소개에 포함하세요',
  ],
  2: [
    '최신 경력부터 역순으로 작성하세요',
    '성과를 수치로 표현하면 설득력이 높아집니다 (예: "매출 30% 증가")',
    '직무 설명에 핵심 키워드를 포함하면 ATS 통과에 유리합니다',
  ],
  3: [
    '최종 학력을 먼저 작성하세요',
    '전공이 직무와 관련 있다면 관련 과목이나 논문을 언급하세요',
    'GPA가 우수하다면 포함하고, 그렇지 않으면 생략해도 됩니다',
  ],
  4: [
    '직무에 필요한 핵심 기술을 먼저 나열하세요',
    '기술을 카테고리로 분류하면 가독성이 높아집니다',
    '숙련도를 함께 표기하면 더 구체적인 인상을 줍니다',
  ],
  5: [
    '전체 내용을 검토하고 오탈자를 확인하세요',
    '모든 날짜와 기간이 정확한지 확인하세요',
    '저장 후 미리보기에서 최종 결과를 확인하세요',
  ],
};

type WizardResumeData = ReturnType<typeof createEmptyResumeData>;

function WizardMode({
  wizardStep,
  setWizardStep,
  wizardData,
  setWizardData,
  wizardJobTitle,
  setWizardJobTitle,
  saving,
  onSave,
  onBack,
}: {
  wizardStep: number;
  setWizardStep: (s: number) => void;
  wizardData: WizardResumeData;
  setWizardData: React.Dispatch<React.SetStateAction<WizardResumeData>>;
  wizardJobTitle: string;
  setWizardJobTitle: (s: string) => void;
  saving: boolean;
  onSave: (data: WizardResumeData) => void;
  onBack: () => void;
}) {
  const inputClass =
    'w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 transition-colors';
  const labelClass = 'block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1';

  const updatePI = (field: string, value: string) => {
    setWizardData((prev) => ({ ...prev, personalInfo: { ...prev.personalInfo, [field]: value } }));
  };

  const addExperience = () => {
    setWizardData((prev) => ({
      ...prev,
      experiences: [
        ...prev.experiences,
        {
          id: crypto.randomUUID(),
          company: '',
          position: '',
          department: '',
          startDate: '',
          endDate: '',
          current: false,
          description: '',
        },
      ],
    }));
  };

  const updateExperience = (id: string, field: string, value: any) => {
    setWizardData((prev) => ({
      ...prev,
      experiences: prev.experiences.map((e) => (e.id === id ? { ...e, [field]: value } : e)),
    }));
  };

  const removeExperience = (id: string) => {
    setWizardData((prev) => ({
      ...prev,
      experiences: prev.experiences.filter((e) => e.id !== id),
    }));
  };

  const addEducation = () => {
    setWizardData((prev) => ({
      ...prev,
      educations: [
        ...prev.educations,
        {
          id: crypto.randomUUID(),
          school: '',
          degree: '',
          field: '',
          gpa: '',
          startDate: '',
          endDate: '',
          description: '',
        },
      ],
    }));
  };

  const updateEducation = (id: string, field: string, value: string) => {
    setWizardData((prev) => ({
      ...prev,
      educations: prev.educations.map((e) => (e.id === id ? { ...e, [field]: value } : e)),
    }));
  };

  const removeEducation = (id: string) => {
    setWizardData((prev) => ({ ...prev, educations: prev.educations.filter((e) => e.id !== id) }));
  };

  const addSkill = () => {
    setWizardData((prev) => ({
      ...prev,
      skills: [...prev.skills, { id: crypto.randomUUID(), category: '', items: '' }],
    }));
  };

  const updateSkill = (id: string, field: string, value: string) => {
    setWizardData((prev) => ({
      ...prev,
      skills: prev.skills.map((s) => (s.id === id ? { ...s, [field]: value } : s)),
    }));
  };

  const removeSkill = (id: string) => {
    setWizardData((prev) => ({ ...prev, skills: prev.skills.filter((s) => s.id !== id) }));
  };

  const canProceed = () => {
    switch (wizardStep) {
      case 0:
        return true; // job title is optional
      case 1:
        return !!wizardData.personalInfo.name?.trim();
      default:
        return true;
    }
  };

  const handleNext = () => {
    if (wizardStep === 1 && !wizardData.title?.trim()) {
      // Auto-set title from name + job
      const name = wizardData.personalInfo.name || '';
      const job = wizardJobTitle || '이력서';
      setWizardData((prev) => ({ ...prev, title: `${name} - ${job}` }));
    }
    if (wizardStep < WIZARD_STEPS.length - 1) {
      setWizardStep(wizardStep + 1);
    }
  };

  const handlePrev = () => {
    if (wizardStep > 0) setWizardStep(wizardStep - 1);
  };

  const handleComplete = () => {
    if (!wizardData.title?.trim()) {
      const name = wizardData.personalInfo.name || '이력서';
      setWizardData((prev) => ({ ...prev, title: name }));
    }
    onSave(wizardData);
  };

  return (
    <>
      {/* Header with back button */}
      <div className="flex items-center gap-3 mb-6">
        <button
          onClick={onBack}
          className="text-sm text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300 focus:outline-none focus:ring-2 focus:ring-teal-500 rounded"
        >
          &larr; 돌아가기
        </button>
        <h1 className="heading-accent text-xl sm:text-2xl font-bold text-slate-900 dark:text-slate-100">
          단계별 이력서 작성
        </h1>
      </div>

      {/* Progress bar */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium text-teal-700 dark:text-teal-400">
            {wizardStep + 1}/{WIZARD_STEPS.length} 단계
          </span>
          <span className="text-sm text-slate-500 dark:text-slate-400">
            {WIZARD_STEPS[wizardStep].label}
          </span>
        </div>
        <div className="h-2 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
          <div
            className="h-full bg-teal-500 rounded-full transition-all duration-300"
            style={{ width: `${((wizardStep + 1) / WIZARD_STEPS.length) * 100}%` }}
          />
        </div>
        {/* Step indicators */}
        <div className="flex justify-between mt-3">
          {WIZARD_STEPS.map((s, i) => (
            <button
              key={i}
              type="button"
              onClick={() => i <= wizardStep && setWizardStep(i)}
              disabled={i > wizardStep}
              className={`flex flex-col items-center gap-1 group ${i <= wizardStep ? 'cursor-pointer' : 'cursor-not-allowed opacity-40'}`}
            >
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center transition-colors ${
                  i === wizardStep
                    ? 'bg-teal-600 text-white'
                    : i < wizardStep
                      ? 'bg-teal-100 dark:bg-teal-900/30 text-teal-600 dark:text-teal-400'
                      : 'bg-slate-100 dark:bg-slate-700 text-slate-400'
                }`}
              >
                {i < wizardStep ? (
                  <svg
                    className="w-4 h-4"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                    strokeWidth={2}
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                ) : (
                  <svg
                    className="w-4 h-4"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                    strokeWidth={1.5}
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" d={s.icon} />
                  </svg>
                )}
              </div>
              <span
                className={`text-[10px] hidden sm:block ${i === wizardStep ? 'text-teal-700 dark:text-teal-400 font-semibold' : 'text-slate-400'}`}
              >
                {s.label}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Tips */}
      {WIZARD_TIPS[wizardStep] && (
        <div className="mb-6 p-3 bg-teal-50 dark:bg-teal-900/10 rounded-xl border border-teal-100 dark:border-teal-800">
          <p className="text-xs font-semibold text-teal-700 dark:text-teal-400 mb-1.5">TIP</p>
          <ul className="text-xs text-teal-600 dark:text-teal-300 space-y-0.5">
            {WIZARD_TIPS[wizardStep].map((tip, i) => (
              <li key={i}>&#8226; {tip}</li>
            ))}
          </ul>
        </div>
      )}

      {/* Step content */}
      <div className="imp-card p-4 sm:p-6 mb-6">
        {/* Step 0: Job Title Selection */}
        {wizardStep === 0 && (
          <div className="space-y-4">
            <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100">
              직종을 선택하세요
            </h2>
            <p className="text-sm text-slate-500 dark:text-slate-400">
              직종에 맞는 추천 문구와 키워드를 제공합니다. 나중에 변경할 수 있습니다.
            </p>
            <div className="stagger-children grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2">
              {JOB_TITLE_LIST.map((title) => (
                <button
                  key={title}
                  type="button"
                  onClick={() => setWizardJobTitle(title)}
                  className={`text-left px-3 py-2.5 rounded-lg border-2 text-sm transition-all ${
                    wizardJobTitle === title
                      ? 'border-teal-500 bg-teal-50 dark:bg-teal-900/20 text-teal-700 dark:text-teal-300 font-medium'
                      : 'border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:border-teal-300 dark:hover:border-teal-600'
                  }`}
                >
                  {title}
                </button>
              ))}
            </div>
            <div>
              <label className={labelClass}>또는 직접 입력</label>
              <input
                className={inputClass}
                placeholder="예: 소프트웨어 엔지니어"
                value={wizardJobTitle}
                onChange={(e) => setWizardJobTitle(e.target.value)}
              />
            </div>
          </div>
        )}

        {/* Step 1: Personal Info */}
        {wizardStep === 1 && (
          <div className="space-y-4">
            <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100">인적사항</h2>
            <div className="stagger-children grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className={labelClass}>이력서 제목</label>
                <input
                  className={inputClass}
                  placeholder="예: 2026 상반기 이력서"
                  value={wizardData.title}
                  onChange={(e) => setWizardData((prev) => ({ ...prev, title: e.target.value }))}
                />
              </div>
              <div>
                <label className={labelClass}>
                  이름 <span className="text-red-500">*</span>
                </label>
                <input
                  className={inputClass}
                  value={wizardData.personalInfo.name}
                  onChange={(e) => updatePI('name', e.target.value)}
                />
              </div>
              <div>
                <label className={labelClass}>이메일</label>
                <input
                  type="email"
                  className={inputClass}
                  value={wizardData.personalInfo.email}
                  onChange={(e) => updatePI('email', e.target.value)}
                />
              </div>
              <div>
                <label className={labelClass}>전화번호</label>
                <input
                  type="tel"
                  className={inputClass}
                  value={wizardData.personalInfo.phone}
                  onChange={(e) => updatePI('phone', e.target.value)}
                />
              </div>
              <div>
                <label className={labelClass}>주소</label>
                <input
                  className={inputClass}
                  value={wizardData.personalInfo.address}
                  onChange={(e) => updatePI('address', e.target.value)}
                />
              </div>
              <div>
                <label className={labelClass}>웹사이트</label>
                <input
                  type="url"
                  className={inputClass}
                  placeholder="https://example.com"
                  value={wizardData.personalInfo.website}
                  onChange={(e) => updatePI('website', e.target.value)}
                />
              </div>
              <div className="sm:col-span-2">
                <label className={labelClass}>자기소개</label>
                <textarea
                  className={inputClass + ' h-28 resize-none'}
                  placeholder="자기소개를 작성하세요. 핵심 역량과 경력을 2-3문장으로 요약하세요."
                  value={wizardData.personalInfo.summary}
                  onChange={(e) => updatePI('summary', e.target.value)}
                />
                <p className="mt-1 text-xs text-slate-400 text-right">
                  {(wizardData.personalInfo.summary || '').length}자
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Step 2: Experience */}
        {wizardStep === 2 && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100">경력사항</h2>
              <button
                type="button"
                onClick={addExperience}
                className="px-3 py-1.5 text-xs font-medium text-teal-600 bg-teal-50 dark:bg-teal-900/20 rounded-lg hover:bg-teal-100 dark:hover:bg-teal-900/30 transition-colors"
              >
                + 경력 추가
              </button>
            </div>

            {wizardData.experiences.length === 0 && (
              <div className="text-center py-8 border-2 border-dashed border-slate-200 dark:border-slate-700 rounded-xl">
                <p className="text-sm text-slate-500 dark:text-slate-400 mb-3">
                  아직 추가된 경력이 없습니다
                </p>
                <button
                  type="button"
                  onClick={addExperience}
                  className="px-4 py-2 bg-teal-600 text-white text-sm rounded-lg hover:bg-teal-700 transition-colors"
                >
                  첫 경력 추가하기
                </button>
              </div>
            )}

            {wizardData.experiences.map((exp, idx) => (
              <div
                key={exp.id}
                className="p-4 border border-slate-200 dark:border-slate-700 rounded-xl space-y-3 bg-slate-50 dark:bg-slate-800/50"
              >
                <div className="flex items-center justify-between">
                  <span className="text-sm font-semibold text-slate-600 dark:text-slate-400">
                    경력 {idx + 1}
                  </span>
                  <button
                    type="button"
                    onClick={() => removeExperience(exp.id)}
                    className="text-xs text-red-500 hover:text-red-700"
                  >
                    삭제
                  </button>
                </div>
                <div className="stagger-children grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className={labelClass}>회사명</label>
                    <input
                      className={inputClass}
                      value={exp.company}
                      onChange={(e) => updateExperience(exp.id, 'company', e.target.value)}
                    />
                  </div>
                  <div>
                    <label className={labelClass}>직위</label>
                    <input
                      className={inputClass}
                      value={exp.position}
                      onChange={(e) => updateExperience(exp.id, 'position', e.target.value)}
                    />
                  </div>
                  <div>
                    <label className={labelClass}>시작일</label>
                    <input
                      type="month"
                      className={inputClass}
                      value={exp.startDate}
                      onChange={(e) => updateExperience(exp.id, 'startDate', e.target.value)}
                    />
                  </div>
                  <div>
                    <label className={labelClass}>
                      종료일
                      <label className="ml-2 inline-flex items-center gap-1 text-xs text-slate-400">
                        <input
                          type="checkbox"
                          checked={exp.current}
                          onChange={(e) => updateExperience(exp.id, 'current', e.target.checked)}
                          className="rounded text-teal-600"
                        />
                        재직중
                      </label>
                    </label>
                    <input
                      type="month"
                      className={inputClass}
                      value={exp.endDate}
                      disabled={exp.current}
                      onChange={(e) => updateExperience(exp.id, 'endDate', e.target.value)}
                    />
                  </div>
                  <div className="sm:col-span-2">
                    <label className={labelClass}>업무 설명</label>
                    <textarea
                      className={inputClass + ' h-24 resize-none'}
                      placeholder="담당 업무와 성과를 작성하세요"
                      value={exp.description}
                      onChange={(e) => updateExperience(exp.id, 'description', e.target.value)}
                    />
                  </div>
                </div>
              </div>
            ))}

            {/* Content suggestions */}
            {wizardJobTitle && (
              <ContentSuggestions
                jobTitle={wizardJobTitle}
                onInsert={(text) => {
                  if (wizardData.experiences.length === 0) addExperience();
                  // Append to last experience description
                  const last = wizardData.experiences[wizardData.experiences.length - 1];
                  if (last) {
                    const newDesc = last.description ? `${last.description}\n${text}` : text;
                    updateExperience(last.id, 'description', newDesc);
                  }
                }}
              />
            )}
          </div>
        )}

        {/* Step 3: Education */}
        {wizardStep === 3 && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100">학력사항</h2>
              <button
                type="button"
                onClick={addEducation}
                className="px-3 py-1.5 text-xs font-medium text-teal-600 bg-teal-50 dark:bg-teal-900/20 rounded-lg hover:bg-teal-100 dark:hover:bg-teal-900/30 transition-colors"
              >
                + 학력 추가
              </button>
            </div>

            {wizardData.educations.length === 0 && (
              <div className="text-center py-8 border-2 border-dashed border-slate-200 dark:border-slate-700 rounded-xl">
                <p className="text-sm text-slate-500 dark:text-slate-400 mb-3">
                  아직 추가된 학력이 없습니다
                </p>
                <button
                  type="button"
                  onClick={addEducation}
                  className="px-4 py-2 bg-teal-600 text-white text-sm rounded-lg hover:bg-teal-700 transition-colors"
                >
                  학력 추가하기
                </button>
              </div>
            )}

            {wizardData.educations.map((edu, idx) => (
              <div
                key={edu.id}
                className="p-4 border border-slate-200 dark:border-slate-700 rounded-xl space-y-3 bg-slate-50 dark:bg-slate-800/50"
              >
                <div className="flex items-center justify-between">
                  <span className="text-sm font-semibold text-slate-600 dark:text-slate-400">
                    학력 {idx + 1}
                  </span>
                  <button
                    type="button"
                    onClick={() => removeEducation(edu.id)}
                    className="text-xs text-red-500 hover:text-red-700"
                  >
                    삭제
                  </button>
                </div>
                <div className="stagger-children grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className={labelClass}>학교명</label>
                    <input
                      className={inputClass}
                      value={edu.school}
                      onChange={(e) => updateEducation(edu.id, 'school', e.target.value)}
                    />
                  </div>
                  <div>
                    <label className={labelClass}>학위</label>
                    <select
                      className={inputClass}
                      value={edu.degree}
                      onChange={(e) => updateEducation(edu.id, 'degree', e.target.value)}
                    >
                      <option value="">선택</option>
                      <option value="고등학교">고등학교</option>
                      <option value="전문학사">전문학사</option>
                      <option value="학사">학사</option>
                      <option value="석사">석사</option>
                      <option value="박사">박사</option>
                    </select>
                  </div>
                  <div>
                    <label className={labelClass}>전공</label>
                    <input
                      className={inputClass}
                      value={edu.field}
                      onChange={(e) => updateEducation(edu.id, 'field', e.target.value)}
                    />
                  </div>
                  <div>
                    <label className={labelClass}>학점 (선택)</label>
                    <input
                      className={inputClass}
                      placeholder="예: 3.8/4.5"
                      value={edu.gpa || ''}
                      onChange={(e) => updateEducation(edu.id, 'gpa', e.target.value)}
                    />
                  </div>
                  <div>
                    <label className={labelClass}>입학일</label>
                    <input
                      type="month"
                      className={inputClass}
                      value={edu.startDate}
                      onChange={(e) => updateEducation(edu.id, 'startDate', e.target.value)}
                    />
                  </div>
                  <div>
                    <label className={labelClass}>졸업일</label>
                    <input
                      type="month"
                      className={inputClass}
                      value={edu.endDate}
                      onChange={(e) => updateEducation(edu.id, 'endDate', e.target.value)}
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Step 4: Skills */}
        {wizardStep === 4 && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100">기술/역량</h2>
              <button
                type="button"
                onClick={addSkill}
                className="px-3 py-1.5 text-xs font-medium text-teal-600 bg-teal-50 dark:bg-teal-900/20 rounded-lg hover:bg-teal-100 dark:hover:bg-teal-900/30 transition-colors"
              >
                + 기술 추가
              </button>
            </div>

            {wizardData.skills.length === 0 && (
              <div className="text-center py-8 border-2 border-dashed border-slate-200 dark:border-slate-700 rounded-xl">
                <p className="text-sm text-slate-500 dark:text-slate-400 mb-3">
                  아직 추가된 기술이 없습니다
                </p>
                <button
                  type="button"
                  onClick={addSkill}
                  className="px-4 py-2 bg-teal-600 text-white text-sm rounded-lg hover:bg-teal-700 transition-colors"
                >
                  기술 추가하기
                </button>
              </div>
            )}

            {wizardData.skills.map((skill, idx) => (
              <div
                key={skill.id}
                className="p-4 border border-slate-200 dark:border-slate-700 rounded-xl space-y-3 bg-slate-50 dark:bg-slate-800/50"
              >
                <div className="flex items-center justify-between">
                  <span className="text-sm font-semibold text-slate-600 dark:text-slate-400">
                    기술 그룹 {idx + 1}
                  </span>
                  <button
                    type="button"
                    onClick={() => removeSkill(skill.id)}
                    className="text-xs text-red-500 hover:text-red-700"
                  >
                    삭제
                  </button>
                </div>
                <div className="stagger-children grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className={labelClass}>카테고리</label>
                    <input
                      className={inputClass}
                      placeholder="예: Frontend, Backend, Tools"
                      value={skill.category}
                      onChange={(e) => updateSkill(skill.id, 'category', e.target.value)}
                    />
                  </div>
                  <div>
                    <label className={labelClass}>기술 항목 (쉼표로 구분)</label>
                    <input
                      className={inputClass}
                      placeholder="예: React, TypeScript, Next.js"
                      value={skill.items}
                      onChange={(e) => updateSkill(skill.id, 'items', e.target.value)}
                    />
                  </div>
                </div>
              </div>
            ))}

            {/* Content suggestions for skills */}
            {wizardJobTitle && (
              <ContentSuggestions
                jobTitle={wizardJobTitle}
                onInsert={(text) => {
                  if (wizardData.skills.length === 0) addSkill();
                  const last = wizardData.skills[wizardData.skills.length - 1];
                  if (last) {
                    const newItems = last.items ? `${last.items}, ${text}` : text;
                    updateSkill(last.id, 'items', newItems);
                  }
                }}
              />
            )}
          </div>
        )}

        {/* Step 5: Preview */}
        {wizardStep === 5 && (
          <div className="space-y-4">
            <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100">최종 확인</h2>
            <p className="text-sm text-slate-500 dark:text-slate-400">
              아래 내용을 확인한 후 저장하세요. 저장 후 편집 페이지에서 더 세부적으로 수정할 수
              있습니다.
            </p>

            <div className="divide-y divide-slate-200 dark:divide-slate-700">
              {/* Summary */}
              <div className="py-3">
                <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
                  기본 정보
                </h3>
                <div className="stagger-children grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm">
                  <div>
                    <span className="text-slate-400">이름:</span>{' '}
                    <span className="text-slate-900 dark:text-slate-100">
                      {wizardData.personalInfo.name || '-'}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-400">이메일:</span>{' '}
                    <span className="text-slate-900 dark:text-slate-100">
                      {wizardData.personalInfo.email || '-'}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-400">전화:</span>{' '}
                    <span className="text-slate-900 dark:text-slate-100">
                      {wizardData.personalInfo.phone || '-'}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-400">직종:</span>{' '}
                    <span className="text-slate-900 dark:text-slate-100">
                      {wizardJobTitle || '-'}
                    </span>
                  </div>
                </div>
                {wizardData.personalInfo.summary && (
                  <div className="mt-2">
                    <span className="text-slate-400 text-sm">자기소개:</span>
                    <p className="text-sm text-slate-700 dark:text-slate-300 mt-1 bg-slate-50 dark:bg-slate-700/50 p-2 rounded-lg">
                      {wizardData.personalInfo.summary}
                    </p>
                  </div>
                )}
              </div>

              {/* Experiences */}
              <div className="py-3">
                <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
                  경력 ({wizardData.experiences.length}개)
                </h3>
                {wizardData.experiences.length === 0 ? (
                  <p className="text-xs text-slate-400">추가된 경력 없음</p>
                ) : (
                  <div className="space-y-2">
                    {wizardData.experiences.map((exp) => (
                      <div
                        key={exp.id}
                        className="text-sm bg-slate-50 dark:bg-slate-700/50 p-2 rounded-lg"
                      >
                        <p className="font-medium text-slate-900 dark:text-slate-100">
                          {exp.company} - {exp.position}
                        </p>
                        <p className="text-xs text-slate-400">
                          {exp.startDate} ~ {exp.current ? '현재' : exp.endDate}
                        </p>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Educations */}
              <div className="py-3">
                <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
                  학력 ({wizardData.educations.length}개)
                </h3>
                {wizardData.educations.length === 0 ? (
                  <p className="text-xs text-slate-400">추가된 학력 없음</p>
                ) : (
                  <div className="space-y-2">
                    {wizardData.educations.map((edu) => (
                      <div
                        key={edu.id}
                        className="text-sm bg-slate-50 dark:bg-slate-700/50 p-2 rounded-lg"
                      >
                        <p className="font-medium text-slate-900 dark:text-slate-100">
                          {edu.school} - {edu.degree} {edu.field}
                        </p>
                        <p className="text-xs text-slate-400">
                          {edu.startDate} ~ {edu.endDate}
                        </p>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Skills */}
              <div className="py-3">
                <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
                  기술 ({wizardData.skills.length}개 그룹)
                </h3>
                {wizardData.skills.length === 0 ? (
                  <p className="text-xs text-slate-400">추가된 기술 없음</p>
                ) : (
                  <div className="flex flex-wrap gap-2">
                    {wizardData.skills.map((s) => (
                      <div
                        key={s.id}
                        className="text-xs bg-teal-50 dark:bg-teal-900/20 text-teal-700 dark:text-teal-300 px-2 py-1 rounded-lg"
                      >
                        <span className="font-medium">{s.category}:</span> {s.items}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Navigation buttons */}
      <div className="flex items-center justify-between">
        <button
          type="button"
          onClick={handlePrev}
          disabled={wizardStep === 0}
          className="px-5 py-2.5 text-sm font-medium text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-700 rounded-xl hover:bg-slate-200 dark:hover:bg-slate-600 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
        >
          &larr; 이전
        </button>
        <span className="text-xs text-slate-400">
          {wizardStep + 1} / {WIZARD_STEPS.length}
        </span>
        {wizardStep < WIZARD_STEPS.length - 1 ? (
          <button
            type="button"
            onClick={handleNext}
            disabled={!canProceed()}
            className="px-5 py-2.5 text-sm font-medium text-white bg-teal-600 rounded-xl hover:bg-teal-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            다음 &rarr;
          </button>
        ) : (
          <button
            type="button"
            onClick={handleComplete}
            disabled={saving || !wizardData.personalInfo.name?.trim()}
            className="px-5 py-2.5 text-sm font-medium text-white bg-blue-600 rounded-xl hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {saving ? '저장 중...' : '이력서 저장'}
          </button>
        )}
      </div>
    </>
  );
}

export default function NewResumePage() {
  const navigate = useNavigate();
  const [saving, setSaving] = useState(false);
  const templatesQuery = useTemplates();
  const templates: Template[] = templatesQuery.data ?? [];
  const resumesQuery = useResumes();
  const allResumes = resumesQuery.data ?? [];
  const resumeCount = allResumes.length;
  const existingTitles = allResumes.map((r) => r.title.toLowerCase());
  const existingResumes = allResumes;
  const [selectedTemplate, setSelectedTemplate] = useState<string | null>(null);
  const [step, setStep] = useState<'template' | 'form' | 'wizard'>('template');
  const [startMode, setStartMode] = useState<'empty' | 'sample' | 'copy' | 'ai-upload' | 'wizard'>(
    'empty',
  );
  // Wizard state
  const [wizardStep, setWizardStep] = useState(0);
  const [wizardData, setWizardData] = useState(createEmptyResumeData());
  const [wizardJobTitle, setWizardJobTitle] = useState('');
  const [copySourceId, setCopySourceId] = useState('');
  const [initialData, setInitialData] = useState<any>(null);
  const [loadingCopy, setLoadingCopy] = useState(false);
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [uploadText, setUploadText] = useState('');
  const [aiLoading, setAiLoading] = useState(false);
  const [aiProgress, setAiProgress] = useState('');
  const [selectedThemeId, setSelectedThemeId] = useState<string | null>(null);
  const [previewTheme, setPreviewTheme] = useState<ResumeTheme | null>(null);
  const [themeFilter, setThemeFilter] = useState<string>('all');
  const user = getUser();
  const plan = getPlan(user?.plan || 'free');
  const isAdminUser = user?.role === 'admin' || user?.role === 'superadmin';
  const atLimit =
    !isAdminUser && plan.features.maxResumes > 0 && resumeCount >= plan.features.maxResumes;

  useEffect(() => {
    document.title = '새 이력서 — 이력서공방';
    return () => {
      document.title = '이력서공방 - AI 기반 이력서 관리 플랫폼';
    };
  }, []);

  const handleSave = async (data: Omit<Resume, 'id' | 'createdAt' | 'updatedAt'>) => {
    // Validate meta (title) with Zod before submit
    const parsed = newResumeSchema.safeParse({ title: data.title });
    if (!parsed.success) {
      const firstError = parsed.error.issues[0]?.message || '제목을 확인해주세요';
      toast(firstError, 'error');
      return;
    }
    const isDuplicate = existingTitles.includes((data.title || '').toLowerCase());
    if (isDuplicate && !confirm('같은 제목의 이력서가 이미 있습니다. 계속 생성하시겠습니까?'))
      return;
    setSaving(true);
    try {
      const result = await createResume(data);
      toast('이력서가 생성되었습니다', 'success');
      navigate(ROUTES.resume.edit(result.id));
    } catch {
      toast('이력서 생성에 실패했습니다', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleAiUpload = async () => {
    const text = uploadText.trim();
    if (!text && !uploadFile) {
      toast('텍스트를 입력하거나 파일을 업로드해주세요', 'error');
      return;
    }
    setAiLoading(true);
    setAiProgress('문서를 분석하고 있습니다...');
    try {
      const token = localStorage.getItem('token');
      const headers: Record<string, string> = {};
      if (token) headers['Authorization'] = `Bearer ${token}`;

      let bodyText = text;
      if (uploadFile && !text) {
        // 파일에서 텍스트 읽기 (txt 파일만 클라이언트에서 처리)
        if (uploadFile.name.endsWith('.txt')) {
          bodyText = await uploadFile.text();
        } else {
          // PDF/DOCX는 서버에서 처리 (현재는 파일명만 전달)
          bodyText = `[업로드된 파일: ${uploadFile.name}] 파일 내용을 분석하여 이력서를 생성해주세요.`;
        }
      }

      setAiProgress('AI가 이력서 항목을 추출하고 있습니다...');
      headers['Content-Type'] = 'application/json';
      const res = await fetch(`${API_URL}/api/auto-generate/preview`, {
        method: 'POST',
        headers,
        body: JSON.stringify({ rawText: bodyText }),
      });
      if (!res.ok) throw new Error('AI 분석에 실패했습니다');
      const data = await res.json();

      setAiProgress('이력서를 구성하고 있습니다...');
      if (data.resume) {
        setInitialData(data.resume);
        toast('AI가 이력서를 자동으로 채웠습니다! 내용을 확인하고 수정해주세요.', 'success');
        setStep('form');
      } else {
        throw new Error('이력서 데이터를 생성할 수 없습니다');
      }
    } catch (err: any) {
      toast(err.message || 'AI 분석에 실패했습니다', 'error');
    } finally {
      setAiLoading(false);
      setAiProgress('');
    }
  };

  const handleSkip = () => {
    setSelectedTemplate(null);
    proceedToForm('empty');
  };

  const handleSelectTemplate = (id: string) => {
    setSelectedTemplate(id);
    proceedToForm(startMode);
  };

  const proceedToForm = async (mode: 'empty' | 'sample' | 'copy' | 'ai-upload' | 'wizard') => {
    if (mode === 'sample') {
      setInitialData(SAMPLE_DATA);
      setStep('form');
    } else if (mode === 'copy' && copySourceId) {
      setLoadingCopy(true);
      try {
        const source = await fetchResume(copySourceId);
        const { id, createdAt, updatedAt, ...rest } = source;
        setInitialData({ ...rest, title: `${rest.title} (복사본)` });
      } catch {
        toast('이력서를 불러오는데 실패했습니다', 'error');
        setInitialData(createEmptyResumeData());
      } finally {
        setLoadingCopy(false);
      }
      setStep('form');
    } else {
      setInitialData(createEmptyResumeData());
      setStep('form');
    }
  };

  const handleCopyFromExisting = async () => {
    if (!copySourceId) {
      toast('복사할 이력서를 선택해주세요', 'error');
      return;
    }
    setLoadingCopy(true);
    try {
      const result = await duplicateResume(copySourceId);
      toast('이력서가 복사되었습니다', 'success');
      navigate(ROUTES.resume.edit(result.id));
    } catch {
      toast('복사에 실패했습니다. 직접 편집 모드로 전환합니다.', 'error');
      proceedToForm('copy');
    } finally {
      setLoadingCopy(false);
    }
  };

  const selected = templates.find((t) => t.id === selectedTemplate);

  return (
    <>
      <Header />
      <main
        id="main-content"
        className="flex-1 max-w-6xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-6 sm:py-8"
        role="main"
      >
        {atLimit ? (
          <div className="text-center py-12 animate-fade-in">
            <span className="text-4xl mb-4 block">&#128202;</span>
            <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100 mb-2">
              이력서 한도 도달
            </h2>
            <p className="text-sm text-slate-500 dark:text-slate-400 mb-4">
              무료 플랜에서는 최대 {plan.features.maxResumes}개의 이력서를 생성할 수 있습니다.
            </p>
            <Link
              to={ROUTES.pricing}
              className="inline-block px-5 py-2.5 bg-blue-600 text-white text-sm font-medium rounded-xl hover:bg-blue-700 transition-colors"
            >
              프로 플랜으로 업그레이드
            </Link>
          </div>
        ) : step === 'template' ? (
          <>
            <div className="flex items-center justify-between mb-6">
              <div>
                <h1 className="heading-accent text-xl sm:text-2xl font-bold text-slate-900 dark:text-slate-100">
                  새 이력서 만들기
                </h1>
                <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                  시작 방법과 템플릿을 선택하세요.
                </p>
              </div>
              <button
                onClick={handleSkip}
                className="text-sm text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500 rounded px-3 py-1.5"
              >
                건너뛰기
              </button>
            </div>

            {/* Start Mode Selection */}
            <div className="mb-8">
              <h2 className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-3">
                시작 방법
              </h2>
              <div className="stagger-children grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
                {/* Empty */}
                <button
                  onClick={() => setStartMode('empty')}
                  className={`text-left p-4 rounded-xl border-2 transition-all duration-200 ${
                    startMode === 'empty'
                      ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20 ring-1 ring-blue-500'
                      : 'border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600'
                  }`}
                >
                  <div className="w-10 h-10 bg-slate-100 dark:bg-slate-700 rounded-lg flex items-center justify-center mb-2">
                    <svg
                      className="w-5 h-5 text-slate-500 dark:text-slate-400"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                      />
                    </svg>
                  </div>
                  <h3 className="font-semibold text-sm text-slate-900 dark:text-slate-100">
                    빈 이력서로 시작
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                    처음부터 직접 작성합니다
                  </p>
                </button>

                {/* Sample Data */}
                <button
                  onClick={() => setStartMode('sample')}
                  className={`text-left p-4 rounded-xl border-2 transition-all duration-200 ${
                    startMode === 'sample'
                      ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20 ring-1 ring-blue-500'
                      : 'border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600'
                  }`}
                >
                  <div className="w-10 h-10 bg-sky-100 dark:bg-sky-900/30 rounded-lg flex items-center justify-center mb-2">
                    <svg
                      className="w-5 h-5 text-sky-500 dark:text-sky-400"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"
                      />
                    </svg>
                  </div>
                  <h3 className="font-semibold text-sm text-slate-900 dark:text-slate-100">
                    샘플 데이터로 시작
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                    예시 데이터를 수정하며 작성합니다
                  </p>
                </button>

                {/* Copy from existing */}
                <button
                  onClick={() => setStartMode('copy')}
                  disabled={existingResumes.length === 0}
                  className={`text-left p-4 rounded-xl border-2 transition-all duration-200 ${
                    existingResumes.length === 0
                      ? 'opacity-50 cursor-not-allowed border-slate-200 dark:border-slate-700'
                      : startMode === 'copy'
                        ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20 ring-1 ring-blue-500'
                        : 'border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600'
                  }`}
                >
                  <div className="w-10 h-10 bg-green-100 dark:bg-green-900/30 rounded-lg flex items-center justify-center mb-2">
                    <svg
                      className="w-5 h-5 text-green-500 dark:text-green-400"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"
                      />
                    </svg>
                  </div>
                  <h3 className="font-semibold text-sm text-slate-900 dark:text-slate-100">
                    이전 이력서에서 복사
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                    {existingResumes.length > 0
                      ? `${existingResumes.length}개의 이력서에서 선택`
                      : '기존 이력서가 없습니다'}
                  </p>
                </button>

                {/* AI Upload */}
                <button
                  onClick={() => setStartMode('ai-upload')}
                  className={`text-left p-4 rounded-xl border-2 transition-all duration-200 ${
                    startMode === 'ai-upload'
                      ? 'border-sky-500 bg-sky-50 dark:bg-sky-900/20 ring-1 ring-sky-500'
                      : 'border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600'
                  }`}
                >
                  <div className="w-10 h-10 bg-sky-100 dark:bg-sky-900/30 rounded-lg flex items-center justify-center mb-2">
                    <svg
                      className="w-5 h-5 text-sky-500 dark:text-sky-400"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
                      />
                    </svg>
                  </div>
                  <h3 className="font-semibold text-sm text-slate-900 dark:text-slate-100">
                    AI 문서 분석
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                    파일/텍스트로 자동 채우기
                  </p>
                </button>

                {/* Step-by-step Wizard */}
                <button
                  onClick={() => setStartMode('wizard')}
                  className={`text-left p-4 rounded-xl border-2 transition-all duration-200 ${
                    startMode === 'wizard'
                      ? 'border-teal-500 bg-teal-50 dark:bg-teal-900/20 ring-1 ring-teal-500'
                      : 'border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600'
                  }`}
                >
                  <div className="w-10 h-10 bg-teal-100 dark:bg-teal-900/30 rounded-lg flex items-center justify-center mb-2">
                    <svg
                      className="w-5 h-5 text-teal-500 dark:text-teal-400"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4"
                      />
                    </svg>
                  </div>
                  <h3 className="font-semibold text-sm text-slate-900 dark:text-slate-100">
                    단계별 작성
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                    6단계 가이드로 쉽게 작성
                  </p>
                </button>
              </div>

              {/* Wizard start button */}
              {startMode === 'wizard' && (
                <div className="mt-3 p-4 bg-teal-50 dark:bg-teal-900/10 rounded-xl border border-teal-200 dark:border-teal-800">
                  <p className="text-sm text-slate-700 dark:text-slate-300 mb-3">
                    6단계로 나누어 이력서를 쉽게 작성합니다. 각 단계에서 팁과 예시를 확인하며 작성할
                    수 있습니다.
                  </p>
                  <div className="flex gap-2 mb-3">
                    {['직종 선택', '인적사항', '경력', '학력', '기술', '미리보기'].map(
                      (label, i) => (
                        <span
                          key={i}
                          className="px-2 py-1 text-[10px] bg-teal-100 dark:bg-teal-900/30 text-teal-700 dark:text-teal-400 rounded-full"
                        >
                          {i + 1}. {label}
                        </span>
                      ),
                    )}
                  </div>
                  <button
                    onClick={() => {
                      setWizardData(createEmptyResumeData());
                      setWizardStep(0);
                      setWizardJobTitle('');
                      setStep('wizard');
                    }}
                    className="w-full py-2.5 bg-teal-600 text-white text-sm font-medium rounded-lg hover:bg-teal-700 transition-colors"
                  >
                    단계별 작성 시작하기
                  </button>
                </div>
              )}

              {/* Copy source selector */}
              {startMode === 'copy' && existingResumes.length > 0 && (
                <div className="mt-3 p-4 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-200 dark:border-slate-700">
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                    복사할 이력서 선택
                  </label>
                  <div className="stagger-children grid grid-cols-1 sm:grid-cols-2 gap-2 mb-3">
                    {existingResumes.slice(0, 6).map((r) => (
                      <button
                        key={r.id}
                        onClick={() => setCopySourceId(r.id)}
                        className={`text-left p-3 rounded-lg border transition-all ${
                          copySourceId === r.id
                            ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20 ring-1 ring-blue-500'
                            : 'border-slate-200 dark:border-slate-600 hover:border-slate-300 dark:hover:border-slate-500'
                        }`}
                      >
                        <p className="text-sm font-medium text-slate-900 dark:text-slate-100 truncate">
                          {r.title || '제목 없음'}
                        </p>
                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                          {r.personalInfo?.name || ''} --{' '}
                          {new Date(r.updatedAt).toLocaleDateString('ko-KR')}
                        </p>
                      </button>
                    ))}
                  </div>
                  <button
                    onClick={handleCopyFromExisting}
                    disabled={!copySourceId || loadingCopy}
                    className="w-full py-2.5 bg-green-600 text-white text-sm font-medium rounded-lg hover:bg-green-700 disabled:opacity-50 transition-colors"
                  >
                    {loadingCopy ? '복사 중...' : '선택한 이력서 복사하여 시작'}
                  </button>
                </div>
              )}

              {/* AI Upload mode */}
              {startMode === 'ai-upload' && (
                <div className="mt-3 p-4 bg-sky-50 dark:bg-sky-900/10 rounded-xl border border-sky-200 dark:border-sky-800">
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                    경력증명서, 기존 이력서, 자기소개 텍스트 등을 붙여넣거나 파일을 업로드하세요
                  </label>
                  <textarea
                    value={uploadText}
                    onChange={(e) => setUploadText(e.target.value)}
                    placeholder={
                      '경력 메모, LinkedIn 프로필, 이전 이력서 내용 등을 자유롭게 붙여넣기...\n\n예시:\n이름: 홍길동\n경력: 네이버 프론트엔드 개발자 3년\n기술: React, TypeScript, Node.js'
                    }
                    rows={6}
                    className="w-full px-3 py-2 text-sm border border-sky-200 dark:border-sky-700 rounded-xl dark:bg-slate-800 dark:text-slate-100 focus:ring-2 focus:ring-sky-500 resize-none mb-3"
                  />
                  <div className="flex items-center gap-3 mb-3">
                    <label className="flex items-center gap-2 px-3 py-2 bg-white dark:bg-slate-800 border border-sky-200 dark:border-sky-700 rounded-lg cursor-pointer hover:bg-sky-50 dark:hover:bg-sky-900/20 transition-colors text-sm">
                      <svg
                        className="w-4 h-4 text-sky-500"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13"
                        />
                      </svg>
                      파일 첨부
                      <input
                        type="file"
                        accept=".pdf,.docx,.doc,.txt,.rtf"
                        className="hidden"
                        onChange={(e) => setUploadFile(e.target.files?.[0] || null)}
                      />
                    </label>
                    {uploadFile && (
                      <div className="flex items-center gap-2 text-sm text-sky-600 dark:text-sky-400">
                        <span>{uploadFile.name}</span>
                        <button
                          onClick={() => setUploadFile(null)}
                          className="text-slate-400 hover:text-red-500"
                        >
                          &times;
                        </button>
                      </div>
                    )}
                  </div>
                  <button
                    onClick={handleAiUpload}
                    disabled={aiLoading || (!uploadText.trim() && !uploadFile)}
                    className="w-full py-2.5 bg-sky-600 text-white text-sm font-medium rounded-lg hover:bg-sky-700 disabled:opacity-50 transition-colors flex items-center justify-center gap-2"
                  >
                    {aiLoading ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        {aiProgress}
                      </>
                    ) : (
                      <>
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
                            d="M13 10V3L4 14h7v7l9-11h-7z"
                          />
                        </svg>
                        AI로 이력서 자동 채우기
                      </>
                    )}
                  </button>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-2">
                    AI가 텍스트를 분석하여 인적사항, 경력, 학력, 기술 등을 자동으로 채워줍니다.
                  </p>
                </div>
              )}
            </div>

            {/* Theme Gallery */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-sm font-medium text-slate-700 dark:text-slate-300">
                  테마 선택
                </h2>
                <span className="text-xs text-slate-400 dark:text-slate-500">
                  {resumeThemes.length}개 테마
                </span>
              </div>

              {/* Category filter pills */}
              <div className="flex gap-2 overflow-x-auto py-1 mb-4 -mx-1 px-1">
                <button
                  onClick={() => setThemeFilter('all')}
                  className={`px-2.5 py-1 text-xs rounded-full whitespace-nowrap transition-colors ${
                    themeFilter === 'all'
                      ? 'bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 font-medium'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200'
                  }`}
                >
                  전체
                </button>
                {Object.entries(THEME_CATEGORY_LABELS).map(([key, label]) => {
                  const count = resumeThemes.filter((t) => t.preview?.category === key).length;
                  return (
                    <button
                      key={key}
                      onClick={() => setThemeFilter(key)}
                      className={`px-2.5 py-1 text-xs rounded-full whitespace-nowrap transition-colors ${
                        themeFilter === key
                          ? 'bg-blue-600 text-white font-medium'
                          : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200'
                      }`}
                    >
                      {label} ({count})
                    </button>
                  );
                })}
              </div>

              <div className="stagger-children grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
                {/* Blank / no theme */}
                <div
                  className={`group relative bg-white dark:bg-slate-800 rounded-xl border-2 border-dashed overflow-hidden transition-all duration-200 cursor-pointer hover:shadow-lg hover:-translate-y-1 ${
                    selectedThemeId === null
                      ? 'border-blue-500 ring-2 ring-blue-200 dark:ring-blue-800'
                      : 'border-slate-300 dark:border-slate-600 hover:border-blue-300'
                  }`}
                  onClick={() => {
                    setSelectedThemeId(null);
                    setSelectedTemplate(null);
                    proceedToForm(startMode);
                  }}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      setSelectedThemeId(null);
                      setSelectedTemplate(null);
                      proceedToForm(startMode);
                    }
                  }}
                >
                  <div className="aspect-[3/4] flex items-center justify-center bg-slate-50 dark:bg-slate-700/50">
                    <div className="text-center">
                      <svg
                        className="w-10 h-10 text-slate-300 dark:text-slate-500 mx-auto mb-2"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={1.5}
                          d="M12 6v6m0 0v6m0-6h6m-6 0H6"
                        />
                      </svg>
                      <p className="text-xs text-slate-400 dark:text-slate-500">기본 양식</p>
                    </div>
                  </div>
                  <div className="px-3 py-2.5 border-t border-slate-100 dark:border-slate-700">
                    <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                      기본
                    </h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400">테마 없이 시작</p>
                  </div>
                </div>

                {resumeThemes
                  .filter((t) => themeFilter === 'all' || t.preview?.category === themeFilter)
                  .map((theme) => (
                    <ThemePreviewCard
                      key={theme.id}
                      theme={theme}
                      selected={selectedThemeId === theme.id}
                      onClick={() => {
                        setSelectedThemeId(theme.id);
                        proceedToForm(startMode);
                      }}
                      onPreview={() => setPreviewTheme(theme)}
                    />
                  ))}
              </div>
            </div>

            {/* Smart Template Recommendations */}
            {templates.length > 0 &&
              (() => {
                // Infer user's field from existing resumes
                const allSkills = existingResumes.flatMap((r) =>
                  (r.skills || []).flatMap((s) =>
                    s.items
                      .toLowerCase()
                      .split(',')
                      .map((i) => i.trim()),
                  ),
                );
                const allPositions = existingResumes.flatMap((r) => r.title?.toLowerCase() || '');

                const JOB_TEMPLATE_MAP: { keywords: string[]; jobLabel: string; reason: string }[] =
                  [
                    {
                      keywords: [
                        'react',
                        'vue',
                        'angular',
                        'typescript',
                        'javascript',
                        'html',
                        'css',
                        'next.js',
                        'node',
                        'python',
                        'java',
                        'spring',
                        'django',
                        'golang',
                        'docker',
                        'kubernetes',
                      ],
                      jobLabel: '개발자',
                      reason: '기술 스택 중심의 레이아웃과 프로젝트 섹션이 강조됩니다',
                    },
                    {
                      keywords: [
                        'figma',
                        'sketch',
                        'photoshop',
                        'illustrator',
                        'ui',
                        'ux',
                        'design',
                        'adobe',
                        '디자인',
                      ],
                      jobLabel: '디자이너',
                      reason: '포트폴리오 링크와 시각적 요소가 돋보이는 구성입니다',
                    },
                    {
                      keywords: [
                        'marketing',
                        'seo',
                        'google analytics',
                        '마케팅',
                        '광고',
                        'sns',
                        'cpa',
                        'roas',
                        '퍼포먼스',
                      ],
                      jobLabel: '마케터',
                      reason: '성과 지표와 캠페인 결과를 강조하는 구성입니다',
                    },
                    {
                      keywords: [
                        'pm',
                        'product',
                        'agile',
                        'scrum',
                        'jira',
                        '기획',
                        'prd',
                        'ux리서치',
                      ],
                      jobLabel: '기획자/PM',
                      reason: '프로젝트 관리 경험과 성과를 중심으로 구성됩니다',
                    },
                    {
                      keywords: ['sales', '영업', '세일즈', 'crm', 'b2b', 'b2c', '실적'],
                      jobLabel: '영업/세일즈',
                      reason: '실적과 고객 관리 역량을 부각하는 구성입니다',
                    },
                    {
                      keywords: ['hr', '인사', '채용', '교육', '조직문화', '노무'],
                      jobLabel: 'HR/인사',
                      reason: '조직 관리와 채용 경험을 강조하는 구성입니다',
                    },
                  ];

                const matchedJobs = JOB_TEMPLATE_MAP.filter((job) =>
                  job.keywords.some(
                    (kw) => allSkills.includes(kw) || allPositions.some((p) => p.includes(kw)),
                  ),
                );

                // Sort templates by usageCount for popularity
                const sortedTemplates = [...templates].sort(
                  (a, b) => (b.usageCount || 0) - (a.usageCount || 0),
                );
                const maxUsage = sortedTemplates[0]?.usageCount || 0;
                const popularThreshold = maxUsage > 0 ? maxUsage * 0.7 : Infinity;

                // Recommended templates: match by category name or description
                const recommendedTemplates =
                  matchedJobs.length > 0
                    ? templates.filter((t) =>
                        matchedJobs.some(
                          (job) =>
                            t.name
                              .toLowerCase()
                              .includes(job.jobLabel.replace(/\/.*/, '').toLowerCase()) ||
                            t.category
                              ?.toLowerCase()
                              .includes(job.jobLabel.replace(/\/.*/, '').toLowerCase()) ||
                            (t.description || '')
                              .toLowerCase()
                              .includes(job.jobLabel.replace(/\/.*/, '').toLowerCase()),
                        ),
                      )
                    : [];

                return (
                  <>
                    {/* Smart Recommendations */}
                    {matchedJobs.length > 0 && recommendedTemplates.length > 0 && (
                      <div className="mt-8">
                        <div className="flex items-center gap-2 mb-3">
                          <svg
                            className="w-5 h-5 text-amber-500"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"
                            />
                          </svg>
                          <h2 className="text-sm font-medium text-slate-700 dark:text-slate-300">
                            직종별 추천
                          </h2>
                          <span className="text-xs text-slate-400 dark:text-slate-500">
                            - 보유 기술 기반 분석
                          </span>
                        </div>
                        <div className="stagger-children grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                          {recommendedTemplates.map((t) => {
                            const layout = parseLayout(t.layout || '{}');
                            const sections: string[] = layout.sections || [];
                            const matchedJob = matchedJobs.find(
                              (job) =>
                                t.name
                                  .toLowerCase()
                                  .includes(job.jobLabel.replace(/\/.*/, '').toLowerCase()) ||
                                t.category
                                  ?.toLowerCase()
                                  .includes(job.jobLabel.replace(/\/.*/, '').toLowerCase()) ||
                                (t.description || '')
                                  .toLowerCase()
                                  .includes(job.jobLabel.replace(/\/.*/, '').toLowerCase()),
                            );

                            return (
                              <button
                                key={`rec-${t.id}`}
                                onClick={() => handleSelectTemplate(t.id)}
                                className="text-left bg-amber-50 dark:bg-amber-900/15 rounded-xl border-2 border-amber-200 dark:border-amber-800 p-4 hover:border-amber-400 dark:hover:border-amber-600 hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-amber-500 group"
                              >
                                <div className="flex items-center gap-2 mb-2">
                                  <span className="px-2 py-0.5 text-[10px] font-bold bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 rounded-full uppercase">
                                    추천
                                  </span>
                                  {(t.usageCount || 0) >= popularThreshold && maxUsage > 0 && (
                                    <span className="px-2 py-0.5 text-[10px] font-bold bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 rounded-full">
                                      인기 템플릿
                                    </span>
                                  )}
                                </div>
                                <h3 className="font-semibold text-slate-900 dark:text-slate-100 group-hover:text-amber-700 dark:group-hover:text-amber-400 transition-colors text-sm mb-1">
                                  {t.name}
                                </h3>
                                {matchedJob && (
                                  <p className="text-xs text-amber-700 dark:text-amber-400 mb-2 flex items-center gap-1">
                                    <svg
                                      className="w-3 h-3 shrink-0"
                                      fill="none"
                                      stroke="currentColor"
                                      viewBox="0 0 24 24"
                                    >
                                      <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth={2}
                                        d="M5 13l4 4L19 7"
                                      />
                                    </svg>
                                    이 템플릿은 {matchedJob.jobLabel}에게 적합합니다 -{' '}
                                    {matchedJob.reason}
                                  </p>
                                )}
                                {sections.length > 0 && (
                                  <div className="flex flex-wrap gap-1">
                                    {sections.slice(0, 4).map((s) => (
                                      <span
                                        key={s}
                                        className="px-1.5 py-0.5 text-[10px] bg-white/60 dark:bg-slate-700 text-slate-600 dark:text-slate-300 rounded"
                                      >
                                        {SECTION_LABELS[s] || s}
                                      </span>
                                    ))}
                                  </div>
                                )}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    )}

                    {/* All Templates (from server) */}
                    <div className="mt-8">
                      <h2 className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-3">
                        서버 템플릿
                      </h2>
                      <div className="stagger-children grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
                        {sortedTemplates.map((t) => {
                          const layout = parseLayout(t.layout || '{}');
                          const sections: string[] = layout.sections || [];
                          const isPopular = (t.usageCount || 0) >= popularThreshold && maxUsage > 0;

                          return (
                            <button
                              key={t.id}
                              onClick={() => handleSelectTemplate(t.id)}
                              className="text-left imp-card p-4 hover:border-blue-400 dark:hover:border-blue-500 hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 group"
                            >
                              <div className="flex items-start justify-between mb-1">
                                <h3 className="font-semibold text-slate-900 dark:text-slate-100 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors text-sm truncate">
                                  {t.name}
                                </h3>
                                <div className="flex items-center gap-1 shrink-0 ml-1">
                                  {isPopular && (
                                    <span className="px-1.5 py-0.5 text-[10px] font-bold bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 rounded-full whitespace-nowrap">
                                      인기
                                    </span>
                                  )}
                                  {t.isDefault && (
                                    <span className="px-1.5 py-1 text-xs bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300 rounded-full">
                                      기본
                                    </span>
                                  )}
                                </div>
                              </div>
                              {t.description && (
                                <p className="text-xs text-slate-500 dark:text-slate-400 mb-2 line-clamp-2">
                                  {t.description}
                                </p>
                              )}
                              {t.usageCount > 0 && (
                                <p className="text-[10px] text-slate-400 dark:text-slate-500 mb-1.5">
                                  {t.usageCount.toLocaleString()}회 사용됨
                                </p>
                              )}
                              {sections.length > 0 && (
                                <div className="flex flex-wrap gap-1">
                                  {sections.slice(0, 3).map((s) => (
                                    <span
                                      key={s}
                                      className="px-1.5 py-0.5 text-[10px] bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 rounded"
                                    >
                                      {SECTION_LABELS[s] || s}
                                    </span>
                                  ))}
                                  {sections.length > 3 && (
                                    <span className="px-1.5 py-0.5 text-[10px] bg-slate-100 dark:bg-slate-700 text-slate-400 rounded">
                                      +{sections.length - 3}
                                    </span>
                                  )}
                                </div>
                              )}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  </>
                );
              })()}

            {/* Theme Preview Modal */}
            {previewTheme && (
              <ThemePreviewModal
                theme={previewTheme}
                onClose={() => setPreviewTheme(null)}
                onSelect={() => {
                  setSelectedThemeId(previewTheme.id);
                  setPreviewTheme(null);
                  proceedToForm(startMode);
                }}
              />
            )}
          </>
        ) : step === 'wizard' ? (
          <WizardMode
            wizardStep={wizardStep}
            setWizardStep={setWizardStep}
            wizardData={wizardData}
            setWizardData={setWizardData}
            wizardJobTitle={wizardJobTitle}
            setWizardJobTitle={setWizardJobTitle}
            saving={saving}
            onSave={handleSave}
            onBack={() => setStep('template')}
          />
        ) : (
          <>
            <div className="flex items-center gap-3 mb-6">
              <button
                onClick={() => setStep('template')}
                className="text-sm text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500 rounded"
              >
                &larr; 템플릿 선택
              </button>
              <h1 className="heading-accent text-xl sm:text-2xl font-bold text-slate-900 dark:text-slate-100">
                새 이력서 작성
              </h1>
              <div className="flex items-center gap-2">
                {selected && (
                  <span className="px-2 py-1 text-xs bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300 rounded-full">
                    {selected.name}
                  </span>
                )}
                {startMode === 'sample' && (
                  <span className="px-2 py-1 text-xs bg-sky-100 dark:bg-sky-900/40 text-sky-700 dark:text-sky-300 rounded-full">
                    샘플 데이터
                  </span>
                )}
                {startMode === 'copy' && (
                  <span className="px-2 py-1 text-xs bg-green-100 dark:bg-green-900/40 text-green-700 dark:text-green-300 rounded-full">
                    복사본
                  </span>
                )}
              </div>
            </div>
            <div className="imp-card p-4 sm:p-6">
              {initialData && (
                <ResumeForm initialData={initialData} onSave={handleSave} saving={saving} />
              )}
            </div>
          </>
        )}
      </main>
      <Footer />
    </>
  );
}
