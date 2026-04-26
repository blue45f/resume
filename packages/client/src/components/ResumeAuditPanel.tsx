import { useMemo, useState } from 'react';
import type { Resume } from '@/types/resume';

interface AuditItem {
  id: string;
  category: string;
  label: string;
  pass: boolean;
  impact: 'high' | 'medium' | 'low';
  tip?: string;
}

const WEAK_VERBS = [
  '했습니다',
  '하였습니다',
  '담당했습니다',
  '참여했습니다',
  '했음',
  '맡음',
  '진행함',
];
const STRONG_VERBS = [
  '주도',
  '개선',
  '달성',
  '증가',
  '구현',
  '설계',
  '리드',
  '최적화',
  '개발',
  '구축',
  '창출',
  '절감',
];
const CLICHES = ['열심히', '최선을', '팀플레이어', '성실한', '도전적인', '창의적인'];

function runAudit(resume: Resume): AuditItem[] {
  const items: AuditItem[] = [];
  const pi = resume.personalInfo;
  const summaryText = (pi.summary || '').replace(/<[^>]*>/g, '').trim();

  // ─── 인적사항 ───────────────────────────────
  items.push({
    id: 'has_name',
    category: '인적사항',
    label: '이름 입력됨',
    pass: !!pi.name?.trim(),
    impact: 'high',
    tip: '이름은 이력서의 필수 항목입니다.',
  });
  items.push({
    id: 'has_email',
    category: '인적사항',
    label: '이메일 입력됨',
    pass: !!pi.email?.trim(),
    impact: 'high',
    tip: '채용담당자가 연락할 수 있는 이메일을 입력하세요.',
  });
  items.push({
    id: 'has_phone',
    category: '인적사항',
    label: '전화번호 입력됨',
    pass: !!pi.phone?.trim(),
    impact: 'high',
    tip: '전화번호를 입력하면 채용 담당자가 더 쉽게 연락할 수 있습니다.',
  });
  items.push({
    id: 'has_github',
    category: '인적사항',
    label: 'GitHub/포트폴리오 링크',
    pass: !!(pi.github || pi.website),
    impact: 'medium',
    tip: '개발자라면 GitHub, 디자이너라면 포트폴리오 링크를 추가하세요.',
  });

  // ─── 자기소개 ───────────────────────────────
  items.push({
    id: 'has_summary',
    category: '자기소개',
    label: '자기소개 작성됨',
    pass: summaryText.length >= 30,
    impact: 'high',
    tip: '자기소개는 채용담당자가 가장 먼저 읽는 항목입니다. 30자 이상 작성하세요.',
  });
  items.push({
    id: 'summary_length',
    category: '자기소개',
    label: '자기소개 적정 분량 (80~300자)',
    pass: summaryText.length >= 80 && summaryText.length <= 300,
    impact: 'medium',
    tip: '너무 짧거나 길면 불리합니다. 2~4문장 (80~300자) 권장.',
  });
  items.push({
    id: 'no_cliches',
    category: '자기소개',
    label: '진부한 표현 없음',
    pass: !CLICHES.some((c) => summaryText.includes(c)),
    impact: 'low',
    tip: `"${CLICHES.join('", "')}" 같은 진부한 표현은 피하세요.`,
  });

  // ─── 경력 ───────────────────────────────────
  const expCount = resume.experiences.length;
  items.push({
    id: 'has_experience',
    category: '경력',
    label: '경력 1개 이상',
    pass: expCount >= 1,
    impact: 'high',
    tip: '경력이 없다면 인턴십, 프로젝트, 아르바이트라도 추가하세요.',
  });
  items.push({
    id: 'exp_has_desc',
    category: '경력',
    label: '경력 설명 작성됨',
    pass: resume.experiences.every(
      (e) => (e.description || '').replace(/<[^>]*>/g, '').length >= 20,
    ),
    impact: 'high',
    tip: '각 경력에 구체적인 업무 내용 (20자 이상)을 작성하세요.',
  });
  const allExpText = resume.experiences.map((e) => e.description || '').join(' ');
  items.push({
    id: 'exp_quantified',
    category: '경력',
    label: '수치화된 성과 포함',
    pass: /\d+|%|배|이상|이하|증가|감소|개선/.test(allExpText),
    impact: 'high',
    tip: '"매출 30% 증가", "응답 시간 2배 개선" 등 수치로 표현하세요.',
  });
  items.push({
    id: 'exp_strong_verbs',
    category: '경력',
    label: '강력한 동사 사용',
    pass: STRONG_VERBS.some((v) => allExpText.includes(v)),
    impact: 'medium',
    tip: `"${STRONG_VERBS.slice(0, 5).join('", "')}" 같은 강력한 동사를 사용하세요.`,
  });
  items.push({
    id: 'exp_no_weak',
    category: '경력',
    label: '약한 표현 최소화',
    pass: !WEAK_VERBS.some((v) => allExpText.includes(v)),
    impact: 'low',
    tip: `"했습니다", "담당했습니다" 보다 능동적이고 구체적인 표현을 사용하세요.`,
  });
  items.push({
    id: 'exp_has_dates',
    category: '경력',
    label: '경력 날짜 모두 입력됨',
    pass: resume.experiences.every((e) => !!e.startDate),
    impact: 'medium',
    tip: '근무 기간이 없으면 채용담당자가 경력 기간을 파악할 수 없습니다.',
  });
  items.push({
    id: 'exp_tech_stack',
    category: '경력',
    label: '기술 스택 명시됨',
    pass: resume.experiences.some((e) => !!e.techStack?.trim()),
    impact: 'medium',
    tip: '경력에 사용한 기술 스택을 명시하면 ATS 통과율이 높아집니다.',
  });

  // ─── 학력 ───────────────────────────────────
  items.push({
    id: 'has_education',
    category: '학력',
    label: '학력 1개 이상',
    pass: resume.educations.length >= 1,
    impact: 'high',
    tip: '학력 정보를 추가하세요.',
  });
  items.push({
    id: 'edu_has_degree',
    category: '학력',
    label: '학위/전공 입력됨',
    pass: resume.educations.every((e) => !!e.degree?.trim() && !!e.field?.trim()),
    impact: 'medium',
    tip: '학위 종류(학사/석사 등)와 전공을 모두 입력하세요.',
  });

  // ─── 기술 ───────────────────────────────────
  const skillCount = resume.skills.reduce(
    (acc, s) => acc + (s.items?.split(',').filter(Boolean).length || 0),
    0,
  );
  items.push({
    id: 'has_skills',
    category: '기술',
    label: '기술 3개 이상',
    pass: skillCount >= 3,
    impact: 'high',
    tip: '최소 3개 이상의 기술 스택을 추가하세요.',
  });
  items.push({
    id: 'skills_categorized',
    category: '기술',
    label: '기술이 카테고리별 분류됨',
    pass: resume.skills.length >= 2,
    impact: 'medium',
    tip: 'Frontend/Backend/DevOps 등 카테고리로 분류하면 가독성이 높아집니다.',
  });

  // ─── 프로젝트 ───────────────────────────────
  items.push({
    id: 'has_projects',
    category: '프로젝트',
    label: '프로젝트 1개 이상',
    pass: resume.projects.length >= 1,
    impact: 'medium',
    tip: '개인/팀 프로젝트를 추가하면 실력을 증명할 수 있습니다.',
  });
  items.push({
    id: 'project_has_tech',
    category: '프로젝트',
    label: '프로젝트에 기술 스택 명시',
    pass: resume.projects.every((p) => !!p.techStack?.trim() || resume.projects.length === 0),
    impact: 'low',
    tip: '각 프로젝트에 사용한 기술 스택을 명시하세요.',
  });

  // ─── 자격증/어학 ───────────────────────────
  items.push({
    id: 'has_certs_or_langs',
    category: '자격/어학',
    label: '자격증 또는 어학 성적',
    pass: resume.certifications.length > 0 || resume.languages.length > 0,
    impact: 'low',
    tip: '자격증이나 어학 성적이 있다면 추가하세요.',
  });

  // ─── ATS 호환성 ──────────────────────────────
  items.push({
    id: 'no_html_heavy',
    category: 'ATS 호환',
    label: '텍스트 중심 작성 (ATS 친화적)',
    pass: !(pi.summary || '').includes('<table') && !(pi.summary || '').includes('<img'),
    impact: 'medium',
    tip: '표나 이미지는 ATS 파싱을 어렵게 합니다. 텍스트 중심으로 작성하세요.',
  });
  items.push({
    id: 'has_title',
    category: 'ATS 호환',
    label: '이력서 제목 설정됨',
    pass: !!(resume as any).title?.trim(),
    impact: 'low',
    tip: '이력서에 명확한 제목을 설정하세요.',
  });

  return items;
}

