import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Header from '@/components/Header';
import ResumeForm from '@/components/ResumeForm';
import TagSelector from '@/components/TagSelector';
import type { Resume } from '@/types/resume';
import { fetchResume, updateResume } from '@/lib/api';

export default function EditResumePage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [resume, setResume] = useState<Resume | null>(null);
  const [notFound, setNotFound] = useState(false);
  const [saving, setSaving] = useState(false);

  const loadResume = () => {
    if (!id) return;
    fetchResume(id).then(setResume).catch(() => setNotFound(true));
  };

  useEffect(() => { loadResume(); }, [id]);

  const handleSave = async (data: Omit<Resume, 'id' | 'createdAt' | 'updatedAt'>) => {
    if (!id) return;
    setSaving(true);
    try {
      await updateResume(id, data);
      navigate(`/resumes/${id}/preview`);
    } finally {
      setSaving(false);
    }
  };

  if (notFound) {
    return (
      <>
        <Header />
        <main id="main-content" className="flex-1 flex items-center justify-center" role="main">
          <div className="text-center px-4">
            <p className="text-lg text-slate-700 mb-4">이력서를 찾을 수 없습니다</p>
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
        <main id="main-content" className="flex-1 flex items-center justify-center" role="main">
          <p className="text-slate-500" aria-live="polite">불러오는 중...</p>
        </main>
      </>
    );
  }

  return (
    <>
      <Header />
      <main id="main-content" className="flex-1 max-w-4xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-6 sm:py-8" role="main">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-6">
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900">이력서 수정</h1>
          {id && (
            <TagSelector
              resumeId={id}
              currentTags={resume.tags || []}
              onUpdate={loadResume}
            />
          )}
        </div>
        <div className="bg-white rounded-xl border border-slate-200 p-4 sm:p-6">
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
            saving={saving}
          />
        </div>
      </main>
    </>
  );
}
