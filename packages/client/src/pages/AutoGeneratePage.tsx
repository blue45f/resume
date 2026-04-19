import { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { useTemplates, useResumes } from '@/hooks/useResources';
import type { Template, ResumeSummary } from '@/types/resume';
import { API_URL } from '@/lib/config';
import { ROUTES } from '@/lib/routes';
import { t } from '@/lib/i18n';

const EXAMPLES = [
  '경력 메모, 자기소개 텍스트',
  'LinkedIn 프로필 복사 붙여넣기',
  '이전 이력서 내용 복사',
  '채용공고 + 내 경력 메모',
];

const STEPS = [
  { id: 1, label: '입력', icon: '1' },
  { id: 2, label: '분석', icon: '2' },
  { id: 3, label: '미리보기', icon: '3' },
  { id: 4, label: '완료', icon: '4' },
];

const ACCEPTED_FILE_TYPES = '.pdf,.docx,.doc,.txt,.rtf';

function parseLayout(layout: string) {
  try {
    return JSON.parse(layout);
  } catch {
    return {};
  }
}

export default function AutoGeneratePage() {
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [rawText, setRawText] = useState('');
  const [instruction, setInstruction] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [preview, setPreview] = useState<{
    resume: Record<string, any>;
    tokensUsed?: number;
    provider?: string;
  } | null>(null);
  const [currentStep, setCurrentStep] = useState(1);
  const [inputMode, setInputMode] = useState<'text' | 'file'>('text');
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [elapsedTime, setElapsedTime] = useState(0);
  const [analysisPhrase, setAnalysisPhrase] = useState(0);

  // Template selection
  const { data: templatesData } = useTemplates();
  const templates: Template[] = ((templatesData as Template[] | undefined) ?? []).slice(0, 4);
  const [selectedTemplateId, setSelectedTemplateId] = useState<string | null>(null);

  // Previous auto-generates (user's existing resumes as history)
  const { data: resumesData } = useResumes();
  const previousResumes: ResumeSummary[] = (resumesData as ResumeSummary[] | undefined) ?? [];
  const [showHistory, setShowHistory] = useState(false);

  const ANALYSIS_PHRASES = [
    '텍스트를 파싱하고 있습니다...',
    '경력 정보를 추출하고 있습니다...',
    '학력 및 기술 스택을 분석 중...',
    '이력서 구조를 생성하고 있습니다...',
    '최종 검토 중...',
  ];

  useEffect(() => {
    document.title = 'AI 자동 생성 — 이력서공방';
    return () => {
      document.title = '이력서공방 - AI 기반 이력서 관리 플랫폼';
    };
  }, []);

  // Timer during analysis
  useEffect(() => {
    if (!loading) {
      setElapsedTime(0);
      setAnalysisPhrase(0);
      return;
    }
    const timer = setInterval(() => setElapsedTime((t) => t + 1), 1000);
    const phraseTimer = setInterval(
      () => setAnalysisPhrase((p) => (p + 1) % ANALYSIS_PHRASES.length),
      4000,
    );
    return () => {
      clearInterval(timer);
      clearInterval(phraseTimer);
    };
  }, [loading]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setUploadedFile(file);
      setRawText('');
    }
  };

  const handleRemoveFile = () => {
    setUploadedFile(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const getRequestBody = useCallback(() => {
    if (inputMode === 'file' && uploadedFile) {
      const formData = new FormData();
      formData.append('file', uploadedFile);
      if (instruction) formData.append('instruction', instruction);
      if (selectedTemplateId) formData.append('templateId', selectedTemplateId);
      return { isFormData: true, body: formData };
    }
    return {
      isFormData: false,
      body: JSON.stringify({
        rawText,
        instruction: instruction || undefined,
        templateId: selectedTemplateId || undefined,
      }),
    };
  }, [inputMode, uploadedFile, rawText, instruction, selectedTemplateId]);

  const hasInput = inputMode === 'file' ? !!uploadedFile : !!rawText.trim();

  const handlePreview = async () => {
    if (!hasInput) return;
    setLoading(true);
    setError('');
    setPreview(null);
    setCurrentStep(2);
    try {
      const token = localStorage.getItem('token');
      const { isFormData, body } = getRequestBody();
      const headers: Record<string, string> = {};
      if (!isFormData) headers['Content-Type'] = 'application/json';
      if (token) headers['Authorization'] = `Bearer ${token}`;

      const res = await fetch(`${API_URL}/api/auto-generate/preview`, {
        method: 'POST',
        headers,
        body,
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.message || '생성에 실패했습니다');
      }
      const data = await res.json();
      setPreview(data);
      setCurrentStep(3);
    } catch (err: any) {
      setError(err.message);
      setCurrentStep(1);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!hasInput) return;
    setLoading(true);
    setError('');
    try {
      const token = localStorage.getItem('token');
      const { isFormData, body } = getRequestBody();
      const headers: Record<string, string> = {};
      if (!isFormData) headers['Content-Type'] = 'application/json';
      if (token) headers['Authorization'] = `Bearer ${token}`;

      const res = await fetch(`${API_URL}/api/auto-generate/create`, {
        method: 'POST',
        headers,
        body,
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.message || '저장에 실패했습니다');
      }
      const data = await res.json();
      setCurrentStep(4);
      navigate(ROUTES.resume.edit(data.resume.id));
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  return (
    <>
      <Header />
      <main
        id="main-content"
        className="flex-1 max-w-5xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-6 sm:py-8"
        role="main"
      >
        <h1 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-slate-100 mb-2">
          {t('nav.aiGenerate')}
        </h1>
        <p className="text-sm text-slate-500 dark:text-slate-400 mb-6">
          경력 관련 아무 자료나 붙여넣거나 파일을 업로드하면 AI가 자동으로 이력서를 생성합니다.
        </p>

        {/* Progress Steps */}
        <div className="mb-8">
          <div className="flex items-center justify-center gap-0">
            {STEPS.map((s, i) => (
              <div key={s.id} className="flex items-center">
                <div className="flex flex-col items-center">
                  <div
                    className={`w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold transition-all duration-300 ${
                      currentStep >= s.id
                        ? currentStep === s.id && loading
                          ? 'bg-blue-500 text-white animate-pulse'
                          : 'bg-blue-600 text-white'
                        : 'bg-slate-200 dark:bg-slate-700 text-slate-400 dark:text-slate-500'
                    }`}
                  >
                    {currentStep > s.id ? (
                      <svg
                        className="w-5 h-5"
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
                      s.icon
                    )}
                  </div>
                  <span
                    className={`text-xs mt-1 font-medium ${currentStep >= s.id ? 'text-blue-600 dark:text-blue-400' : 'text-slate-400 dark:text-slate-500'}`}
                  >
                    {s.label}
                  </span>
                </div>
                {i < STEPS.length - 1 && (
                  <div
                    className={`w-12 sm:w-20 h-0.5 mx-1 mb-5 transition-colors duration-300 ${currentStep > s.id ? 'bg-blue-500' : 'bg-slate-200 dark:bg-slate-700'}`}
                  />
                )}
              </div>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Input */}
          <div className="space-y-4">
            {/* Input Mode Toggle */}
            <div className="flex gap-1 p-1 bg-slate-100 dark:bg-slate-800 rounded-lg">
              <button
                onClick={() => setInputMode('text')}
                className={`flex-1 py-2 text-sm font-medium rounded-md transition-colors ${
                  inputMode === 'text'
                    ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 shadow-sm'
                    : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300'
                }`}
              >
                텍스트 붙여넣기
              </button>
              <button
                onClick={() => setInputMode('file')}
                className={`flex-1 py-2 text-sm font-medium rounded-md transition-colors ${
                  inputMode === 'file'
                    ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 shadow-sm'
                    : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300'
                }`}
              >
                파일 업로드
              </button>
            </div>

            {inputMode === 'text' ? (
              <div>
                <label
                  htmlFor="raw-text"
                  className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1"
                >
                  원본 텍스트 *
                </label>
                <textarea
                  id="raw-text"
                  value={rawText}
                  onChange={(e) => setRawText(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 h-52 resize-none bg-white dark:bg-slate-700 dark:text-slate-100"
                  placeholder={`아무 형식으로 경력/학력/기술 정보를 입력하세요.\n\n예시:\n- 경력 메모\n- LinkedIn 프로필 복사\n- 이전 이력서 텍스트\n- 자기소개 + 경력 나열`}
                />
                <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">
                  {rawText.length.toLocaleString()}자
                </p>
              </div>
            ) : (
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                  파일 업로드 *
                </label>
                {uploadedFile ? (
                  <div className="flex items-center gap-3 p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
                    <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900/40 rounded-lg flex items-center justify-center shrink-0">
                      <svg
                        className="w-5 h-5 text-blue-600 dark:text-blue-400"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                        />
                      </svg>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-slate-900 dark:text-slate-100 truncate">
                        {uploadedFile.name}
                      </p>
                      <p className="text-xs text-slate-500 dark:text-slate-400">
                        {formatFileSize(uploadedFile.size)}
                      </p>
                    </div>
                    <button
                      onClick={handleRemoveFile}
                      className="text-slate-400 hover:text-red-500 transition-colors p-1"
                      aria-label="파일 제거"
                    >
                      <svg
                        className="w-5 h-5"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M6 18L18 6M6 6l12 12"
                        />
                      </svg>
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="w-full p-8 border-2 border-dashed border-slate-300 dark:border-slate-600 rounded-lg hover:border-blue-400 dark:hover:border-blue-500 hover:bg-blue-50/50 dark:hover:bg-blue-900/10 transition-colors text-center"
                  >
                    <svg
                      className="w-10 h-10 mx-auto text-slate-400 dark:text-slate-500 mb-2"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={1.5}
                        d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
                      />
                    </svg>
                    <p className="text-sm text-slate-600 dark:text-slate-400 font-medium">
                      클릭하여 파일을 선택하세요
                    </p>
                    <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">
                      PDF, DOCX, DOC, TXT, RTF 지원
                    </p>
                  </button>
                )}
                <input
                  ref={fileInputRef}
                  type="file"
                  accept={ACCEPTED_FILE_TYPES}
                  onChange={handleFileChange}
                  className="hidden"
                />
              </div>
            )}

            {/* Template Selection */}
            {templates.length > 0 && (
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                  템플릿 선택 (선택사항)
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {templates.map((t) => {
                    const layout = parseLayout(t.layout || '{}');
                    const sections: string[] = (layout.sections || []).slice(0, 3);
                    return (
                      <button
                        key={t.id}
                        onClick={() =>
                          setSelectedTemplateId(selectedTemplateId === t.id ? null : t.id)
                        }
                        className={`p-3 rounded-lg border text-left transition-all duration-200 ${
                          selectedTemplateId === t.id
                            ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/30 ring-1 ring-blue-500'
                            : 'border-slate-200 dark:border-slate-600 hover:border-slate-300 dark:hover:border-slate-500'
                        }`}
                      >
                        {/* Mini thumbnail placeholder */}
                        <div className="w-full h-10 bg-slate-100 dark:bg-slate-700 rounded mb-2 flex items-center justify-center overflow-hidden">
                          <div className="w-full px-1.5 space-y-0.5">
                            <div className="h-1 bg-slate-300 dark:bg-slate-500 rounded-full w-2/3" />
                            <div className="h-0.5 bg-slate-200 dark:bg-slate-600 rounded-full w-full" />
                            <div className="h-0.5 bg-slate-200 dark:bg-slate-600 rounded-full w-4/5" />
                          </div>
                        </div>
                        <p className="text-xs font-medium text-slate-900 dark:text-slate-100 truncate">
                          {t.name}
                        </p>
                        {sections.length > 0 && (
                          <p className="text-[10px] text-slate-400 dark:text-slate-500 truncate mt-0.5">
                            {sections.join(' / ')}
                          </p>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            <div>
              <label
                htmlFor="instruction"
                className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1"
              >
                추가 지시 (선택)
              </label>
              <input
                id="instruction"
                value={instruction}
                onChange={(e) => setInstruction(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-slate-700 dark:text-slate-100"
                placeholder="예: 개발자 이력서로 만들어줘, 성과 중심으로 작성해줘"
              />
            </div>

            <div className="flex gap-2">
              <button
                onClick={handlePreview}
                disabled={loading || !hasInput}
                className="flex-1 py-2.5 bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 font-medium rounded-lg hover:bg-slate-200 dark:hover:bg-slate-600 disabled:opacity-50 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors text-sm"
              >
                {loading && !preview ? '분석 중...' : '미리보기'}
              </button>
              <button
                onClick={handleSave}
                disabled={loading || !hasInput}
                className="flex-1 py-2.5 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 disabled:opacity-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors text-sm"
              >
                {loading && preview ? '저장 중...' : '바로 생성 + 저장'}
              </button>
            </div>

            {error && (
              <div
                role="alert"
                className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg text-sm text-red-700 dark:text-red-400"
              >
                {error}
              </div>
            )}

            {/* Examples */}
            <div className="p-4 bg-slate-50 dark:bg-slate-900 rounded-lg">
              <p className="text-xs font-medium text-slate-500 dark:text-slate-400 mb-2">
                이런 것들을 입력할 수 있어요:
              </p>
              <ul className="text-xs text-slate-400 dark:text-slate-500 space-y-1">
                {EXAMPLES.map((ex, i) => (
                  <li key={i}>- {ex}</li>
                ))}
              </ul>
            </div>
          </div>

          {/* Preview / Analysis */}
          <div>
            {preview ? (
              <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-4 sm:p-6 space-y-4">
                <div className="flex items-center justify-between">
                  <h2 className="font-semibold text-slate-900 dark:text-slate-100">생성 결과</h2>
                  <span className="text-xs text-slate-400 dark:text-slate-500">
                    {preview.tokensUsed?.toLocaleString()} tokens ({preview.provider})
                  </span>
                </div>

                {preview.resume?.personalInfo?.name && (
                  <div className="p-3 bg-blue-50 dark:bg-blue-900/30 rounded-lg">
                    <p className="font-medium text-slate-900 dark:text-slate-100">
                      {preview.resume.personalInfo.name}
                    </p>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      {preview.resume.personalInfo.email} {preview.resume.personalInfo.phone}
                    </p>
                    {preview.resume.personalInfo.summary && (
                      <p className="text-sm text-slate-600 dark:text-slate-400 mt-2">
                        {preview.resume.personalInfo.summary}
                      </p>
                    )}
                  </div>
                )}

                {[
                  {
                    key: 'experiences',
                    label: '경력',
                    render: (e: any) => `${e.company} - ${e.position}`,
                  },
                  {
                    key: 'educations',
                    label: '학력',
                    render: (e: any) => `${e.school} ${e.degree} ${e.field}`,
                  },
                  { key: 'skills', label: '기술', render: (s: any) => `${s.category}: ${s.items}` },
                  {
                    key: 'certifications',
                    label: '자격증',
                    render: (c: any) => `${c.name} (${c.issuer})`,
                  },
                  {
                    key: 'languages',
                    label: '어학',
                    render: (l: any) => `${l.name} ${l.testName} ${l.score}`,
                  },
                  { key: 'projects', label: '프로젝트', render: (p: any) => p.name },
                  { key: 'awards', label: '수상', render: (a: any) => a.name },
                  { key: 'activities', label: '활동', render: (a: any) => a.name },
                ].map(({ key, label, render }) => {
                  const items = preview.resume?.[key];
                  if (!items?.length) return null;
                  return (
                    <div key={key}>
                      <h3 className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                        {label} ({items.length})
                      </h3>
                      <ul className="text-sm text-slate-600 dark:text-slate-400 space-y-0.5">
                        {items.map((item: any, i: number) => (
                          <li key={i} className="truncate">
                            - {render(item)}
                          </li>
                        ))}
                      </ul>
                    </div>
                  );
                })}

                <button
                  onClick={handleSave}
                  disabled={loading}
                  className="w-full py-2.5 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 disabled:opacity-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors text-sm"
                >
                  이 내용으로 이력서 저장
                </button>
              </div>
            ) : loading ? (
              <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-12 text-center">
                <div className="inline-block w-12 h-12 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin mb-4" />
                <p className="text-sm text-slate-700 dark:text-slate-300 font-semibold mb-1">
                  AI가 이력서를 분석하고 있습니다
                </p>
                <p className="text-sm text-blue-600 dark:text-blue-400 font-medium animate-pulse mb-3">
                  {ANALYSIS_PHRASES[analysisPhrase]}
                </p>
                <div className="flex items-center justify-center gap-2 text-xs text-slate-400 dark:text-slate-500">
                  <span>경과: {elapsedTime}초</span>
                  <span>|</span>
                  <span>예상: 15~30초</span>
                </div>
                {/* Progress bar */}
                <div className="mt-4 w-full bg-slate-200 dark:bg-slate-700 rounded-full h-1.5 overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-blue-500 to-indigo-500 rounded-full transition-all duration-1000 ease-linear"
                    style={{ width: `${Math.min(95, (elapsedTime / 30) * 100)}%` }}
                  />
                </div>
              </div>
            ) : (
              <div className="bg-white dark:bg-slate-800 rounded-xl border border-dashed border-slate-300 dark:border-slate-600 p-8 text-center text-slate-400 dark:text-slate-500">
                <p className="text-4xl mb-3" aria-hidden="true">
                  &#129302;
                </p>
                <p className="text-sm">원본 텍스트를 입력하거나 파일을 업로드하고</p>
                <p className="text-sm">미리보기를 누르면 AI가 자동으로 이력서를 구성합니다</p>
              </div>
            )}
          </div>
        </div>

        {/* Previous Auto-Generates */}
        {previousResumes.length > 0 && (
          <div className="mt-8">
            <button
              onClick={() => setShowHistory(!showHistory)}
              className="flex items-center gap-2 text-sm font-medium text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 transition-colors"
            >
              <svg
                className={`w-4 h-4 transition-transform duration-200 ${showHistory ? 'rotate-90' : ''}`}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 5l7 7-7 7"
                />
              </svg>
              이전 변환 내역 ({previousResumes.length})
            </button>
            {showHistory && (
              <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {previousResumes.slice(0, 6).map((r) => (
                  <button
                    key={r.id}
                    onClick={() => navigate(ROUTES.resume.edit(r.id))}
                    className="text-left p-4 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 hover:border-blue-400 dark:hover:border-blue-500 hover:shadow-sm transition-all"
                  >
                    <p className="text-sm font-medium text-slate-900 dark:text-slate-100 truncate">
                      {r.title || '제목 없음'}
                    </p>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                      {r.personalInfo?.name || ''}
                    </p>
                    <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">
                      {new Date(r.updatedAt).toLocaleDateString('ko-KR')}
                    </p>
                  </button>
                ))}
              </div>
            )}
          </div>
        )}
      </main>
      <Footer />
    </>
  );
}
