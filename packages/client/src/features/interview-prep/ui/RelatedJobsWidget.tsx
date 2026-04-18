import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { fetchJobs } from '@/lib/api';

interface RelatedJob {
  id: string;
  company?: string;
  position?: string;
  location?: string;
  skills?: string;
  type?: string;
  user?: { companyName?: string };
}

interface RelatedJobsWidgetProps {
  companyName: string;
  position: string;
  limit?: number;
}

/**
 * RelatedJobsWidget
 * Fetches /api/jobs and ranks them by company/position similarity to the provided
 * context, showing the top N matches with a quick link to interview prep.
 * Used on CoverLetterPage to help users discover related roles while writing.
 */
export default function RelatedJobsWidget({
  companyName,
  position,
  limit = 5,
}: RelatedJobsWidgetProps) {
  const [jobs, setJobs] = useState<RelatedJob[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const trimmedCompany = companyName.trim();
  const trimmedPosition = position.trim();
  const hasContext = trimmedCompany.length > 0 || trimmedPosition.length > 0;

  useEffect(() => {
    if (!hasContext) {
      setJobs([]);
      setLoading(false);
      return;
    }
    let cancelled = false;
    setLoading(true);
    setError(null);
    fetchJobs()
      .then((data) => {
        if (cancelled) return;
        setJobs(Array.isArray(data) ? (data as RelatedJob[]) : []);
      })
      .catch((err) => {
        if (cancelled) return;
        setError(err instanceof Error ? err.message : '채용 공고를 불러오지 못했습니다');
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [hasContext]);

  const ranked = useMemo(() => {
    if (!hasContext || jobs.length === 0) return [] as RelatedJob[];
    const companyLower = trimmedCompany.toLowerCase();
    const positionLower = trimmedPosition.toLowerCase();

    const scored = jobs
      .map((job) => {
        const jobCompany = (job.company || job.user?.companyName || '').toLowerCase();
        const jobPosition = (job.position || '').toLowerCase();
        let score = 0;
        if (companyLower && jobCompany) {
          if (jobCompany === companyLower) score += 100;
          else if (jobCompany.includes(companyLower) || companyLower.includes(jobCompany))
            score += 40;
        }
        if (positionLower && jobPosition) {
          if (jobPosition === positionLower) score += 60;
          else {
            // Token overlap
            const tokens = positionLower.split(/[\s\/,\.\(\)·]+/).filter((t) => t.length >= 2);
            const matched = tokens.filter((t) => jobPosition.includes(t)).length;
            if (matched > 0) score += Math.min(35, matched * 15);
          }
        }
        return { job, score };
      })
      .filter((entry) => entry.score > 0)
      .sort((a, b) => b.score - a.score);

    return scored.slice(0, limit).map((entry) => entry.job);
  }, [jobs, trimmedCompany, trimmedPosition, limit, hasContext]);

  if (!hasContext) return null;

  return (
    <div className="imp-card p-4">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100 flex items-center gap-2">
          <span className="w-5 h-5 bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-md flex items-center justify-center text-[11px]">
            🎯
          </span>
          관련 채용 공고
        </h3>
        <Link to="/jobs" className="text-xs text-blue-600 dark:text-blue-400 hover:underline">
          전체 보기 →
        </Link>
      </div>

      {loading ? (
        <div className="space-y-2" aria-hidden>
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-14 rounded-lg bg-slate-100 dark:bg-slate-800 animate-pulse" />
          ))}
        </div>
      ) : error ? (
        <p className="text-xs text-rose-600 dark:text-rose-400">{error}</p>
      ) : ranked.length === 0 ? (
        <p className="text-xs text-slate-500 dark:text-slate-400">
          조건에 맞는 채용 공고가 아직 없어요.
        </p>
      ) : (
        <ul className="space-y-2">
          {ranked.map((job) => {
            const displayCompany = job.company || job.user?.companyName || '회사 미지정';
            const displayPosition = job.position || '포지션 미지정';
            const interviewHref = `/interview-prep?position=${encodeURIComponent(displayPosition)}`;
            return (
              <li
                key={job.id}
                className="flex items-center justify-between gap-3 px-3 py-2 rounded-lg border border-slate-100 dark:border-slate-700 hover:border-slate-200 dark:hover:border-slate-600 transition-colors"
              >
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-slate-900 dark:text-slate-100 truncate">
                    {displayPosition}
                  </p>
                  <p className="text-xs text-slate-500 dark:text-slate-400 truncate">
                    {displayCompany}
                    {job.location ? ` · ${job.location}` : ''}
                  </p>
                </div>
                <Link
                  to={interviewHref}
                  className="shrink-0 imp-btn px-2.5 py-1.5 text-[11px] font-medium border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800"
                >
                  예상 질문 보기
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
