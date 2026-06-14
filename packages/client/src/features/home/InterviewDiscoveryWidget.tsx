import { useQuery } from '@tanstack/react-query'
import { Link } from 'react-router-dom'

import {
  fetchStudyGroups,
  fetchJobInterviewQuestions,
  type StudyGroup,
  type JobInterviewQuestion,
} from '@/lib/api'
import { ROUTES, withQuery } from '@/lib/routes'

/* ── 면접 크로스 추천 위젯 (스터디 그룹 + 예상 질문) ─────────────── */
export default function InterviewDiscoveryWidget() {
  const groupsQuery = useQuery({
    queryKey: ['home-study-groups', { limit: 20 }],
    queryFn: () => fetchStudyGroups({ limit: 20 }),
    staleTime: 60_000,
  })
  const questionsQuery = useQuery({
    queryKey: ['home-job-interview-questions', { limit: 20 }],
    queryFn: () => fetchJobInterviewQuestions({ limit: 20 }),
    staleTime: 60_000,
  })
  const loading = groupsQuery.isLoading || questionsQuery.isLoading
  const groups: StudyGroup[] = groupsQuery.data
    ? [...groupsQuery.data.items].sort((a, b) => b.memberCount - a.memberCount).slice(0, 5)
    : []
  const questions: JobInterviewQuestion[] = questionsQuery.data
    ? [...questionsQuery.data]
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
        .slice(0, 5)
    : []

  if (loading) {
    return (
      <div className="mb-6 grid grid-cols-1 md:grid-cols-2 gap-4">
        {[0, 1].map((i) => (
          <div key={i} className="imp-card p-5">
            <div className="h-4 w-32 bg-slate-100 dark:bg-slate-800 rounded animate-pulse mb-3" />
            <div className="space-y-2">
              {[0, 1, 2].map((j) => (
                <div
                  key={j}
                  className="h-10 rounded-lg bg-slate-100 dark:bg-slate-800 animate-pulse"
                />
              ))}
            </div>
          </div>
        ))}
      </div>
    )
  }

  if (groups.length === 0 && questions.length === 0) return null

  return (
    <div className="mb-6 grid grid-cols-1 md:grid-cols-2 gap-4">
      {groups.length > 0 && (
        <div className="imp-card overflow-hidden">
          <div className="flex items-center justify-between px-5 py-3 border-b border-slate-100 dark:border-slate-700">
            <h3 className="text-sm font-semibold text-slate-800 dark:text-slate-200 flex items-center gap-2">
              <span className="w-5 h-5 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 rounded-md flex items-center justify-center text-xs">
                👥
              </span>
              인기 면접 스터디 그룹
            </h3>
            <Link
              to={withQuery(ROUTES.jobs.list, { tab: 'internal' })}
              className="home-subtle-link text-xs"
            >
              더보기 →
            </Link>
          </div>
          <ul className="divide-y divide-slate-100 dark:divide-slate-700">
            {groups.map((g) => (
              <li key={g.id} className="home-list-row flex items-center gap-3">
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-slate-800 dark:text-slate-200 truncate">
                    {g.name}
                  </p>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate">
                    {g.companyName || '전체'}
                    {g.position ? ` · ${g.position}` : ''}
                  </p>
                </div>
                <span className="shrink-0 text-[11px] text-slate-500 dark:text-slate-400 tabular-nums">
                  {g.memberCount}/{g.maxMembers}명
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {questions.length > 0 && (
        <div className="imp-card overflow-hidden">
          <div className="flex items-center justify-between px-5 py-3 border-b border-slate-100 dark:border-slate-700">
            <h3 className="text-sm font-semibold text-slate-800 dark:text-slate-200 flex items-center gap-2">
              <span className="w-5 h-5 bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-md flex items-center justify-center text-xs">
                💡
              </span>
              최근 생성된 면접 질문
            </h3>
            <Link to={ROUTES.interview.prep} className="home-subtle-link text-xs">
              더보기 →
            </Link>
          </div>
          <ul className="divide-y divide-slate-100 dark:divide-slate-700">
            {questions.map((q) => (
              <li key={q.id} className="home-list-row flex items-center gap-3">
                <div className="min-w-0 flex-1">
                  <p className="text-sm text-slate-800 dark:text-slate-200 truncate">
                    {q.question}
                  </p>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate">
                    {q.companyName}
                    {q.position ? ` · ${q.position}` : ''}
                  </p>
                </div>
                <Link
                  to={withQuery(ROUTES.interview.prep, { position: q.position || '' })}
                  className="home-subtle-link home-subtle-link--compact text-[11px] font-medium"
                >
                  보기
                </Link>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  )
}
