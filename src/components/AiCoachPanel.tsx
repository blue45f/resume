import { useState, useEffect, useCallback, useRef } from 'react';
import * as RadixDialog from '@radix-ui/react-dialog';
import FeatureGate from '@/components/FeatureGate';
import { toast } from '@/components/Toast';
import { API_URL } from '@/lib/config';
import type { Resume } from '@/types/resume';

type ResumeData = Omit<Resume, 'id' | 'createdAt' | 'updatedAt'>;

type Severity = 'info' | 'warning' | 'critical';
type Category = 'completeness' | 'keywords' | 'ats' | 'readability';

interface CoachTip {
  id: string;
  category: Category;
  severity: Severity;
  title: string;
  description: string;
  fix?: string; // auto-fix value
  fixAction?: () => void;
}

interface SectionScore {
  section: string;
  label: string;
  score: number;
}

const CATEGORY_META: Record<Category, { label: string; icon: string }> = {
  completeness: { label: '완성도', icon: 'M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z' },
  keywords: { label: '키워드', icon: 'M7 20l4-16m2 16l4-16M6 9h14M4 15h14' },
  ats: {
    label: 'ATS 호환성',
    icon: 'M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z',
  },
  readability: {
    label: '가독성',
    icon: 'M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z',
  },
};

const SEVERITY_STYLES: Record<
  Severity,
  { bg: string; border: string; text: string; badge: string }
> = {
  info: {
    bg: 'bg-blue-50 dark:bg-blue-900/20',
    border: 'border-blue-200 dark:border-blue-800',
    text: 'text-blue-700 dark:text-blue-300',
    badge: 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300',
  },
  warning: {
    bg: 'bg-amber-50 dark:bg-amber-900/20',
    border: 'border-amber-200 dark:border-amber-800',
    text: 'text-amber-700 dark:text-amber-300',
    badge: 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300',
  },
  critical: {
    bg: 'bg-red-50 dark:bg-red-900/20',
    border: 'border-red-200 dark:border-red-800',
    text: 'text-red-700 dark:text-red-300',
    badge: 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300',
  },
};

function stripHtml(html: string): string {
  return (html || '').replace(/<[^>]*>/g, '').trim();
}

