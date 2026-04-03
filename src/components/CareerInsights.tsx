import { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { API_URL } from '@/lib/config';
import { fetchResumes } from '@/lib/api';
import type { ResumeSummary } from '@/types/resume';

interface JobPost {
  id: string;
  company: string;
  position: string;
  skills: string;
  salary: string;
  type: string;
  createdAt: string;
}

interface SkillCount {
  name: string;
  count: number;
}

interface SalaryRange {
  type: string;
  label: string;
  avgSalary: string;
  count: number;
}

interface SkillRecommendation {
  skill: string;
  boost: number;
  reason: string;
}

const JOB_TYPE_LABELS: Record<string, string> = {
  fulltime: '정규직',
  contract: '계약직',
  parttime: '파트타임',
  intern: '인턴',
};

function parseSalaryNumber(salary: string): number | null {
  if (!salary) return null;
  const cleaned = salary.replace(/[^0-9]/g, '');
  if (!cleaned) return null;
  const num = parseInt(cleaned, 10);
  // Heuristic: if the number looks like 만원 format (e.g. 5000 = 5000만원)
  if (num > 0 && num < 100000) return num;
  return null;
}

export default function CareerInsights() {
  const [jobs, setJobs] = useState<JobPost[]>([]);
  const [resumes, setResumes] = useState<ResumeSummary[]>([]);
  const [collapsed, setCollapsed] = useState(false);
  const [activeTab, setActiveTab] = useState<'skills' | 'salary' | 'recommend'>('skills');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      fetch(`${API_URL}/api/jobs`).then(r => r.ok ? r.json() : []).catch(() => []),
      fetchResumes().catch(() => []),
    ]).then(([jobData, resumeData]) => {
      setJobs(jobData);
      setResumes(resumeData);
    }).finally(() => setLoading(false));
  }, []);

  // Compute top 10 skills from job postings
  const topSkills = useMemo((): SkillCount[] => {
    const counts: Record<string, number> = {};
    jobs.forEach(j => {
      if (!j.skills) return;
      j.skills.split(',').forEach(s => {
        const skill = s.trim().toLowerCase();
        if (skill) counts[skill] = (counts[skill] || 0) + 1;
      });
    });
    return Object.entries(counts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([name, count]) => ({ name, count }));
  }, [jobs]);

  // Compute salary trends by job type
  const salaryTrends = useMemo((): SalaryRange[] => {
    const byType: Record<string, number[]> = {};
    jobs.forEach(j => {
      if (!j.salary) return;
      const num = parseSalaryNumber(j.salary);
      if (num === null) return;
      const type = j.type || 'other';
      if (!byType[type]) byType[type] = [];
      byType[type].push(num);
    });
    return Object.entries(byType).map(([type, salaries]) => {
      const avg = Math.round(salaries.reduce((a, b) => a + b, 0) / salaries.length);
      return {
        type,
        label: JOB_TYPE_LABELS[type] || type,
        avgSalary: `${avg.toLocaleString()}만원`,
        count: salaries.length,
      };
    }).sort((a, b) => b.count - a.count);
  }, [jobs]);

  // User's current skills from resumes
  const userSkills = useMemo((): Set<string> => {
    const skills = new Set<string>();
    resumes.forEach(r => {
      r.skills?.forEach(sk => {
        sk.items.split(',').forEach(item => {
          const trimmed = item.trim().toLowerCase();
          if (trimmed) skills.add(trimmed);
        });
      });
    });
    return skills;
  }, [resumes]);

  // Personalized recommendations
  const recommendations = useMemo((): SkillRecommendation[] => {
    if (userSkills.size === 0 || topSkills.length === 0) return [];

    const maxCount = topSkills[0]?.count || 1;
    return topSkills
      .filter(sk => !userSkills.has(sk.name))
      .slice(0, 5)
      .map(sk => {
        const boost = Math.round((sk.count / maxCount) * 20) + 5;
        const jobsRequiring = jobs.filter(j =>
          j.skills?.toLowerCase().includes(sk.name)
        ).length;
        return {
          skill: sk.name,
          boost,
          reason: `${jobsRequiring}개 공고에서 요구`,
        };
      });
  }, [topSkills, userSkills, jobs]);

  if (loading) {
    return (
      <div className="mb-6 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-5 animate-pulse">
        <div className="h-5 bg-slate-200 dark:bg-slate-700 rounded w-1/3 mb-4" />
        <div className="space-y-2">
          <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-full" />
          <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-5/6" />
          <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-4/6" />
        </div>
      </div>
    );
  }

  if (jobs.length === 0) return null;

  const maxSkillCount = topSkills[0]?.count || 1;

  return (
    <div className="mb-6 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden animate-fade-in">
      {/* Header */}
      <button
        onClick={() => setCollapsed(!collapsed)}
        className="w-full flex items-center justify-between p-4 sm:p-5 hover:bg-slate-50 dark:hover:bg-slate-750 transition-colors"
      >
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-lg flex items-center justify-center">
            <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
            </svg>
          </div>
          <div className="text-left">
            <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">AI 커리어 인사이트</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">{jobs.length}개 공고 기반 분석</p>
          </div>
        </div>
        <svg
          className={`w-5 h-5 text-slate-400 transition-transform duration-200 ${collapsed ? '' : 'rotate-180'}`}
          fill="none" stroke="currentColor" viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {!collapsed && (
        <div className="px-4 sm:px-5 pb-4 sm:pb-5 border-t border-slate-100 dark:border-slate-700">
          {/* Tabs */}
          <div className="flex gap-1 mt-3 mb-4 bg-slate-100 dark:bg-slate-900 rounded-lg p-1">
            {([
              { id: 'skills' as const, label: '인기 기술 TOP 10' },
              { id: 'salary' as const, label: '급여 트렌드' },
              { id: 'recommend' as const, label: '맞춤 추천' },
            ]).map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex-1 py-1.5 text-xs font-medium rounded-md transition-colors ${
                  activeTab === tab.id
                    ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 shadow-sm'
                    : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Skills tab */}
          {activeTab === 'skills' && (
            <div className="space-y-2">
              {topSkills.map((sk, i) => {
                const isOwned = userSkills.has(sk.name);
                return (
                  <div key={sk.name} className="flex items-center gap-3">
                    <span className="w-5 text-xs text-slate-400 dark:text-slate-500 text-right font-medium">{i + 1}</span>
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-0.5">
                        <div className="flex items-center gap-1.5">
                          <span className="text-sm font-medium text-slate-700 dark:text-slate-300 capitalize">{sk.name}</span>
                          {isOwned && (
                            <span className="px-1.5 py-0.5 text-[10px] bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 rounded font-medium">
                              보유
                            </span>
                          )}
                        </div>
                        <span className="text-xs text-slate-400 dark:text-slate-500">{sk.count}개 공고</span>
                      </div>
                      <div className="w-full bg-slate-100 dark:bg-slate-700 rounded-full h-1.5">
                        <div
                          className={`h-1.5 rounded-full transition-all duration-500 ${isOwned ? 'bg-emerald-500' : 'bg-indigo-500'}`}
                          style={{ width: `${(sk.count / maxSkillCount) * 100}%` }}
                        />
                      </div>
                    </div>
                  </div>
                );
              })}
              {topSkills.length === 0 && (
                <p className="text-sm text-slate-400 dark:text-slate-500 text-center py-4">충분한 데이터가 없습니다</p>
              )}
            </div>
          )}

          {/* Salary tab */}
          {activeTab === 'salary' && (
            <div className="space-y-3">
              {salaryTrends.length > 0 ? (
                salaryTrends.map(st => (
                  <div key={st.type} className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-900 rounded-lg">
                    <div>
                      <span className="text-sm font-medium text-slate-700 dark:text-slate-300">{st.label}</span>
                      <span className="text-xs text-slate-400 dark:text-slate-500 ml-2">({st.count}개 공고)</span>
                    </div>
                    <span className="text-sm font-bold text-emerald-600 dark:text-emerald-400">{st.avgSalary}</span>
                  </div>
                ))
              ) : (
                <div className="text-center py-6">
                  <p className="text-sm text-slate-400 dark:text-slate-500">급여 정보가 포함된 공고가 없습니다</p>
                  <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">공고에 급여가 명시되면 트렌드가 표시됩니다</p>
                </div>
              )}
            </div>
          )}

          {/* Recommendations tab */}
          {activeTab === 'recommend' && (
            <div className="space-y-2">
              {recommendations.length > 0 ? (
                recommendations.map(rec => (
                  <div key={rec.skill} className="flex items-center justify-between p-3 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-lg border border-blue-100 dark:border-blue-800/50">
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 bg-blue-100 dark:bg-blue-900/50 rounded-full flex items-center justify-center">
                        <svg className="w-3 h-3 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                        </svg>
                      </div>
                      <div>
                        <span className="text-sm font-medium text-slate-700 dark:text-slate-300 capitalize">{rec.skill}</span>
                        <p className="text-xs text-slate-400 dark:text-slate-500">{rec.reason}</p>
                      </div>
                    </div>
                    <span className="px-2 py-1 text-xs font-bold text-blue-700 dark:text-blue-400 bg-blue-100 dark:bg-blue-900/50 rounded-lg whitespace-nowrap">
                      매칭률 +{rec.boost}%
                    </span>
                  </div>
                ))
              ) : userSkills.size === 0 ? (
                <div className="text-center py-6">
                  <p className="text-sm text-slate-500 dark:text-slate-400">이력서에 기술 스택을 추가하면</p>
                  <p className="text-sm text-slate-500 dark:text-slate-400">맞춤 추천을 받을 수 있습니다</p>
                  <Link to="/resumes/new" className="inline-block mt-3 px-4 py-2 bg-blue-600 text-white text-xs font-medium rounded-lg hover:bg-blue-700 transition-colors">
                    이력서 작성하기
                  </Link>
                </div>
              ) : (
                <div className="text-center py-6">
                  <div className="w-12 h-12 bg-emerald-100 dark:bg-emerald-900/30 rounded-full flex items-center justify-center mx-auto mb-2">
                    <svg className="w-6 h-6 text-emerald-600 dark:text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  <p className="text-sm font-medium text-emerald-700 dark:text-emerald-400">인기 기술을 모두 보유하고 있습니다!</p>
                  <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">현재 시장에서 경쟁력 있는 프로필입니다</p>
                </div>
              )}
            </div>
          )}

          {/* Footer link */}
          <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-700 flex justify-between items-center">
            <span className="text-[10px] text-slate-400 dark:text-slate-500">
              {jobs.length}개 채용 공고 데이터 기반
            </span>
            <Link to="/jobs" className="text-xs text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 font-medium">
              채용 공고 보기 &rarr;
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
