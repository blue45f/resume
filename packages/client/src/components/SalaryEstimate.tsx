import { useState, useMemo } from 'react';
import type { Resume } from '@/types/resume';

interface Props {
  resume: Resume;
}

type JobCategory = 'IT' | '금융' | '제조' | '서비스';
type CompanySize = '스타트업' | '중소기업' | '중견기업' | '대기업';
type Region = '서울' | '경기' | '부산' | '대전' | '기타';

interface SalaryResult {
  mine: number;
  marketAvg: number;
  top25: number;
  percentile: number;
}

interface GrowthProjection {
  year: number;
  salary: number;
}

interface NegotiationTip {
  title: string;
  description: string;
  icon: string;
}

const INDUSTRY_BASE: Record<JobCategory, number> = {
  IT: 4800,
  금융: 5200,
  제조: 4200,
  서비스: 3800,
};

const COMPANY_SIZE_MULT: Record<CompanySize, number> = {
  스타트업: 0.9,
  중소기업: 0.95,
  중견기업: 1.05,
  대기업: 1.2,
};

const REGION_MULT: Record<Region, number> = {
  서울: 1.15,
  경기: 1.05,
  부산: 0.92,
  대전: 0.9,
  기타: 0.85,
};

const SKILL_PREMIUM: Record<string, number> = {
  react: 200,
  typescript: 200,
  python: 250,
  java: 180,
  'node.js': 180,
  kubernetes: 300,
  docker: 150,
  aws: 250,
  terraform: 280,
  graphql: 150,
  tensorflow: 350,
  pytorch: 350,
  'machine learning': 400,
  rust: 300,
  go: 250,
  'next.js': 180,
  postgresql: 120,
  redis: 130,
  elasticsearch: 200,
};

function detectJobCategory(resume: Resume): JobCategory {
  const skills = resume.skills.map((s) => s.items.toLowerCase()).join(' ');
  if (/react|node|python|java|typescript|개발|프론트|백엔드|devops|docker/.test(skills))
    return 'IT';
  if (/금융|회계|재무|finance|투자/.test(skills)) return '금융';
  if (/제조|생산|품질|공장|기계/.test(skills)) return '제조';
  return '서비스';
}

function computeSalary(
  resume: Resume,
  jobCategory: JobCategory,
  experienceYears: number,
  region: Region,
  companySize: CompanySize,
): SalaryResult {
  const currentSkills = resume.skills.flatMap((s) =>
    s.items.split(',').map((i) => i.trim().toLowerCase()),
  );
  const hasDegree = resume.educations.some(
    (e) => e.degree.includes('석사') || e.degree.includes('박사'),
  );
  const certCount = resume.certifications.length;

  let base = INDUSTRY_BASE[jobCategory];
  base += experienceYears * 400;
  base *= COMPANY_SIZE_MULT[companySize];
  base *= REGION_MULT[region];

  // Skill premium
  let skillBonus = 0;
  currentSkills.forEach((sk) => {
    const premium = SKILL_PREMIUM[sk];
    if (premium) skillBonus += premium;
  });
  base += Math.min(skillBonus, 2000);

  if (hasDegree) base += 500;
  base += certCount * 80;

  base = Math.max(2800, Math.min(base, 18000));

  const mine = Math.round(base / 100) * 100;
  const marketAvg = Math.round((INDUSTRY_BASE[jobCategory] + experienceYears * 350) / 100) * 100;
  const top25 = Math.round((mine * 1.25) / 100) * 100;
  const percentile = Math.min(
    95,
    Math.max(15, 30 + experienceYears * 8 + Math.min(currentSkills.length * 3, 20)),
  );

  return { mine, marketAvg, top25, percentile };
}

function projectGrowth(currentSalary: number, experienceYears: number): GrowthProjection[] {
  const projections: GrowthProjection[] = [];
  let salary = currentSalary;
  for (let i = 0; i <= 5; i++) {
    projections.push({ year: i, salary: Math.round(salary / 100) * 100 });
    // Diminishing growth rate
    const growthRate = Math.max(0.03, 0.12 - (experienceYears + i) * 0.008);
    salary *= 1 + growthRate;
  }
  return projections;
}