const IMPACT_COLORS: Record<string, string> = {
  high: 'text-red-500 dark:text-red-400',
  medium: 'text-amber-500 dark:text-amber-400',
  low: 'text-blue-500 dark:text-blue-400',
};

const IMPACT_BG: Record<string, string> = {
  high: 'bg-red-50 dark:bg-red-900/10 border-red-200 dark:border-red-800',
  medium: 'bg-amber-50 dark:bg-amber-900/10 border-amber-200 dark:border-amber-800',
  low: 'bg-blue-50 dark:bg-blue-900/10 border-blue-200 dark:border-blue-800',
};

const IMPACT_LABELS: Record<string, string> = {
  high: '높음',
  medium: '중간',
  low: '낮음',
};

interface Props {
  resume: Resume;
  compact?: boolean;
}

export default function ResumeAuditPanel({ resume, compact = false }: Props) {
  const [activeCategory, setActiveCategory] = useState<string>('all');
  const [showPassed, setShowPassed] = useState(false);

  const items = useMemo(() => runAudit(resume), [resume]);
  const passedCount = items.filter((i) => i.pass).length;
  const totalCount = items.length;
  const score = Math.round((passedCount / totalCount) * 100);

  const categories = ['all', ...Array.from(new Set(items.map((i) => i.category)))];
  const filtered = items.filter((i) => {
    if (!showPassed && i.pass) return false;
    if (activeCategory === 'all') return true;
    return i.category === activeCategory;
  });

  const failedHigh = items.filter((i) => !i.pass && i.impact === 'high').length;
  const failedMed = items.filter((i) => !i.pass && i.impact === 'medium').length;

  if (compact) {
    return (
      <div className="flex items-center gap-2">
        <div className="flex-1 bg-slate-100 dark:bg-slate-700 rounded-full h-1.5">
          <div
            className={`h-1.5 rounded-full transition-all ${score >= 80 ? 'bg-blue-500' : score >= 60 ? 'bg-green-500' : score >= 40 ? 'bg-amber-500' : 'bg-red-500'}`}
            style={{ width: `${score}%` }}
          />
        </div>
        <span className="text-xs font-semibold text-slate-600 dark:text-slate-400 tabular-nums">
          {passedCount}/{totalCount}
        </span>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-4">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-semibold text-slate-800 dark:text-slate-200 flex items-center gap-2">
          <svg
            className="w-4 h-4 text-indigo-500"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
          이력서 종합 감사
        </h3>
        <div className="flex items-center gap-2">
          <span
            className={`text-xs font-bold px-2 py-0.5 rounded-full ${
              score >= 80
                ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400'
                : score >= 60
                  ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                  : score >= 40
                    ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400'
                    : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
            }`}
          >
            {passedCount}/{totalCount}
          </span>
        </div>
      </div>

      {/* Score bar */}
      <div className="mb-3">
        <div className="flex justify-between text-xs text-slate-400 mb-1">
          <span>통과 {score}%</span>
          {failedHigh > 0 && <span className="text-red-500">중요 {failedHigh}개 미통과</span>}
        </div>
        <div className="w-full bg-slate-100 dark:bg-slate-700 rounded-full h-2 overflow-hidden">
          <div
            className={`h-2 rounded-full transition-all duration-500 ${
              score >= 80
                ? 'bg-blue-500'
                : score >= 60
                  ? 'bg-green-500'
                  : score >= 40
                    ? 'bg-amber-500'
                    : 'bg-red-500'
            }`}
            style={{ width: `${score}%` }}
          />
        </div>
      </div>

      {/* Summary badges */}
      <div className="flex flex-wrap gap-2 mb-3">
        {failedHigh > 0 && (
          <span className="text-[11px] px-2 py-0.5 bg-red-100 dark:bg-red-900/20 text-red-600 dark:text-red-400 rounded-full font-medium">
            높은중요도 {failedHigh}개 개선 필요
          </span>
        )}
        {failedMed > 0 && (
          <span className="text-[11px] px-2 py-0.5 bg-amber-100 dark:bg-amber-900/20 text-amber-600 dark:text-amber-400 rounded-full font-medium">
            중간중요도 {failedMed}개
          </span>
        )}
        {failedHigh === 0 && failedMed === 0 && (
          <span className="text-[11px] px-2 py-0.5 bg-green-100 dark:bg-green-900/20 text-green-600 dark:text-green-400 rounded-full font-medium">
            핵심 항목 모두 통과!
          </span>
        )}
      </div>

      {/* Category filter */}
      <div className="flex gap-1 flex-wrap mb-3">
        {categories.map((cat) => (
          <button
            key={cat}
            onClick={() => setActiveCategory(cat)}
            className={`px-2 py-0.5 text-[11px] rounded-full transition-colors ${
              activeCategory === cat
                ? 'bg-indigo-600 text-white'
                : 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-600'
            }`}
          >
            {cat === 'all' ? '전체' : cat}
          </button>
        ))}
      </div>

      {/* Toggle passed */}
      <button
        onClick={() => setShowPassed((p) => !p)}
        className="flex items-center gap-1 text-[11px] text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 mb-2 transition-colors"
      >
        <svg
          className={`w-3.5 h-3.5 transition-transform ${showPassed ? 'rotate-0' : 'rotate-0'}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d={
              showPassed
                ? 'M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21'
                : 'M15 12a3 3 0 11-6 0 3 3 0 016 0z M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z'
            }
          />
        </svg>
        {showPassed ? '통과 항목 숨기기' : `통과 항목 보기 (${passedCount}개)`}
      </button>

      {/* Audit items */}
      <div className="space-y-1.5 max-h-64 overflow-y-auto pr-1">
        {filtered.length === 0 ? (
          <p className="text-xs text-slate-400 text-center py-4">
            {showPassed
              ? '표시할 항목이 없습니다'
              : `모든 ${activeCategory === 'all' ? '' : activeCategory + ' '}항목을 통과했습니다! 🎉`}
          </p>
        ) : (
          filtered.map((item) => (
            <div
              key={item.id}
              className={`flex items-start gap-2 p-2 rounded-lg border text-xs ${
                item.pass
                  ? 'bg-slate-50 dark:bg-slate-700/30 border-slate-100 dark:border-slate-700'
                  : IMPACT_BG[item.impact]
              }`}
            >
              <span
                className={`shrink-0 mt-0.5 ${item.pass ? 'text-green-500' : IMPACT_COLORS[item.impact]}`}
              >
                {item.pass ? (
                  <svg
                    className="w-3.5 h-3.5"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2.5}
                      d="M5 13l4 4L19 7"
                    />
                  </svg>
                ) : (
                  <svg
                    className="w-3.5 h-3.5"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2.5}
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                )}
              </span>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span
                    className={`font-medium ${item.pass ? 'text-slate-600 dark:text-slate-400' : 'text-slate-700 dark:text-slate-300'}`}
                  >
                    {item.label}
                  </span>
                  {!item.pass && (
                    <span
                      className={`text-[10px] font-medium px-1 py-0.5 rounded ${
                        item.impact === 'high'
                          ? 'bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400'
                          : item.impact === 'medium'
                            ? 'bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400'
                            : 'bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400'
                      }`}
                    >
                      {IMPACT_LABELS[item.impact]}
                    </span>
                  )}
                </div>
                {!item.pass && item.tip && (
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 leading-snug">
                    {item.tip}
                  </p>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
