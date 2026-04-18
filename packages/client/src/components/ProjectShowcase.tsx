import { memo, useState } from 'react';
import type { Resume, Project } from '@/types/resume';
import { getUser } from '@/lib/auth';
import { useNavigate } from 'react-router-dom';

interface Props {
  resume: Resume;
}

/** Gradient palettes for project cards */
const GRADIENTS = [
  'from-blue-500 to-indigo-600',
  'from-emerald-500 to-teal-600',
  'from-blue-500 to-cyan-600',
  'from-amber-500 to-orange-600',
  'from-cyan-500 to-blue-600',
  'from-rose-500 to-red-600',
  'from-blue-500 to-sapphire-600',
  'from-teal-500 to-emerald-600',
];

function formatDate(d: string): string {
  if (!d) return '';
  const parts = d.split('-');
  if (parts.length >= 2) return `${parts[0]}.${parts[1]}`;
  return d;
}

function ProjectCard({ project, index }: { project: Project; index: number }) {
  const [expanded, setExpanded] = useState(false);
  const gradient = GRADIENTS[index % GRADIENTS.length];
  const techItems = project.techStack
    ? project.techStack
        .split(',')
        .map((t) => t.trim())
        .filter(Boolean)
    : [];
  const plainDesc = project.description?.replace(/<[^>]*>/g, '') || '';
  const snippet = plainDesc.length > 120 ? plainDesc.slice(0, 120) + '...' : plainDesc;

  return (
    <div className="group bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden shadow-sm hover:shadow-md transition-shadow duration-300 flex flex-col">
      {/* Gradient header */}
      <div className={`h-24 bg-gradient-to-br ${gradient} relative flex items-end p-4`}>
        <div className="absolute inset-0 bg-black/10" />
        <div className="relative z-10 w-full">
          <h4 className="text-white font-bold text-sm leading-tight truncate drop-shadow-sm">
            {project.name}
          </h4>
          {project.role && <p className="text-white/80 text-xs mt-0.5 truncate">{project.role}</p>}
        </div>
      </div>

      {/* Body */}
      <div className="p-4 flex-1 flex flex-col">
        {/* Date range */}
        {(project.startDate || project.endDate) && (
          <p className="text-[11px] text-slate-400 dark:text-slate-500 mb-2">
            {formatDate(project.startDate)} ~ {formatDate(project.endDate) || '진행 중'}
          </p>
        )}

        {/* Tech stack pills */}
        {techItems.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mb-3">
            {techItems.slice(0, expanded ? techItems.length : 6).map((tech) => (
              <span
                key={tech}
                className="px-2 py-0.5 text-[11px] font-medium rounded-full bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300"
              >
                {tech}
              </span>
            ))}
            {!expanded && techItems.length > 6 && (
              <span className="px-2 py-0.5 text-[11px] text-slate-400 dark:text-slate-500">
                +{techItems.length - 6}
              </span>
            )}
          </div>
        )}

        {/* Description */}
        <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed flex-1">
          {expanded ? plainDesc : snippet}
        </p>

        {/* Expand / collapse + link */}
        <div className="flex items-center justify-between mt-3 pt-2 border-t border-slate-100 dark:border-slate-700">
          {plainDesc.length > 120 ? (
            <button
              onClick={() => setExpanded((v) => !v)}
              className="text-xs text-blue-600 dark:text-blue-400 hover:underline focus:outline-none"
            >
              {expanded ? '접기' : '자세히 보기'}
            </button>
          ) : (
            <span />
          )}
          {project.link && (
            <a
              href={project.link}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors flex items-center gap-1"
            >
              <svg
                className="w-3.5 h-3.5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                strokeWidth={2}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1"
                />
              </svg>
              링크
            </a>
          )}
        </div>
      </div>
    </div>
  );
}

function ProjectShowcase({ resume }: Props) {
  const navigate = useNavigate();
  const projects = resume.projects;
  const currentUser = getUser();
  const isOwner = currentUser && resume.userId && currentUser.id === resume.userId;

  if (projects.length === 0 && !isOwner) return null;

  return (
    <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-5 no-print">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <svg
            className="w-5 h-5 text-indigo-500"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            strokeWidth={2}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z"
            />
          </svg>
          <h3 className="text-sm font-semibold text-slate-800 dark:text-slate-200">
            프로젝트 쇼케이스
          </h3>
          <span className="text-xs text-slate-400 dark:text-slate-500">{projects.length}개</span>
        </div>
      </div>

      {projects.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {projects.map((project, idx) => (
            <ProjectCard key={project.id} project={project} index={idx} />
          ))}
        </div>
      ) : (
        <div className="text-center py-8">
          <p className="text-sm text-slate-400 dark:text-slate-500 mb-3">
            아직 등록된 프로젝트가 없습니다
          </p>
        </div>
      )}

      {/* CTA for owner */}
      {isOwner && (
        <div className="mt-4 text-center">
          <button
            onClick={() => navigate(`/resumes/${resume.id}/edit`)}
            className="inline-flex items-center gap-1.5 px-4 py-2 text-sm font-medium text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-900/20 hover:bg-indigo-100 dark:hover:bg-indigo-900/30 rounded-lg transition-colors"
          >
            <svg
              className="w-4 h-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              strokeWidth={2}
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
            </svg>
            프로젝트 추가
          </button>
        </div>
      )}
    </div>
  );
}

export default memo(ProjectShowcase);
