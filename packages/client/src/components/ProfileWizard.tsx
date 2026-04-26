import { useState, useMemo, type ReactElement } from 'react';
import { useNavigate } from 'react-router-dom';
import type { Resume } from '@/types/resume';
import { calculateCompleteness } from '@/lib/completeness';
import { ROUTES, withQuery } from '@/lib/routes';

interface WizardStep {
  key: string;
  label: string;
  tab: string;
  icon: ReactElement;
  checkComplete: (resume: Resume) => boolean;
  getMissing: (resume: Resume) => string[];
  whyMatters: string;
}

const STEPS: WizardStep[] = [
  {
    key: 'personalInfo',
    label: '인적사항',
    tab: 'personalInfo',
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
        />
      </svg>
    ),
    checkComplete: (r) => {
      const pi = r.personalInfo;
      return !!(
        pi.name &&
        pi.email &&
        pi.summary &&
        pi.summary.replace(/<[^>]*>/g, '').length > 30
      );
    },
    getMissing: (r) => {
      const missing: string[] = [];
      const pi = r.personalInfo;
      if (!pi.name) missing.push('이름');
      if (!pi.email) missing.push('이메일');
      if (!pi.phone) missing.push('연락처');
      if (!pi.summary || pi.summary.replace(/<[^>]*>/g, '').length <= 30)
        missing.push('자기소개 (30자 이상)');
      if (!pi.photo) missing.push('프로필 사진');
      if (!pi.website && !pi.github) missing.push('웹사이트 또는 GitHub');
      return missing;
    },
    whyMatters:
      '인적사항은 첫인상을 결정합니다. 채용담당자가 가장 먼저 확인하는 영역이며, 완성된 인적사항은 신뢰감을 줍니다.',
  },
  {
    key: 'experiences',
    label: '경력',
    tab: 'experiences',
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
        />
      </svg>
    ),
    checkComplete: (r) =>
      r.experiences.length >= 1 &&
      r.experiences.some((e) => e.description && e.description.length > 30),
    getMissing: (r) => {
      const missing: string[] = [];
      if (r.experiences.length === 0) missing.push('경력 사항 1개 이상');
      else {
        if (!r.experiences.some((e) => e.description && e.description.length > 30))
          missing.push('업무 내용 상세 기술');
        if (!r.experiences.some((e) => e.techStack)) missing.push('사용 기술 스택');
        if (!r.experiences.some((e) => e.achievements)) missing.push('주요 성과');
      }
      return missing;
    },
    whyMatters:
      '경력은 이력서에서 가장 높은 비중을 차지합니다. 구체적인 성과와 기술을 포함하면 서류 통과율이 크게 올라갑니다.',
  },
  {
    key: 'educations',
    label: '학력',
    tab: 'educations',
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path d="M12 14l9-5-9-5-9 5 9 5z" />
        <path d="M12 14l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14z" />
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M12 14l9-5-9-5-9 5 9 5zm0 0l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14zm-4 6v-7.5l4-2.222"
        />
      </svg>
    ),
    checkComplete: (r) => r.educations.length >= 1 && !!r.educations[0]?.degree,
    getMissing: (r) => {
      const missing: string[] = [];
      if (r.educations.length === 0) missing.push('학력 정보');
      else {
        if (!r.educations[0]?.degree) missing.push('학위');
        if (!r.educations[0]?.field) missing.push('전공');
      }
      return missing;
    },
    whyMatters:
      '학력 정보는 특히 신입이나 경력 전환 시 중요합니다. ATS(자동서류심사)에서도 학력은 핵심 필터링 항목입니다.',
  },
  {
    key: 'skills',
    label: '기술',
    tab: 'skills',
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"
        />
      </svg>
    ),
    checkComplete: (r) =>
      r.skills.length >= 2 && r.skills.some((s) => s.items && s.items.split(',').length >= 3),
    getMissing: (r) => {
      const missing: string[] = [];
      if (r.skills.length === 0) missing.push('기술 카테고리 1개 이상');
      else {
        if (r.skills.length < 2) missing.push('기술 카테고리 추가 (2개 이상 권장)');
        if (!r.skills.some((s) => s.items && s.items.split(',').length >= 3))
          missing.push('각 카테고리에 3개 이상 기술');
      }
      return missing;
    },
    whyMatters:
      '기술 스택은 JD(채용공고) 매칭의 핵심입니다. 명확하게 정리된 기술 목록은 채용담당자의 눈에 바로 들어옵니다.',
  },
  {
    key: 'projects',
    label: '프로젝트',
    tab: 'projects',
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"
        />
      </svg>
    ),
    checkComplete: (r) =>
      r.projects.length >= 1 && r.projects.some((p) => p.description && p.description.length > 30),
    getMissing: (r) => {
      const missing: string[] = [];
      if (r.projects.length === 0) missing.push('프로젝트 1개 이상');
      else {
        if (!r.projects.some((p) => p.description && p.description.length > 30))
          missing.push('프로젝트 상세 설명');
        if (!r.projects.some((p) => p.techStack)) missing.push('사용 기술 스택');
        if (!r.projects.some((p) => p.link)) missing.push('프로젝트 링크');
      }
      return missing;
    },
    whyMatters:
      '프로젝트는 실무 역량을 보여주는 가장 좋은 방법입니다. 포트폴리오와 함께 지원하면 면접 확률이 40% 이상 높아집니다.',
  },
];

interface ProfileWizardProps {
  resume: Resume;
  resumeId: string;
  onDismiss?: () => void;
}

