import { useMemo } from 'react';

interface JobPost {
  id: string;
  company: string;
  position: string;
  location: string;
  salary: string;
  type: string;
  skills: string;
  description: string;
  status: string;
  createdAt: string;
  user: { id: string; name: string; companyName?: string };
}

interface Props {
  job: JobPost;
  allJobs: JobPost[];
  onSelectJob: (id: string) => void;
}

const INDUSTRY_BADGES: Record<string, { label: string; color: string }> = {
  IT: {
    label: 'IT/소프트웨어',
    color: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
  },
  finance: {
    label: '금융',
    color: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400',
  },
  manufacturing: {
    label: '제조',
    color: 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400',
  },
  default: {
    label: '기타',
    color: 'bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-400',
  },
};

const SIZE_BADGES = [
  {
    min: 10,
    label: '스타트업',
    color: 'bg-sky-100 text-violet-700 dark:bg-sky-900/30 dark:text-sky-400',
  },
  {
    min: 5,
    label: '중소기업',
    color: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
  },
  {
    min: 2,
    label: '중견기업',
    color: 'bg-cyan-100 text-cyan-700 dark:bg-cyan-900/30 dark:text-cyan-400',
  },
  {
    min: 0,
    label: '기업',
    color: 'bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-400',
  },
];

function parseSalaryToNumber(salary: string): number | null {
  if (!salary) return null;
  const cleaned = salary.replace(/[^0-9]/g, '');
  if (!cleaned) return null;
  return parseInt(cleaned, 10);
}

function detectIndustry(job: JobPost): string {
  const text = `${job.skills} ${job.description} ${job.position}`.toLowerCase();
  if (/react|node|python|java|개발|프론트|백엔드|devops|cloud|aws|데이터|ai|ml/.test(text))
    return 'IT';
  if (/금융|은행|보험|투자|핀테크/.test(text)) return 'finance';
  if (/제조|생산|공장|설비/.test(text)) return 'manufacturing';
  return 'default';
}

function estimateCompanySize(jobCount: number) {
  for (const badge of SIZE_BADGES) {
    if (jobCount >= badge.min) return badge;
  }
  return SIZE_BADGES[SIZE_BADGES.length - 1];
}

