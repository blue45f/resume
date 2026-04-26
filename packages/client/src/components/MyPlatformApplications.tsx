import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { fetchMyJobApplications } from '@/lib/api';

interface PlatformApp {
  id: string;
  jobId: string;
  job: { id: string; position: string; company: string; location: string; status: string };
  stage: string;
  resumeId: string | null;
  createdAt: string;
  updatedAt: string;
}

const STAGE_META: Record<string, { label: string; color: string; icon: string }> = {
  interested: {
    label: '검토중',
    color: 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400',
    icon: '👀',
  },
  contacted: {
    label: '연락 받음',
    color: 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400',
    icon: '📞',
  },
  interview: {
    label: '면접',
    color: 'bg-sky-100 dark:bg-sky-900/30 text-sky-700 dark:text-sky-400',
    icon: '🗓',
  },
  hired: {
    label: '채용',
    color: 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400',
    icon: '✅',
  },
  rejected: {
    label: '거절',
    color: 'bg-rose-100 dark:bg-rose-900/30 text-rose-700 dark:text-rose-400',
    icon: '✗',
  },
  withdrawn: {
    label: '철회',
    color: 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-400',
    icon: '—',
  },
};

/**
 * 플랫폼 내부 공고에 직접 지원한 application + recruiter 가 설정한 stage 표시.
 * 빈 데이터면 자동 hide. ApplicationsPage 상단에 inline.
 */
export default function MyPlatformApplications() {
  const [apps, setApps] = useState<PlatformApp[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchMyJobApplications()
      .then((rows) => setApps(rows || []))
      .catch(() => setApps([]))
      .finally(() => setLoading(false));
  }, []);

  if (loading || apps.length === 0) return null;

  return (
    <section className="imp-card p-4 mb-5" aria-label="플랫폼 공고 지원 현황">
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-sm font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-2">
          <span aria-hidden="true">📥</span>
          플랫폼 공고 지원
          <span className="text-[10px] font-bold px-1.5 py-0.5 bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-400 rounded-full">
            {apps.length}
          </span>
        </h2>
        <p className="text-[11px] text-slate-500 dark:text-slate-400">
          회사가 직접 stage 를 관리합니다
        </p>
      </div>
      <ul className="space-y-2">
        {apps.slice(0, 8).map((a) => {
          const meta = STAGE_META[a.stage] || STAGE_META.interested;
          return (
            <li key={a.id}>
              <Link
                to={`/jobs/${a.jobId}`}
                className="flex items-center justify-between gap-3 p-2.5 rounded-lg border border-slate-100 dark:border-slate-700 hover:border-slate-200 dark:hover:border-slate-600 hover:bg-slate-50 dark:hover:bg-slate-700/40 transition-colors"
              >
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-slate-900 dark:text-slate-100 truncate">
                    {a.job.position}
                    <span className="ml-2 text-xs font-normal text-slate-500">
                      · {a.job.company}
                    </span>
                  </p>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">
                    {new Date(a.createdAt).toLocaleDateString('ko-KR')} 지원
                    {a.job.location && ` · ${a.job.location}`}
                  </p>
                </div>
                <span
                  className={`shrink-0 px-2.5 py-1 text-xs font-medium rounded-full inline-flex items-center gap-1 ${meta.color}`}
                  title={a.stage}
                >
                  <span aria-hidden="true">{meta.icon}</span>
                  {meta.label}
                </span>
              </Link>
            </li>
          );
        })}
      </ul>
      {apps.length > 8 && (
        <p className="mt-2 text-[11px] text-slate-500 text-center">+{apps.length - 8}개 더</p>
      )}
    </section>
  );
}
