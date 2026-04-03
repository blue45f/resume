import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Header from '@/components/Header';
import Breadcrumb from '@/components/Breadcrumb';
import ResumeForm from '@/components/ResumeForm';
import { FormSkeleton } from '@/components/Skeleton';
import { toast } from '@/components/Toast';
import TagSelector from '@/components/TagSelector';
import AttachmentPanel from '@/components/AttachmentPanel';
import VersionPanel from '@/components/VersionPanel';
import type { Resume } from '@/types/resume';
import { fetchResume, updateResume, setResumeVisibility } from '@/lib/api';

export default function EditResumePage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [resume, setResume] = useState<Resume | null>(null);
  const [notFound, setNotFound] = useState(false);
  const [saving, setSaving] = useState(false);
  const [showAttachments, setShowAttachments] = useState(false);
  const [showVersions, setShowVersions] = useState(false);

  const loadResume = () => {
    if (!id) return;
    fetchResume(id).then(setResume).catch(() => setNotFound(true));
  };

  useEffect(() => {
    let cancelled = false;
    if (!id) return;
    fetchResume(id)
      .then(data => { if (!cancelled) setResume(data); })
      .catch(() => { if (!cancelled) setNotFound(true); });
    return () => { cancelled = true; };
  }, [id]);

  useEffect(() => {
    if (resume) {
      document.title = `${resume.title || '이력서'} 수정 — 이력서공방`;
    }
    return () => { document.title = '이력서공방 - AI 기반 이력서 관리 플랫폼'; };
  }, [resume]);

  const handleSave = async (data: Omit<Resume, 'id' | 'createdAt' | 'updatedAt'>) => {
    if (!id) return;
    setSaving(true);
    try {
      await updateResume(id, data);
      toast('이력서가 저장되었습니다', 'success');
      navigate(`/resumes/${id}/preview`);
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

  if (notFound) {
    return (
      <>
        <Header />
        <main id="main-content" className="flex-1 flex items-center justify-center" role="main">
          <div className="text-center px-4 animate-fade-in">
            <div className="mx-auto mb-4 w-16 h-16 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center">
              <svg className="w-8 h-8 text-slate-400 dark:text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m6.75 12H9.75m0 0l2.25-2.25M9.75 15l2.25 2.25M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <p className="text-lg font-medium text-slate-700 dark:text-slate-300 mb-1">이력서를 찾을 수 없습니다</p>
            <p className="text-sm text-slate-500 dark:text-slate-400 mb-5">삭제되었거나 존재하지 않는 이력서입니다.</p>
            <button onClick={() => navigate('/')} className="text-blue-600 hover:underline focus:outline-none focus:ring-2 focus:ring-blue-500 rounded">
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
        <main id="main-content" className="flex-1 max-w-4xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-6 sm:py-8" role="main">
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
      <main id="main-content" className="flex-1 max-w-4xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-6 sm:py-8" role="main">
        <Breadcrumb items={[
          { label: resume.title || '이력서', to: `/resumes/${id}/preview` },
          { label: '수정' },
        ]} />
        {resume.updatedAt && (
          <p className="text-xs text-slate-400 dark:text-slate-500 mb-4">
            마지막 저장: {new Date(resume.updatedAt).toLocaleString('ko-KR')}
          </p>
        )}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-6">
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-slate-100">이력서 수정</h1>
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
              <TagSelector
                resumeId={id}
                currentTags={resume.tags || []}
                onUpdate={loadResume}
              />
            )}
          </div>
        </div>
        <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-4 sm:p-6">
          <ResumeForm
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
          onRestore={() => { loadResume(); }}
        />
      )}
    </>
  );
}