export default function CompanyInfoCard({ job, allJobs, onSelectJob }: Props) {
  const companyJobs = useMemo(
    () => allJobs.filter((j) => j.company === job.company && j.status === 'active'),
    [allJobs, job.company],
  );
  const otherJobs = useMemo(
    () => companyJobs.filter((j) => j.id !== job.id),
    [companyJobs, job.id],
  );

  const salaryStats = useMemo(() => {
    const salaries = companyJobs
      .map((j) => parseSalaryToNumber(j.salary))
      .filter((n): n is number => n !== null);
    if (salaries.length === 0) return null;
    const min = Math.min(...salaries);
    const max = Math.max(...salaries);
    const avg = Math.round(salaries.reduce((a, b) => a + b, 0) / salaries.length);
    return { min, max, avg };
  }, [companyJobs]);

  const industry = detectIndustry(job);
  const industryBadge = INDUSTRY_BADGES[industry] || INDUSTRY_BADGES.default;
  const sizeBadge = estimateCompanySize(companyJobs.length);

  return (
    <div className="bg-gradient-to-br from-slate-50 to-blue-50/30 dark:from-slate-800 dark:to-blue-900/10 rounded-xl border border-slate-200 dark:border-slate-700 p-4 mb-5">
      <div className="flex items-start gap-3 mb-3">
        {/* Company avatar */}
        <div className="w-11 h-11 bg-blue-600 text-white rounded-xl flex items-center justify-center text-lg font-bold shrink-0">
          {job.company.charAt(0)}
        </div>
        <div className="min-w-0 flex-1">
          <h4 className="font-bold text-slate-900 dark:text-slate-100 truncate">{job.company}</h4>
          {job.user?.companyName && (
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              {job.user.companyName}
            </p>
          )}
        </div>
      </div>

      {/* Badges */}
      <div className="flex flex-wrap gap-1.5 mb-3">
        <span className={`px-2 py-0.5 text-xs font-medium rounded-full ${industryBadge.color}`}>
          {industryBadge.label}
        </span>
        <span className={`px-2 py-0.5 text-xs font-medium rounded-full ${sizeBadge.color}`}>
          {sizeBadge.label}
        </span>
        {job.location && (
          <span className="px-2 py-0.5 text-xs font-medium rounded-full bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-400">
            {job.location}
          </span>
        )}
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-2 gap-2 mb-3">
        <div className="bg-white dark:bg-slate-800/80 rounded-lg p-2.5 text-center border border-slate-100 dark:border-slate-700">
          <p className="text-lg font-bold text-blue-600 dark:text-blue-400">{companyJobs.length}</p>
          <p className="text-xs text-slate-500 dark:text-slate-400">채용 중인 공고</p>
        </div>
        <div className="bg-white dark:bg-slate-800/80 rounded-lg p-2.5 text-center border border-slate-100 dark:border-slate-700">
          {salaryStats ? (
            <>
              <p className="text-lg font-bold text-emerald-600 dark:text-emerald-400">
                {salaryStats.avg >= 10000
                  ? `${(salaryStats.avg / 10000).toFixed(0)}만`
                  : `${salaryStats.avg}만`}
              </p>
              <p className="text-xs text-slate-500 dark:text-slate-400">평균 연봉</p>
            </>
          ) : (
            <>
              <p className="text-lg font-bold text-slate-400">-</p>
              <p className="text-xs text-slate-500 dark:text-slate-400">연봉 비공개</p>
            </>
          )}
        </div>
      </div>

      {/* Salary range bar */}
      {salaryStats && salaryStats.min !== salaryStats.max && (
        <div className="mb-3 bg-white dark:bg-slate-800/80 rounded-lg p-2.5 border border-slate-100 dark:border-slate-700">
          <p className="text-xs font-medium text-slate-600 dark:text-slate-400 mb-1.5">연봉 범위</p>
          <div className="relative h-2.5 bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden">
            <div
              className="absolute inset-y-0 bg-gradient-to-r from-emerald-400 to-emerald-500 rounded-full"
              style={{
                left: `${(salaryStats.min / salaryStats.max) * 70}%`,
                right: '0%',
              }}
            />
          </div>
          <div className="flex justify-between text-xs text-slate-400 mt-1">
            <span>
              {salaryStats.min >= 10000
                ? `${(salaryStats.min / 10000).toFixed(0)}만원`
                : `${salaryStats.min}만원`}
            </span>
            <span>
              {salaryStats.max >= 10000
                ? `${(salaryStats.max / 10000).toFixed(0)}만원`
                : `${salaryStats.max}만원`}
            </span>
          </div>
        </div>
      )}

      {/* Other jobs from this company */}
      {otherJobs.length > 0 && (
        <div>
          <p className="text-xs font-semibold text-slate-600 dark:text-slate-400 mb-2">
            이 회사의 다른 공고 ({otherJobs.length})
          </p>
          <div className="space-y-1.5 max-h-32 overflow-y-auto">
            {otherJobs.slice(0, 5).map((oj) => (
              <button
                key={oj.id}
                onClick={() => onSelectJob(oj.id)}
                className="w-full text-left px-2.5 py-1.5 bg-white dark:bg-slate-800/80 rounded-lg border border-slate-100 dark:border-slate-700 hover:border-blue-300 dark:hover:border-blue-600 transition-colors"
              >
                <p className="text-xs font-medium text-slate-700 dark:text-slate-300 truncate">
                  {oj.position}
                </p>
                <p className="text-xs text-slate-400 truncate">
                  {oj.location} {oj.salary && `· ${oj.salary}`}
                </p>
              </button>
            ))}
            {otherJobs.length > 5 && (
              <p className="text-xs text-blue-500 text-center py-1">
                +{otherJobs.length - 5}개 더 보기
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
