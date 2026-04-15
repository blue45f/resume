import { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { API_URL } from '@/lib/config';
import { fetchResumes } from '@/lib/api';
import { getUser } from '@/lib/auth';
import type { ResumeSummary } from '@/types/resume';
import {
  ResponsiveContainer,
  RadialBarChart,
  RadialBar,
  BarChart,
  Bar,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  Cell,
} from 'recharts';

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

interface SkillTrend {
  name: string;
  count: number;
  trend: 'up' | 'down' | 'stable';
  owned: boolean;
}

interface MarketValueScore {
  total: number;
  breakdown: { label: string; score: number; max: number }[];
}

interface LearningRec {
  title: string;
  type: 'course' | 'cert' | 'project';
  skill: string;
  reason: string;
  impact: string;
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
  if (num > 0 && num < 100000) return num;
  return null;
}

interface NewsItem {
  id: string;
  title: string;
  url: string;
  source: string;
  pubDate: string;
}

export default function CareerInsights() {
  const user = getUser();
  const [jobs, setJobs] = useState<JobPost[]>([]);
  const [news, setNews] = useState<NewsItem[]>([]);
  const [resumes, setResumes] = useState<ResumeSummary[]>([]);
  const [collapsed, setCollapsed] = useState(false);
  const [activeTab, setActiveTab] = useState<'market' | 'skills' | 'learning' | 'news'>('market');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      fetch(`${API_URL}/api/jobs`).then(r => r.ok ? r.json() : []).catch(() => []),
      fetchResumes().catch(() => []),
      // 한국 취업/채용 뉴스 (Google News RSS)
      fetch('https://news.google.com/rss/search?q=%EC%B1%84%EC%9A%A9+%EC%B7%A8%EC%97%85+%EC%9D%B4%EB%A0%A5%EC%84%9C&hl=ko&gl=KR&ceid=KR:ko')
        .then(r => r.text())
        .then(xml => {
          const parser = new DOMParser();
          const doc = parser.parseFromString(xml, 'text/xml');
          const items = doc.querySelectorAll('item');
          const parsed: NewsItem[] = [];
          items.forEach((item, i) => {
            if (i >= 6) return;
            const title = item.querySelector('title')?.textContent || '';
            const link = item.querySelector('link')?.textContent || '';
            const source = item.querySelector('source')?.textContent || '';
            const pubDate = item.querySelector('pubDate')?.textContent || '';
            parsed.push({ id: String(i), title, url: link, source, pubDate });
          });
          return parsed;
        })
        .catch(() => []),
    ]).then(([jobData, resumeData, newsData]) => {
      setJobs(jobData);
      setResumes(resumeData);
      setNews(newsData.filter((n: any) => n?.title));
    }).finally(() => setLoading(false));
  }, []);

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

  // Top skills with trend indicators
  const skillTrends = useMemo((): SkillTrend[] => {
    const counts: Record<string, number> = {};
    jobs.forEach(j => {
      if (!j.skills) return;
      j.skills.split(',').forEach(s => {
        const skill = s.trim().toLowerCase();
        if (skill) counts[skill] = (counts[skill] || 0) + 1;
      });
    });

    // 최근 공고(7일 이내) vs 이전 공고 비교로 실제 트렌드 계산
    const now = Date.now();
    const oneWeek = 7 * 24 * 60 * 60 * 1000;
    const recentCounts: Record<string, number> = {};
    const olderCounts: Record<string, number> = {};
    jobs.forEach(j => {
      if (!j.skills) return;
      const isRecent = (now - new Date(j.createdAt).getTime()) < oneWeek;
      j.skills.split(',').forEach(s => {
        const skill = s.trim().toLowerCase();
        if (!skill) return;
        if (isRecent) recentCounts[skill] = (recentCounts[skill] || 0) + 1;
        else olderCounts[skill] = (olderCounts[skill] || 0) + 1;
      });
    });

    const sorted = Object.entries(counts).sort((a, b) => b[1] - a[1]).slice(0, 12);

    return sorted.map(([name, count]) => {
      const recent = recentCounts[name] || 0;
      const older = olderCounts[name] || 0;
      let trend: 'up' | 'down' | 'stable' = 'stable';
      if (recent > older * 1.2) trend = 'up';
      else if (recent < older * 0.8 && older > 0) trend = 'down';

      return { name, count, trend, owned: userSkills.has(name) };
    });
  }, [jobs, userSkills]);

  // Market value score
  const marketValue = useMemo((): MarketValueScore => {
    const skillScore = Math.min(30, userSkills.size * 3);
    const expScore = Math.min(25, resumes.length * 5);

    // Education score
    let eduScore = 0;
    resumes.forEach(r => {
      // Use personalInfo as a proxy (in full version, check educations)
      if (r.personalInfo?.name) eduScore = Math.min(20, eduScore + 10);
    });
    eduScore = Math.min(20, Math.max(eduScore, 5));

    // Demand match score
    const demandedSkills = skillTrends.filter(st => st.trend === 'up').map(st => st.name);
    const matchCount = demandedSkills.filter(sk => userSkills.has(sk)).length;
    const demandScore = Math.min(25, matchCount * 8);

    const total = skillScore + expScore + eduScore + demandScore;

    return {
      total: Math.min(100, total),
      breakdown: [
        { label: '기술 스택', score: skillScore, max: 30 },
        { label: '경력', score: expScore, max: 25 },
        { label: '학력/자격', score: eduScore, max: 20 },
        { label: '시장 수요 매칭', score: demandScore, max: 25 },
      ],
    };
  }, [userSkills, resumes, skillTrends]);

  // Learning recommendations
  const learningRecs = useMemo((): LearningRec[] => {
    const recs: LearningRec[] = [];
    const trendingNotOwned = skillTrends.filter(st => st.trend === 'up' && !st.owned);

    // 채용 시장 데이터 기반 동적 추천 (하드코딩 없음)
    trendingNotOwned.forEach(st => {
      const type = st.count >= 5 ? 'cert' as const : st.count >= 3 ? 'course' as const : 'project' as const;
      recs.push({
        title: `${st.name} ${type === 'cert' ? '자격증' : type === 'course' ? '학습 과정' : '실습 프로젝트'}`,
        type,
        skill: st.name,
        reason: `${st.count}개 채용 공고에서 요구`,
        impact: st.trend === 'up' ? '수요 상승 중' : '안정적 수요',
      });
    });

    return recs.slice(0, 5);
  }, [skillTrends]);

  // Salary by type
  const salaryTrends = useMemo(() => {
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
      return { type, label: JOB_TYPE_LABELS[type] || type, avgSalary: `${avg.toLocaleString()}만원`, count: salaries.length };
    }).sort((a, b) => b.count - a.count);
  }, [jobs]);

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

  if (!user || jobs.length === 0) return null;

  const trendIcon = (trend: 'up' | 'down' | 'stable') => {
    if (trend === 'up') return <span className="text-green-500 text-[10px] font-bold">▲</span>;
    if (trend === 'down') return <span className="text-red-500 text-[10px] font-bold">▼</span>;
    return <span className="text-slate-400 text-[10px] font-bold">━</span>;
  };

  const typeIcon = (type: 'course' | 'cert' | 'project') => {
    if (type === 'cert') return '🏅';
    if (type === 'project') return '🔨';
    return '📚';
  };

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
            <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">AI 커리어 인사이트 대시보드</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">{jobs.length}개 공고 기반 | 시장 가치: {marketValue.total}점</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {/* Quick market value badge */}
          <div className={`px-2 py-0.5 text-xs font-bold rounded-full ${
            marketValue.total >= 70 ? 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400' :
            marketValue.total >= 40 ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400' :
            'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400'
          }`}>
            {marketValue.total}점
          </div>
          <svg
            className={`w-5 h-5 text-slate-400 transition-transform duration-200 ${collapsed ? '' : 'rotate-180'}`}
            fill="none" stroke="currentColor" viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </div>
      </button>

      {!collapsed && (
        <div className="px-4 sm:px-5 pb-4 sm:pb-5 border-t border-slate-100 dark:border-slate-700">
          {/* Tabs */}
          <div className="flex gap-1 mt-3 mb-4 bg-slate-100 dark:bg-slate-900 rounded-lg p-1">
            {([
              { id: 'market' as const, label: '내 시장 가치' },
              { id: 'skills' as const, label: '수요 높은 기술' },
              { id: 'learning' as const, label: '추천 학습' },
              { id: 'news' as const, label: '업계 뉴스' },
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

          {/* Market Value Tab */}
          {activeTab === 'market' && (
            <div className="space-y-4">
              {/* RadialBarChart 스코어 */}
              <div className="flex items-center justify-center gap-4">
                <div className="relative">
                  <ResponsiveContainer width={140} height={140}>
                    <RadialBarChart
                      cx="50%"
                      cy="50%"
                      innerRadius={42}
                      outerRadius={62}
                      startAngle={90}
                      endAngle={-270}
                      data={[{ value: marketValue.total, fill: marketValue.total >= 70 ? '#10b981' : marketValue.total >= 40 ? '#3b82f6' : '#f59e0b' }]}
                    >
                      <RadialBar dataKey="value" background={{ fill: '#e2e8f0' }} cornerRadius={6} />
                    </RadialBarChart>
                  </ResponsiveContainer>
                  <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                    <span className="text-2xl font-bold text-slate-800 dark:text-slate-200">{marketValue.total}</span>
                    <span className="text-[10px] text-slate-400">/ 100</span>
                  </div>
                </div>
              </div>

              {/* 항목별 BarChart */}
              <div>
                <ResponsiveContainer width="100%" height={100}>
                  <BarChart
                    data={marketValue.breakdown.map(b => ({ name: b.label, 점수: b.score, 최대: b.max }))}
                    margin={{ top: 0, right: 5, left: -20, bottom: 0 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
                    <XAxis dataKey="name" tick={{ fontSize: 9, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fontSize: 9, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                    <Tooltip
                      contentStyle={{ borderRadius: 8, border: 'none', boxShadow: '0 4px 20px rgba(0,0,0,0.1)', fontSize: 11 }}
                      formatter={(v: number, name: string) => [`${v}점`, name]}
                    />
                    <Bar dataKey="점수" radius={[3, 3, 0, 0]}>
                      {marketValue.breakdown.map((b, i) => (
                        <Cell
                          key={`cell-${i}`}
                          fill={(b.score / b.max) >= 0.7 ? '#10b981' : (b.score / b.max) >= 0.4 ? '#3b82f6' : '#f59e0b'}
                        />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>

              {/* Summary message */}
              <div className={`p-2.5 rounded-lg text-center text-xs font-medium ${
                marketValue.total >= 70
                  ? 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800'
                  : marketValue.total >= 40
                  ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400 border border-blue-200 dark:border-blue-800'
                  : 'bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-800'
              }`}>
                {marketValue.total >= 70
                  ? '시장에서 높은 경쟁력을 갖추고 있습니다!'
                  : marketValue.total >= 40
                  ? '좋은 프로필입니다. 트렌딩 기술을 추가하면 더 강해집니다.'
                  : '기술 스택과 경험을 보강하면 시장 가치가 크게 올라갑니다.'}
              </div>

              {/* Salary overview */}
              {salaryTrends.length > 0 && (
                <div className="border-t border-slate-100 dark:border-slate-700 pt-3">
                  <p className="text-xs font-semibold text-slate-600 dark:text-slate-400 mb-2">급여 트렌드</p>
                  {salaryTrends.map(st => (
                    <div key={st.type} className="flex items-center justify-between py-1.5">
                      <div>
                        <span className="text-xs font-medium text-slate-700 dark:text-slate-300">{st.label}</span>
                        <span className="text-[10px] text-slate-400 ml-1.5">({st.count}개 공고)</span>
                      </div>
                      <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400">{st.avgSalary}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Skills Demand Tab */}
          {activeTab === 'skills' && (
            <div className="space-y-2">
              {skillTrends.length > 0 ? skillTrends.map((sk, i) => {
                const maxCount = skillTrends[0]?.count || 1;
                return (
                  <div key={sk.name} className="flex items-center gap-2.5">
                    <span className="w-4 text-[10px] text-slate-400 text-right font-medium">{i + 1}</span>
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-0.5">
                        <div className="flex items-center gap-1.5">
                          <span className="text-sm font-medium text-slate-700 dark:text-slate-300 capitalize">{sk.name}</span>
                          {trendIcon(sk.trend)}
                          {sk.owned && (
                            <span className="px-1 py-0.5 text-[9px] bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 rounded font-medium">
                              보유
                            </span>
                          )}
                        </div>
                        <span className="text-[10px] text-slate-400">{sk.count}개 공고</span>
                      </div>
                      <div className="w-full bg-slate-100 dark:bg-slate-700 rounded-full h-1.5">
                        <div
                          className={`h-1.5 rounded-full transition-all duration-500 ${
                            sk.owned ? 'bg-emerald-500' : sk.trend === 'up' ? 'bg-indigo-500' : 'bg-slate-400'
                          }`}
                          style={{ width: `${(sk.count / maxCount) * 100}%` }}
                        />
                      </div>
                    </div>
                  </div>
                );
              }) : (
                <p className="text-sm text-slate-400 dark:text-slate-500 text-center py-4">충분한 데이터가 없습니다</p>
              )}

              {/* Owned skill count summary */}
              {skillTrends.length > 0 && (
                <div className="mt-2 p-2 bg-slate-50 dark:bg-slate-900/50 rounded-lg text-center">
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    상위 {skillTrends.length}개 기술 중 <span className="font-bold text-emerald-600 dark:text-emerald-400">{skillTrends.filter(s => s.owned).length}개</span> 보유
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Learning Recommendations Tab */}
          {activeTab === 'learning' && (
            <div className="space-y-2">
              {learningRecs.length > 0 ? learningRecs.map(rec => (
                <div key={rec.skill} className="p-3 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-lg border border-blue-100 dark:border-blue-800/50">
                  <div className="flex items-start gap-2.5">
                    <span className="text-lg shrink-0">{typeIcon(rec.type)}</span>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <p className="text-xs font-semibold text-slate-700 dark:text-slate-300">{rec.title}</p>
                        <span className={`px-1.5 py-0.5 text-[9px] rounded font-medium shrink-0 ml-2 ${
                          rec.type === 'cert' ? 'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400' :
                          rec.type === 'project' ? 'bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-400' :
                          'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400'
                        }`}>
                          {rec.type === 'cert' ? '자격증' : rec.type === 'project' ? '프로젝트' : '강의'}
                        </span>
                      </div>
                      <p className="text-[10px] text-slate-400 dark:text-slate-500 mt-0.5">
                        <span className="capitalize font-medium">{rec.skill}</span> | {rec.reason} | {rec.impact}
                      </p>
                    </div>
                  </div>
                </div>
              )) : userSkills.size === 0 ? (
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
                  <p className="text-sm font-medium text-emerald-700 dark:text-emerald-400">트렌딩 기술을 모두 보유하고 있습니다!</p>
                </div>
              )}
            </div>
          )}

          {/* Industry News Tab (placeholder) */}
          {activeTab === 'news' && (
            <div className="space-y-3">
              {news.length > 0 ? (
                <>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mb-2">채용/취업 뉴스</p>
                  {news.map((item) => (
                    <a
                      key={item.id}
                      href={item.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="block p-3 bg-slate-50 dark:bg-slate-900/50 rounded-lg border border-slate-100 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-900 transition-colors"
                    >
                      <div className="flex items-center gap-2 mb-1">
                        <span className="px-1.5 py-0.5 text-[9px] font-medium bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 rounded">뉴스</span>
                        {item.source && <span className="text-[10px] text-slate-400">{item.source}</span>}
                        {item.pubDate && <span className="text-[10px] text-slate-400 ml-auto">{new Date(item.pubDate).toLocaleDateString('ko-KR')}</span>}
                      </div>
                      <p className="text-xs font-semibold text-slate-700 dark:text-slate-300 line-clamp-2">{item.title.replace(/ - [^-]+$/, '')}</p>
                    </a>
                  ))}
                  <p className="text-[10px] text-slate-400 text-center">Google News 기반 실시간 뉴스</p>
                </>
              ) : (
                <div className="text-center py-8 text-slate-400 dark:text-slate-500">
                  <p className="text-sm">뉴스를 불러오는 중...</p>
                </div>
              )}
            </div>
          )}

          {/* Footer */}
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