/** Compute local tips without hitting the LLM - fast and free */
function computeLocalTips(data: ResumeData, activeTab: string): CoachTip[] {
  const tips: CoachTip[] = [];
  const pi = data.personalInfo;

  // --- Completeness ---
  if (!pi.name) {
    tips.push({
      id: 'c-name',
      category: 'completeness',
      severity: 'critical',
      title: '이름 미입력',
      description: '이름은 이력서의 필수 항목입니다.',
    });
  }
  if (!pi.email) {
    tips.push({
      id: 'c-email',
      category: 'completeness',
      severity: 'critical',
      title: '이메일 미입력',
      description: '채용 담당자가 연락할 수 있도록 이메일을 입력하세요.',
    });
  }
  if (!pi.phone) {
    tips.push({
      id: 'c-phone',
      category: 'completeness',
      severity: 'warning',
      title: '전화번호 미입력',
      description: '전화번호를 입력하면 면접 연락을 빠르게 받을 수 있습니다.',
    });
  }
  if (!stripHtml(pi.summary)) {
    tips.push({
      id: 'c-summary',
      category: 'completeness',
      severity: 'warning',
      title: '자기소개 미작성',
      description: '자기소개는 첫인상을 결정합니다. 3~5문장으로 핵심 역량을 요약하세요.',
    });
  } else if (stripHtml(pi.summary).length < 50) {
    tips.push({
      id: 'c-summary-short',
      category: 'completeness',
      severity: 'info',
      title: '자기소개가 짧습니다',
      description: '50자 이상으로 작성하면 더 효과적입니다. 핵심 기술과 경력 목표를 포함하세요.',
    });
  }
  if (data.experiences.length === 0) {
    tips.push({
      id: 'c-exp',
      category: 'completeness',
      severity: 'warning',
      title: '경력 미입력',
      description: '경력사항을 추가하면 이력서 완성도가 높아집니다.',
    });
  }
  if (data.skills.length === 0) {
    tips.push({
      id: 'c-skills',
      category: 'completeness',
      severity: 'warning',
      title: '기술 스택 미입력',
      description: 'ATS 시스템이 키워드를 인식하려면 기술을 반드시 입력해야 합니다.',
    });
  }
  if (data.educations.length === 0) {
    tips.push({
      id: 'c-edu',
      category: 'completeness',
      severity: 'info',
      title: '학력 미입력',
      description: '학력 정보를 추가하면 이력서가 더 완성도 있어집니다.',
    });
  }
  if (!pi.github && !pi.website) {
    tips.push({
      id: 'c-links',
      category: 'completeness',
      severity: 'info',
      title: '포트폴리오 링크 없음',
      description: 'GitHub이나 개인 웹사이트를 추가하면 기술력을 어필할 수 있습니다.',
    });
  }

  // --- Experience-specific tips ---
  if (activeTab === 'experience') {
    data.experiences.forEach((exp, i) => {
      const desc = stripHtml(exp.description);
      if (desc.length > 0 && desc.length < 50) {
        tips.push({
          id: `exp-short-${i}`,
          category: 'readability',
          severity: 'warning',
          title: `경력 ${i + 1}: 업무 내용이 짧습니다`,
          description:
            '이 경력에 대해 더 자세히 작성해보세요. STAR 기법(상황-과제-행동-결과)으로 작성하면 더 효과적입니다.',
        });
      }
      if (!exp.achievements || stripHtml(exp.achievements).length === 0) {
        tips.push({
          id: `exp-ach-${i}`,
          category: 'keywords',
          severity: 'info',
          title: `경력 ${i + 1}: 성과 미작성`,
          description:
            '정량적 성과(예: "매출 30% 증가", "응답 시간 50% 단축")를 추가하면 설득력이 높아집니다.',
        });
      }
      if (!exp.techStack) {
        tips.push({
          id: `exp-tech-${i}`,
          category: 'ats',
          severity: 'info',
          title: `경력 ${i + 1}: 기술 스택 미입력`,
          description: 'ATS 시스템이 기술 키워드를 스캔합니다. 사용한 기술을 명시하세요.',
        });
      }
      if (desc && !/\d/.test(desc)) {
        tips.push({
          id: `exp-nonum-${i}`,
          category: 'readability',
          severity: 'info',
          title: `경력 ${i + 1}: 숫자가 없습니다`,
          description: '업무 내용에 수치(인원, 기간, 성과)를 추가하면 구체성이 높아집니다.',
        });
      }
    });
  }

  // --- Skills-specific ---
  if (activeTab === 'skills') {
    data.skills.forEach((skill, i) => {
      const items = skill.items
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean);
      if (items.length === 1) {
        tips.push({
          id: `skill-single-${i}`,
          category: 'keywords',
          severity: 'info',
          title: `기술 ${i + 1}: 항목이 1개뿐입니다`,
          description: '관련 기술을 함께 나열하면 역량을 더 잘 보여줄 수 있습니다.',
        });
      }
    });
  }

  // --- ATS tips ---
  const allText = [
    pi.summary,
    ...data.experiences.map((e) => e.description),
    ...data.skills.map((s) => s.items),
  ].join(' ');
  if (pi.summary && /<img|<table|<iframe/i.test(pi.summary)) {
    tips.push({
      id: 'ats-html',
      category: 'ats',
      severity: 'critical',
      title: 'ATS 비호환 콘텐츠',
      description: '이미지나 표는 ATS가 인식하지 못합니다. 텍스트 기반으로 작성하세요.',
    });
  }
  if (allText.length > 0 && !/[a-zA-Z]/.test(allText) && data.skills.length > 0) {
    tips.push({
      id: 'ats-eng',
      category: 'ats',
      severity: 'info',
      title: '영문 키워드 부재',
      description: '글로벌 ATS는 영문 기술명을 인식합니다. "리액트" 대신 "React"도 병기하세요.',
    });
  }

  // --- Readability ---
  if (stripHtml(pi.summary).length > 500) {
    tips.push({
      id: 'read-summary-long',
      category: 'readability',
      severity: 'info',
      title: '자기소개가 길어요',
      description: '300자 내외가 적당합니다. 핵심만 간결하게 정리하세요.',
    });
  }

  return tips;
}

