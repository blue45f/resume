import { useState } from 'react';
import type { Resume } from '@/types/resume';
import { enhanceResumeWithDocument, updateResume } from '@/lib/api';
import { toast } from '@/components/Toast';

interface Props {
  resumeId: string;
  resume: Resume;
  onApplied?: (resume: Resume) => void;
}

/**
 * DocumentEnhancePanel — 외부 문서 업로드/붙여넣기 → AI 기존 이력서 고도화.
 * 서버 POST /transform/enhance-with-document 호출.
 * 결과는 diff 요약만 보여주고 '적용' 누르면 updateResume.
 */
export default function DocumentEnhancePanel({ resumeId, resume, onApplied }: Props) {
  const [expanded, setExpanded] = useState(false);
  const [docText, setDocText] = useState('');
  const [instruction, setInstruction] = useState('');
  const [loading, setLoading] = useState(false);
  const [applying, setApplying] = useState(false);
  const [preview, setPreview] = useState<{
    enhanced: Omit<Resume, 'id' | 'createdAt' | 'updatedAt'>;
    changes: string[];
  } | null>(null);

  const handleFile = async (file: File) => {
    // 텍스트 파일만 직접 읽기 — PDF/DOCX 는 사용자가 텍스트로 붙여넣도록 안내
    const typeOk =
      file.type.startsWith('text/') ||
      file.name.endsWith('.txt') ||
      file.name.endsWith('.md') ||
      file.name.endsWith('.json');
    if (!typeOk) {
      toast('PDF/DOCX 는 내용을 복사해서 붙여넣어 주세요 (.txt/.md/.json 만 직접 업로드)', 'info');
      return;
    }
    if (file.size > 500 * 1024) {
      toast('500KB 이하의 파일만 업로드할 수 있습니다', 'error');
      return;
    }
    const text = await file.text();
    setDocText(text.slice(0, 15000));
  };

  const analyze = async () => {
    if (docText.trim().length < 30) {
      toast('최소 30자 이상의 문서 텍스트를 입력하세요', 'info');
      return;
    }
    setLoading(true);
    setPreview(null);
    try {
      const r = await enhanceResumeWithDocument(resumeId, docText, instruction || undefined);
      setPreview({ enhanced: r.enhanced, changes: r.changes });
    } catch (e) {
      toast(e instanceof Error ? e.message : 'AI 고도화 실패', 'error');
    } finally {
      setLoading(false);
    }
  };

  const apply = async () => {
    if (!preview) return;
    setApplying(true);
    try {
      const merged: Resume = {
        ...resume,
        ...(preview.enhanced as any),
      };
      // updateResume 은 id/createdAt/updatedAt 을 제외함 — 기존 payload 구조 유지
      const { id: _a, createdAt: _b, updatedAt: _c, ...payload } = merged;
      void _a;
      void _b;
      void _c;
      await updateResume(resumeId, payload as any);
      toast(`이력서 고도화 완료 (${preview.changes.length}건 변경)`, 'success');
      onApplied?.(merged);
      setPreview(null);
      setDocText('');
      setInstruction('');
    } catch (e) {
      toast(e instanceof Error ? e.message : '이력서 저장 실패', 'error');
    } finally {
      setApplying(false);
    }
  };

  return (
    <div className="imp-card bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-4 no-print">
      <button
        onClick={() => setExpanded((v) => !v)}
        className="w-full flex items-center justify-between focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-accent)] focus-visible:ring-offset-2 rounded-[var(--radius-sm)]"
        aria-expanded={expanded}
      >
        <div className="flex items-center gap-2 min-w-0">
          <span aria-hidden className="text-base">
            📥
          </span>
          <h3 className="text-sm font-semibold text-slate-800 dark:text-slate-200 shrink-0">
            외부 문서로 이력서 고도화
          </h3>
          <span className="text-[11px] text-slate-400 dark:text-slate-500 hidden sm:inline truncate">
            기존 이력서 + LinkedIn/예전 이력서 텍스트 → AI 병합·보완
          </span>
        </div>
        <svg
          className={`w-4 h-4 text-slate-400 transition-transform shrink-0 ${expanded ? 'rotate-180' : ''}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
          aria-hidden
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {expanded && (
        <div className="mt-4 space-y-3 animate-in fade-in-0 duration-200">
          {!preview && (
            <>
              <label className="block">
                <span className="text-xs font-medium text-slate-600 dark:text-slate-300">
                  문서 내용 붙여넣기
                </span>
                <textarea
                  value={docText}
                  onChange={(e) => setDocText(e.target.value.slice(0, 15000))}
                  rows={8}
                  placeholder="예전 이력서, LinkedIn 프로필 복사, 프로젝트 노트, 성과 메모 등을 여기 붙여넣으세요 (최대 15,000자)"
                  className="mt-1.5 w-full px-3 py-2 text-sm rounded-lg border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/30 resize-y"
                />
              </label>
              <div className="flex items-center justify-between gap-2 text-[11px] text-slate-400">
                <label className="inline-flex items-center gap-1 cursor-pointer hover:text-blue-600 dark:hover:text-blue-400">
                  <input
                    type="file"
                    accept=".txt,.md,.json"
                    onChange={(e) => {
                      const f = e.target.files?.[0];
                      if (f) handleFile(f);
                    }}
                    className="hidden"
                  />
                  <span aria-hidden>📎</span> 텍스트 파일 업로드 (.txt / .md / .json)
                </label>
                <span>{docText.length.toLocaleString()}/15,000자</span>
              </div>
              <input
                type="text"
                value={instruction}
                onChange={(e) => setInstruction(e.target.value.slice(0, 500))}
                placeholder="추가 지시 (선택) — 예: '경력 위주로 보완', '성과를 수치로 구체화'"
                className="w-full px-3 py-2 text-sm rounded-lg border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700"
              />
              <div className="flex flex-wrap items-center justify-between gap-2">
                <p className="text-[10px] text-slate-400 leading-relaxed max-w-md">
                  💡 PDF/DOCX 는 내용을 복사해서 위 영역에 붙여넣어 주세요. 원본 이력서의 모든
                  필드는 보존되며, 누락·중복 정보만 자동 보완됩니다.
                </p>
                <button
                  type="button"
                  onClick={analyze}
                  disabled={loading || docText.trim().length < 30}
                  className="px-3 py-1.5 text-xs font-semibold bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                >
                  {loading ? 'AI 분석 중…' : 'AI 고도화 미리보기'}
                </button>
              </div>
            </>
          )}

          {preview && (
            <>
              <div className="p-3 rounded-lg bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800">
                <p className="text-sm font-semibold text-emerald-800 dark:text-emerald-200">
                  변경 요약 ({preview.changes.length}건)
                </p>
                {preview.changes.length > 0 ? (
                  <ul className="mt-2 space-y-1 list-disc list-inside text-xs text-emerald-700 dark:text-emerald-300">
                    {preview.changes.map((c, i) => (
                      <li key={i} className="leading-relaxed">
                        {c}
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="mt-1 text-xs text-emerald-700 dark:text-emerald-300">
                    외부 문서에 새 정보가 없어 의미 있는 변경이 없습니다.
                  </p>
                )}
              </div>
              <div className="flex flex-wrap items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setPreview(null)}
                  disabled={applying}
                  className="px-3 py-1.5 text-xs text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white disabled:opacity-50"
                >
                  다시 작성
                </button>
                <button
                  type="button"
                  onClick={apply}
                  disabled={applying || preview.changes.length === 0}
                  className="px-4 py-1.5 text-xs font-semibold bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 disabled:opacity-50"
                >
                  {applying ? '저장 중…' : '이력서에 적용'}
                </button>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}
