import { useEffect, useMemo } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { useResume } from '@/hooks/useResources';
import { ROUTES } from '@/lib/routes';
import type { Resume } from '@/types/resume';

/** Category weights for score calculation */
interface ScoreCategory {
  id: string;
  label: string;
  weight: number;
  icon: string;
  description: string;
}

const CATEGORIES: ScoreCategory[] = [
  {
    id: 'completeness',
    label: '완성도',
    weight: 0.3,
    icon: 'M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z',
    description: '필수 정보가 빠짐없이 작성되었는지 평가합니다',
  },
  {
    id: 'keywords',
    label: '키워드',
    weight: 0.2,
    icon: 'M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z',
    description: '직무 관련 핵심 키워드가 포함되어 있는지 평가합니다',
  },
  {
    id: 'format',
    label: '포맷',
    weight: 0.15,
    icon: 'M4 6h16M4 12h16M4 18h7',
    description: '일관된 형식과 적절한 길이로 작성되었는지 평가합니다',
  },
  {
    id: 'readability',
    label: '가독성',
    weight: 0.15,
    icon: 'M15 12a3 3 0 11-6 0 3 3 0 016 0z M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z',
    description: '읽기 쉬운 구조로 작성되었는지 평가합니다',
  },
  {
    id: 'ats',
    label: 'ATS 호환성',
    weight: 0.2,
    icon: 'M9 3v2m6-2v2M9 19v2m6-2v2M5 9H3m2 6H3m18-6h-2m2 6h-2M7 19h10a2 2 0 002-2V7a2 2 0 00-2-2H7a2 2 0 00-2 2v10a2 2 0 002 2z',
    description: 'ATS(지원자추적시스템)가 정보를 잘 읽을 수 있는지 평가합니다',
  },
];

interface Recommendation {
  category: string;
  severity: 'critical' | 'warning' | 'info';
  message: string;
  section?: string;
}

function getLetterGrade(score: number): { grade: string; color: string; bg: string } {
  if (score >= 90)
    return {
      grade: 'A+',
      color: 'text-emerald-700 dark:text-emerald-400',
      bg: 'bg-emerald-100 dark:bg-emerald-900/30',
    };
  if (score >= 80)
    return {
      grade: 'A',
      color: 'text-emerald-600 dark:text-emerald-400',
      bg: 'bg-emerald-50 dark:bg-emerald-900/20',
    };
  if (score >= 70)
    return {
      grade: 'B+',
      color: 'text-blue-700 dark:text-blue-400',
      bg: 'bg-blue-100 dark:bg-blue-900/30',
    };
  if (score >= 60)
    return {
      grade: 'B',
      color: 'text-blue-600 dark:text-blue-400',
      bg: 'bg-blue-50 dark:bg-blue-900/20',
    };
  if (score >= 50)
    return {
      grade: 'C+',
      color: 'text-amber-700 dark:text-amber-400',
      bg: 'bg-amber-100 dark:bg-amber-900/30',
    };
  if (score >= 40)
    return {
      grade: 'C',
      color: 'text-amber-600 dark:text-amber-400',
      bg: 'bg-amber-50 dark:bg-amber-900/20',
    };
  if (score >= 30)
    return {
      grade: 'D',
      color: 'text-orange-600 dark:text-orange-400',
      bg: 'bg-orange-50 dark:bg-orange-900/20',
    };
  return {
    grade: 'F',
    color: 'text-red-600 dark:text-red-400',
    bg: 'bg-red-50 dark:bg-red-900/20',
  };
}

function scoreColor(score: number): string {
  if (score >= 80) return 'text-emerald-600 dark:text-emerald-400';
  if (score >= 60) return 'text-blue-600 dark:text-blue-400';
  if (score >= 40) return 'text-amber-600 dark:text-amber-400';
  return 'text-red-600 dark:text-red-400';
}

function barColor(score: number): string {
  if (score >= 80) return 'bg-emerald-500';
  if (score >= 60) return 'bg-blue-500';
  if (score >= 40) return 'bg-amber-500';
  return 'bg-red-500';
}

