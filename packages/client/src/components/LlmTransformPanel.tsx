import { useState, useCallback, useEffect } from 'react';
import * as RadixDialog from '@radix-ui/react-dialog';
import {
  transformResumeStream,
  localTransform,
  fetchPresets,
  fetchTemplates,
  fetchLlmProviders,
} from '@/lib/api';
import type { Template, LlmProvider } from '@/types/resume';

const LLM_TEMPLATES = [
  { value: 'standard', label: '표준 이력서', icon: '📄' },
  { value: 'career-description', label: '경력기술서', icon: '💼' },
  { value: 'cover-letter', label: '자기소개서', icon: '✉️' },
  { value: 'developer', label: '개발자 이력서', icon: '💻' },
  { value: 'designer', label: '디자이너 이력서', icon: '🎨' },
  { value: 'english', label: '영문 이력서', icon: '🌐' },
  { value: 'linkedin', label: 'LinkedIn 프로필', icon: '🔗' },
] as const;

interface Props {
  resumeId: string;
  onClose: () => void;
}

export default function LlmTransformPanel({ resumeId, onClose }: Props) {
  const [mode, setMode] = useState<'local' | 'llm'>('local');

  // Local transform state
  const [presets, setPresets] = useState<{ id: string; name: string; description: string }[]>([]);
  const [templates, setTemplates] = useState<Template[]>([]);
  const [selectedPreset, setSelectedPreset] = useState('standard');
  const [selectedTemplate, setSelectedTemplate] = useState('');
  const [localSource, setLocalSource] = useState<'preset' | 'template'>('preset');

  // LLM state
  const [templateType, setTemplateType] = useState('standard');
  const [targetLanguage, setTargetLanguage] = useState('ko');
  const [jobDescription, setJobDescription] = useState('');
  const [llmProviders, setLlmProviders] = useState<LlmProvider[]>([]);
  const [, setSelectedProvider] = useState('');

  // Common state
  const [result, setResult] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [tokensUsed, setTokensUsed] = useState(0);

  useEffect(() => {
    fetchPresets()
      .then(setPresets)
      .catch(() => {});
    fetchTemplates()
      .then(setTemplates)
      .catch(() => {});
    fetchLlmProviders(resumeId)
      .then((providers) => {
        setLlmProviders(providers);
        const def = providers.find((p) => p.isDefault);
        if (def) setSelectedProvider(def.name);
      })
      .catch(() => {});
  }, [resumeId]);

  const handleLocalTransform = useCallback(async () => {
    setLoading(true);
    setError('');
    setResult('');
    try {
      const data =
        localSource === 'template' && selectedTemplate
          ? { templateId: selectedTemplate }
          : { preset: selectedPreset };
      const res = await localTransform(resumeId, data);
      setResult(res.text);
    } catch (err: any) {
      setError(err.message || '변환에 실패했습니다');
    } finally {
      setLoading(false);
    }
  }, [resumeId, localSource, selectedPreset, selectedTemplate]);

  const handleLlmTransform = useCallback(async () => {
    setLoading(true);
    setError('');
    setResult('');
    setTokensUsed(0);
    try {
      let accumulated = '';
      for await (const chunk of transformResumeStream(resumeId, {
        templateType,
        targetLanguage,
        jobDescription: jobDescription || undefined,
      })) {
        if (chunk.type === 'delta' && chunk.text) {
          accumulated += chunk.text;
          setResult(accumulated);
        } else if (chunk.type === 'done') {
          setTokensUsed(chunk.tokensUsed || 0);
        } else if (chunk.type === 'error') {
          setError((chunk as any).message || '변환 중 오류가 발생했습니다');
        }
      }
    } catch (err: any) {
      setError(err.message || '변환 요청에 실패했습니다');
    } finally {
      setLoading(false);
    }
  }, [resumeId, templateType, targetLanguage, jobDescription]);

  const handleTransform = mode === 'local' ? handleLocalTransform : handleLlmTransform;

  const handleCopy = () => navigator.clipboard.writeText(result);

  return (
    <RadixDialog.Root
      open
      onOpenChange={(o) => {
        if (!o) onClose();
      }}
    >
      <RadixDialog.Portal>
        <RadixDialog.Overlay className="fixed inset-0 z-[90] bg-black/40 animate-fade-in" />
        <RadixDialog.Content
          aria-label="이력서 변환"
          aria-describedby={undefined}
          className="fixed z-[91] left-1/2 bottom-0 sm:top-1/2 sm:-translate-y-1/2 -translate-x-1/2 w-full sm:max-w-2xl bg-white dark:bg-neutral-800 sm:rounded-xl max-h-[92vh] flex flex-col rounded-t-xl overflow-hidden focus:outline-none animate-fade-in-up"
        >
          {/* Header */}
          <div className="flex items-center justify-between px-4 sm:px-6 py-3 border-b border-neutral-200 dark:border-neutral-700">
            <RadixDialog.Title className="text-lg font-bold text-neutral-900 dark:text-neutral-100">
              이력서 변환
            </RadixDialog.Title>
            <RadixDialog.Close asChild>
              <button
                className="p-2 text-neutral-400 dark:text-neutral-500 hover:text-neutral-600 dark:hover:text-neutral-300 focus:outline-none focus:ring-2 focus:ring-blue-500 rounded-lg"
                aria-label="닫기"
              >
                <svg
                  className="w-5 h-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  aria-hidden="true"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </RadixDialog.Close>
          </div>

          {/* Mode tabs */}
          <div className="flex border-b border-slate-200 dark:border-slate-700" role="tablist">
            <button
              role="tab"
              aria-selected={mode === 'local'}
              onClick={() => {
                setMode('local');
                setResult('');
                setError('');
              }}
              className={`flex-1 py-2.5 text-sm font-medium text-center transition-colors focus:outline-none ${
                mode === 'local'
                  ? 'text-blue-600 border-b-2 border-blue-600'
                  : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300'
              }`}
            >
              로컬 변환 (무료)
            </button>
            <button
              role="tab"
              aria-selected={mode === 'llm'}
              onClick={() => {
                setMode('llm');
                setResult('');
                setError('');
              }}
              className={`flex-1 py-2.5 text-sm font-medium text-center transition-colors focus:outline-none ${
                mode === 'llm'
                  ? 'text-sky-600 border-b-2 border-sky-700'
                  : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300'
              }`}
            >
              AI 변환 (LLM)
            </button>
          </div>

          {/* Body */}
          <div className="flex-1 overflow-y-auto px-4 sm:px-6 py-4 space-y-4">
            {mode === 'local' ? (
              <>
                {/* Source selection */}
                <div className="flex gap-2">
                  <button
                    onClick={() => setLocalSource('preset')}
                    className={`px-3 py-1.5 text-sm rounded-lg border transition-colors ${
                      localSource === 'preset'
                        ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/30 text-blue-700'
                        : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400'
                    }`}
                  >
                    프리셋
                  </button>
                  <button
                    onClick={() => setLocalSource('template')}
                    className={`px-3 py-1.5 text-sm rounded-lg border transition-colors ${
                      localSource === 'template'
                        ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/30 text-blue-700'
                        : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400'
                    }`}
                  >
                    커스텀 템플릿
                  </button>
                </div>

                {localSource === 'preset' ? (
                  <fieldset>
                    <legend className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                      프리셋 선택
                    </legend>
                    <div className="space-y-2">
                      {presets.map((p) => (
                        <button
                          key={p.id}
                          onClick={() => setSelectedPreset(p.id)}
                          className={`w-full text-left px-4 py-3 rounded-lg border transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                            selectedPreset === p.id
                              ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/30'
                              : 'border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700'
                          }`}
                        >
                          <div className="font-medium text-sm text-slate-900 dark:text-slate-100">
                            {p.name}
                          </div>
                          <div className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                            {p.description}
                          </div>
                        </button>
                      ))}
                    </div>
                  </fieldset>
                ) : (
                  <fieldset>
                    <legend className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                      템플릿 선택
                    </legend>
                    <div className="space-y-2">
                      {templates.map((t) => (
                        <button
                          key={t.id}
                          onClick={() => setSelectedTemplate(t.id)}
                          className={`w-full text-left px-4 py-3 rounded-lg border transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                            selectedTemplate === t.id
                              ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/30'
                              : 'border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700'
                          }`}
                        >
                          <div className="font-medium text-sm text-slate-900 dark:text-slate-100">
                            {t.name}
                          </div>
                          <div className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                            {t.description}
                          </div>
                        </button>
                      ))}
                    </div>
                  </fieldset>
                )}

                <p className="text-xs text-slate-400 dark:text-slate-500">
                  로컬 변환은 LLM 없이 데이터를 구조적으로 재배치합니다. 비용이 발생하지 않습니다.
                </p>
              </>
            ) : (
              <>
                {/* LLM template selection */}
                <fieldset>
                  <legend className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                    변환 양식
                  </legend>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                    {LLM_TEMPLATES.map((opt) => (
                      <button
                        key={opt.value}
                        onClick={() => setTemplateType(opt.value)}
                        className={`px-3 py-2.5 text-sm rounded-lg border text-left transition-colors focus:outline-none focus:ring-2 focus:ring-sky-500 ${
                          templateType === opt.value
                            ? 'border-sky-500 bg-sky-50 dark:bg-sky-900/30 text-sky-700 font-medium'
                            : 'border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700'
                        }`}
                      >
                        <span aria-hidden="true">{opt.icon}</span> {opt.label}
                      </button>
                    ))}
                  </div>
                </fieldset>

                <div>
                  <label
                    htmlFor="target-lang"
                    className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-1 block"
                  >
                    출력 언어
                  </label>
                  <select
                    id="target-lang"
                    value={targetLanguage}
                    onChange={(e) => setTargetLanguage(e.target.value)}
                    className="w-full sm:w-auto px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-sky-500 bg-white dark:bg-slate-700 dark:text-slate-100"
                  >
                    <option value="ko">한국어</option>
                    <option value="en">English</option>
                  </select>
                </div>

                {/* LLM Provider info */}
                {llmProviders.length > 0 ? (
                  <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
                    <span className="w-2 h-2 bg-emerald-500 rounded-full" />
                    AI 엔진 {llmProviders.filter((p) => p.available).length}개 활성 (자동 선택)
                  </div>
                ) : (
                  <div className="p-3 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg text-sm text-amber-700 dark:text-amber-300">
                    AI 엔진이 설정되지 않았습니다. 관리자에게 문의해주세요.
                  </div>
                )}

                <div>
                  <label
                    htmlFor="jd-input"
                    className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-1 block"
                  >
                    Job Description (선택)
                  </label>
                  <textarea
                    id="jd-input"
                    value={jobDescription}
                    onChange={(e) => setJobDescription(e.target.value)}
                    placeholder="JD를 붙여넣으면 맞춤 최적화됩니다"
                    className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg text-sm h-20 resize-none focus:outline-none focus:ring-2 focus:ring-sky-500 bg-white dark:bg-slate-700 dark:text-slate-100"
                    maxLength={3000}
                  />
                  <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">
                    {jobDescription.length}/3000자
                  </p>
                </div>
              </>
            )}

            {error && (
              <div
                role="alert"
                className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700"
              >
                {error}
              </div>
            )}

            {result && (
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-slate-700 dark:text-slate-300">
                    변환 결과
                  </span>
                  <div className="flex items-center gap-2">
                    {tokensUsed > 0 && (
                      <span className="text-xs text-slate-400 dark:text-slate-500">
                        {tokensUsed.toLocaleString()} tokens
                      </span>
                    )}
                    <button
                      onClick={handleCopy}
                      className="text-xs px-2 py-1 bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-400 rounded hover:bg-slate-200 dark:hover:bg-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      복사
                    </button>
                  </div>
                </div>
                <div
                  className="prose prose-sm max-w-none p-4 bg-slate-50 dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-700 max-h-[40vh] overflow-y-auto text-slate-800 dark:text-slate-200 whitespace-pre-wrap"
                  aria-live="polite"
                >
                  {result}
                </div>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="px-4 sm:px-6 py-3 border-t border-slate-200 dark:border-slate-700 flex flex-col sm:flex-row gap-2 sm:justify-end">
            <button
              onClick={onClose}
              className="w-full sm:w-auto px-4 py-2.5 text-sm text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-700 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              닫기
            </button>
            <button
              onClick={handleTransform}
              disabled={loading}
              className={`w-full sm:w-auto px-6 py-2.5 text-sm font-medium text-white rounded-lg disabled:opacity-50 focus:outline-none focus:ring-2 focus:ring-offset-2 transition-colors ${
                mode === 'local'
                  ? 'bg-blue-600 hover:bg-blue-700 focus:ring-blue-500'
                  : 'bg-sky-600 hover:bg-sky-700 focus:ring-sky-500'
              }`}
              aria-busy={loading}
            >
              {loading ? '변환 중...' : mode === 'local' ? '로컬 변환' : 'AI 변환'}
            </button>
          </div>
        </RadixDialog.Content>
      </RadixDialog.Portal>
    </RadixDialog.Root>
  );
}
