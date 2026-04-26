import { useState } from 'react';
import type { Resume } from '@/types/resume';
import { aiInlineAssist } from '@/lib/api';

interface Props {
  resumeId?: string;
  resume: Omit<Resume, 'id' | 'createdAt' | 'updatedAt'>;
  onAccept: (summary: string) => void;
}

/**
 * AI Summary Generator - generates a professional summary paragraph
 * from the user's experience, skills, and education data.
 * Shows when the summary field is empty.
 */
export default function AiSummaryGenerator({ resumeId, resume, onAccept }: Props) {
  const [loading, setLoading] = useState(false);
  const [preview, setPreview] = useState<string | null>(null);
  const [error, setError] = useState('');

  const plainSummary = (resume.personalInfo.summary || '').replace(/<[^>]*>/g, '').trim();

  // Only show when summary is empty or very short
  if (plainSummary.length > 20) return null;

  // Build context string from resume data for the AI prompt
  function buildContextForAI(): string {
    const parts: string[] = [];

    if (resume.personalInfo.name) {
      parts.push(`이름: ${resume.personalInfo.name}`);
    }

    if (resume.experiences.length > 0) {
      const expSummary = resume.experiences
        .map((e) => {
          const period = e.current ? '현재 재직 중' : '';
          return `${e.company} ${e.position || ''} ${e.department || ''} ${period}`.trim();
        })
        .join(', ');
      parts.push(`경력: ${expSummary}`);
    }

    if (resume.skills.length > 0) {
      const skillSummary = resume.skills.map((s) => `${s.category}: ${s.items}`).join('; ');
      parts.push(`기술: ${skillSummary}`);
    }

    if (resume.educations.length > 0) {
      const eduSummary = resume.educations
        .map((e) => `${e.school} ${e.degree || ''} ${e.field || ''}`.trim())
        .join(', ');
      parts.push(`학력: ${eduSummary}`);
    }

    if (resume.projects.length > 0) {
      const projSummary = resume.projects.map((p) => p.name).join(', ');
      parts.push(`프로젝트: ${projSummary}`);
    }

    if (resume.certifications.length > 0) {
      const certSummary = resume.certifications.map((c) => c.name).join(', ');
      parts.push(`자격증: ${certSummary}`);
    }

    return parts.join('\n');
  }

  const hasEnoughData =
    resume.experiences.length > 0 || resume.skills.length > 0 || resume.educations.length > 0;

  const handleGenerate = async () => {
    if (!resumeId) {
      setError('이력서를 먼저 저장해주세요.');
      return;
    }
    if (!hasEnoughData) {
      setError('경력, 기술, 학력 중 최소 1개를 먼저 입력해주세요.');
      return;
    }

    setLoading(true);
    setError('');
    setPreview(null);

    try {
      const context = buildContextForAI();
      const prompt = `다음 이력서 정보를 바탕으로 전문적인 자기소개 문단을 3-5문장으로 작성해주세요. 1인칭으로, 핵심 역량과 경력 하이라이트를 포함하세요.\n\n${context}`;
      const res = await aiInlineAssist(resumeId, prompt, 'improve');
      setPreview(res.improved);
    } catch (err: any) {
      setError(err?.message || 'AI 요청에 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  const handleAccept = () => {
    if (preview) {
      onAccept(preview);
      setPreview(null);
    }
  };

  const handleRegenerate = () => {
    setPreview(null);
    handleGenerate();
  };

  return (
    <div className="mt-2 rounded-xl border border-dashed border-sky-300 dark:border-sky-700 bg-sky-50/50 dark:bg-sky-900/10 p-4">
      {/* Header */}
      <div className="flex items-center gap-2 mb-2">
        <svg
          className="w-5 h-5 text-sky-500"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth={2}
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.455 2.456L21.75 6l-1.036.259a3.375 3.375 0 00-2.455 2.456zM16.894 20.567L16.5 21.75l-.394-1.183a2.25 2.25 0 00-1.423-1.423L13.5 18.75l1.183-.394a2.25 2.25 0 001.423-1.423l.394-1.183.394 1.183a2.25 2.25 0 001.423 1.423l1.183.394-1.183.394a2.25 2.25 0 00-1.423 1.423z"
          />
        </svg>
        <p className="text-sm font-medium text-sky-700 dark:text-sky-400">
          자기소개가 비어있습니다
        </p>
      </div>
      <p className="text-xs text-slate-500 dark:text-slate-400 mb-3">
        경력, 기술, 학력 정보를 바탕으로 AI가 전문적인 자기소개를 생성해 드립니다.
      </p>

      {/* Error */}
      {error && (
        <div className="mb-3 px-3 py-2 text-xs text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/10 rounded-lg border border-red-200 dark:border-red-800">
          {error}
        </div>
      )}

      {/* Loading */}
      {loading && (
        <div className="flex items-center justify-center gap-2 py-6">
          <svg className="w-5 h-5 animate-spin text-sky-500" fill="none" viewBox="0 0 24 24">
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
            />
          </svg>
          <span className="text-sm text-sky-600 dark:text-sky-400">
            AI가 자기소개를 작성 중입니다...
          </span>
        </div>
      )}

      {/* Preview */}
      {preview && !loading && (
        <div className="space-y-3">
          <div className="p-3 bg-white dark:bg-slate-800 rounded-lg border border-sky-200 dark:border-sky-800">
            <p className="text-xs font-medium text-slate-500 dark:text-slate-400 mb-1.5">
              AI 생성 결과:
            </p>
            <p className="text-sm text-slate-800 dark:text-slate-200 leading-relaxed whitespace-pre-wrap">
              {preview}
            </p>
          </div>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={handleAccept}
              className="flex-1 px-4 py-2 text-sm font-medium text-white bg-sky-600 rounded-lg hover:bg-sky-700 transition-colors"
            >
              적용
            </button>
            <button
              type="button"
              onClick={handleRegenerate}
              className="flex-1 px-4 py-2 text-sm font-medium text-sky-600 dark:text-sky-400 bg-sky-100 dark:bg-sky-900/30 rounded-lg hover:bg-sky-200 dark:hover:bg-sky-800/40 transition-colors"
            >
              다시 생성
            </button>
          </div>
        </div>
      )}

      {/* Generate Button (initial state) */}
      {!preview && !loading && (
        <button
          type="button"
          onClick={handleGenerate}
          disabled={!hasEnoughData}
          className="w-full flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-medium text-white bg-sky-700 rounded-lg hover:from-blue-700 hover:to-sky-700 disabled:opacity-40 disabled:cursor-not-allowed transition-all shadow-sm hover:shadow-md"
        >
          <svg
            className="w-4 h-4"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09z"
            />
          </svg>
          AI로 자기소개 생성
        </button>
      )}

      {!hasEnoughData && !loading && !preview && (
        <p className="mt-2 text-xs text-slate-400 dark:text-slate-500 text-center">
          경력, 기술, 학력 탭에서 정보를 먼저 입력하면 더 정확한 자기소개를 생성할 수 있습니다.
        </p>
      )}
    </div>
  );
}