function getNegotiationTips(resume: Resume, salary: SalaryResult): NegotiationTip[] {
  const tips: NegotiationTip[] = [];
  const skillCount = resume.skills.reduce((sum, s) => sum + s.items.split(',').length, 0);

  if (salary.mine > salary.marketAvg) {
    tips.push({
      title: '시장 평균 대비 강점 어필',
      description: `현재 프로필은 시장 평균 대비 ${Math.round(((salary.mine - salary.marketAvg) / salary.marketAvg) * 100)}% 높은 가치를 가집니다. 면접 시 보유 기술과 경력을 구체적 수치로 제시하세요.`,
      icon: '📊',
    });
  } else {
    tips.push({
      title: '기술 스택 보강으로 가치 상승',
      description:
        '시장 수요가 높은 기술(클라우드, AI/ML)을 추가 학습하면 연봉 협상에서 유리합니다.',
      icon: '📈',
    });
  }

  if (skillCount >= 8) {
    tips.push({
      title: '다양한 기술 활용',
      description: `${skillCount}개의 기술을 보유하고 있습니다. 풀스택 역량이나 T자형 인재임을 강조하세요.`,
      icon: '🛠',
    });
  }

  tips.push({
    title: '타이밍을 활용하세요',
    description:
      '상반기(3-4월)와 하반기(9-10월) 채용 시즌에 이직하면 더 나은 조건을 받을 수 있습니다.',
    icon: '🕐',
  });

  if (resume.certifications.length > 0) {
    tips.push({
      title: '자격증 활용',
      description: `${resume.certifications.length}개의 자격증을 보유 중입니다. 업무 관련 자격증은 연봉 협상에서 5-10% 프리미엄을 기대할 수 있습니다.`,
      icon: '🏅',
    });
  }

  tips.push({
    title: '데이터 기반 협상',
    description:
      '면접 전 해당 포지션의 연봉 범위를 조사하고, 본인 예상치의 10-15% 위에서 협상을 시작하세요.',
    icon: '💡',
  });

  return tips.slice(0, 4);
}

function BarCompare({
  items,
  maxVal,
}: {
  items: { label: string; value: number; color: string }[];
  maxVal: number;
}) {
  return (
    <div className="space-y-2">
      {items.map((item) => {
        const pct = Math.max(8, (item.value / maxVal) * 100);
        return (
          <div key={item.label} className="flex items-center gap-2">
            <span className="text-xs text-slate-500 dark:text-slate-400 w-20 shrink-0 text-right">
              {item.label}
            </span>
            <div className="flex-1 h-6 bg-slate-100 dark:bg-slate-700 rounded overflow-hidden">
              <div
                className={`h-full rounded transition-all duration-700 ${item.color}`}
                style={{ width: `${pct}%` }}
              />
            </div>
            <span className="text-xs font-bold text-slate-700 dark:text-slate-300 w-16 text-right">
              {item.value.toLocaleString()}만
            </span>
          </div>
        );
      })}
    </div>
  );
}

