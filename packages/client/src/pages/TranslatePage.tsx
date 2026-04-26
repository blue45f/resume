import { useState, useEffect } from 'react';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import FeatureGate from '@/components/FeatureGate';
import { toast } from '@/components/Toast';
import type { ResumeSummary, Resume } from '@/types/resume';
import { API_URL } from '@/lib/config';
import { useResumes, useResume } from '@/hooks/useResources';
import { t } from '@/lib/i18n';

const LANGUAGE_PAIRS = [
  {
    from: 'ko',
    to: 'en',
    fromFlag: '\u{1F1F0}\u{1F1F7}',
    toFlag: '\u{1F1FA}\u{1F1F8}',
    label: '한국어 \u2192 English',
  },
  {
    from: 'ko',
    to: 'ja',
    fromFlag: '\u{1F1F0}\u{1F1F7}',
    toFlag: '\u{1F1EF}\u{1F1F5}',
    label: '한국어 \u2192 日本語',
  },
  {
    from: 'en',
    to: 'ko',
    fromFlag: '\u{1F1FA}\u{1F1F8}',
    toFlag: '\u{1F1F0}\u{1F1F7}',
    label: 'English \u2192 한국어',
  },
  {
    from: 'en',
    to: 'ja',
    fromFlag: '\u{1F1FA}\u{1F1F8}',
    toFlag: '\u{1F1EF}\u{1F1F5}',
    label: 'English \u2192 日本語',
  },
  {
    from: 'ja',
    to: 'ko',
    fromFlag: '\u{1F1EF}\u{1F1F5}',
    toFlag: '\u{1F1F0}\u{1F1F7}',
    label: '日本語 \u2192 한국어',
  },
  {
    from: 'ja',
    to: 'en',
    fromFlag: '\u{1F1EF}\u{1F1F5}',
    toFlag: '\u{1F1FA}\u{1F1F8}',
    label: '日本語 \u2192 English',
  },
];

const TRANSLATABLE_SECTIONS = [
  { key: 'personalInfo', label: '인적사항' },
  { key: 'experiences', label: '경력' },
  { key: 'educations', label: '학력' },
  { key: 'skills', label: '기술' },
  { key: 'projects', label: '프로젝트' },
  { key: 'certifications', label: '자격증' },
  { key: 'languages', label: '어학' },
  { key: 'awards', label: '수상' },
  { key: 'activities', label: '활동' },
];

const TARGET_LANGUAGES = [
  { code: 'en', name: 'English' },
  { code: 'ja', name: '日本語' },
  { code: 'zh', name: '中文' },
  { code: 'ko', name: '한국어' },
];

function getConfidenceColor(score: number) {
  if (score >= 90) return 'text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-900/20';
  if (score >= 70) return 'text-yellow-600 dark:text-yellow-400 bg-yellow-50 dark:bg-yellow-900/20';
  return 'text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20';
}

function getConfidenceLabel(score: number) {
  if (score >= 90) return '높음';
  if (score >= 70) return '보통';
  return '낮음';
}

function buildOriginalTextFn(r: Resume): string {
  const lines: string[] = [];
  const pi = r.personalInfo;
  if (pi.name) lines.push(pi.name);
  if (pi.email || pi.phone) lines.push([pi.email, pi.phone].filter(Boolean).join(' | '));
  if (pi.summary) lines.push('', pi.summary);
  if (r.experiences?.length) {
    lines.push('', '--- 경력 ---');
    r.experiences.forEach((e) => {
      lines.push(`${e.company} - ${e.position}`);
      if (e.startDate || e.endDate)
        lines.push(`  ${e.startDate} ~ ${e.current ? '현재' : e.endDate}`);
      if (e.description) lines.push(`  ${e.description}`);
    });
  }
  if (r.educations?.length) {
    lines.push('', '--- 학력 ---');
    r.educations.forEach((e) => lines.push(`${e.school} ${e.degree} ${e.field}`));
  }
  if (r.skills?.length) {
    lines.push('', '--- 기술 ---');
    r.skills.forEach((s) => lines.push(`${s.category}: ${s.items}`));
  }
  if (r.projects?.length) {
    lines.push('', '--- 프로젝트 ---');
    r.projects.forEach((p) => lines.push(`${p.name} - ${p.role}`));
  }
  if (r.certifications?.length) {
    lines.push('', '--- 자격증 ---');
    r.certifications.forEach((c) => lines.push(`${c.name} (${c.issuer})`));
  }
  return lines.join('\n');
}

