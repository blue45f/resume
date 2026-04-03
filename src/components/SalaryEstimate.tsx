import { useState } from 'react';
import type { Resume } from '@/types/resume';

interface Props {
  resume: Resume;
}

interface SalaryRange {
  min: number;
  avg: number;
  max: number;
  percentile: number;
}

interface ExperienceLevelSalary {
  label: string;
  key: string;
  min: number;
  avg: number;
  max: number;
}

interface RegionSalary {
  label: string;
  multiplier: number;
  avg: number;
}

function estimateSalary(resume: Resume): SalaryRange {
  const expYears = resume.experiences.length;
  const skillCount = resume.skills.reduce((sum, s) => sum + s.items.split(',').length, 0);
  const hasDegree = resume.educations.some(e => e.degree.includes('석사') || e.degree.includes('박사'));
  const certCount = resume.certifications.length;
  const langCount = resume.languages.length;

  // Base salary (만원 단위)
  let base = 3000;

  // Experience multiplier
  base += expYears * 800;

  // Skill bonus
  base += Math.min(skillCount * 100, 1500);

  // Degree bonus
  if (hasDegree) base += 500;

  // Cert/Lang bonus
  base += certCount * 100 + langCount * 50;

  // Cap at realistic range
  base = Math.min(base, 15000);

  const min = Math.round(base * 0.8 / 100) * 100;
  const avg = Math.round(base / 100) * 100;
  const max = Math.round(base * 1.3 / 100) * 100;

  const percentile = Math.min(95, Math.max(20, 30 + expYears * 10 + skillCount * 2));

  return { min, avg, max, percentile };
}

function getExperienceLevelSalaries(baseSalary: number): ExperienceLevelSalary[] {
  return [
    { label: '신입', key: 'entry', min: 2800, avg: 3200, max: 3800 },
    { label: '3년차', key: '3yr', min: 3500, avg: 4200, max: 5200 },
    { label: '5년차', key: '5yr', min: 4500, avg: 5500, max: 7000 },
    { label: '10년+', key: '10yr', min: 6000, avg: 7500, max: 10000 },
  ];
}

function getIndustryAverage(resume: Resume): number {
  const skills = resume.skills.map(s => s.items.toLowerCase()).join(' ');
  if (/react|node|python|java|typescript|개발|프론트|백엔드/.test(skills)) return 5200;
  if (/디자인|ui|ux|figma/.test(skills)) return 4500;
  if (/마케팅|광고|seo/.test(skills)) return 4000;
  if (/데이터|ml|ai|머신러닝/.test(skills)) return 5800;
  return 4200;
}

function getRegionalSalaries(baseSalary: number): RegionSalary[] {
  return [
    { label: '서울', multiplier: 1.15, avg: Math.round(baseSalary * 1.15 / 100) * 100 },
    { label: '경기', multiplier: 1.05, avg: Math.round(baseSalary * 1.05 / 100) * 100 },
    { label: '기타', multiplier: 0.85, avg: Math.round(baseSalary * 0.85 / 100) * 100 },
  ];
}