function GrowthChart({ projections }: { projections: GrowthProjection[] }) {
  const maxSalary = Math.max(...projections.map((p) => p.salary));
  const minSalary = Math.min(...projections.map((p) => p.salary));
  const range = maxSalary - minSalary || 1;
  const chartHeight = 120;

  const points = projections.map((p, i) => {
    const x = (i / (projections.length - 1)) * 100;
    const y = chartHeight - ((p.salary - minSalary) / range) * (chartHeight - 20) - 10;
    return { x, y, ...p };
  });

  const pathD = points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ');
  const areaD =
    pathD + ` L ${points[points.length - 1].x} ${chartHeight} L ${points[0].x} ${chartHeight} Z`;

  return (
    <div className="bg-slate-50 dark:bg-slate-900/50 rounded-lg p-3">
      <p className="text-xs font-semibold text-slate-600 dark:text-slate-400 mb-2">
        5년 연봉 성장 예측
      </p>
      <svg
        viewBox={`0 0 100 ${chartHeight}`}
        className="w-full"
        preserveAspectRatio="none"
        style={{ height: '120px' }}
      >
        <defs>
          <linearGradient id="growthGrad" x1="0" x2="0" y1="0" y2="1">
            <stop offset="0%" stopColor="#10b981" stopOpacity="0.3" />
            <stop offset="100%" stopColor="#10b981" stopOpacity="0.02" />
          </linearGradient>
        </defs>
        {/* Grid lines */}
        {[0.25, 0.5, 0.75].map((frac) => (
          <line
            key={frac}
            x1="0"
            x2="100"
            y1={chartHeight - frac * (chartHeight - 20) - 10}
            y2={chartHeight - frac * (chartHeight - 20) - 10}
            stroke="currentColor"
            className="text-slate-200 dark:text-slate-700"
            strokeWidth="0.3"
          />
        ))}
        <path d={areaD} fill="url(#growthGrad)" />
        <path
          d={pathD}
          fill="none"
          stroke="#10b981"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        {points.map((p, i) => (
          <circle key={i} cx={p.x} cy={p.y} r="2" fill="#10b981" stroke="white" strokeWidth="0.8" />
        ))}
      </svg>
      <div className="flex justify-between mt-1">
        {projections.map((p, i) => (
          <div key={i} className="text-center">
            <p className="text-[9px] text-slate-400">{i === 0 ? '현재' : `+${p.year}년`}</p>
            <p className="text-[10px] font-semibold text-slate-600 dark:text-slate-300">
              {p.salary.toLocaleString()}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function SalaryEstimate({ resume }: Props) {
  const detectedCategory = detectJobCategory(resume);
  const expYears = resume.experiences.length;

  const [expanded, setExpanded] = useState(false);
  const [activeTab, setActiveTab] = useState<'calculator' | 'compare' | 'tips' | 'projection'>(
    'calculator',
  );
  const [jobCategory, setJobCategory] = useState<JobCategory>(detectedCategory);
  const [experienceYears, setExperienceYears] = useState(expYears);
  const [region, setRegion] = useState<Region>('서울');
  const [companySize, setCompanySize] = useState<CompanySize>('중견기업');

  const salary = useMemo(
    () => computeSalary(resume, jobCategory, experienceYears, region, companySize),
    [resume, jobCategory, experienceYears, region, companySize],
  );

  const projections = useMemo(
    () => projectGrowth(salary.mine, experienceYears),
    [salary.mine, experienceYears],
  );

  const tips = useMemo(() => getNegotiationTips(resume, salary), [resume, salary]);

  // Industry comparison
  const industryComparison = useMemo(() => {
    return (['IT', '금융', '제조', '서비스'] as JobCategory[]).map((cat) => ({
      label: cat,
      value: Math.round((INDUSTRY_BASE[cat] + experienceYears * 350) / 100) * 100,
      color: cat === jobCategory ? 'bg-emerald-500' : 'bg-gradient-to-r from-blue-300 to-blue-400',
    }));
  }, [experienceYears, jobCategory]);

  const tabs = [
    { key: 'calculator' as const, label: '연봉 계산기' },
    { key: 'compare' as const, label: '비교 분석' },
    { key: 'projection' as const, label: '성장 예측' },
    { key: 'tips' as const, label: '협상 팁' },
  ];

  return (
    <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-4 no-print">
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center justify-between"
      >
        <h3 className="text-sm font-semibold text-slate-800 dark:text-slate-200">
          예상 연봉 & 급여 인텔리전스
        </h3>
        <div className="flex items-center gap-2">
          <span className="text-sm font-bold text-green-600">
            {salary.mine.toLocaleString()}만원
          </span>
          <svg
            className={`w-4 h-4 text-slate-400 transition-transform ${expanded ? 'rotate-180' : ''}`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </div>
      </button>

      {expanded && (
        <div className="mt-3 space-y-4 animate-fade-in">
          {/* Tab navigation */}
          <div className="flex gap-1 bg-slate-100 dark:bg-slate-700 rounded-lg p-0.5">
            {tabs.map((tab) => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`flex-1 py-1.5 text-xs font-medium rounded-md transition-colors ${
                  activeTab === tab.key
                    ? 'bg-white dark:bg-slate-600 text-slate-900 dark:text-slate-100 shadow-sm'
                    : 'text-slate-500 dark:text-slate-400 hover:text-slate-700'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Calculator Tab */}
          {activeTab === 'calculator' && (
            <div className="space-y-3">
              {/* Input controls */}
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-[10px] font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                    직종
                  </label>
                  <select
                    value={jobCategory}
                    onChange={(e) => setJobCategory(e.target.value as JobCategory)}
                    className="w-full mt-0.5 text-xs border border-slate-200 dark:border-slate-600 rounded-md px-2 py-1.5 bg-white dark:bg-slate-700 text-slate-800 dark:text-slate-200"
                  >
                    {(['IT', '금융', '제조', '서비스'] as JobCategory[]).map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-[10px] font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                    경력년수
                  </label>
                  <input
                    type="range"
                    min={0}
                    max={20}
                    value={experienceYears}
                    onChange={(e) => setExperienceYears(Number(e.target.value))}
                    className="w-full mt-2 accent-emerald-500"
                  />
                  <p className="text-[10px] text-slate-400 text-center">{experienceYears}년</p>
                </div>
                <div>
                  <label className="text-[10px] font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                    지역
                  </label>
                  <select
                    value={region}
                    onChange={(e) => setRegion(e.target.value as Region)}
                    className="w-full mt-0.5 text-xs border border-slate-200 dark:border-slate-600 rounded-md px-2 py-1.5 bg-white dark:bg-slate-700 text-slate-800 dark:text-slate-200"
                  >
                    {(['서울', '경기', '부산', '대전', '기타'] as Region[]).map((r) => (
                      <option key={r} value={r}>
                        {r}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-[10px] font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                    기업규모
                  </label>
                  <select
                    value={companySize}
                    onChange={(e) => setCompanySize(e.target.value as CompanySize)}
                    className="w-full mt-0.5 text-xs border border-slate-200 dark:border-slate-600 rounded-md px-2 py-1.5 bg-white dark:bg-slate-700 text-slate-800 dark:text-slate-200"
                  >
                    {(['스타트업', '중소기업', '중견기업', '대기업'] as CompanySize[]).map((s) => (
                      <option key={s} value={s}>
                        {s}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Skill premium preview */}
              {(() => {
                const currentSkills = resume.skills.flatMap((s) =>
                  s.items.split(',').map((i) => i.trim().toLowerCase()),
                );
                const premiumSkills = currentSkills
                  .filter((sk) => SKILL_PREMIUM[sk])
                  .map((sk) => ({ name: sk, premium: SKILL_PREMIUM[sk] }))
                  .sort((a, b) => b.premium - a.premium)
                  .slice(0, 5);
                if (premiumSkills.length === 0) return null;
                return (
                  <div className="bg-emerald-50 dark:bg-emerald-900/20 rounded-lg p-2.5 border border-emerald-200 dark:border-emerald-800">
                    <p className="text-[10px] font-semibold text-emerald-700 dark:text-emerald-400 mb-1">
                      기술 프리미엄 반영
                    </p>
                    <div className="flex flex-wrap gap-1">
                      {premiumSkills.map((sk) => (
                        <span
                          key={sk.name}
                          className="px-1.5 py-0.5 text-[10px] bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-400 rounded"
                        >
                          {sk.name} +{sk.premium}만
                        </span>
                      ))}
                    </div>
                  </div>
                );
              })()}

              {/* Result summary */}
              <div className="bg-gradient-to-br from-emerald-50 to-green-50 dark:from-emerald-900/20 dark:to-green-900/20 rounded-lg p-3 border border-emerald-200 dark:border-emerald-800">
                <div className="text-center">
                  <p className="text-xs text-slate-500 dark:text-slate-400">나의 예상 연봉</p>
                  <p className="text-2xl font-bold text-emerald-600 dark:text-emerald-400 mt-0.5">
                    {salary.mine.toLocaleString()}만원
                  </p>
                  <p className="text-xs text-slate-400 mt-0.5">
                    상위 {100 - salary.percentile}% 수준 | {jobCategory} / {region} / {companySize}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Compare Tab */}
          {activeTab === 'compare' && (
            <div className="space-y-4">
              {/* My vs Market vs Top25 */}
              <div className="bg-slate-50 dark:bg-slate-900/50 rounded-lg p-3">
                <p className="text-xs font-semibold text-slate-600 dark:text-slate-400 mb-3">
                  나의 연봉 위치
                </p>
                <BarCompare
                  maxVal={Math.max(salary.mine, salary.marketAvg, salary.top25)}
                  items={[
                    {
                      label: '나의 예상',
                      value: salary.mine,
                      color: 'bg-emerald-500',
                    },
                    {
                      label: '시장 평균',
                      value: salary.marketAvg,
                      color: 'bg-gradient-to-r from-blue-400 to-blue-500',
                    },
                    {
                      label: '상위 25%',
                      value: salary.top25,
                      color: 'bg-sky-500',
                    },
                  ]}
                />
                <div className="mt-2 text-center">
                  {salary.mine >= salary.marketAvg ? (
                    <p className="text-xs text-emerald-600 dark:text-emerald-400 font-medium">
                      시장 평균 대비 +
                      {Math.round(((salary.mine - salary.marketAvg) / salary.marketAvg) * 100)}%
                    </p>
                  ) : (
                    <p className="text-xs text-amber-600 dark:text-amber-400 font-medium">
                      시장 평균 대비 -
                      {Math.round(((salary.marketAvg - salary.mine) / salary.marketAvg) * 100)}%
                    </p>
                  )}
                </div>
              </div>

              {/* Industry comparison */}
              <div className="bg-slate-50 dark:bg-slate-900/50 rounded-lg p-3">
                <p className="text-xs font-semibold text-slate-600 dark:text-slate-400 mb-3">
                  업종별 평균 연봉 비교 ({experienceYears}년차 기준)
                </p>
                <BarCompare
                  maxVal={Math.max(...industryComparison.map((i) => i.value))}
                  items={industryComparison}
                />
              </div>
            </div>
          )}

          {/* Projection Tab */}
          {activeTab === 'projection' && (
            <div className="space-y-3">
              <GrowthChart projections={projections} />

              <div className="grid grid-cols-3 gap-2">
                <div className="text-center p-2 bg-slate-50 dark:bg-slate-900/50 rounded-lg">
                  <p className="text-[10px] text-slate-400">현재</p>
                  <p className="text-sm font-bold text-slate-700 dark:text-slate-300">
                    {projections[0].salary.toLocaleString()}만
                  </p>
                </div>
                <div className="text-center p-2 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                  <p className="text-[10px] text-blue-500">3년 후</p>
                  <p className="text-sm font-bold text-blue-700 dark:text-blue-400">
                    {projections[3].salary.toLocaleString()}만
                  </p>
                </div>
                <div className="text-center p-2 bg-emerald-50 dark:bg-emerald-900/20 rounded-lg">
                  <p className="text-[10px] text-emerald-500">5년 후</p>
                  <p className="text-sm font-bold text-emerald-700 dark:text-emerald-400">
                    {projections[5].salary.toLocaleString()}만
                  </p>
                </div>
              </div>

              <p className="text-[10px] text-slate-400 text-center">
                예상 5년 누적 성장률: +
                {Math.round(
                  ((projections[5].salary - projections[0].salary) / projections[0].salary) * 100,
                )}
                %
              </p>
            </div>
          )}

          {/* Tips Tab */}
          {activeTab === 'tips' && (
            <div className="space-y-2">
              <p className="text-xs font-semibold text-slate-600 dark:text-slate-400">
                연봉 협상 팁
              </p>
              {tips.map((tip, i) => (
                <div
                  key={i}
                  className="flex gap-2.5 p-2.5 bg-slate-50 dark:bg-slate-900/50 rounded-lg border border-slate-100 dark:border-slate-700"
                >
                  <span className="text-lg shrink-0 mt-0.5">{tip.icon}</span>
                  <div>
                    <p className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                      {tip.title}
                    </p>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 leading-relaxed">
                      {tip.description}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}

          <p className="text-xs text-slate-400 dark:text-slate-500 text-center italic">
            * AI 추정치이며 실제 연봉과 다를 수 있습니다
          </p>
        </div>
      )}
    </div>
  );
}
