import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Header from '@/components/Header';
import ResumeForm from '@/components/ResumeForm';
import { toast } from '@/components/Toast';
import { createEmptyResumeData } from '@/types/resume';
import type { Resume, Template } from '@/types/resume';
import { createResume, fetchTemplates } from '@/lib/api';

const SECTION_LABELS: Record<string, string> = {
  personalInfo: '인적사항', summary: '자기소개', experiences: '경력',
  educations: '학력', skills: '기술', projects: '프로젝트',
  certifications: '자격증', languages: '어학', awards: '수상', activities: '활동',
};

function parseLayout(layout: string) {
  try {
    return JSON.parse(layout);
  } catch {
    return {};
  }
}

export default function NewResumePage() {
  const navigate = useNavigate();
  const [saving, setSaving] = useState(false);
  const [templates, setTemplates] = useState<Template[]>([]);
  const [selectedTemplate, setSelectedTemplate] = useState<string | null>(null);
  const [step, setStep] = useState<'template' | 'form'>('template');

  useEffect(() => {
    let cancelled = false;
    fetchTemplates().then(t => { if (!cancelled) setTemplates(t); }).catch(() => {});
    return () => { cancelled = true; };
  }, []);

  const handleSave = async (data: Omit<Resume, 'id' | 'createdAt' | 'updatedAt'>) => {
    setSaving(true);
    try {
      const result = await createResume(data);
      toast('이력서가 생성되었습니다', 'success');
      navigate(`/resumes/${result.id}/edit`);
    } catch {
      toast('이력서 생성에 실패했습니다', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleSkip = () => {
    setSelectedTemplate(null);
    setStep('form');
  };

  const handleSelectTemplate = (id: string) => {
    setSelectedTemplate(id);
    setStep('form');
  };

  const selected = templates.find(t => t.id === selectedTemplate);

  return (
    <>
      <Header />
      <main id="main-content" className="flex-1 max-w-4xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-6 sm:py-8" role="main">
        {step === 'template' ? (
          <>
            <div className="flex items-center justify-between mb-6">
              <div>
                <h1 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-slate-100">템플릿 선택</h1>
                <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">이력서 양식을 먼저 선택하세요. 나중에 변경할 수 있습니다.</p>
              </div>
              <button
                onClick={handleSkip}
                className="text-sm text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500 rounded px-3 py-1.5"
              >
                건너뛰기
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {/* Blank template */}
              <button
                onClick={handleSkip}
                className="text-left bg-white dark:bg-slate-800 rounded-xl border-2 border-dashed border-slate-300 dark:border-slate-600 p-5 hover:border-blue-400 hover:bg-blue-50/30 dark:hover:bg-blue-900/20 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <div className="text-2xl mb-2" aria-hidden="true">📝</div>
                <h3 className="font-semibold text-slate-900 dark:text-slate-100">빈 이력서</h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">처음부터 직접 작성합니다</p>
              </button>

              {templates.map(t => {
                const layout = parseLayout(t.layout || '{}');
                const sections: string[] = layout.sections || [];

                return (
                  <button
                    key={t.id}
                    onClick={() => handleSelectTemplate(t.id)}
                    className="text-left bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-5 hover:border-blue-400 hover:shadow-md transition-all focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <div className="flex items-start justify-between mb-2">
                      <h3 className="font-semibold text-slate-900 dark:text-slate-100">{t.name}</h3>
                      {t.isDefault && (
                        <span className="px-1.5 py-0.5 text-xs bg-blue-100 text-blue-700 rounded-full shrink-0">기본</span>
                      )}
                    </div>
                    {t.description && (
                      <p className="text-xs text-slate-500 dark:text-slate-400 mb-3 line-clamp-2">{t.description}</p>
                    )}
                    {sections.length > 0 && (
                      <div className="flex flex-wrap gap-1">
                        {sections.slice(0, 5).map(s => (
                          <span key={s} className="px-1.5 py-0.5 text-xs bg-slate-100 dark:bg-slate-700 text-slate-500 dark:text-slate-400 rounded">
                            {SECTION_LABELS[s] || s}
                          </span>
                        ))}
                        {sections.length > 5 && (
                          <span className="px-1.5 py-0.5 text-xs bg-slate-100 dark:bg-slate-700 text-slate-400 dark:text-slate-500 rounded">
                            +{sections.length - 5}
                          </span>
                        )}
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          </>
        ) : (
          <>
            <div className="flex items-center gap-3 mb-6">
              <button
                onClick={() => setStep('template')}
                className="text-sm text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500 rounded"
              >
                &larr; 템플릿 선택
              </button>
              <h1 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-slate-100">
                새 이력서 작성
              </h1>
              {selected && (
                <span className="px-2 py-0.5 text-xs bg-blue-100 text-blue-700 rounded-full">
                  {selected.name}
                </span>
              )}
            </div>
            <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-4 sm:p-6">
              <ResumeForm initialData={createEmptyResumeData()} onSave={handleSave} saving={saving} />
            </div>
          </>
        )}
      </main>
    </>
  );
}