export default function ProfileWizard({ resume, resumeId, onDismiss }: ProfileWizardProps) {
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(0);
  const [dismissed, setDismissed] = useState(false);

  const completeness = useMemo(() => calculateCompleteness(resume), [resume]);

  const stepStatuses = useMemo(
    () =>
      STEPS.map((step) => ({
        ...step,
        complete: step.checkComplete(resume),
        missing: step.getMissing(resume),
      })),
    [resume],
  );

  const completedCount = stepStatuses.filter((s) => s.complete).length;
  const progressPercent = Math.round((completedCount / STEPS.length) * 100);

  // Don't show if completeness >= 50% or dismissed
  if (completeness.percentage >= 50 || dismissed) return null;

  const current = stepStatuses[currentStep];

  const handleNavigateToEdit = (tab: string) => {
    navigate(withQuery(ROUTES.resume.edit(resumeId), { tab }));
  };

  const handleNext = () => {
    if (currentStep < STEPS.length - 1) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handleSkip = () => {
    if (currentStep < STEPS.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      setDismissed(true);
      onDismiss?.();
    }
  };

  const handleDismiss = () => {
    setDismissed(true);
    onDismiss?.();
  };

  return (
    <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden mb-6 animate-fade-in-up">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-sky-700 px-5 py-4 flex items-center justify-between">
        <div>
          <h3 className="text-white font-bold text-sm">프로필 완성 가이드</h3>
          <p className="text-blue-100 text-xs mt-0.5">
            완성도를 높이면 채용담당자에게 더 잘 보입니다
          </p>
        </div>
        <button
          onClick={handleDismiss}
          className="text-white/60 hover:text-white transition-colors p-1"
          aria-label="닫기"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M6 18L18 6M6 6l12 12"
            />
          </svg>
        </button>
      </div>

      {/* Progress Bar */}
      <div className="px-5 pt-4">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-medium text-slate-600 dark:text-slate-400">
            {completedCount}/{STEPS.length} 단계 완료
          </span>
          <span className="text-xs font-bold text-blue-600 dark:text-blue-400">
            {progressPercent}%
          </span>
        </div>
        <div className="w-full bg-slate-100 dark:bg-slate-700 rounded-full h-2 mb-4">
          <div
            className="bg-gradient-to-r from-blue-500 to-sky-500 h-2 rounded-full transition-all duration-500 ease-out"
            style={{ width: `${progressPercent}%` }}
          />
        </div>

        {/* Step indicators */}
        <div className="flex items-center gap-1 mb-4">
          {stepStatuses.map((step, i) => (
            <button
              key={step.key}
              onClick={() => setCurrentStep(i)}
              className={`flex-1 flex flex-col items-center gap-1 py-2 rounded-lg transition-all duration-200 ${
                i === currentStep
                  ? 'bg-blue-50 dark:bg-blue-900/20'
                  : 'hover:bg-slate-50 dark:hover:bg-slate-700/50'
              }`}
            >
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center transition-all ${
                  step.complete
                    ? 'bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400'
                    : i === currentStep
                      ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400'
                      : 'bg-slate-100 dark:bg-slate-700 text-slate-400 dark:text-slate-500'
                }`}
              >
                {step.complete ? (
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2.5}
                      d="M5 13l4 4L19 7"
                    />
                  </svg>
                ) : (
                  step.icon
                )}
              </div>
              <span
                className={`text-[10px] font-medium ${
                  i === currentStep
                    ? 'text-blue-600 dark:text-blue-400'
                    : step.complete
                      ? 'text-green-600 dark:text-green-400'
                      : 'text-slate-400 dark:text-slate-500'
                }`}
              >
                {step.label}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Current Step Content */}
      <div className="px-5 pb-4">
        <div
          className={`rounded-xl p-4 ${
            current.complete
              ? 'bg-green-50 dark:bg-green-900/10 border border-green-200 dark:border-green-800'
              : 'bg-slate-50 dark:bg-slate-700/50 border border-slate-200 dark:border-slate-600'
          }`}
        >
          <div className="flex items-start justify-between mb-2">
            <h4
              className={`font-semibold text-sm ${
                current.complete
                  ? 'text-green-700 dark:text-green-400'
                  : 'text-slate-800 dark:text-slate-200'
              }`}
            >
              {current.complete ? `${current.label} - 완료!` : `${current.label} 작성하기`}
            </h4>
            {current.complete && (
              <span className="text-xs px-2 py-0.5 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 rounded-full font-medium">
                완료
              </span>
            )}
          </div>

          {!current.complete && current.missing.length > 0 && (
            <div className="mb-3">
              <p className="text-xs text-slate-500 dark:text-slate-400 mb-1.5">누락된 항목:</p>
              <ul className="space-y-1">
                {current.missing.map((item, i) => (
                  <li
                    key={i}
                    className="flex items-center gap-2 text-xs text-slate-600 dark:text-slate-300"
                  >
                    <span className="w-1.5 h-1.5 bg-amber-400 rounded-full shrink-0" />
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          )}

          <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed mb-3">
            {current.whyMatters}
          </p>

          {!current.complete && (
            <button
              onClick={() => handleNavigateToEdit(current.tab)}
              className="w-full py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors"
            >
              {current.label} 작성하러 가기
            </button>
          )}
        </div>

        {/* Navigation buttons */}
        <div className="flex items-center justify-between mt-3">
          <button
            onClick={handleSkip}
            className="text-xs text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300 transition-colors"
          >
            {currentStep < STEPS.length - 1 ? '건너뛰기' : '가이드 닫기'}
          </button>
          {currentStep < STEPS.length - 1 && (
            <button
              onClick={handleNext}
              className="px-4 py-1.5 text-xs font-medium bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors"
            >
              다음
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