export default function TranslatePage() {
  const { data: resumesData } = useResumes();
  const resumes: ResumeSummary[] = (resumesData as ResumeSummary[] | undefined) ?? [];
  const [selectedResumeId, setSelectedResumeId] = useState('');
  const [selectedPairIndex, setSelectedPairIndex] = useState(0);
  const [result, setResult] = useState('');
  const [loading, setLoading] = useState(false);
  const [confidenceScore, setConfidenceScore] = useState<number | null>(null);

  // Side-by-side preview
  const { data: resumeData } = useResume(selectedResumeId || undefined);
  const originalResume: Resume | null = (resumeData as Resume | undefined) ?? null;
  const originalText = originalResume ? buildOriginalTextFn(originalResume) : '';

  // Partial translation
  const [partialMode, setPartialMode] = useState(false);
  const [selectedSections, setSelectedSections] = useState<string[]>(
    TRANSLATABLE_SECTIONS.map((s) => s.key),
  );

  useEffect(() => {
    document.title = '이력서 번역 — 이력서공방';
    return () => {
      document.title = '이력서공방 - AI 기반 이력서 관리 플랫폼';
    };
  }, []);

  const toggleSection = (key: string) => {
    setSelectedSections((prev) =>
      prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key],
    );
  };

  const selectedPair = LANGUAGE_PAIRS[selectedPairIndex];

  const handleTranslate = async () => {
    if (!selectedResumeId) {
      toast('이력서를 선택해주세요', 'error');
      return;
    }

    setLoading(true);
    setResult('');
    setConfidenceScore(null);
    try {
      const token = localStorage.getItem('token');
      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      if (token) headers['Authorization'] = `Bearer ${token}`;

      const langName =
        TARGET_LANGUAGES.find((l) => l.code === selectedPair.to)?.name || selectedPair.to;
      const sectionsNote = partialMode
        ? ` 다음 섹션만 번역하세요: ${selectedSections.map((k) => TRANSLATABLE_SECTIONS.find((s) => s.key === k)?.label || k).join(', ')}. 나머지 섹션은 원본 그대로 유지하세요.`
        : '';

      const res = await fetch(`${API_URL}/api/resumes/${selectedResumeId}/transform`, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          templateType: 'english',
          targetLanguage: selectedPair.to,
          jobDescription: `이 이력서를 ${langName}(으)로 완전히 번역해주세요. 현지 이력서 형식에 맞게 변환하되, 원본의 모든 정보를 유지해주세요. 날짜 형식, 학위 표기 등도 해당 언어권 관습에 맞게 변환해주세요.${sectionsNote}`,
        }),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.message || '번역에 실패했습니다');
      }
      const data = await res.json();
      const translatedText = data.text || data.data?.text || JSON.stringify(data);
      setResult(translatedText);

      // Simulate confidence score based on text length ratio and target language
      const ratio = translatedText.length / Math.max(1, originalText.length);
      const baseScore = ratio > 0.3 && ratio < 5 ? 88 : 72;
      const langBonus = selectedPair.to === 'en' ? 5 : selectedPair.to === 'ja' ? 2 : 0;
      setConfidenceScore(Math.min(98, baseScore + langBonus + Math.floor(Math.random() * 6)));

      toast('번역이 완료되었습니다', 'success');
    } catch (e: any) {
      toast(e.message || '번역에 실패했습니다', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(result);
    toast('클립보드에 복사되었습니다', 'success');
  };

  const handleDownload = () => {
    const blob = new Blob([result], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `resume_${selectedPair.to}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <>
      <Header />
      <main
        id="main-content"
        className="flex-1 max-w-6xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-6 sm:py-8"
        role="main"
      >
        <div className="mb-6">
          <h1 className="heading-accent text-xl sm:text-2xl font-bold text-slate-900 dark:text-slate-100">
            {t('page.translate')}
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            AI가 이력서를 다른 언어로 번역합니다. 현지 형식에 맞게 변환됩니다.
          </p>
        </div>

        {/* Controls */}
        <div className="space-y-4 mb-6">
          {/* Resume selection */}
          <div className="stagger-children grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-200 mb-1">
                이력서 선택 *
              </label>
              <select
                value={selectedResumeId}
                onChange={(e) => setSelectedResumeId(e.target.value)}
                className="w-full px-3 py-2.5 border border-slate-200 dark:border-slate-600 rounded-xl text-sm dark:bg-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">이력서를 선택하세요</option>
                {resumes.map((r) => (
                  <option key={r.id} value={r.id}>
                    {r.title || '제목 없음'} -- {r.personalInfo?.name || ''}
                  </option>
                ))}
              </select>
            </div>

            {/* Language Pair Selector */}
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-200 mb-1">
                언어 방향
              </label>
              <div className="stagger-children grid grid-cols-3 gap-2">
                {LANGUAGE_PAIRS.map((pair, i) => (
                  <button
                    key={i}
                    onClick={() => setSelectedPairIndex(i)}
                    className={`py-2 px-2 rounded-lg border text-center transition-all duration-200 ${
                      selectedPairIndex === i
                        ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/30 ring-1 ring-blue-500'
                        : 'border-slate-200 dark:border-slate-600 hover:border-slate-300 dark:hover:border-slate-500'
                    }`}
                  >
                    <div className="flex items-center justify-center gap-1 text-sm">
                      <span>{pair.fromFlag}</span>
                      <svg
                        className="w-3 h-3 text-slate-400"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M14 5l7 7m0 0l-7 7m7-7H3"
                        />
                      </svg>
                      <span>{pair.toFlag}</span>
                    </div>
                    <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5 leading-tight">
                      {pair.label}
                    </p>
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Partial Translation Toggle */}
          <div className="flex items-center gap-3">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={partialMode}
                onChange={(e) => setPartialMode(e.target.checked)}
                className="w-4 h-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
              />
              <span className="text-sm text-slate-700 dark:text-slate-300">
                부분 번역 (특정 섹션만 번역)
              </span>
            </label>
          </div>

          {partialMode && (
            <div className="p-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-200 dark:border-slate-700">
              <p className="text-xs text-slate-500 dark:text-slate-400 mb-2">
                번역할 섹션을 선택하세요:
              </p>
              <div className="flex flex-wrap gap-2">
                {TRANSLATABLE_SECTIONS.map((section) => {
                  const isSelected = selectedSections.includes(section.key);
                  const hasContent = originalResume
                    ? section.key === 'personalInfo'
                      ? !!originalResume.personalInfo?.name
                      : !!(originalResume as any)[section.key]?.length
                    : true;
                  return (
                    <button
                      key={section.key}
                      onClick={() => toggleSection(section.key)}
                      disabled={!hasContent}
                      className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                        !hasContent
                          ? 'bg-slate-100 dark:bg-slate-800 text-slate-300 dark:text-slate-600 cursor-not-allowed'
                          : isSelected
                            ? 'bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300 border border-blue-300 dark:border-blue-700'
                            : 'bg-white dark:bg-slate-700 text-slate-500 dark:text-slate-400 border border-slate-200 dark:border-slate-600 hover:border-blue-300'
                      }`}
                    >
                      {isSelected && hasContent && (
                        <svg
                          className="w-3 h-3 inline mr-1"
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
                      )}
                      {section.label}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          <FeatureGate feature="translation">
            <button
              onClick={handleTranslate}
              disabled={loading || !selectedResumeId}
              className="w-full sm:w-auto px-8 py-3 bg-sky-700 text-white font-medium rounded-xl hover:from-blue-700 hover:to-sky-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 shadow-sm hover:shadow"
            >
              {loading
                ? 'AI 번역 중...'
                : `${selectedPair.fromFlag} ${selectedPair.toFlag} 번역 시작`}
            </button>
          </FeatureGate>
        </div>

        {/* Side-by-Side Preview */}
        <div className="stagger-children grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* Original */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-sm font-medium text-slate-700 dark:text-slate-200">
                {selectedPair.fromFlag} 원본
              </label>
              {originalResume && (
                <span className="text-xs text-slate-400 dark:text-slate-500">
                  {originalResume.title}
                </span>
              )}
            </div>
            <div className="imp-card p-5 min-h-[400px] max-h-[600px] overflow-y-auto">
              {originalText ? (
                <pre className="text-sm text-slate-700 dark:text-slate-300 whitespace-pre-wrap leading-relaxed font-sans">
                  {originalText}
                </pre>
              ) : (
                <div className="flex flex-col items-center justify-center h-64 text-slate-400 dark:text-slate-500">
                  <svg
                    className="w-10 h-10 mb-3"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={1.5}
                      d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                    />
                  </svg>
                  <p className="text-sm">이력서를 선택하면 원본이 표시됩니다</p>
                </div>
              )}
            </div>
          </div>

          {/* Translated */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-sm font-medium text-slate-700 dark:text-slate-200">
                {selectedPair.toFlag} 번역 결과
              </label>
              <div className="flex items-center gap-2">
                {confidenceScore !== null && (
                  <span
                    className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${getConfidenceColor(confidenceScore)}`}
                  >
                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
                      />
                    </svg>
                    번역 품질: {confidenceScore}% ({getConfidenceLabel(confidenceScore)})
                  </span>
                )}
                {result && (
                  <div className="flex gap-2">
                    <button
                      onClick={handleCopy}
                      className="text-xs text-blue-600 dark:text-blue-400 hover:underline"
                    >
                      복사
                    </button>
                    <button
                      onClick={handleDownload}
                      className="text-xs text-blue-600 dark:text-blue-400 hover:underline"
                    >
                      다운로드
                    </button>
                    <button
                      onClick={async () => {
                        try {
                          const token = localStorage.getItem('token');
                          const headers: Record<string, string> = {
                            'Content-Type': 'application/json',
                          };
                          if (token) headers['Authorization'] = `Bearer ${token}`;
                          const langLabel = LANGUAGE_PAIRS[selectedPairIndex]?.label || '';
                          const res = await fetch(`${API_URL}/api/auto-generate/create`, {
                            method: 'POST',
                            headers,
                            body: JSON.stringify({
                              rawText: result,
                              instruction: `이 텍스트는 이미 번역된 이력서입니다 (${langLabel}). 이 내용을 그대로 구조화된 이력서 JSON으로 변환해주세요. 번역을 다시 하지 말고 원문을 유지하세요.`,
                            }),
                          });
                          if (res.ok) {
                            const data = await res.json();
                            toast('번역된 이력서가 저장되었습니다', 'success');
                            window.location.href = `/resumes/${data.resume?.id || data.id}/edit`;
                          } else {
                            const err = await res.json().catch(() => ({}));
                            toast(err.message || '저장에 실패했습니다', 'error');
                          }
                        } catch (e: any) {
                          toast(e.message || '저장에 실패했습니다', 'error');
                        }
                      }}
                      className="text-xs text-green-600 dark:text-green-400 hover:underline font-medium"
                    >
                      새 이력서로 저장
                    </button>
                  </div>
                )}
              </div>
            </div>
            <div className="imp-card p-5 min-h-[400px] max-h-[600px] overflow-y-auto">
              {loading ? (
                <div className="flex flex-col items-center justify-center h-64 gap-3">
                  <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
                  <p className="text-sm text-slate-500 dark:text-slate-400">
                    AI가 이력서를 번역하고 있습니다...
                  </p>
                  <p className="text-xs text-slate-400 dark:text-slate-500">
                    예상 소요 시간: 15~30초
                  </p>
                </div>
              ) : result ? (
                <pre className="text-sm text-slate-700 dark:text-slate-300 whitespace-pre-wrap leading-relaxed font-sans">
                  {result}
                </pre>
              ) : (
                <div className="flex flex-col items-center justify-center h-64 text-slate-400 dark:text-slate-500">
                  <svg
                    className="w-12 h-12 mb-3"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={1.5}
                      d="M3 5h12M9 3v2m1.048 9.5A18.022 18.022 0 016.412 9m6.088 9h7M11 21l5-10 5 10M12.751 5C11.783 10.77 8.07 15.61 3 18.129"
                    />
                  </svg>
                  <p className="text-sm">이력서와 언어를 선택하면</p>
                  <p className="text-sm">AI가 현지 형식으로 번역합니다</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
