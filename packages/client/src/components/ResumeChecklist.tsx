import type { Resume } from '@/types/resume';

interface Props {
  resume: Resume;
  compact?: boolean;
}

interface CheckItem {
  label: string;
  done: boolean;
  priority: 'high' | 'medium' | 'low';
}

export default function ResumeChecklist({ resume, compact }: Props) {
  const pi = resume.personalInfo;

  const items: CheckItem[] = [
    { label: '이름 입력', done: !!pi.name, priority: 'high' },
    { label: '이메일 입력', done: !!pi.email, priority: 'high' },
    { label: '연락처 입력', done: !!pi.phone, priority: 'high' },
    {
      label: '자기소개 작성',
      done: !!(pi.summary && pi.summary.replace(/<[^>]*>/g, '').trim().length > 20),
      priority: 'high',
    },
    { label: '경력 1개 이상', done: resume.experiences.length > 0, priority: 'high' },
    { label: '학력 입력', done: resume.educations.length > 0, priority: 'medium' },
    { label: '기술 스택 입력', done: resume.skills.length > 0, priority: 'high' },
    { label: '프로젝트 추가', done: resume.projects.length > 0, priority: 'medium' },
    { label: '자격증 추가', done: resume.certifications.length > 0, priority: 'low' },
    { label: '어학 점수', done: resume.languages.length > 0, priority: 'low' },
    { label: '증명사진', done: !!pi.photo, priority: 'low' },
    { label: '웹사이트/포트폴리오', done: !!(pi.website || pi.github), priority: 'medium' },
  ];

  const completed = items.filter((i) => i.done).length;
  const total = items.length;
  const percentage = Math.round((completed / total) * 100);

  if (compact) {
    return (
      <div className="flex items-center gap-2 text-xs">
        <div className="w-20 bg-slate-100 dark:bg-slate-700 rounded-full h-1.5">
          <div
            className="bg-blue-500 rounded-full h-1.5 transition-all"
            style={{ width: `${percentage}%` }}
          />
        </div>
        <span className="text-slate-500 dark:text-slate-400">
          {completed}/{total}
        </span>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-4 no-print">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-semibold text-slate-800 dark:text-slate-200">
          작성 체크리스트
        </h3>
        <span className="text-xs font-medium text-blue-600 dark:text-blue-400">
          {completed}/{total} ({percentage}%)
        </span>
      </div>

      <div className="bg-slate-100 dark:bg-slate-700 rounded-full h-2 mb-3">
        <div
          className={`rounded-full h-2 transition-all duration-500 ${percentage === 100 ? 'bg-green-500' : 'bg-blue-500'}`}
          style={{ width: `${percentage}%` }}
        />
      </div>

      <div className="stagger-children grid grid-cols-1 sm:grid-cols-2 gap-2">
        {items.map((item) => (
          <div key={item.label} className="flex items-center gap-2 text-xs">
            {item.done ? (
              <svg
                className="w-4 h-4 text-green-500 shrink-0"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M5 13l4 4L19 7"
                />
              </svg>
            ) : (
              <svg
                className={`w-4 h-4 shrink-0 ${item.priority === 'high' ? 'text-red-400' : item.priority === 'medium' ? 'text-amber-400' : 'text-slate-300 dark:text-slate-600'}`}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <circle cx="12" cy="12" r="10" strokeWidth={2} />
              </svg>
            )}
            <span
              className={
                item.done
                  ? 'text-slate-400 dark:text-slate-500 line-through'
                  : 'text-slate-700 dark:text-slate-300'
              }
            >
              {item.label}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
