import { useDeferredValue, useEffect, useMemo, useState, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Header from '@/components/Header';
import Breadcrumb from '@/components/Breadcrumb';
import ResumeForm from '@/components/ResumeForm';
import { FormSkeleton } from '@/components/Skeleton';
import { toast } from '@/components/Toast';
import TagSelector from '@/components/TagSelector';
import AttachmentPanel from '@/components/AttachmentPanel';
import VersionPanel from '@/components/VersionPanel';
import LiveAtsBadge from '@/components/LiveAtsBadge';
import OverallHealthGauge from '@/components/OverallHealthGauge';
import QuotableHighlights from '@/components/QuotableHighlights';
import CareerGapPanel from '@/components/CareerGapPanel';
import { InterviewabilityRow } from '@/components/KoreanQualityBadge';
import { buildResumePlainText } from '@/lib/resumeText';
import type { Resume } from '@/types/resume';
import { useQueryClient } from '@tanstack/react-query';
import { updateResume, setResumeVisibility } from '@/lib/api';
import { useResume } from '@/hooks/useResources';
import { ROUTES } from '@/lib/routes';
import { calculateCompleteness } from '@/lib/completeness';

interface RoadmapTask {
  label: string;
  tip: string;
  gain: number;
  done: boolean;
  sectionId: string;
}

function buildRoadmap(resume: Partial<Resume>): RoadmapTask[] {
  if (!resume.personalInfo) return [];
  const r = resume as Resume;
  const tasks: RoadmapTask[] = [];
  const pi = r.personalInfo;

  if (!pi.summary || pi.summary.replace(/<[^>]*>/g, '').length < 30)
    tasks.push({
      label: '자기소개 작성',
      tip: '30자 이상 자기소개를 작성하면 +8점',
      gain: 8,
      done: false,
      sectionId: 'summary',
    });
  else
    tasks.push({
      label: '자기소개 완성',
      tip: '자기소개가 잘 작성되어 있습니다',
      gain: 8,
      done: true,
      sectionId: 'summary',
    });

  if (!pi.github && !pi.website)
    tasks.push({
      label: 'GitHub / 포트폴리오 링크 추가',
      tip: 'URL 추가 시 +3점, ATS 매칭률 향상',
      gain: 3,
      done: false,
      sectionId: 'links',
    });
  else
    tasks.push({
      label: 'GitHub / 포트폴리오 링크',
      tip: '링크가 등록되어 있습니다',
      gain: 3,
      done: true,
      sectionId: 'links',
    });

  const hasDescriptions = r.experiences.some(
    (e) => e.description && e.description.replace(/<[^>]*>/g, '').length > 30,
  );
  if (r.experiences.length === 0)
    tasks.push({
      label: '경력 사항 추가',
      tip: '경력 1개 추가 시 +10점',
      gain: 10,
      done: false,
      sectionId: 'experience',
    });
  else if (!hasDescriptions)
    tasks.push({
      label: '경력 업무 내용 상세화',
      tip: '업무 설명 30자+ 입력 시 +5점',
      gain: 5,
      done: false,
      sectionId: 'experience',
    });
  else if (!r.experiences.some((e) => e.techStack))
    tasks.push({
      label: '경력에 기술 스택 명시',
      tip: '사용 기술 추가 시 +2점, ATS 키워드 강화',
      gain: 2,
      done: false,
      sectionId: 'experience',
    });
  else
    tasks.push({
      label: '경력 섹션 완성',
      tip: '경력이 충실하게 작성되어 있습니다',
      gain: 25,
      done: true,
      sectionId: 'experience',
    });

  if (r.educations.length === 0)
    tasks.push({
      label: '학력 추가',
      tip: '학력 입력 시 +7점',
      gain: 7,
      done: false,
      sectionId: 'education',
    });
  else
    tasks.push({
      label: '학력 완성',
      tip: '학력이 등록되어 있습니다',
      gain: 10,
      done: true,
      sectionId: 'education',
    });

  if (r.skills.length === 0)
    tasks.push({
      label: '기술 스택 추가',
      tip: '기술 1개 카테고리 추가 시 +6점',
      gain: 6,
      done: false,
      sectionId: 'skills',
    });
  else if (r.skills.length < 2)
    tasks.push({
      label: '기술 카테고리 추가',
      tip: '2개 이상 카테고리 입력 시 +4점 추가',
      gain: 4,
      done: false,
      sectionId: 'skills',
    });
  else
    tasks.push({
      label: '기술 스택 완성',
      tip: '다양한 기술이 등록되어 있습니다',
      gain: 15,
      done: true,
      sectionId: 'skills',
    });

  if (r.projects.length === 0)
    tasks.push({
      label: '프로젝트 추가',
      tip: '프로젝트 1개 추가 시 +5점',
      gain: 5,
      done: false,
      sectionId: 'projects',
    });
  else
    tasks.push({
      label: '프로젝트 완성',
      tip: '프로젝트가 등록되어 있습니다',
      gain: 10,
      done: true,
      sectionId: 'projects',
    });

  const hasExtras = r.certifications.length > 0 || r.languages.length > 0 || r.awards.length > 0;
  if (!hasExtras)
    tasks.push({
      label: '자격증 또는 어학 추가',
      tip: '자격증/어학/수상 추가 시 +3~5점',
      gain: 5,
      done: false,
      sectionId: 'extras',
    });
  else
    tasks.push({
      label: '자격증 / 어학',
      tip: '추가 스펙이 등록되어 있습니다',
      gain: 10,
      done: true,
      sectionId: 'extras',
    });

  // Sort: incomplete tasks first, by gain descending
  return tasks.sort((a, b) => {
    if (a.done !== b.done) return a.done ? 1 : -1;
    return b.gain - a.gain;
  });
}

/** Enhanced live completeness + roadmap widget */
function LiveCompletenessBar({ resume }: { resume: Partial<Resume> }) {
  const [expanded, setExpanded] = useState(false);
  if (!resume.personalInfo) return null;
  const result = calculateCompleteness(resume as Resume);
  const pct = result.percentage;
  const roadmap = buildRoadmap(resume);
  const pendingTasks = roadmap.filter((t) => !t.done);
  const potentialGain = pendingTasks.reduce((s, t) => s + t.gain, 0);

  const color = pct >= 80 ? '#3b82f6' : pct >= 60 ? '#22c55e' : pct >= 40 ? '#f97316' : '#ef4444';
  const label = pct >= 80 ? '우수' : pct >= 60 ? '양호' : pct >= 40 ? '보통' : '부족';
  const grade = result.grade;

  const gradeColors: Record<string, string> = {
    S: 'text-sky-600 bg-sky-50 border-sky-200 dark:bg-sky-900/20 dark:border-sky-800 dark:text-sky-400',
    A: 'text-blue-600 bg-blue-50 border-blue-200 dark:bg-blue-900/20 dark:border-blue-800 dark:text-blue-400',
    B: 'text-green-600 bg-green-50 border-green-200 dark:bg-green-900/20 dark:border-green-800 dark:text-green-400',
    C: 'text-amber-600 bg-amber-50 border-amber-200 dark:bg-amber-900/20 dark:border-amber-800 dark:text-amber-400',
    D: 'text-red-600 bg-red-50 border-red-200 dark:bg-red-900/20 dark:border-red-800 dark:text-red-400',
  };

  const sectionIcons: Record<string, string> = {
    summary: '✍️',
    links: '🔗',
    experience: '💼',
    education: '🎓',
    skills: '⚡',
    projects: '🚀',
    extras: '🏆',
  };

  return (
    <div className="mb-4 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden">
      {/* Header row */}
      <button
        onClick={() => setExpanded((v) => !v)}
        className="w-full p-3 flex items-center gap-3 hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors text-left"
        aria-expanded={expanded}
      >
        {/* Circular mini-progress */}
        <svg width="36" height="36" viewBox="0 0 36 36" className="shrink-0">
          <circle
            cx="18"
            cy="18"
            r="15"
            fill="none"
            stroke="#e2e8f0"
            strokeWidth="3"
            className="dark:stroke-slate-700"
          />
          <circle
            cx="18"
            cy="18"
            r="15"
            fill="none"
            stroke={color}
            strokeWidth="3"
            strokeDasharray={`${(pct / 100) * 94.2} 94.2`}
            strokeLinecap="round"
            transform="rotate(-90 18 18)"
            style={{ transition: 'stroke-dasharray 0.6s ease' }}
          />
          <text x="18" y="22" textAnchor="middle" fontSize="9" fontWeight="bold" fill={color}>
            {pct}%
          </text>
        </svg>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">
              이력서 완성도
            </span>
            <span
              className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full border ${gradeColors[grade]}`}
            >
              {grade}등급 · {label}
            </span>
          </div>
          <div className="w-full bg-slate-100 dark:bg-slate-700 rounded-full h-1.5 overflow-hidden">
            <div
              className="h-1.5 rounded-full transition-all duration-700 ease-out"
              style={{ width: `${pct}%`, backgroundColor: color }}
            />
          </div>
        </div>

        <div className="shrink-0 flex items-center gap-2">
          {pendingTasks.length > 0 && (
            <span className="text-[10px] font-medium text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/20 px-2 py-0.5 rounded-full border border-amber-200 dark:border-amber-800">
              +{potentialGain}점 가능
            </span>
          )}
          <svg
            className={`w-4 h-4 text-slate-400 transition-transform duration-200 ${expanded ? 'rotate-180' : ''}`}
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
          </svg>
        </div>
      </button>

      {/* Roadmap panel */}
      {expanded && (
        <div className="border-t border-slate-100 dark:border-slate-700 px-3 pb-3 pt-2 animate-fade-in">
          <p className="text-[10px] font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wide mb-2">
            개선 로드맵
          </p>
          <div className="space-y-1.5">
            {roadmap.slice(0, 6).map((task) => (
              <div
                key={task.sectionId}
                className={`flex items-start gap-2.5 p-2 rounded-lg ${
                  task.done
                    ? 'bg-slate-50 dark:bg-slate-700/30 opacity-60'
                    : 'bg-amber-50 dark:bg-amber-900/10 border border-amber-100 dark:border-amber-900/30'
                }`}
              >
                <span className="text-sm shrink-0 mt-0.5">
                  {task.done ? '✅' : sectionIcons[task.sectionId]}
                </span>
                <div className="flex-1 min-w-0">
                  <p
                    className={`text-[11px] font-medium leading-tight ${task.done ? 'text-slate-500 dark:text-slate-400 line-through' : 'text-slate-700 dark:text-slate-300'}`}
                  >
                    {task.label}
                  </p>
                  {!task.done && (
                    <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5">
                      {task.tip}
                    </p>
                  )}
                </div>
                {!task.done && (
                  <span className="shrink-0 text-[10px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-900/20 px-1.5 py-0.5 rounded-full border border-emerald-200 dark:border-emerald-800">
                    +{task.gain}점
                  </span>
                )}
              </div>
            ))}
          </div>
          {pct === 100 && (
            <p className="mt-2 text-[11px] text-center text-sky-600 dark:text-sky-400 font-medium">
              🎉 완벽한 이력서! 이제 공개로 전환해 보세요.
            </p>
          )}
        </div>
      )}
    </div>
  );
}

export default function EditResumePage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { data: resumeData, error: resumeError } = useResume(id);
  const resume: Resume | null = (resumeData as Resume | undefined) ?? null;
  const notFound = !!resumeError;
  const [saving, setSaving] = useState(false);
  const [showAttachments, setShowAttachments] = useState(false);
  const [showVersions, setShowVersions] = useState(false);
  const [liveData, setLiveData] = useState<Partial<Resume> | null>(null);

  const loadResume = () => {
    queryClient.invalidateQueries({ queryKey: ['resume', id] });
  };

  useEffect(() => {
    if (resume) setLiveData(resume);
  }, [resume?.id]);

  useEffect(() => {
    if (resume) {
      document.title = `${resume.title || '이력서'} 수정 — 이력서공방`;
    }
    return () => {
      document.title = '이력서공방 - AI 기반 이력서 관리 플랫폼';
    };
  }, [resume]);

  const handleSave = async (data: Omit<Resume, 'id' | 'createdAt' | 'updatedAt'>) => {
    if (!id) return;
    setSaving(true);
    try {
      await updateResume(id, data);
      toast('이력서가 저장되었습니다', 'success');
      if (id) navigate(ROUTES.resume.preview(id));
    } catch {
      toast('저장에 실패했습니다. 다시 시도해주세요.', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleAutoSave = async (data: Omit<Resume, 'id' | 'createdAt' | 'updatedAt'>) => {
    if (!id) return;
    try {
      await updateResume(id, data);
    } catch {
      // auto-save failures are silent; the indicator in ResumeForm will show error
      throw new Error('auto-save failed');
    }
  };

  const handleDataChange = useCallback((data: Omit<Resume, 'id' | 'createdAt' | 'updatedAt'>) => {
    setLiveData(data as Partial<Resume>);
  }, []);

  const liveAnalysisText = useMemo(() => buildResumePlainText(liveData), [liveData]);
  // 분석기 패널은 타이핑 중에는 뒤로 미루어 입력 레이턴시 보호 — useDeferredValue 가 유휴 시간에 재렌더.
  const deferredAnalysisText = useDeferredValue(liveAnalysisText);

  if (notFound) {
    return (
      <>
        <Header />
        <main id="main-content" className="flex-1 flex items-center justify-center" role="main">
          <div className="text-center px-4 animate-fade-in">
            <div className="mx-auto mb-4 w-16 h-16 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center">
              <svg
                className="w-8 h-8 text-slate-400 dark:text-slate-500"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={1.5}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m6.75 12H9.75m0 0l2.25-2.25M9.75 15l2.25 2.25M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            </div>
            <p className="text-lg font-medium text-slate-700 dark:text-slate-300 mb-1">
              이력서를 찾을 수 없습니다
            </p>
            <p className="text-sm text-slate-500 dark:text-slate-400 mb-5">
              삭제되었거나 존재하지 않는 이력서입니다.
            </p>
            <button
              onClick={() => navigate(ROUTES.home)}
              className="text-blue-600 hover:underline focus:outline-none focus:ring-2 focus:ring-blue-500 rounded"
            >
              목록으로 돌아가기
            </button>
          </div>
        </main>
      </>
    );
  }

  if (!resume) {
    return (
      <>
        <Header />
        <main
          id="main-content"
          className="flex-1 max-w-4xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-6 sm:py-8"
          role="main"
        >
          <div className="h-8 bg-slate-200 dark:bg-slate-700 rounded w-48 mb-6 animate-pulse" />
          <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-6">
            <FormSkeleton />
          </div>
        </main>
      </>
    );
  }

  return (
    <>
      <Header />
      <main
        id="main-content"
        className="flex-1 max-w-4xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-6 sm:py-8"
        role="main"
      >
        <Breadcrumb
          items={[
            { label: resume.title || '이력서', to: `/resumes/${id}/preview` },
            { label: '수정' },
          ]}
        />
        {resume.updatedAt && (
          <p className="text-xs text-slate-400 dark:text-slate-500 mb-4">
            마지막 저장: {new Date(resume.updatedAt).toLocaleString('ko-KR')}
          </p>
        )}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-6">
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-slate-100">
            이력서 수정
          </h1>
          <div className="flex items-center gap-3 flex-wrap">
            {/* 공개 설정 */}
            {id && (
              <select
                value={resume.visibility || 'private'}
                onChange={async (e) => {
                  await setResumeVisibility(id, e.target.value);
                  loadResume();
                }}
                className="px-3 py-1.5 text-xs border border-slate-300 dark:border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-slate-700 dark:text-slate-100"
                aria-label="공개 설정"
              >
                <option value="private">비공개</option>
                <option value="public">공개</option>
                <option value="link-only">링크만 공개</option>
              </select>
            )}
            <button
              onClick={() => setShowAttachments(true)}
              className="px-3 py-1.5 text-xs border border-slate-300 dark:border-slate-600 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors text-slate-600 dark:text-slate-300"
            >
              첨부파일
            </button>
            <button
              onClick={() => setShowVersions(true)}
              className="px-3 py-1.5 text-xs border border-slate-300 dark:border-slate-600 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors text-slate-600 dark:text-slate-300"
            >
              버전 이력
            </button>
            {id && (
              <TagSelector resumeId={id} currentTags={resume.tags || []} onUpdate={loadResume} />
            )}
          </div>
        </div>

        {/* Live completeness indicator */}
        {liveData && (
          <>
            <LiveCompletenessBar resume={liveData} />
            <LiveAtsBadge resume={liveData} />
          </>
        )}

        {/* Live resume analysis panels (text ≥ 200자일 때만 렌더) */}
        {deferredAnalysisText.length >= 200 && (
          <div className="mb-4 space-y-2">
            <OverallHealthGauge text={deferredAnalysisText} />
            <div className="rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 p-3">
              <InterviewabilityRow text={deferredAnalysisText} />
            </div>
            <CareerGapPanel text={deferredAnalysisText} />
            <QuotableHighlights text={deferredAnalysisText} />
          </div>
        )}

        <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-4 sm:p-6">
          <ResumeForm
            resumeId={id}
            initialData={{
              title: resume.title,
              personalInfo: resume.personalInfo,
              experiences: resume.experiences,
              educations: resume.educations,
              skills: resume.skills,
              projects: resume.projects,
              certifications: resume.certifications,
              languages: resume.languages,
              awards: resume.awards,
              activities: resume.activities,
            }}
            onSave={handleSave}
            onAutoSave={handleAutoSave}
            onDataChange={handleDataChange}
            saving={saving}
          />
        </div>
      </main>
      {showAttachments && id && (
        <AttachmentPanel resumeId={id} onClose={() => setShowAttachments(false)} />
      )}
      {showVersions && id && (
        <VersionPanel
          resumeId={id}
          onClose={() => setShowVersions(false)}
          onRestore={() => {
            loadResume();
          }}
        />
      )}
    </>
  );
}