/** Compute section scores (0-100) purely locally */
function computeSectionScores(data: ResumeData): SectionScore[] {
  const scores: SectionScore[] = [];
  const pi = data.personalInfo;

  // Personal
  let s = 0;
  if (pi.name) s += 25;
  if (pi.email) s += 20;
  if (pi.phone) s += 15;
  if (stripHtml(pi.summary).length >= 50) s += 25;
  else if (stripHtml(pi.summary).length > 0) s += 10;
  if (pi.github || pi.website) s += 15;
  scores.push({ section: 'personal', label: '인적사항', score: Math.min(s, 100) });

  // Experience
  if (data.experiences.length > 0) {
    const expScores = data.experiences.map((exp) => {
      let es = 0;
      if (exp.company) es += 15;
      if (exp.position) es += 15;
      if (exp.startDate) es += 10;
      if (stripHtml(exp.description).length >= 50) es += 25;
      else if (stripHtml(exp.description).length > 0) es += 10;
      if (stripHtml(exp.achievements || '').length > 0) es += 20;
      if (exp.techStack) es += 15;
      return Math.min(es, 100);
    });
    scores.push({
      section: 'experience',
      label: '경력',
      score: Math.round(expScores.reduce((a, b) => a + b, 0) / expScores.length),
    });
  } else {
    scores.push({ section: 'experience', label: '경력', score: 0 });
  }

  // Skills
  if (data.skills.length > 0) {
    const filled = data.skills.filter((s) => s.items.trim().length > 0).length;
    scores.push({
      section: 'skills',
      label: '기술',
      score: Math.round((filled / data.skills.length) * 100),
    });
  } else {
    scores.push({ section: 'skills', label: '기술', score: 0 });
  }

  // Education
  if (data.educations.length > 0) {
    const eduScores = data.educations.map((edu) => {
      let es = 0;
      if (edu.school) es += 30;
      if (edu.degree) es += 25;
      if (edu.field) es += 25;
      if (edu.startDate || edu.endDate) es += 20;
      return Math.min(es, 100);
    });
    scores.push({
      section: 'education',
      label: '학력',
      score: Math.round(eduScores.reduce((a, b) => a + b, 0) / eduScores.length),
    });
  } else {
    scores.push({ section: 'education', label: '학력', score: 0 });
  }

  // Projects
  if (data.projects.length > 0) {
    const projScores = data.projects.map((p) => {
      let ps = 0;
      if (p.name) ps += 25;
      if (p.role) ps += 20;
      if (stripHtml(p.description).length >= 30) ps += 30;
      if (p.techStack) ps += 15;
      if (p.link) ps += 10;
      return Math.min(ps, 100);
    });
    scores.push({
      section: 'projects',
      label: '프로젝트',
      score: Math.round(projScores.reduce((a, b) => a + b, 0) / projScores.length),
    });
  }

  return scores;
}

