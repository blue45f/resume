import { useState, useMemo, useCallback } from 'react';
import type { Resume } from '@/types/resume';

interface CareerPath {
  title: string;
  match: number;
  requiredSkills: string[];
  currentSkills: string[];
  missingSkills: string[];
  salaryRange: string;
  salaryMin: number;
  salaryMax: number;
  timeline: string;
  description: string;
}

interface CareerNode {
  title: string;
  paths: CareerPath[];
}

function analyzeCareerPaths(resume: Resume): CareerNode {
  const currentSkills = new Set(
    resume.skills.flatMap((s) => s.items.split(',').map((i) => i.trim().toLowerCase())),
  );
  // Detect current role from most recent experience or skills
  const lastExp = resume.experiences[0];
  const positionLower = lastExp?.position?.toLowerCase() || '';
  const allSkills = [...currentSkills].join(' ');

  let currentTitle = '현재 포지션';
  if (lastExp?.position) {
    currentTitle = lastExp.position;
  } else if (/react|프론트|frontend/.test(allSkills)) {
    currentTitle = '프론트엔드 개발자';
  } else if (/node|backend|백엔드|nest|spring/.test(allSkills)) {
    currentTitle = '백엔드 개발자';
  } else if (/python|data|데이터/.test(allSkills)) {
    currentTitle = '데이터 엔지니어';
  }

  const allPaths: {
    title: string;
    skills: string[];
    salaryRange: string;
    salaryMin: number;
    salaryMax: number;
    timeline: string;
    description: string;
    relevance: string[];
  }[] = [
    {
      title: '시니어 프론트엔드 개발자',
      skills: ['react', 'typescript', 'next.js', 'graphql', 'testing', 'performance optimization'],
      salaryRange: '7,000~10,000만원',
      salaryMin: 7000,
      salaryMax: 10000,
      timeline: '2~3년',
      description: '프론트엔드 아키텍처 설계, 코드 리뷰 주도, 주니어 멘토링',
      relevance: ['react', 'typescript', 'javascript', 'frontend', '프론트'],
    },
    {
      title: '풀스택 개발자',
      skills: ['react', 'node.js', 'typescript', 'postgresql', 'docker', 'aws'],
      salaryRange: '6,500~9,500만원',
      salaryMin: 6500,
      salaryMax: 9500,
      timeline: '1~2년',
      description: '프론트와 백엔드 모두 설계/구현 가능한 엔지니어',
      relevance: ['react', 'node', 'typescript', 'python', 'java'],
    },
    {
      title: '프론트엔드/개발 팀 리드',
      skills: ['react', 'typescript', 'architecture', 'code review', 'ci/cd', 'agile'],
      salaryRange: '8,500~13,000만원',
      salaryMin: 8500,
      salaryMax: 13000,
      timeline: '3~5년',
      description: '팀 리딩, 기술 의사결정, 프로젝트 관리 및 멘토링',
      relevance: ['react', 'typescript', 'java', 'python', 'lead', '리드'],
    },
    {
      title: 'DevOps / SRE 엔지니어',
      skills: ['docker', 'kubernetes', 'aws', 'terraform', 'ci/cd', 'monitoring'],
      salaryRange: '7,500~12,000만원',
      salaryMin: 7500,
      salaryMax: 12000,
      timeline: '2~3년',
      description: '인프라 자동화, 배포 파이프라인, 시스템 안정성 관리',
      relevance: ['docker', 'kubernetes', 'aws', 'linux', 'devops'],
    },
    {
      title: 'AI/ML 엔지니어',
      skills: ['python', 'tensorflow', 'pytorch', 'sql', 'docker', 'mlops'],
      salaryRange: '7,500~13,000만원',
      salaryMin: 7500,
      salaryMax: 13000,
      timeline: '2~4년',
      description: 'ML 모델 개발/배포, 데이터 파이프라인, 연구 및 프로덕션화',
      relevance: ['python', 'tensorflow', 'pytorch', 'ml', 'ai', '머신러닝', 'data'],
    },
    {
      title: '데이터 엔지니어',
      skills: ['python', 'sql', 'spark', 'airflow', 'aws', 'kafka'],
      salaryRange: '6,500~11,000만원',
      salaryMin: 6500,
      salaryMax: 11000,
      timeline: '1~3년',
      description: '대규모 데이터 파이프라인 설계, ETL 프로세스, 데이터 인프라',
      relevance: ['python', 'sql', 'data', '데이터', 'spark'],
    },
    {
      title: 'PM / PO (기술 기반)',
      skills: ['agile', 'jira', 'sql', 'analytics', 'ux', 'stakeholder management'],
      salaryRange: '6,500~11,000만원',
      salaryMin: 6500,
      salaryMax: 11000,
      timeline: '2~4년',
      description: '제품 전략 수립, 기술팀과 비즈니스팀 연결, 로드맵 관리',
      relevance: ['agile', 'jira', 'pm', 'product', 'analytics'],
    },
    {
      title: 'CTO / VP of Engineering',
      skills: ['architecture', 'team management', 'strategy', 'budgeting', 'hiring', 'agile'],
      salaryRange: '12,000~20,000만원',
      salaryMin: 12000,
      salaryMax: 20000,
      timeline: '5~8년',
      description: '기술 전략 총괄, 조직 관리, 기술 비전 및 문화 수립',
      relevance: ['architecture', 'lead', 'management', 'cto', 'strategy'],
    },
  ];

  const scoredPaths = allPaths
    .map((p) => {
      const matched = p.skills.filter((s) => currentSkills.has(s));
      const missing = p.skills.filter((s) => !currentSkills.has(s));
      // Base match from skills
      let matchScore = (matched.length / p.skills.length) * 100;
      // Bonus from relevance keywords
      const relevanceBonus = p.relevance.some(
        (r) => currentSkills.has(r) || positionLower.includes(r) || allSkills.includes(r),
      )
        ? 15
        : 0;
      matchScore = Math.min(100, matchScore + relevanceBonus);

      return {
        title: p.title,
        match: Math.round(matchScore),
        requiredSkills: p.skills,
        currentSkills: matched,
        missingSkills: missing,
        salaryRange: p.salaryRange,
        salaryMin: p.salaryMin,
        salaryMax: p.salaryMax,
        timeline: p.timeline,
        description: p.description,
      };
    })
    .filter((p) => p.match >= 15)
    .sort((a, b) => b.match - a.match)
    .slice(0, 4);

  return { title: currentTitle, paths: scoredPaths };
}

