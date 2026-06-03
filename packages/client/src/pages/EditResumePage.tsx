import { useDeferredValue, useEffect, useMemo, useState, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Header from '@/components/Header';
import Breadcrumb from '@/components/Breadcrumb';
import ResumeForm from '@/components/ResumeForm';
import { toast } from '@/components/Toast';
import LiveAtsBadge from '@/components/LiveAtsBadge';
import { buildResumePlainText } from '@/lib/resumeText';
import type { Resume } from '@/types/resume';
import { useQueryClient } from '@tanstack/react-query';
import { updateResume } from '@/lib/api';
import { useResume } from '@/hooks/useResources';
import { ROUTES } from '@/lib/routes';
import LiveCompletenessBar from '@/features/edit-resume/LiveCompletenessBar';
import EditResumeToolbar from '@/features/edit-resume/EditResumeToolbar';
import ResumeAnalysisPanels from '@/features/edit-resume/ResumeAnalysisPanels';
import EditResumeNotFound from '@/features/edit-resume/EditResumeNotFound';
import EditResumeLoading from '@/features/edit-resume/EditResumeLoading';
import EditResumeDialogs from '@/features/edit-resume/EditResumeDialogs';

export default function EditResumePage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { data: resumeData, error: resumeError } = useResume(id);
  const resume: Resume | null = (resumeData as Resume | undefined) ?? null;
  const notFound = !!resumeError;

  // ResumeForm은 initialData 참조가 바뀌면 reset()을 호출한다(계약). 인라인 객체
  // 리터럴을 넘기면 매 렌더 새 참조가 되어 reset→onDataChange→setLiveData→재렌더가
  // 무한 루프가 된다. React Query의 resume는 fetch 단위로 안정적이므로, 그 참조에
  // 묶어 메모이즈해 실제 데이터 로드 시에만 initialData 참조가 바뀌도록 한다.
  const formInitialData = useMemo(
    () =>
      resume
        ? {
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
          }
        : null,
    [resume],
  );
  const [saving, setSaving] = useState(false);
  const [showAttachments, setShowAttachments] = useState(false);
  const [showVersions, setShowVersions] = useState(false);
  const [showAllowedViewers, setShowAllowedViewers] = useState(false);
  const [liveData, setLiveData] = useState<Partial<Resume> | null>(null);
  const [liveSyncedId, setLiveSyncedId] = useState<string | null>(null);

  const loadResume = () => {
    queryClient.invalidateQueries({ queryKey: ['resume', id] });
  };

  // Sync liveData when the loaded resume id changes (React's recommended
  // pattern for "reset state when a prop changes" — no effect needed).
  if (resume && resume.id !== liveSyncedId) {
    setLiveSyncedId(resume.id);
    setLiveData(resume);
  }

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
    return <EditResumeNotFound onBackHome={() => navigate(ROUTES.home)} />;
  }

  if (!resume) {
    return <EditResumeLoading />;
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
          <p className="text-xs text-slate-500 dark:text-slate-400 mb-4">
            마지막 저장: {new Date(resume.updatedAt).toLocaleString('ko-KR')}
          </p>
        )}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-6">
          <h1 className="heading-accent text-xl sm:text-2xl font-bold text-slate-900 dark:text-slate-100">
            이력서 수정
          </h1>
          <EditResumeToolbar
            id={id}
            resume={resume}
            onReload={loadResume}
            onShowAttachments={() => setShowAttachments(true)}
            onShowVersions={() => setShowVersions(true)}
            onShowAllowedViewers={() => setShowAllowedViewers(true)}
          />
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
          <ResumeAnalysisPanels
            text={deferredAnalysisText}
            id={id}
            title={liveData?.title ?? resume.title ?? ''}
          />
        )}

        <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-4 sm:p-6">
          <ResumeForm
            resumeId={id}
            initialData={formInitialData!}
            onSave={handleSave}
            onAutoSave={handleAutoSave}
            onDataChange={handleDataChange}
            saving={saving}
          />
        </div>
      </main>
      <EditResumeDialogs
        id={id}
        showAttachments={showAttachments}
        showVersions={showVersions}
        showAllowedViewers={showAllowedViewers}
        onCloseAttachments={() => setShowAttachments(false)}
        onCloseVersions={() => setShowVersions(false)}
        onCloseAllowedViewers={() => setShowAllowedViewers(false)}
        onRestoreVersion={() => {
          loadResume();
        }}
      />
    </>
  );
}