/** Average resume scores (simulated benchmark) */
const AVERAGE_SCORES: Record<string, number> = {
  completeness: 62,
  keywords: 48,
  format: 55,
  readability: 58,
  ats: 45,
};

function analyzeResume(resume: Resume): {
  categoryScores: Record<string, number>;
  recommendations: Recommendation[];
} {
  const scores: Record<string, number> = {};
  const recs: Recommendation[] = [];

  // 1. Completeness (30%)
  let completeness = 0;
  const pi = resume.personalInfo;
  if (pi.name?.trim()) completeness += 15;
  else
    recs.push({
      category: 'completeness',
      severity: 'critical',
      message: '이름이 비어 있습니다. 반드시 입력해주세요.',
      section: 'personal',
    });
  if (pi.email?.trim()) completeness += 10;
  else
    recs.push({
      category: 'completeness',
      severity: 'critical',
      message: '이메일 주소를 입력해주세요.',
      section: 'personal',
    });
  if (pi.phone?.trim()) completeness += 10;
  else
    recs.push({
      category: 'completeness',
      severity: 'warning',
      message: '연락처(전화번호)를 추가하면 채용담당자가 연락하기 쉽습니다.',
      section: 'personal',
    });
  if (pi.summary?.trim()) {
    completeness += 15;
    if (pi.summary.length < 50) {
      completeness -= 5;
      recs.push({
        category: 'completeness',
        severity: 'warning',
        message: '자기소개가 너무 짧습니다. 최소 2-3문장으로 작성하세요.',
        section: 'personal',
      });
    }
  } else {
    recs.push({
      category: 'completeness',
      severity: 'critical',
      message: '자기소개(Professional Summary)를 작성하면 첫인상을 크게 높일 수 있습니다.',
      section: 'personal',
    });
  }
  if (resume.experiences.length > 0) completeness += 20;
  else
    recs.push({
      category: 'completeness',
      severity: 'critical',
      message: '경력사항을 최소 1개 이상 추가해주세요.',
      section: 'experience',
    });
  if (resume.educations.length > 0) completeness += 10;
  else
    recs.push({
      category: 'completeness',
      severity: 'warning',
      message: '학력사항을 추가하면 완성도가 높아집니다.',
      section: 'education',
    });
  if (resume.skills.length > 0) completeness += 10;
  else
    recs.push({
      category: 'completeness',
      severity: 'warning',
      message: '보유 기술을 추가하면 키워드 매칭률이 높아집니다.',
      section: 'skills',
    });
  if (resume.projects.length > 0) completeness += 5;
  if (resume.certifications.length > 0) completeness += 5;
  scores.completeness = Math.min(100, completeness);

  // 2. Keywords (20%)
  let keywords = 0;
  const allText = [
    pi.summary,
    pi.name,
    ...resume.experiences.flatMap((e) => [
      e.company,
      e.position,
      e.description,
      e.achievements,
      e.techStack,
    ]),
    ...resume.educations.flatMap((e) => [e.school, e.degree, e.field, e.description]),
    ...resume.skills.flatMap((s) => [s.category, s.items]),
    ...resume.projects.flatMap((p) => [p.name, p.description, p.techStack]),
  ]
    .filter(Boolean)
    .join(' ')
    .toLowerCase();
  const textLength = allText.length;
  // Check for action words (Korean & English)
  const actionWords = [
    '개발',
    '구축',
    '설계',
    '최적화',
    '개선',
    '달성',
    '리드',
    '주도',
    '관리',
    '분석',
    'developed',
    'built',
    'designed',
    'optimized',
    'improved',
    'achieved',
    'led',
    'managed',
    'analyzed',
  ];
  const actionCount = actionWords.filter((w) => allText.includes(w)).length;
  keywords += Math.min(40, actionCount * 8);
  // Check for quantifiable results
  const hasNumbers = /\d+%|\d+억|\d+만|\d+배|\d+건/.test(allText);
  if (hasNumbers) keywords += 30;
  else
    recs.push({
      category: 'keywords',
      severity: 'warning',
      message: '성과를 수치로 표현하면 설득력이 높아집니다. (예: "매출 30% 증가", "비용 20% 절감")',
      section: 'experience',
    });
  // Check for tech stack keywords
  const techKeywords = [
    'react',
    'python',
    'java',
    'node',
    'sql',
    'aws',
    'docker',
    'typescript',
    'javascript',
    'kubernetes',
  ];
  const techCount = techKeywords.filter((k) => allText.includes(k)).length;
  keywords += Math.min(30, techCount * 6);
  if (techCount === 0 && resume.skills.length === 0) {
    recs.push({
      category: 'keywords',
      severity: 'info',
      message: '기술 스택 키워드를 경력 설명이나 기술 섹션에 포함하세요.',
      section: 'skills',
    });
  }
  scores.keywords = Math.min(100, keywords);

  // 3. Format (15%)
  let format = 50; // base
  // Check description lengths
  const expDescriptions = resume.experiences.map((e) => (e.description || '').length);
  const hasLongDesc = expDescriptions.some((l) => l > 300);
  const hasShortDesc = expDescriptions.some((l) => l > 0 && l < 30);
  if (hasLongDesc) {
    format -= 10;
    recs.push({
      category: 'format',
      severity: 'info',
      message:
        '경력 설명이 너무 길면 핵심을 놓칠 수 있습니다. 3-5개 핵심 불릿 포인트로 정리하세요.',
    });
  }
  if (hasShortDesc) {
    format -= 10;
    recs.push({
      category: 'format',
      severity: 'warning',
      message: '경력 설명이 너무 짧습니다. 구체적인 업무와 성과를 추가해주세요.',
      section: 'experience',
    });
  }
  // Check date consistency
  const hasDates = resume.experiences.every((e) => e.startDate);
  if (hasDates) format += 15;
  else
    recs.push({
      category: 'format',
      severity: 'warning',
      message: '경력 기간(시작일)을 모두 입력해주세요.',
      section: 'experience',
    });
  // Title present
  if (resume.title?.trim()) format += 10;
  // Consistent skill categories
  if (resume.skills.length > 0 && resume.skills.every((s) => s.category?.trim())) format += 15;
  else if (resume.skills.length > 0)
    recs.push({
      category: 'format',
      severity: 'info',
      message: '기술 항목에 카테고리(예: Frontend, Backend)를 지정하면 가독성이 좋아집니다.',
      section: 'skills',
    });
  // Overall text volume
  if (textLength > 500) format += 10;
  scores.format = Math.min(100, Math.max(0, format));

  // 4. Readability (15%)
  let readability = 50;
  // Summary length check
  const summaryLen = (pi.summary || '').length;
  if (summaryLen >= 80 && summaryLen <= 300) readability += 20;
  else if (summaryLen > 300) {
    readability += 5;
    recs.push({
      category: 'readability',
      severity: 'info',
      message: '자기소개를 150-250자 내외로 간결하게 작성하면 읽기 편합니다.',
      section: 'personal',
    });
  }
  // Number of experiences (sweet spot: 2-5)
  const expCount = resume.experiences.length;
  if (expCount >= 2 && expCount <= 5) readability += 15;
  else if (expCount > 5) {
    readability += 5;
    recs.push({
      category: 'readability',
      severity: 'info',
      message: '경력이 많다면 최근 5개 위주로 상세히 작성하고 나머지는 간략하게 정리하세요.',
    });
  }
  // Skills categorized
  if (resume.skills.length >= 2) readability += 15;
  // Address present (location matters)
  if (pi.address?.trim()) readability += 5;
  // Website/GitHub links
  if (pi.website?.trim() || pi.github?.trim()) readability += 5;
  // Projects add depth
  if (resume.projects.length > 0) readability += 10;
  scores.readability = Math.min(100, readability);

  // 5. ATS Compatibility (20%)
  let ats = 40;
  // Standard sections present
  if (pi.name?.trim() && pi.email?.trim()) ats += 15;
  if (resume.experiences.length > 0) ats += 10;
  if (resume.educations.length > 0) ats += 5;
  if (resume.skills.length > 0) ats += 10;
  // No special characters in key fields
  const hasSpecialChars = /[^\w\s가-힣ㄱ-ㅎㅏ-ㅣ@.+\-,()/:;#&]/.test(pi.name + pi.email);
  if (!hasSpecialChars) ats += 5;
  else
    recs.push({
      category: 'ats',
      severity: 'warning',
      message: '이름이나 이메일에 특수문자가 있으면 ATS가 인식하지 못할 수 있습니다.',
      section: 'personal',
    });
  // Plain text descriptions (no excessive formatting)
  const hasHtmlTags = /<[^>]+>/.test(allText);
  if (!hasHtmlTags) ats += 10;
  // Clear job titles
  const hasPositions = resume.experiences.every((e) => e.position?.trim());
  if (hasPositions) ats += 5;
  else
    recs.push({
      category: 'ats',
      severity: 'warning',
      message: '모든 경력 항목에 직책/직위를 명시해주세요. ATS가 경력을 정확히 파악합니다.',
      section: 'experience',
    });
  scores.ats = Math.min(100, ats);

  return { categoryScores: scores, recommendations: recs };
}

export default function ResumeReviewPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { data, isLoading: loading, error: queryError } = useResume(id);
  const resume: Resume | null = (data as Resume | undefined) ?? null;
  const error = !!queryError;

  useEffect(() => {
    document.title = '이력서 리뷰 -- 이력서공방';
    return () => {
      document.title = '이력서공방 - AI 기반 이력서 관리 플랫폼';
    };
  }, []);

  const analysis = useMemo(() => (resume ? analyzeResume(resume) : null), [resume]);

  const overallScore = useMemo(() => {
    if (!analysis) return 0;
    return Math.round(
      CATEGORIES.reduce((sum, cat) => sum + (analysis.categoryScores[cat.id] || 0) * cat.weight, 0),
    );
  }, [analysis]);

  const grade = useMemo(() => getLetterGrade(overallScore), [overallScore]);

  const averageOverall = useMemo(
    () => Math.round(CATEGORIES.reduce((sum, cat) => sum + AVERAGE_SCORES[cat.id] * cat.weight, 0)),
    [],
  );

  if (loading) {
    return (
      <>
        <Header />
        <main
          id="main-content"
          className="flex-1 max-w-4xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-8"
          role="main"
        >
          <div className="animate-pulse space-y-6">
            <div className="h-8 bg-slate-200 dark:bg-slate-700 rounded w-64" />
            <div className="h-48 bg-slate-100 dark:bg-slate-800 rounded-2xl" />
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="h-32 bg-slate-100 dark:bg-slate-800 rounded-xl" />
              ))}
            </div>
          </div>
        </main>
        <Footer />
      </>
    );
  }

  if (error || !resume || !analysis) {
    return (
      <>
        <Header />
        <main id="main-content" className="flex-1 flex items-center justify-center" role="main">
          <div className="text-center px-4">
            <p className="text-lg font-medium text-slate-700 dark:text-slate-300 mb-4">
              이력서를 불러올 수 없습니다
            </p>
            <button
              onClick={() => navigate(ROUTES.home)}
              className="px-5 py-2.5 bg-blue-600 text-white text-sm font-medium rounded-xl hover:bg-blue-700 transition-colors"
            >
              홈으로
            </button>
          </div>
        </main>
      </>
    );
  }

  const sortedRecs = [...analysis.recommendations].sort((a, b) => {
    const order = { critical: 0, warning: 1, info: 2 };
    return order[a.severity] - order[b.severity];
  });

  const sectionMap: Record<string, string> = {
    personal: '인적사항',
    experience: '경력',
    education: '학력',
    skills: '기술',
    projects: '프로젝트',
  };

  return (
    <>
      <Header />
      <main
        id="main-content"
        className="flex-1 max-w-4xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-6 sm:py-8"
        role="main"
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-slate-100">
              이력서 리뷰
            </h1>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
              {resume.title || resume.personalInfo.name || '제목 없음'}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Link
              to={`/resumes/${id}/preview`}
              className="px-3 py-1.5 text-sm text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-700 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors"
            >
              미리보기
            </Link>
            <Link
              to={`/resumes/${id}/edit`}
              className="px-3 py-1.5 text-sm text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors"
            >
              수정하기
            </Link>
          </div>
        </div>

        {/* Overall Score Card */}
        <div
          className={`${grade.bg} rounded-2xl p-6 sm:p-8 mb-6 border border-slate-200/50 dark:border-slate-700/50`}
        >
          <div className="flex flex-col sm:flex-row items-center gap-6">
            {/* Score circle */}
            <div className="relative w-32 h-32 sm:w-36 sm:h-36 shrink-0">
              <svg viewBox="0 0 120 120" className="w-full h-full -rotate-90">
                <circle
                  cx="60"
                  cy="60"
                  r="52"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="8"
                  className="text-slate-200 dark:text-slate-700"
                />
                <circle
                  cx="60"
                  cy="60"
                  r="52"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="8"
                  strokeLinecap="round"
                  strokeDasharray={`${(overallScore / 100) * 327} 327`}
                  className={barColor(overallScore).replace('bg-', 'text-')}
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className={`text-3xl sm:text-4xl font-bold ${grade.color}`}>
                  {overallScore}
                </span>
                <span className={`text-sm font-semibold ${grade.color}`}>{grade.grade}</span>
              </div>
            </div>

            <div className="flex-1 text-center sm:text-left">
              <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100 mb-2">
                {overallScore >= 80
                  ? '우수한 이력서입니다!'
                  : overallScore >= 60
                    ? '좋은 이력서이지만 개선 여지가 있습니다'
                    : overallScore >= 40
                      ? '몇 가지 중요한 개선이 필요합니다'
                      : '기본 정보부터 채워나가세요'}
              </h2>
              <p className="text-sm text-slate-600 dark:text-slate-400 mb-3">
                평균 점수 <span className="font-semibold">{averageOverall}점</span> 대비{' '}
                {overallScore > averageOverall ? (
                  <span className="text-emerald-600 dark:text-emerald-400 font-semibold">
                    +{overallScore - averageOverall}점 높습니다
                  </span>
                ) : overallScore < averageOverall ? (
                  <span className="text-red-600 dark:text-red-400 font-semibold">
                    {overallScore - averageOverall}점 낮습니다
                  </span>
                ) : (
                  <span className="font-semibold">동일합니다</span>
                )}
              </p>
              <div className="flex flex-wrap gap-2">
                {sortedRecs.filter((r) => r.severity === 'critical').length > 0 && (
                  <span className="px-2.5 py-1 text-xs font-medium bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 rounded-full">
                    필수 개선 {sortedRecs.filter((r) => r.severity === 'critical').length}건
                  </span>
                )}
                {sortedRecs.filter((r) => r.severity === 'warning').length > 0 && (
                  <span className="px-2.5 py-1 text-xs font-medium bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 rounded-full">
                    권장 개선 {sortedRecs.filter((r) => r.severity === 'warning').length}건
                  </span>
                )}
                {sortedRecs.filter((r) => r.severity === 'info').length > 0 && (
                  <span className="px-2.5 py-1 text-xs font-medium bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 rounded-full">
                    참고 {sortedRecs.filter((r) => r.severity === 'info').length}건
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Category Breakdown */}
        <h2 className="text-base font-bold text-slate-900 dark:text-slate-100 mb-4">
          카테고리별 점수
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
          {CATEGORIES.map((cat) => {
            const score = analysis.categoryScores[cat.id] || 0;
            const avg = AVERAGE_SCORES[cat.id];
            const diff = score - avg;
            return (
              <div
                key={cat.id}
                className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-4"
              >
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg bg-slate-100 dark:bg-slate-700 flex items-center justify-center">
                      <svg
                        className="w-4 h-4 text-slate-600 dark:text-slate-300"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                        strokeWidth={1.5}
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" d={cat.icon} />
                      </svg>
                    </div>
                    <div>
                      <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                        {cat.label}
                      </h3>
                      <p className="text-[10px] text-slate-400 dark:text-slate-500">
                        비중 {Math.round(cat.weight * 100)}%
                      </p>
                    </div>
                  </div>
                  <span className={`text-xl font-bold ${scoreColor(score)}`}>{score}</span>
                </div>
                {/* Progress bar */}
                <div className="h-2 bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden mb-2">
                  <div
                    className={`h-full rounded-full transition-all duration-500 ${barColor(score)}`}
                    style={{ width: `${score}%` }}
                  />
                </div>
                {/* Comparison with average */}
                <div className="flex items-center justify-between text-[11px]">
                  <span className="text-slate-400 dark:text-slate-500">평균 {avg}점</span>
                  {diff !== 0 && (
                    <span
                      className={
                        diff > 0
                          ? 'text-emerald-600 dark:text-emerald-400'
                          : 'text-red-500 dark:text-red-400'
                      }
                    >
                      {diff > 0 ? '+' : ''}
                      {diff}점
                    </span>
                  )}
                </div>
                <p className="text-[10px] text-slate-400 dark:text-slate-500 mt-2">
                  {cat.description}
                </p>
              </div>
            );
          })}
        </div>

        {/* Recommendations */}
        <h2 className="text-base font-bold text-slate-900 dark:text-slate-100 mb-4">
          상세 개선 사항
        </h2>
        {sortedRecs.length === 0 ? (
          <div className="bg-emerald-50 dark:bg-emerald-900/10 rounded-xl border border-emerald-200 dark:border-emerald-800 p-6 text-center">
            <svg
              className="w-10 h-10 text-emerald-500 mx-auto mb-2"
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
            <p className="text-sm font-medium text-emerald-700 dark:text-emerald-400">
              모든 항목이 양호합니다!
            </p>
          </div>
        ) : (
          <div className="space-y-3 mb-8">
            {sortedRecs.map((rec, idx) => {
              const severityConfig = {
                critical: {
                  border: 'border-red-200 dark:border-red-800',
                  bg: 'bg-red-50 dark:bg-red-900/10',
                  icon: 'M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z',
                  iconColor: 'text-red-500',
                },
                warning: {
                  border: 'border-amber-200 dark:border-amber-800',
                  bg: 'bg-amber-50 dark:bg-amber-900/10',
                  icon: 'M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z',
                  iconColor: 'text-amber-500',
                },
                info: {
                  border: 'border-blue-200 dark:border-blue-800',
                  bg: 'bg-blue-50 dark:bg-blue-900/10',
                  icon: 'M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z',
                  iconColor: 'text-blue-500',
                },
              };
              const config = severityConfig[rec.severity];
              return (
                <div
                  key={idx}
                  className={`flex items-start gap-3 p-4 rounded-xl border ${config.border} ${config.bg}`}
                >
                  <svg
                    className={`w-5 h-5 shrink-0 mt-0.5 ${config.iconColor}`}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                    strokeWidth={1.5}
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" d={config.icon} />
                  </svg>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                      <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase">
                        {CATEGORIES.find((c) => c.id === rec.category)?.label}
                      </span>
                      {rec.section && (
                        <span className="text-[10px] px-1.5 py-0.5 bg-white/60 dark:bg-slate-700/60 text-slate-500 dark:text-slate-400 rounded">
                          {sectionMap[rec.section] || rec.section}
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-slate-700 dark:text-slate-300">{rec.message}</p>
                  </div>
                  {rec.section && (
                    <Link
                      to={`/resumes/${id}/edit`}
                      className="shrink-0 px-3 py-1.5 text-xs font-medium text-blue-600 dark:text-blue-400 bg-white dark:bg-slate-800 border border-blue-200 dark:border-blue-700 rounded-lg hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors"
                    >
                      수정하기
                    </Link>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* Action Footer */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 py-6 border-t border-slate-200 dark:border-slate-700">
          <Link
            to={`/resumes/${id}/edit`}
            className="w-full sm:w-auto px-6 py-2.5 bg-blue-600 text-white text-sm font-medium rounded-xl hover:bg-blue-700 transition-colors text-center"
          >
            이력서 수정하기
          </Link>
          <Link
            to={`/resumes/${id}/preview`}
            className="w-full sm:w-auto px-6 py-2.5 border border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-300 text-sm font-medium rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors text-center"
          >
            미리보기로 돌아가기
          </Link>
        </div>
      </main>
      <Footer />
    </>
  );
}