function ScoreBar({ score }: { score: number }) {
  const color = score >= 80 ? 'bg-green-500' : score >= 50 ? 'bg-amber-500' : 'bg-red-500';
  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 h-1.5 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-500 ${color}`}
          style={{ width: `${score}%` }}
        />
      </div>
      <span className="text-xs font-medium text-slate-600 dark:text-slate-400 w-8 text-right">
        {score}
      </span>
    </div>
  );
}

interface Props {
  resumeId?: string;
  data: ResumeData;
  activeTab: string;
  onApplyFix?: (section: string, field: string, value: string) => void;
}

export default function AiCoachPanel({ resumeId, data, activeTab }: Props) {
  const [open, setOpen] = useState(false);
  const [tips, setTips] = useState<CoachTip[]>([]);
  const [scores, setScores] = useState<SectionScore[]>([]);
  const [aiTips, setAiTips] = useState<CoachTip[]>([]);
  const [loadingAi, setLoadingAi] = useState(false);
  const [activeCategory, setActiveCategory] = useState<Category | 'all'>('all');
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Recompute local tips on data/tab change (debounced)
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      setTips(computeLocalTips(data, activeTab));
      setScores(computeSectionScores(data));
    }, 300);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [data, activeTab]);

  const overallScore =
    scores.length > 0 ? Math.round(scores.reduce((sum, s) => sum + s.score, 0) / scores.length) : 0;

  const fetchAiCoaching = useCallback(async () => {
    if (!resumeId) {
      toast('이력서를 먼저 저장해주세요.', 'warning');
      return;
    }
    setLoadingAi(true);
    try {
      const token = localStorage.getItem('token');
      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      if (token) headers['Authorization'] = `Bearer ${token}`;

      const prompt = `다음 이력서를 분석하고 JSON 배열로 개선 팁을 제공하세요. 각 팁은 {"category": "completeness"|"keywords"|"ats"|"readability", "severity": "info"|"warning"|"critical", "title": "한줄 제목", "description": "구체적 개선 방법"} 형식입니다. 최대 5개만 반환하세요. JSON 배열만 반환하고 다른 텍스트는 포함하지 마세요.

이력서 요약:
- 이름: ${data.personalInfo.name || '미입력'}
- 자기소개: ${stripHtml(data.personalInfo.summary).substring(0, 200) || '미입력'}
- 경력 수: ${data.experiences.length}개
- 기술: ${
        data.skills
          .map((s) => s.items)
          .join(', ')
          .substring(0, 200) || '미입력'
      }
- 학력 수: ${data.educations.length}개
- 프로젝트 수: ${data.projects.length}개`;

      const res = await fetch(`${API_URL}/api/resumes/${resumeId}/transform`, {
        method: 'POST',
        headers,
        body: JSON.stringify({ templateType: 'custom', jobDescription: prompt }),
      });
      if (!res.ok) throw new Error('AI 분석 실패');
      const result = await res.json();
      const text = result.text || '';
      // Parse JSON array from response
      const jsonMatch = text.match(/\[[\s\S]*\]/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]) as Array<{
          category: Category;
          severity: Severity;
          title: string;
          description: string;
        }>;
        setAiTips(parsed.map((t, i) => ({ ...t, id: `ai-${i}` })));
      }
    } catch {
      toast('AI 코칭을 불러올 수 없습니다.', 'error');
    } finally {
      setLoadingAi(false);
    }
  }, [resumeId, data]);

  const allTips = [...tips, ...aiTips];
  const filteredTips =
    activeCategory === 'all' ? allTips : allTips.filter((t) => t.category === activeCategory);

  const criticalCount = allTips.filter((t) => t.severity === 'critical').length;
  const warningCount = allTips.filter((t) => t.severity === 'warning').length;

  return (
    <FeatureGate feature="aiCoaching" fallback={null}>
      {/* Toggle button - fixed on right side */}
      {!open && (
        <button
          onClick={() => setOpen(true)}
          className="fixed right-0 top-1/2 -translate-y-1/2 z-40 flex items-center gap-1.5 px-2 py-3 bg-purple-600 text-white rounded-l-xl shadow-lg hover:bg-purple-700 transition-all duration-200 group"
          aria-label="AI 코치 열기"
        >
          <svg
            className="w-5 h-5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            strokeWidth={2}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09z"
            />
          </svg>
          <span
            className="writing-vertical text-xs font-medium tracking-wider hidden sm:block"
            style={{ writingMode: 'vertical-rl' }}
          >
            AI 코치
          </span>
          {criticalCount > 0 && (
            <span className="absolute -top-1 -left-1 w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center font-bold">
              {criticalCount}
            </span>
          )}
          {criticalCount === 0 && warningCount > 0 && (
            <span className="absolute -top-1 -left-1 w-5 h-5 bg-amber-500 text-white text-xs rounded-full flex items-center justify-center font-bold">
              {warningCount}
            </span>
          )}
        </button>
      )}

      {/* Panel */}
      <RadixDialog.Root open={open} onOpenChange={setOpen}>
        <RadixDialog.Portal>
          <RadixDialog.Overlay className="fixed inset-0 bg-black/20 z-[90] sm:bg-transparent" />
          <RadixDialog.Content
            aria-label="AI 코치"
            aria-describedby={undefined}
            className={`fixed z-[91] bg-white dark:bg-neutral-800 shadow-2xl border-l border-neutral-200 dark:border-neutral-700 flex flex-col focus:outline-none
              sm:right-0 sm:top-0 sm:h-full sm:w-80 lg:w-96
              max-sm:bottom-0 max-sm:left-0 max-sm:right-0 max-sm:max-h-[70vh] max-sm:rounded-t-2xl max-sm:border-t`}
          >
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-slate-200 dark:border-slate-700 bg-gradient-to-r from-purple-50 to-blue-50 dark:from-purple-900/20 dark:to-blue-900/20 shrink-0">
              <div className="flex items-center gap-2">
                <svg
                  className="w-5 h-5 text-purple-600 dark:text-purple-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  strokeWidth={2}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09z"
                  />
                </svg>
                <RadixDialog.Title className="text-sm font-bold text-neutral-800 dark:text-neutral-200">
                  AI 이력서 코치
                </RadixDialog.Title>
              </div>
              <button
                onClick={() => setOpen(false)}
                className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
                aria-label="패널 닫기"
              >
                <svg
                  className="w-5 h-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  strokeWidth={2}
                >
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Scrollable content */}
            <div className="flex-1 overflow-y-auto">
              {/* Overall Score */}
              <div className="px-4 py-3 border-b border-slate-100 dark:border-slate-700">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-medium text-slate-500 dark:text-slate-400">
                    전체 완성도
                  </span>
                  <span
                    className={`text-lg font-bold ${overallScore >= 80 ? 'text-green-600' : overallScore >= 50 ? 'text-amber-600' : 'text-red-600'}`}
                  >
                    {overallScore}점
                  </span>
                </div>
                <div className="h-2 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-700 ${overallScore >= 80 ? 'bg-green-500' : overallScore >= 50 ? 'bg-amber-500' : 'bg-red-500'}`}
                    style={{ width: `${overallScore}%` }}
                  />
                </div>

                {/* Section scores */}
                <div className="mt-3 space-y-1.5">
                  {scores.map((s) => (
                    <div key={s.section}>
                      <div className="flex items-center justify-between mb-0.5">
                        <span className="text-xs text-slate-500 dark:text-slate-400">
                          {s.label}
                        </span>
                      </div>
                      <ScoreBar score={s.score} />
                    </div>
                  ))}
                </div>
              </div>

              {/* Category filter */}
              <div className="px-4 py-2 border-b border-slate-100 dark:border-slate-700 flex gap-1.5 overflow-x-auto scrollbar-none">
                <button
                  onClick={() => setActiveCategory('all')}
                  className={`shrink-0 px-2.5 py-1 text-xs rounded-full transition-colors ${
                    activeCategory === 'all'
                      ? 'bg-purple-600 text-white'
                      : 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-400 hover:bg-slate-200'
                  }`}
                >
                  전체 ({allTips.length})
                </button>
                {(Object.keys(CATEGORY_META) as Category[]).map((cat) => {
                  const count = allTips.filter((t) => t.category === cat).length;
                  return (
                    <button
                      key={cat}
                      onClick={() => setActiveCategory(cat)}
                      className={`shrink-0 px-2.5 py-1 text-xs rounded-full transition-colors ${
                        activeCategory === cat
                          ? 'bg-purple-600 text-white'
                          : 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-400 hover:bg-slate-200'
                      }`}
                    >
                      {CATEGORY_META[cat].label} ({count})
                    </button>
                  );
                })}
              </div>

              {/* Tips list */}
              <div className="px-4 py-3 space-y-2">
                {filteredTips.length === 0 && (
                  <div className="text-center py-6">
                    <svg
                      className="w-10 h-10 mx-auto text-green-400 mb-2"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                      strokeWidth={1.5}
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                      />
                    </svg>
                    <p className="text-sm text-slate-500 dark:text-slate-400">
                      {activeCategory === 'all'
                        ? '모든 항목이 양호합니다!'
                        : '이 카테고리에 개선 사항이 없습니다.'}
                    </p>
                  </div>
                )}
                {filteredTips.map((tip) => {
                  const style = SEVERITY_STYLES[tip.severity];
                  const catMeta = CATEGORY_META[tip.category];
                  return (
                    <div
                      key={tip.id}
                      className={`p-3 rounded-lg border ${style.bg} ${style.border} transition-all duration-200`}
                    >
                      <div className="flex items-start gap-2">
                        <svg
                          className={`w-4 h-4 mt-0.5 shrink-0 ${style.text}`}
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                          strokeWidth={2}
                        >
                          <path strokeLinecap="round" strokeLinejoin="round" d={catMeta.icon} />
                        </svg>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-1.5 mb-0.5">
                            <span className={`text-xs font-semibold ${style.text}`}>
                              {tip.title}
                            </span>
                            <span
                              className={`text-[10px] px-1.5 py-0.5 rounded-full font-medium ${style.badge}`}
                            >
                              {tip.severity === 'critical'
                                ? '필수'
                                : tip.severity === 'warning'
                                  ? '권장'
                                  : '참고'}
                            </span>
                          </div>
                          <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                            {tip.description}
                          </p>
                          {tip.fixAction && (
                            <button
                              onClick={tip.fixAction}
                              className="mt-1.5 px-2.5 py-1 text-xs font-medium text-purple-700 dark:text-purple-300 bg-purple-100 dark:bg-purple-900/30 rounded-md hover:bg-purple-200 dark:hover:bg-purple-800/40 transition-colors"
                            >
                              자동 수정
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Footer: AI deep analysis */}
            <div className="shrink-0 px-4 py-3 border-t border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/50">
              <button
                onClick={fetchAiCoaching}
                disabled={loadingAi}
                className="w-full flex items-center justify-center gap-2 px-4 py-2 text-sm font-medium text-white bg-purple-600 rounded-lg hover:bg-purple-700 disabled:opacity-50 transition-colors"
              >
                {loadingAi ? (
                  <>
                    <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                      />
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                      />
                    </svg>
                    AI 분석 중...
                  </>
                ) : (
                  <>
                    <svg
                      className="w-4 h-4"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                      strokeWidth={2}
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09z"
                      />
                    </svg>
                    AI 심층 분석
                  </>
                )}
              </button>
              <p className="text-[10px] text-slate-400 dark:text-slate-500 text-center mt-1">
                LLM을 사용하여 더 상세한 개선안을 제공합니다
              </p>
            </div>
          </RadixDialog.Content>
        </RadixDialog.Portal>
      </RadixDialog.Root>
    </FeatureGate>
  );
}