function BarChart({ data, maxVal, label }: { data: { label: string; value: number; min?: number; max?: number; highlight?: boolean }[]; maxVal: number; label: string }) {
  return (
    <div>
      <p className="text-xs font-semibold text-slate-600 dark:text-slate-400 mb-2">{label}</p>
      <div className="space-y-2">
        {data.map(item => {
          const pct = Math.max(8, (item.value / maxVal) * 100);
          return (
            <div key={item.label} className="flex items-center gap-2">
              <span className="text-xs text-slate-500 dark:text-slate-400 w-12 shrink-0 text-right">{item.label}</span>
              <div className="flex-1 relative">
                {/* Range background */}
                {item.min !== undefined && item.max !== undefined && (
                  <div
                    className="absolute inset-y-0 bg-slate-100 dark:bg-slate-700 rounded"
                    style={{
                      left: `${(item.min / maxVal) * 100}%`,
                      width: `${((item.max - item.min) / maxVal) * 100}%`,
                    }}
                  />
                )}
                <div className="relative h-5 bg-slate-100 dark:bg-slate-700 rounded overflow-hidden">
                  <div
                    className={`h-full rounded transition-all duration-500 ${
                      item.highlight
                        ? 'bg-gradient-to-r from-green-400 to-emerald-500'
                        : 'bg-gradient-to-r from-blue-400 to-blue-500'
                    }`}
                    style={{ width: `${pct}%` }}
                  />
                </div>
              </div>
              <span className={`text-xs font-medium shrink-0 w-14 text-right ${item.highlight ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-600 dark:text-slate-400'}`}>
                {item.value >= 10000 ? `${(item.value / 10000).toFixed(0)}만` : `${item.value}만`}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default function SalaryEstimate({ resume }: Props) {
  const [expanded, setExpanded] = useState(false);
  const [activeTab, setActiveTab] = useState<'overview' | 'experience' | 'region'>('overview');
  const salary = estimateSalary(resume);
  const expLevels = getExperienceLevelSalaries(salary.avg);
  const industryAvg = getIndustryAverage(resume);
  const regions = getRegionalSalaries(salary.avg);

  const expYears = resume.experiences.length;
  const currentLevelIdx = expYears >= 10 ? 3 : expYears >= 5 ? 2 : expYears >= 3 ? 1 : 0;

  return (
    <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-4 no-print">
      <button onClick={() => setExpanded(!expanded)} className="w-full flex items-center justify-between">
        <h3 className="text-sm font-semibold text-slate-800 dark:text-slate-200">예상 연봉</h3>
        <div className="flex items-center gap-2">
          <span className="text-sm font-bold text-green-600">{(salary.avg / 10000).toFixed(0)}만원</span>
          <svg className={`w-4 h-4 text-slate-400 transition-transform ${expanded ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </div>
      </button>

      {expanded && (
        <div className="mt-3 space-y-4 animate-fade-in">
          {/* Tab navigation */}
          <div className="flex gap-1 bg-slate-100 dark:bg-slate-700 rounded-lg p-0.5">
            {([
              { key: 'overview', label: '종합' },
              { key: 'experience', label: '경력별' },
              { key: 'region', label: '지역별' },
            ] as const).map(tab => (
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

          {/* Overview tab */}
          {activeTab === 'overview' && (
            <div className="space-y-3">
              {/* Range bar */}
              <div className="relative h-8 bg-slate-100 dark:bg-slate-700 rounded-lg overflow-hidden">
                <div className="absolute inset-y-0 bg-gradient-to-r from-blue-200 to-green-200 dark:from-blue-900/30 dark:to-green-900/30 rounded-lg"
                  style={{ left: '10%', right: '10%' }} />
                <div className="absolute top-1/2 -translate-y-1/2 w-3 h-3 bg-green-500 rounded-full border-2 border-white shadow"
                  style={{ left: `${Math.min(90, Math.max(10, salary.percentile))}%` }} />
              </div>
              <div className="flex justify-between text-xs text-slate-400">
                <span>{(salary.min / 10000).toFixed(0)}만</span>
                <span className="font-medium text-green-600">{(salary.avg / 10000).toFixed(0)}만 (예상)</span>
                <span>{(salary.max / 10000).toFixed(0)}만</span>
              </div>

              <p className="text-xs text-slate-500 dark:text-slate-400 text-center">
                경력 {resume.experiences.length}년차 기준 상위 {100 - salary.percentile}% 수준
              </p>

              {/* Industry average comparison */}
              <div className="bg-slate-50 dark:bg-slate-900/50 rounded-lg p-3">
                <p className="text-xs font-semibold text-slate-600 dark:text-slate-400 mb-2">업계 평균 비교</p>
                <div className="space-y-2">
                  {/* Your salary bar */}
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-slate-500 w-16 shrink-0 text-right">내 예상</span>
                    <div className="flex-1 h-5 bg-slate-100 dark:bg-slate-700 rounded overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-green-400 to-emerald-500 rounded"
                        style={{ width: `${Math.min(100, (salary.avg / Math.max(salary.avg, industryAvg) * 100))}%` }}
                      />
                    </div>
                    <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400 w-14 text-right">
                      {(salary.avg / 10000).toFixed(0)}만
                    </span>
                  </div>
                  {/* Industry average bar */}
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-slate-500 w-16 shrink-0 text-right">업계 평균</span>
                    <div className="flex-1 h-5 bg-slate-100 dark:bg-slate-700 rounded overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-blue-400 to-blue-500 rounded"
                        style={{ width: `${Math.min(100, (industryAvg / Math.max(salary.avg, industryAvg) * 100))}%` }}
                      />
                    </div>
                    <span className="text-xs font-medium text-blue-600 dark:text-blue-400 w-14 text-right">
                      {(industryAvg / 10000).toFixed(0)}만
                    </span>
                  </div>
                </div>
                {salary.avg > industryAvg ? (
                  <p className="text-xs text-emerald-600 dark:text-emerald-400 mt-2 text-center font-medium">
                    업계 평균보다 {Math.round(((salary.avg - industryAvg) / industryAvg) * 100)}% 높은 수준입니다
                  </p>
                ) : salary.avg < industryAvg ? (
                  <p className="text-xs text-amber-600 dark:text-amber-400 mt-2 text-center font-medium">
                    업계 평균보다 {Math.round(((industryAvg - salary.avg) / industryAvg) * 100)}% 낮은 수준입니다
                  </p>
                ) : (
                  <p className="text-xs text-slate-500 mt-2 text-center">업계 평균과 동일한 수준입니다</p>
                )}
              </div>
            </div>
          )}

          {/* Experience level tab */}
          {activeTab === 'experience' && (
            <div className="space-y-3">
              <BarChart
                label="경력별 예상 연봉 (만원)"
                maxVal={Math.max(...expLevels.map(l => l.max))}
                data={expLevels.map((level, i) => ({
                  label: level.label,
                  value: level.avg,
                  min: level.min,
                  max: level.max,
                  highlight: i === currentLevelIdx,
                }))}
              />

              {/* Current level indicator */}
              <div className="bg-emerald-50 dark:bg-emerald-900/20 rounded-lg p-2.5 border border-emerald-200 dark:border-emerald-800">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-emerald-500 rounded-full" />
                  <span className="text-xs text-emerald-700 dark:text-emerald-400">
                    현재 {expLevels[currentLevelIdx].label} 기준:
                    <span className="font-bold ml-1">
                      {expLevels[currentLevelIdx].min}만 ~ {expLevels[currentLevelIdx].max}만
                    </span>
                    <span className="text-emerald-500 ml-1">(평균 {expLevels[currentLevelIdx].avg}만)</span>
                  </span>
                </div>
              </div>

              {/* Range bars per level */}
              <div className="space-y-1.5">
                {expLevels.map((level, i) => {
                  const rangeMax = 10000;
                  const leftPct = (level.min / rangeMax) * 100;
                  const widthPct = ((level.max - level.min) / rangeMax) * 100;
                  const avgPct = ((level.avg - level.min) / (level.max - level.min)) * widthPct + leftPct;
                  const isCurrentLevel = i === currentLevelIdx;
                  return (
                    <div key={level.key} className="flex items-center gap-2">
                      <span className={`text-xs w-12 shrink-0 text-right ${isCurrentLevel ? 'font-bold text-emerald-600 dark:text-emerald-400' : 'text-slate-500'}`}>
                        {level.label}
                      </span>
                      <div className="flex-1 relative h-3 bg-slate-100 dark:bg-slate-700 rounded-full">
                        <div
                          className={`absolute inset-y-0 rounded-full ${
                            isCurrentLevel
                              ? 'bg-gradient-to-r from-emerald-300 to-emerald-400 dark:from-emerald-600 dark:to-emerald-500'
                              : 'bg-gradient-to-r from-blue-200 to-blue-300 dark:from-blue-800 dark:to-blue-700'
                          }`}
                          style={{ left: `${leftPct}%`, width: `${widthPct}%` }}
                        />
                        <div
                          className={`absolute top-1/2 -translate-y-1/2 w-2 h-2 rounded-full border border-white dark:border-slate-900 ${
                            isCurrentLevel ? 'bg-emerald-600' : 'bg-blue-500'
                          }`}
                          style={{ left: `${avgPct}%` }}
                        />
                      </div>
                      <span className="text-xs text-slate-400 w-20 shrink-0">
                        {level.min}~{level.max}만
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Region tab */}
          {activeTab === 'region' && (
            <div className="space-y-3">
              <BarChart
                label="지역별 예상 연봉 (만원)"
                maxVal={Math.max(...regions.map(r => r.avg))}
                data={regions.map(r => ({
                  label: r.label,
                  value: r.avg,
                  highlight: r.label === '서울',
                }))}
              />

              {/* Detailed comparison */}
              <div className="grid grid-cols-3 gap-2">
                {regions.map(region => (
                  <div
                    key={region.label}
                    className={`text-center p-2.5 rounded-lg border ${
                      region.label === '서울'
                        ? 'bg-emerald-50 dark:bg-emerald-900/20 border-emerald-200 dark:border-emerald-800'
                        : 'bg-white dark:bg-slate-800/80 border-slate-100 dark:border-slate-700'
                    }`}
                  >
                    <p className="text-sm font-bold text-slate-800 dark:text-slate-200">{region.label}</p>
                    <p className={`text-lg font-bold mt-0.5 ${
                      region.label === '서울' ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-600 dark:text-slate-400'
                    }`}>
                      {region.avg >= 10000 ? `${(region.avg / 10000).toFixed(0)}만` : `${region.avg}만`}
                    </p>
                    <p className="text-xs text-slate-400 mt-0.5">
                      {region.multiplier > 1 ? `+${Math.round((region.multiplier - 1) * 100)}%` : `${Math.round((region.multiplier - 1) * 100)}%`}
                    </p>
                  </div>
                ))}
              </div>

              <p className="text-xs text-slate-400 text-center">
                서울 기준 대비 지역별 보정치 적용
              </p>
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