interface Props {
  resume: Resume;
}

export default function CareerPathSuggestion({ resume }: Props) {
  const [expanded, setExpanded] = useState(false);
  const [selectedPath, setSelectedPath] = useState<number | null>(null);
  const [savedPaths, setSavedPaths] = useState<Set<string>>(new Set());

  const { title: currentTitle, paths } = useMemo(() => analyzeCareerPaths(resume), [resume]);

  const handleSaveRoadmap = useCallback((pathTitle: string) => {
    setSavedPaths((prev) => {
      const next = new Set(prev);
      if (next.has(pathTitle)) {
        next.delete(pathTitle);
      } else {
        next.add(pathTitle);
      }
      return next;
    });
  }, []);

  if (paths.length === 0) return null;

  return (
    <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-4 no-print">
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center justify-between"
      >
        <h3 className="text-sm font-semibold text-slate-800 dark:text-slate-200">
          커리어 패스 로드맵
        </h3>
        <svg
          className={`w-4 h-4 text-slate-400 transition-transform ${expanded ? 'rotate-180' : ''}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {expanded && (
        <div className="mt-3 space-y-4 animate-fade-in">
          {/* Visual Roadmap */}
          <div className="bg-gradient-to-r from-slate-50 to-blue-50 dark:from-slate-900/50 dark:to-blue-900/20 rounded-lg p-3 border border-slate-200 dark:border-slate-700">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-3 h-3 bg-blue-500 rounded-full ring-2 ring-blue-200 dark:ring-blue-800" />
              <p className="text-xs font-bold text-slate-700 dark:text-slate-300">{currentTitle}</p>
              <span className="text-xs text-slate-400">({resume.experiences.length}년차)</span>
            </div>

            {/* Path arrows */}
            <div className="ml-1.5 border-l-2 border-dashed border-blue-300 dark:border-blue-700 pl-4 space-y-3">
              {paths.map((p, i) => {
                const isSelected = selectedPath === i;
                const isSaved = savedPaths.has(p.title);
                return (
                  <div key={p.title}>
                    <button
                      onClick={() => setSelectedPath(isSelected ? null : i)}
                      className={`w-full text-left p-2.5 rounded-lg transition-all border ${
                        isSelected
                          ? 'bg-white dark:bg-slate-800 border-blue-300 dark:border-blue-600 shadow-sm'
                          : 'bg-white/60 dark:bg-slate-800/60 border-slate-100 dark:border-slate-700 hover:bg-white dark:hover:bg-slate-800'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          {/* Arrow connector */}
                          <div className="relative -ml-[1.35rem]">
                            <div className="w-2.5 h-2.5 rounded-full border-2 border-blue-400 bg-white dark:bg-slate-800" />
                          </div>
                          <span className="text-sm font-medium text-slate-800 dark:text-slate-200">
                            {p.title}
                          </span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <span className="text-[10px] text-slate-400">{p.timeline}</span>
                          <span
                            className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                              p.match >= 70
                                ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400'
                                : p.match >= 40
                                  ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400'
                                  : 'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400'
                            }`}
                          >
                            {p.match}%
                          </span>
                        </div>
                      </div>
                      <div className="mt-1 bg-slate-200 dark:bg-slate-700 rounded-full h-1 ml-3">
                        <div
                          className={`h-1 rounded-full transition-all duration-500 ${
                            p.match >= 70
                              ? 'bg-green-500'
                              : p.match >= 40
                                ? 'bg-blue-500'
                                : 'bg-amber-500'
                          }`}
                          style={{ width: `${p.match}%` }}
                        />
                      </div>
                    </button>

                    {/* Expanded detail */}
                    {isSelected && (
                      <div className="mt-2 ml-3 space-y-2.5 animate-fade-in">
                        <p className="text-xs text-slate-500 dark:text-slate-400">
                          {p.description}
                        </p>

                        {/* Salary range */}
                        <div className="flex items-center gap-2 p-2 bg-emerald-50 dark:bg-emerald-900/20 rounded-lg border border-emerald-200 dark:border-emerald-800">
                          <svg
                            className="w-3.5 h-3.5 text-emerald-500 shrink-0"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                            />
                          </svg>
                          <span className="text-xs font-medium text-emerald-700 dark:text-emerald-400">
                            연봉 범위: {p.salaryRange}
                          </span>
                        </div>

                        {/* Timeline */}
                        <div className="flex items-center gap-2 p-2 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
                          <svg
                            className="w-3.5 h-3.5 text-blue-500 shrink-0"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                            />
                          </svg>
                          <span className="text-xs font-medium text-blue-700 dark:text-blue-400">
                            예상 소요 기간: {p.timeline}
                          </span>
                        </div>

                        {/* Skills list */}
                        <div>
                          <p className="text-[10px] font-semibold text-slate-500 dark:text-slate-400 mb-1 uppercase tracking-wider">
                            이 경로에 필요한 기술
                          </p>
                          <div className="flex flex-wrap gap-1">
                            {p.currentSkills.map((s) => (
                              <span
                                key={s}
                                className="px-1.5 py-0.5 text-[10px] bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400 rounded border border-green-200 dark:border-green-800 flex items-center gap-0.5"
                              >
                                <svg
                                  className="w-2.5 h-2.5"
                                  fill="none"
                                  stroke="currentColor"
                                  viewBox="0 0 24 24"
                                >
                                  <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={3}
                                    d="M5 13l4 4L19 7"
                                  />
                                </svg>
                                {s}
                              </span>
                            ))}
                            {p.missingSkills.map((s) => (
                              <span
                                key={s}
                                className="px-1.5 py-0.5 text-[10px] bg-red-50 dark:bg-red-900/20 text-red-500 dark:text-red-400 rounded border border-red-200 dark:border-red-800"
                              >
                                + {s}
                              </span>
                            ))}
                          </div>
                          <p className="text-[10px] text-slate-400 mt-1">
                            보유: {p.currentSkills.length}/{p.requiredSkills.length} ({p.match}%
                            매칭)
                          </p>
                        </div>

                        {/* Save roadmap button */}
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleSaveRoadmap(p.title);
                          }}
                          className={`w-full py-1.5 text-xs font-medium rounded-lg border transition-colors ${
                            isSaved
                              ? 'bg-emerald-50 dark:bg-emerald-900/20 border-emerald-300 dark:border-emerald-700 text-emerald-700 dark:text-emerald-400'
                              : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-600 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-700'
                          }`}
                        >
                          {isSaved ? '저장됨' : '커리어 로드맵 저장'}
                        </button>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          <p className="text-xs text-slate-400 dark:text-slate-500 text-center">
            현재 기술 스택 기반 AI 추천
          </p>
        </div>
      )}
    </div>
  );
}
