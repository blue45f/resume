import { useDeferredValue, useState, useEffect, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import FeatureGate from '@/components/FeatureGate';
import { toast } from '@/components/Toast';
import type { ResumeSummary } from '@/types/resume';
import { API_URL } from '@/lib/config';
import RelatedJobsWidget from '@/features/interview-prep/ui/RelatedJobsWidget';
import { tx } from '@/lib/i18n';
import { useResumes } from '@/hooks/useResources';
import KoreanQualityBadge from '@/components/KoreanQualityBadge';
import KeywordCloud from '@/components/KeywordCloud';
import InterviewQuestionsPanel from '@/components/InterviewQuestionsPanel';
import SectionInsightsPanel from '@/components/SectionInsightsPanel';
import OverallHealthGauge from '@/components/OverallHealthGauge';
import QuotableHighlights from '@/components/QuotableHighlights';
import CareerGapPanel from '@/components/CareerGapPanel';
import FeatureDisabledBanner from '@/components/FeatureDisabledBanner';
import {
  computeJDMatch,
  detectSkillMentions,
  recommendCoverLetterOpeners,
  analyzeEverything,
  summarizeAnalysis,
  generateResumeTldr,
  detectUnquantifiedClaims,
  scoreInterviewability,
} from '@/lib/koreanChecker';

type PageMode = 'generate' | 'feedback';

const generateSchema = z.object({
  company: z
    .string()
    .min(1, '회사명을 입력해주세요')
    .max(100, '회사명은 최대 100자까지 입력 가능합니다'),
  position: z
    .string()
    .min(1, '포지션을 입력해주세요')
    .max(100, '포지션은 최대 100자까지 입력 가능합니다'),
  jobDescription: z
    .string()
    .min(10, '채용 공고는 최소 10자 이상이어야 합니다')
    .max(10000, '채용 공고는 최대 10,000자까지 입력 가능합니다'),
});

type GenerateFormValues = z.infer<typeof generateSchema>;

const feedbackSchema = z.object({
  content: z
    .string()
    .min(10, '자기소개서는 최소 10자 이상이어야 합니다')
    .max(10000, '자기소개서는 최대 10,000자까지 입력 가능합니다'),
  jobDescription: z
    .string()
    .max(3000, '채용 공고는 최대 3,000자까지 입력 가능합니다')
    .optional()
    .or(z.literal('')),
});

type FeedbackFormValues = z.infer<typeof feedbackSchema>;

const TONES = [
  { value: 'formal' as const, label: '격식체', desc: '공식적·전문적' },
  { value: 'friendly' as const, label: '친근체', desc: '따뜻·열정적' },
  { value: 'confident' as const, label: '자신감체', desc: '당당·확신' },
];

const SECTIONS = [
  {
    id: 'growth',
    label: '성장 과정',
    placeholder: '나의 성장 경험과 그 과정에서 배운 점을 서술해 주세요.',
  },
  {
    id: 'motivation',
    label: '지원 동기',
    placeholder: '이 회사와 직무에 지원하게 된 구체적인 이유를 서술해 주세요.',
  },
  {
    id: 'strengths',
    label: '장단점',
    placeholder: '나의 강점과 약점, 그리고 약점 개선 노력을 서술해 주세요.',
  },
  {
    id: 'aspiration',
    label: '입사 후 포부',
    placeholder: '입사 후 어떻게 기여하고 성장할 것인지 서술해 주세요.',
  },
  {
    id: 'experience',
    label: '직무 관련 경험',
    placeholder: '직무와 관련된 경험·프로젝트·성과를 서술해 주세요.',
  },
];

interface FeedbackResult {
  totalScore: number;
  categories: { label: string; score: number; max: number; comment: string }[];
  keywords: { found: string[]; missing: string[] };
  suggestions: string[];
  strengths: string[];
  charCount: number;
}

function analyzeCoverLetter(text: string, jobDesc: string): FeedbackResult {
  const charCount = text.replace(/\s/g, '').length;

  // Length score (권장: 800~1500자)
  const lengthScore =
    charCount >= 800 && charCount <= 1500
      ? 20
      : charCount >= 500 && charCount < 800
        ? 14
        : charCount >= 1500 && charCount <= 2000
          ? 16
          : charCount < 200
            ? 4
            : 10;

  // Keyword matching
  const jdWords = jobDesc
    .toLowerCase()
    .split(/[\s,\.\(\)\[\]\/·]+/)
    .filter((w) => w.length >= 2)
    .filter(
      (w) =>
        ![
          '이',
          '가',
          '을',
          '를',
          '은',
          '는',
          '의',
          '에',
          '와',
          '과',
          '로',
          '으로',
          '하는',
          '하고',
          '있는',
          '하여',
          '에서',
        ].includes(w),
    );

  const uniqueJdWords = [...new Set(jdWords)].slice(0, 30);
  const textLower = text.toLowerCase();
  const foundKeywords = uniqueJdWords.filter((w) => textLower.includes(w)).slice(0, 15);
  const missingKeywords = uniqueJdWords.filter((w) => !textLower.includes(w)).slice(0, 8);
  const keywordScore = Math.round((foundKeywords.length / Math.max(uniqueJdWords.length, 1)) * 25);

  // Structure score (check for key elements)
  const hasSpecific = /\d+|%|배|증가|달성|성과|결과/.test(text);
  const hasParagraphs = text.split('\n').filter((l) => l.trim().length > 20).length >= 3;
  const hasFirstPerson = /저는|제가|나는|내가|저의/.test(text);
  const structScore = (hasSpecific ? 10 : 0) + (hasParagraphs ? 7 : 0) + (hasFirstPerson ? 3 : 0);

  // Tone/professionalism
  const hasSlang = /ㅎㅎ|ㅋㅋ|ㅠㅠ|ㄷㄷ|!!|~~/.test(text);
  const toneScore = hasSlang ? 10 : 20;

  const totalScore = Math.min(100, lengthScore + keywordScore + structScore + toneScore);

  // Suggestions
  const suggestions: string[] = [];
  if (charCount < 800)
    suggestions.push('자기소개서가 너무 짧습니다. 800자 이상 작성을 권장합니다.');
  if (charCount > 2000)
    suggestions.push('일부 회사는 글자 수 제한이 있습니다. 핵심만 담아 간결하게 줄이세요.');
  if (!hasSpecific)
    suggestions.push('구체적인 수치(%, 배수, 기간 등)를 사용하면 신뢰도가 높아집니다.');
  if (!hasParagraphs) suggestions.push('내용을 여러 문단으로 나눠 가독성을 높이세요.');
  if (hasSlang) suggestions.push('비공식적 표현(ㅎㅎ, !! 등)은 공식 서류에 적합하지 않습니다.');
  if (missingKeywords.length > 5)
    suggestions.push(
      `채용 공고의 주요 키워드가 빠져 있습니다: ${missingKeywords.slice(0, 4).join(', ')} 등`,
    );
  if (keywordScore < 10)
    suggestions.push('채용 공고의 직무 요건과 더 직접적으로 연결된 내용을 추가하세요.');

  // Strengths
  const strengths: string[] = [];
  if (lengthScore >= 16) strengths.push('적절한 분량을 유지하고 있습니다.');
  if (hasSpecific) strengths.push('구체적인 수치와 성과를 포함하고 있습니다.');
  if (keywordScore >= 15) strengths.push('채용 공고의 핵심 키워드를 잘 반영하고 있습니다.');
  if (!hasSlang) strengths.push('전문적이고 격식 있는 어투를 사용하고 있습니다.');
  if (hasParagraphs) strengths.push('내용이 구조적으로 잘 정리되어 있습니다.');

  return {
    totalScore,
    categories: [
      {
        label: '분량',
        score: lengthScore,
        max: 20,
        comment: charCount < 800 ? '너무 짧음' : charCount > 2000 ? '너무 길 수 있음' : '적절',
      },
      {
        label: '키워드 매칭',
        score: keywordScore,
        max: 25,
        comment: `${foundKeywords.length}/${uniqueJdWords.length}개 매칭`,
      },
      {
        label: '구체성',
        score: structScore,
        max: 20,
        comment: hasSpecific ? '수치 포함' : '수치 없음',
      },
      { label: '전문성', score: toneScore, max: 20, comment: hasSlang ? '비격식체 발견' : '양호' },
      {
        label: '직무 적합성',
        score: Math.round(keywordScore * 0.6),
        max: 15,
        comment: keywordScore >= 15 ? '높음' : '개선 필요',
      },
    ],
    keywords: { found: foundKeywords, missing: missingKeywords },
    suggestions,
    strengths,
    charCount,
  };
}

function ScoreMeter({ score }: { score: number }) {
  const color =
    score >= 80 ? '#10b981' : score >= 60 ? '#3b82f6' : score >= 40 ? '#f59e0b' : '#ef4444';
  const r = 45;
  const circ = 2 * Math.PI * r;
  const offset = circ - (score / 100) * circ;

  return (
    <div className="relative w-28 h-28 mx-auto">
      <svg width="112" height="112" viewBox="0 0 112 112" className="rotate-[-90deg]">
        <circle cx="56" cy="56" r={r} fill="none" stroke="#e2e8f0" strokeWidth="8" />
        <circle
          cx="56"
          cy="56"
          r={r}
          fill="none"
          stroke={color}
          strokeWidth="8"
          strokeDasharray={circ}
          strokeDashoffset={offset}
          strokeLinecap="round"
          style={{ transition: 'stroke-dashoffset 0.8s ease' }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-3xl font-bold text-slate-900 dark:text-slate-100">{score}</span>
        <span className="text-xs text-slate-400">/ 100</span>
      </div>
    </div>
  );
}

export default function CoverLetterPage() {
  const [searchParams] = useSearchParams();
  const [mode, setMode] = useState<PageMode>('generate');
  const { data: resumesData } = useResumes();
  const resumes: ResumeSummary[] = (resumesData as ResumeSummary[] | undefined) ?? [];
  // Support ?resumeId=xxx from PreviewPage "자소서" button
  const [selectedResumeId, setSelectedResumeId] = useState(searchParams.get('resumeId') || '');
  const [tone, setTone] = useState<'formal' | 'friendly' | 'confident'>('formal');
  const [result, setResult] = useState('');
  const [error, setError] = useState('');
  const [feedback, setFeedback] = useState<FeedbackResult | null>(null);
  const [analyzingFeedback, setAnalyzingFeedback] = useState(false);

  // Feedback mode
  const [feedbackResult, setFeedbackResult] = useState<FeedbackResult | null>(null);

  // Section mode
  const [usesSections, setUsesSections] = useState(false);
  const [sections, setSections] = useState<Record<string, string>>({});
  const [sectionLimits, setSectionLimits] = useState<Record<string, number>>({});

  // Generate form
  const {
    register: registerGenerate,
    handleSubmit: handleSubmitGenerate,
    watch: watchGenerate,
    formState: { errors: generateErrors, isSubmitting: isGenerating },
  } = useForm<GenerateFormValues>({
    resolver: zodResolver(generateSchema),
    mode: 'onBlur',
    defaultValues: {
      company: '',
      position: searchParams.get('position') || '',
      jobDescription: '',
    },
  });
  const companyName = watchGenerate('company');
  const position = watchGenerate('position');

  // Feedback form
  const {
    register: registerFeedback,
    handleSubmit: handleSubmitFeedback,
    watch: watchFeedback,
    formState: { errors: feedbackErrors, isSubmitting: isAnalyzingFeedbackForm },
  } = useForm<FeedbackFormValues>({
    resolver: zodResolver(feedbackSchema),
    mode: 'onBlur',
    defaultValues: { content: '', jobDescription: '' },
  });
  const feedbackText = watchFeedback('content');
  const feedbackJd = watchFeedback('jobDescription');
  // 타이핑 레이턴시 보호 — 10+ 분석기 패널을 유휴 시간에 재렌더.
  const deferredFeedbackText = useDeferredValue(feedbackText || '');

  useEffect(() => {
    document.title = '자기소개서 — 이력서공방';
    return () => {
      document.title = '이력서공방 - AI 기반 이력서 관리 플랫폼';
    };
  }, []);

  const toneKorean: Record<string, string> = {
    formal: '격식체',
    friendly: '친근체',
    confident: '자신감체',
  };

  const onGenerateSubmit = useCallback(
    async (values: GenerateFormValues) => {
      if (!selectedResumeId) {
        toast('이력서를 선택해주세요', 'error');
        return;
      }

      setResult('');
      setError('');
      setFeedback(null);
      try {
        const token = localStorage.getItem('token');
        const headers: Record<string, string> = { 'Content-Type': 'application/json' };
        if (token) headers['Authorization'] = `Bearer ${token}`;

        const sectionContent = usesSections
          ? Object.entries(sections)
              .map(([id, text]) => {
                const s = SECTIONS.find((sec) => sec.id === id);
                return s && text.trim() ? `[${s.label}]\n${text}` : '';
              })
              .filter(Boolean)
              .join('\n\n')
          : '';

        const res = await fetch(`${API_URL}/api/resumes/${selectedResumeId}/transform`, {
          method: 'POST',
          headers,
          body: JSON.stringify({
            templateType: 'cover-letter',
            jobDescription: `[회사: ${values.company}] [포지션: ${values.position}] [어조: ${toneKorean[tone]}]${sectionContent ? `\n\n[작성된 항목]\n${sectionContent}` : ''}\n\n${values.jobDescription}`,
          }),
        });

        if (!res.ok) {
          const err = await res.json().catch(() => ({}));
          throw new Error(err.message || '생성에 실패했습니다');
        }
        const data = await res.json();
        const generatedText = data.text || data.data?.text || JSON.stringify(data);
        setResult(generatedText);
        toast('자기소개서가 생성되었습니다', 'success');

        // Auto-analyze feedback
        setTimeout(() => {
          setAnalyzingFeedback(true);
          setTimeout(() => {
            setFeedback(analyzeCoverLetter(generatedText, values.jobDescription));
            setAnalyzingFeedback(false);
          }, 800);
        }, 300);

        // Auto-save
        const saveToken = localStorage.getItem('token');
        if (saveToken) {
          fetch(`${API_URL}/api/cover-letters`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${saveToken}` },
            body: JSON.stringify({
              resumeId: selectedResumeId,
              company: values.company,
              position: values.position,
              tone,
              jobDescription: values.jobDescription,
              content: generatedText,
            }),
          }).catch(() => {});
        }
      } catch (e: any) {
        const msg = e.message || '생성에 실패했습니다';
        setError(msg);
        toast(msg, 'error');
      }
    },
    [selectedResumeId, tone, usesSections, sections],
  );

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    toast('클립보드에 복사되었습니다', 'success');
  };

  const handleDownloadPdf = (text: string) => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      toast('팝업이 차단되었습니다', 'error');
      return;
    }
    printWindow.document
      .write(`<!DOCTYPE html><html><head><meta charset="utf-8"><title>자기소개서 - ${companyName || '미지정'}</title><style>
      body { font-family: 'Pretendard', -apple-system, sans-serif; padding: 40px; line-height: 1.8; color: #1e293b; max-width: 800px; margin: 0 auto; font-size: 14px; }
      h1 { font-size: 18px; margin-bottom: 8px; }
      .meta { font-size: 12px; color: #64748b; margin-bottom: 24px; }
      .content { white-space: pre-wrap; }
    </style></head><body>
      <h1>${companyName ? companyName + ' — ' : ''}${position || '자기소개서'}</h1>
      <div class="meta">${toneKorean[tone]} | ${new Date().toLocaleDateString('ko-KR')}</div>
      <div class="content">${text.replace(/</g, '&lt;').replace(/>/g, '&gt;')}</div>
    </body></html>`);
    printWindow.document.close();
    setTimeout(() => {
      printWindow.print();
    }, 300);
  };

  const onFeedbackSubmit = (values: FeedbackFormValues) => {
    setFeedbackResult(analyzeCoverLetter(values.content, values.jobDescription || ''));
  };

  const charCount = result ? result.replace(/\s/g, '').length : 0;
  const wordCount = result ? result.replace(/\s+/g, ' ').trim().length : 0;

  return (
    <>
      <Header />
      <main
        id="main-content"
        className="flex-1 max-w-6xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-6 sm:py-8"
        role="main"
      >
        <div className="mb-6">
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-slate-100">
            {tx('resume.sections.summary')}
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            AI 자기소개서 생성 · 피드백 분석 · 항목별 작성
          </p>
        </div>
        <FeatureDisabledBanner feature="ai.coverLetter" label="AI 자기소개서">
          {/* Mode tabs */}
          <div className="flex gap-1 p-1 bg-slate-100 dark:bg-slate-800 rounded-xl w-fit mb-6">
            {[
              { id: 'generate' as const, label: '✍️ AI 생성', desc: '이력서 기반 자동 작성' },
              { id: 'feedback' as const, label: '🔍 피드백 분석', desc: '기존 자소서 분석' },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setMode(tab.id)}
                className={`px-4 py-2 text-sm font-medium rounded-lg transition-all ${mode === tab.id ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 shadow-sm' : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300'}`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* ─── GENERATE MODE ─── */}
          {mode === 'generate' && (
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
              {/* Left: Input */}
              <form
                onSubmit={handleSubmitGenerate(onGenerateSubmit)}
                className="space-y-5"
                noValidate
              >
                {/* Resume */}
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-200 mb-1.5">
                    이력서 선택 <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={selectedResumeId}
                    onChange={(e) => setSelectedResumeId(e.target.value)}
                    className="w-full px-3 py-2.5 border border-slate-200 dark:border-slate-600 rounded-xl text-sm dark:bg-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">이력서를 선택하세요</option>
                    {resumes.map((r) => (
                      <option key={r.id} value={r.id}>
                        {r.title || '제목 없음'} — {r.personalInfo?.name || '이름 없음'}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Company & Position */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-200 mb-1.5">
                      회사명 <span className="text-red-500">*</span>
                    </label>
                    <input
                      {...registerGenerate('company')}
                      placeholder="예: 카카오"
                      className={`w-full px-3 py-2.5 border rounded-xl text-sm dark:bg-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500 ${generateErrors.company ? 'border-red-400' : 'border-slate-200 dark:border-slate-600'}`}
                    />
                    {generateErrors.company && (
                      <p className="text-xs text-red-500 mt-1">{generateErrors.company.message}</p>
                    )}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-200 mb-1.5">
                      포지션 <span className="text-red-500">*</span>
                    </label>
                    <input
                      {...registerGenerate('position')}
                      placeholder="예: 마케터"
                      className={`w-full px-3 py-2.5 border rounded-xl text-sm dark:bg-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500 ${generateErrors.position ? 'border-red-400' : 'border-slate-200 dark:border-slate-600'}`}
                    />
                    {generateErrors.position && (
                      <p className="text-xs text-red-500 mt-1">{generateErrors.position.message}</p>
                    )}
                  </div>
                </div>

                {/* Tone */}
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-200 mb-1.5">
                    어조
                  </label>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                    {TONES.map((t) => (
                      <label
                        key={t.value}
                        className={`p-3 rounded-xl border cursor-pointer transition-all ${tone === t.value ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/30 ring-1 ring-blue-500' : 'border-slate-200 dark:border-slate-600 hover:border-slate-300'}`}
                      >
                        <input
                          type="radio"
                          name="tone"
                          value={t.value}
                          checked={tone === t.value}
                          onChange={() => setTone(t.value)}
                          className="sr-only"
                        />
                        <div className="text-sm font-medium text-slate-900 dark:text-slate-100">
                          {t.label}
                        </div>
                        <div className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                          {t.desc}
                        </div>
                      </label>
                    ))}
                  </div>
                </div>

                {/* Section mode toggle */}
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => setUsesSections((v) => !v)}
                    className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${usesSections ? 'bg-blue-600' : 'bg-slate-300 dark:bg-slate-600'}`}
                  >
                    <span
                      className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${usesSections ? 'translate-x-4' : 'translate-x-0.5'}`}
                    />
                  </button>
                  <span className="text-sm text-slate-700 dark:text-slate-300">
                    항목별 작성 (성장과정, 지원동기 등)
                  </span>
                </div>

                {/* Section inputs */}
                {usesSections && (
                  <div className="space-y-3 animate-fade-in-up">
                    {SECTIONS.map((sec) => {
                      const limit = sectionLimits[sec.id];
                      const text = sections[sec.id] || '';
                      const chars = text.replace(/\s/g, '').length;
                      const isOver = limit && chars > limit;
                      return (
                        <div
                          key={sec.id}
                          className="bg-slate-50 dark:bg-slate-900/30 rounded-xl border border-slate-200 dark:border-slate-700 p-3"
                        >
                          <div className="flex items-center justify-between mb-2">
                            <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                              {sec.label}
                            </label>
                            <div className="flex items-center gap-2">
                              <span
                                className={`text-[10px] ${isOver ? 'text-red-500 font-medium' : 'text-slate-400'}`}
                              >
                                {chars}자{limit ? ` / ${limit}자` : ''}
                              </span>
                              <input
                                type="number"
                                value={limit || ''}
                                onChange={(e) =>
                                  setSectionLimits((prev) => ({
                                    ...prev,
                                    [sec.id]: parseInt(e.target.value) || 0,
                                  }))
                                }
                                placeholder="글자 제한"
                                className="w-20 px-2 py-0.5 text-[10px] border border-slate-200 dark:border-slate-600 rounded-lg dark:bg-slate-800 dark:text-slate-100 focus:outline-none"
                              />
                            </div>
                          </div>
                          <textarea
                            value={text}
                            onChange={(e) =>
                              setSections((prev) => ({ ...prev, [sec.id]: e.target.value }))
                            }
                            placeholder={sec.placeholder}
                            rows={3}
                            className={`w-full text-sm bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 rounded-lg border focus:outline-none focus:ring-1 focus:ring-blue-500 resize-none px-3 py-2 ${isOver ? 'border-red-400' : 'border-slate-200 dark:border-slate-600'}`}
                          />
                        </div>
                      );
                    })}
                  </div>
                )}

                {/* Job description */}
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-200 mb-1.5">
                    채용 공고 <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    {...registerGenerate('jobDescription')}
                    placeholder="채용 공고 내용을 붙여넣으세요..."
                    rows={8}
                    className={`w-full px-3 py-2.5 border rounded-xl text-sm dark:bg-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none ${generateErrors.jobDescription ? 'border-red-400' : 'border-slate-200 dark:border-slate-600'}`}
                  />
                  {generateErrors.jobDescription && (
                    <p className="text-xs text-red-500 mt-1">
                      {generateErrors.jobDescription.message}
                    </p>
                  )}
                </div>

                <FeatureGate feature="coverLetter">
                  <button
                    type="submit"
                    disabled={isGenerating || !selectedResumeId}
                    className="w-full py-3 bg-gradient-to-r from-blue-600 to-sky-700 text-white font-medium rounded-xl hover:from-blue-700 hover:to-sky-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-sm hover:shadow"
                  >
                    {isGenerating ? (
                      <span className="flex items-center justify-center gap-2">
                        <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
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
                        생성 중...
                      </span>
                    ) : (
                      '자기소개서 생성'
                    )}
                  </button>
                </FeatureGate>
              </form>

              {/* Right: Result + Feedback */}
              <div className="space-y-4">
                {/* Result area */}
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="text-sm font-medium text-slate-700 dark:text-slate-200">
                      생성 결과
                    </label>
                    {result && (
                      <span className="text-xs text-slate-400">
                        {charCount.toLocaleString()}자 (공백 포함 {wordCount.toLocaleString()}자)
                      </span>
                    )}
                  </div>
                  {error && (
                    <div className="p-4 mb-2 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl text-sm text-red-600 dark:text-red-400">
                      {error}
                    </div>
                  )}
                  <div className="imp-card p-5 min-h-[300px]">
                    {isGenerating ? (
                      <div className="flex flex-col items-center justify-center h-48 gap-3">
                        <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
                        <p className="text-sm text-slate-500">AI가 자기소개서를 작성 중입니다...</p>
                      </div>
                    ) : result ? (
                      <div className="prose prose-sm dark:prose-invert max-w-none whitespace-pre-wrap text-sm text-slate-700 dark:text-slate-300 leading-relaxed">
                        {result}
                      </div>
                    ) : (
                      <div className="flex flex-col items-center justify-center h-48 text-slate-400">
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
                        <p className="text-sm">이력서와 채용 공고를 입력하면</p>
                        <p className="text-sm">AI가 맞춤 자기소개서를 작성합니다</p>
                      </div>
                    )}
                  </div>

                  {result && (
                    <div className="flex flex-wrap gap-2 mt-3">
                      <button
                        onClick={() => handleCopy(result)}
                        className="flex items-center gap-2 px-3 py-2 text-xs font-medium bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 rounded-xl hover:bg-blue-100 transition-colors"
                      >
                        <svg
                          className="w-3.5 h-3.5"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"
                          />
                        </svg>
                        복사
                      </button>
                      <button
                        onClick={() => handleDownloadPdf(result)}
                        className="flex items-center gap-2 px-3 py-2 text-xs font-medium bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400 rounded-xl hover:bg-green-100 transition-colors"
                      >
                        <svg
                          className="w-3.5 h-3.5"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                          />
                        </svg>
                        PDF
                      </button>
                      <button
                        type="button"
                        onClick={handleSubmitGenerate(onGenerateSubmit)}
                        disabled={isGenerating}
                        className="flex items-center gap-2 px-3 py-2 text-xs font-medium bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 rounded-xl hover:bg-slate-200 transition-colors disabled:opacity-50"
                      >
                        <svg
                          className="w-3.5 h-3.5"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                          />
                        </svg>
                        재생성
                      </button>
                    </div>
                  )}
                </div>

                {/* Related jobs (cross-feature recommendation) */}
                {(companyName?.trim() || position?.trim()) && (
                  <RelatedJobsWidget
                    companyName={companyName || ''}
                    position={position || ''}
                    limit={5}
                  />
                )}

                {/* AI Feedback panel */}
                {(feedback || analyzingFeedback) && (
                  <div className="imp-card p-5 animate-fade-in-up">
                    <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 mb-4 flex items-center gap-2">
                      <span className="w-6 h-6 bg-sky-100 dark:bg-sky-900/30 rounded-lg flex items-center justify-center text-xs">
                        🔍
                      </span>
                      AI 피드백 분석
                    </h3>

                    {analyzingFeedback ? (
                      <div className="flex items-center gap-2 text-sm text-slate-500 py-4">
                        <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
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
                        분석 중...
                      </div>
                    ) : (
                      feedback && <FeedbackPanel result={feedback} />
                    )}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ─── FEEDBACK MODE ─── */}
          {mode === 'feedback' && (
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
              <form
                onSubmit={handleSubmitFeedback(onFeedbackSubmit)}
                className="space-y-4"
                noValidate
              >
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-200 mb-1.5">
                    자기소개서 붙여넣기 <span className="text-red-500">*</span>
                  </label>
                  <KoreanQualityBadge
                    text={feedbackText || ''}
                    label="자기소개서"
                    className="mb-1.5"
                  />
                  <div className="text-xs text-slate-400 mb-1.5">
                    {(feedbackText || '').replace(/\s/g, '').length}자 (공백 제외)
                  </div>
                  <textarea
                    {...registerFeedback('content')}
                    placeholder="분석할 자기소개서를 여기에 붙여넣으세요..."
                    rows={14}
                    className={`w-full px-3 py-2.5 border rounded-xl text-sm dark:bg-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-sky-500 resize-none ${feedbackErrors.content ? 'border-red-400' : 'border-slate-200 dark:border-slate-600'}`}
                  />
                  {feedbackErrors.content && (
                    <p className="text-xs text-red-500 mt-1">{feedbackErrors.content.message}</p>
                  )}
                  {deferredFeedbackText.length >= 80 && (
                    <div className="mt-2">
                      <TldrHeadline text={deferredFeedbackText} />
                      <OverallHealthGauge text={deferredFeedbackText} className="mb-2" />
                      <div className="text-[11px] font-medium text-slate-500 dark:text-slate-400 mb-1">
                        🏷️ 핵심 키워드
                      </div>
                      <KeywordCloud text={deferredFeedbackText} topN={12} />
                      <SkillMentionsBar text={deferredFeedbackText} />
                      <AnalysisSummaryBar text={deferredFeedbackText} />
                      <SectionInsightsPanel text={deferredFeedbackText} />
                      <CareerGapPanel text={deferredFeedbackText} />
                      <QuotableHighlights text={deferredFeedbackText} />
                      <UnquantifiedClaimsPanel text={deferredFeedbackText} />
                      <OpenerSuggestionsPanel text={deferredFeedbackText} />
                      <InterviewQuestionsPanel text={deferredFeedbackText} />
                    </div>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-200 mb-1.5">
                    채용 공고{' '}
                    <span className="text-slate-400 font-normal">
                      (선택, 있으면 키워드 매칭 분석)
                    </span>
                  </label>
                  <textarea
                    {...registerFeedback('jobDescription')}
                    placeholder="채용 공고를 붙여넣으면 키워드 적합성을 분석합니다..."
                    rows={6}
                    className={`w-full px-3 py-2.5 border rounded-xl text-sm dark:bg-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-sky-500 resize-none ${feedbackErrors.jobDescription ? 'border-red-400' : 'border-slate-200 dark:border-slate-600'}`}
                  />
                  {feedbackErrors.jobDescription && (
                    <p className="text-xs text-red-500 mt-1">
                      {feedbackErrors.jobDescription.message}
                    </p>
                  )}
                  {(feedbackText || '').length >= 100 && (feedbackJd || '').length >= 80 && (
                    <JDMatchBadge resumeText={feedbackText || ''} jdText={feedbackJd || ''} />
                  )}
                </div>
                <button
                  type="submit"
                  disabled={isAnalyzingFeedbackForm}
                  className="w-full py-3 bg-neutral-900 dark:bg-white text-white font-medium rounded-xl hover:bg-neutral-800 dark:hover:bg-neutral-100 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-sm"
                >
                  {isAnalyzingFeedbackForm ? '분석 중...' : '피드백 분석'}
                </button>
              </form>

              <div>
                {feedbackResult ? (
                  <div className="imp-card p-5 animate-fade-in-up">
                    <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 mb-4">
                      분석 결과
                    </h3>
                    <FeedbackPanel result={feedbackResult} />
                  </div>
                ) : (
                  <div className="imp-card p-8 flex flex-col items-center justify-center text-center min-h-[400px]">
                    <div className="text-5xl mb-4">🔍</div>
                    <p className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                      자소서 분석 도구
                    </p>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      자기소개서를 붙여넣으면 AI가
                      <br />
                      점수, 키워드 매칭, 개선점을 분석합니다
                    </p>
                    <div className="mt-6 grid grid-cols-2 gap-3 text-xs text-left w-full max-w-xs">
                      {['분량 적절성', '키워드 매칭', '구체성 분석', '전문성 평가'].map((item) => (
                        <div
                          key={item}
                          className="flex items-center gap-2 text-slate-500 dark:text-slate-400"
                        >
                          <span className="text-green-500">✓</span> {item}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </FeatureDisabledBanner>
      </main>
      <Footer />
    </>
  );
}

function FeedbackPanel({ result }: { result: FeedbackResult }) {
  const scoreColor =
    result.totalScore >= 80
      ? 'text-emerald-600'
      : result.totalScore >= 60
        ? 'text-blue-600'
        : result.totalScore >= 40
          ? 'text-amber-600'
          : 'text-red-500';

  return (
    <div className="space-y-5">
      {/* Score meter */}
      <div className="text-center">
        <ScoreMeter score={result.totalScore} />
        <p className={`text-sm font-bold mt-2 ${scoreColor}`}>
          {result.totalScore >= 80
            ? '우수한 자기소개서입니다!'
            : result.totalScore >= 60
              ? '준수한 수준, 개선 가능합니다'
              : result.totalScore >= 40
                ? '핵심 개선이 필요합니다'
                : '전반적인 보완이 필요합니다'}
        </p>
        <p className="text-xs text-slate-400 mt-0.5">
          {result.charCount.toLocaleString()}자 (공백 제외)
        </p>
      </div>

      {/* Category scores */}
      <div className="space-y-2">
        {result.categories.map((cat) => {
          const pct = (cat.score / cat.max) * 100;
          return (
            <div key={cat.label} className="flex items-center gap-2">
              <span className="text-xs text-slate-600 dark:text-slate-400 w-20 shrink-0">
                {cat.label}
              </span>
              <div className="flex-1 h-2 bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all duration-700 ${pct >= 70 ? 'bg-emerald-500' : pct >= 40 ? 'bg-blue-500' : 'bg-amber-500'}`}
                  style={{ width: `${pct}%` }}
                />
              </div>
              <span className="text-[10px] text-slate-400 shrink-0 w-10 text-right">
                {cat.score}/{cat.max}
              </span>
              <span className="text-[10px] text-slate-400 w-20 shrink-0">{cat.comment}</span>
            </div>
          );
        })}
      </div>

      {/* Keywords */}
      {(result.keywords.found.length > 0 || result.keywords.missing.length > 0) && (
        <div className="border-t border-slate-100 dark:border-slate-700 pt-4">
          <p className="text-xs font-semibold text-slate-700 dark:text-slate-300 mb-2">
            키워드 분석
          </p>
          {result.keywords.found.length > 0 && (
            <div className="mb-2">
              <p className="text-[10px] text-emerald-600 dark:text-emerald-400 font-medium mb-1">
                ✓ 포함된 키워드
              </p>
              <div className="flex flex-wrap gap-1">
                {result.keywords.found.map((kw) => (
                  <span
                    key={kw}
                    className="px-1.5 py-0.5 text-[10px] bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-400 rounded-full"
                  >
                    {kw}
                  </span>
                ))}
              </div>
            </div>
          )}
          {result.keywords.missing.length > 0 && (
            <div>
              <p className="text-[10px] text-amber-600 dark:text-amber-400 font-medium mb-1">
                ⚠ 추가 권장 키워드
              </p>
              <div className="flex flex-wrap gap-1">
                {result.keywords.missing.map((kw) => (
                  <span
                    key={kw}
                    className="px-1.5 py-0.5 text-[10px] bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-400 rounded-full"
                  >
                    {kw}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Strengths */}
      {result.strengths.length > 0 && (
        <div className="border-t border-slate-100 dark:border-slate-700 pt-4">
          <p className="text-xs font-semibold text-slate-700 dark:text-slate-300 mb-2">👍 강점</p>
          <ul className="space-y-1">
            {result.strengths.map((s, i) => (
              <li
                key={i}
                className="text-xs text-slate-600 dark:text-slate-400 flex items-start gap-2"
              >
                <span className="text-emerald-500 shrink-0 mt-0.5">✓</span> {s}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Suggestions */}
      {result.suggestions.length > 0 && (
        <div className="border-t border-slate-100 dark:border-slate-700 pt-4">
          <p className="text-xs font-semibold text-slate-700 dark:text-slate-300 mb-2">
            💡 개선 제안
          </p>
          <ul className="space-y-1.5">
            {result.suggestions.map((s, i) => (
              <li
                key={i}
                className="text-xs text-slate-600 dark:text-slate-400 flex items-start gap-2 p-2 bg-amber-50 dark:bg-amber-900/10 rounded-lg"
              >
                <span className="text-amber-500 shrink-0 mt-0.5">•</span> {s}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

// KoreanQualityBadge 는 @/components/KoreanQualityBadge 로 추출되어 공용화됨.

function TldrHeadline({ text }: { text: string }) {
  if (text.length < 300) return null;
  const tldr = generateResumeTldr(text);
  return (
    <div className="mb-3 p-2.5 rounded-lg bg-blue-50/50 dark:bg-blue-900/10 border border-blue-100 dark:border-blue-900/30">
      <div className="text-[10px] font-semibold uppercase tracking-wider text-blue-700 dark:text-blue-300 mb-1">
        📌 이력서 한 줄 요약
      </div>
      <p className="text-[12.5px] leading-relaxed text-slate-700 dark:text-slate-200">
        {tldr.summary}
      </p>
    </div>
  );
}

function AnalysisSummaryBar({ text }: { text: string }) {
  if (text.length < 200) return null;
  const full = analyzeEverything(text);
  const summary = summarizeAnalysis(full);
  const interview = scoreInterviewability(text);
  const tierColor =
    interview.tier === 'call-back'
      ? 'bg-green-100 dark:bg-green-900/40 text-green-800 dark:text-green-200'
      : interview.tier === 'promising'
        ? 'bg-blue-100 dark:bg-blue-900/40 text-blue-800 dark:text-blue-200'
        : interview.tier === 'needs-work'
          ? 'bg-amber-100 dark:bg-amber-900/40 text-amber-800 dark:text-amber-200'
          : 'bg-red-100 dark:bg-red-900/40 text-red-800 dark:text-red-200';
  const tierLabel =
    interview.tier === 'call-back'
      ? '콜백 유력'
      : interview.tier === 'promising'
        ? '유망'
        : interview.tier === 'needs-work'
          ? '보완 필요'
          : '미달';
  if (summary.topFlags.length === 0) return null;
  return (
    <div className="mt-3 p-2.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-gradient-to-r from-slate-50 to-slate-50/50 dark:from-slate-800/50 dark:to-slate-800/30">
      <div className="flex items-baseline justify-between mb-1.5 gap-2">
        <span className="text-[11px] font-semibold text-slate-700 dark:text-slate-200">
          📊 종합 진단
        </span>
        <span className="flex items-center gap-2">
          <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded ${tierColor}`}>
            🎯 면접 {interview.overall}점 · {tierLabel}
          </span>
          <span className="text-[10px] text-slate-500 dark:text-slate-400">{summary.oneLiner}</span>
        </span>
      </div>
      <ul className="space-y-1">
        {summary.topFlags.map((f, i) => (
          <li
            key={i}
            className="flex items-start gap-2 text-[10.5px] text-slate-600 dark:text-slate-300"
          >
            <span aria-hidden>
              {f.severity === 'red' ? '🔴' : f.severity === 'yellow' ? '🟡' : '🟢'}
            </span>
            <span>
              <span className="font-medium">{f.label}</span>
              <span className="text-slate-500 dark:text-slate-400"> · {f.note}</span>
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}

function UnquantifiedClaimsPanel({ text }: { text: string }) {
  if (text.length < 200) return null;
  const claims = detectUnquantifiedClaims(text);
  if (claims.length === 0) return null;
  return (
    <div className="mt-3 p-2.5 rounded-lg border border-amber-200 dark:border-amber-800 bg-amber-50/60 dark:bg-amber-900/15">
      <div className="flex items-baseline justify-between mb-1.5">
        <span className="text-[11px] font-semibold text-amber-800 dark:text-amber-200">
          📈 수치화 필요 문장
        </span>
        <span className="text-[10px] text-amber-600 dark:text-amber-400">{claims.length}건</span>
      </div>
      <ul className="space-y-1.5">
        {claims.slice(0, 4).map((c, i) => (
          <li key={i} className="text-[10.5px] leading-snug text-slate-700 dark:text-slate-200">
            <span className="inline-flex items-center px-1 py-0 rounded text-[9px] font-medium bg-amber-100 dark:bg-amber-900/40 text-amber-800 dark:text-amber-200 mr-1">
              {c.verb}
            </span>
            {c.sentence.length > 80 ? c.sentence.slice(0, 80) + '…' : c.sentence}
          </li>
        ))}
      </ul>
    </div>
  );
}

function OpenerSuggestionsPanel({ text }: { text: string }) {
  if (text.length < 200) return null;
  const openers = recommendCoverLetterOpeners(text);
  const copyToClipboard = async (t: string) => {
    try {
      await navigator.clipboard.writeText(t);
    } catch {
      // ignore
    }
  };
  const styleLabel: Record<(typeof openers)[number]['style'], string> = {
    achievement: '성과형',
    passion: '열정형',
    pragmatic: '실용형',
  };
  return (
    <div className="mt-3">
      <div className="text-[11px] font-medium text-slate-500 dark:text-slate-400 mb-1">
        ✏️ 추천 오프닝 문장
      </div>
      <ul className="space-y-1.5">
        {openers.map((o) => (
          <li
            key={o.style}
            className="p-2 text-[11.5px] rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/50"
          >
            <div className="flex items-baseline justify-between gap-2 mb-0.5">
              <span className="inline-flex items-center px-1.5 py-0 rounded text-[9.5px] font-medium bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
                {styleLabel[o.style]}
              </span>
              <button
                type="button"
                onClick={() => copyToClipboard(o.text)}
                className="text-[9.5px] text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200"
              >
                복사
              </button>
            </div>
            <p className="text-slate-700 dark:text-slate-300 leading-snug">{o.text}</p>
          </li>
        ))}
      </ul>
    </div>
  );
}

function SkillMentionsBar({ text }: { text: string }) {
  const skills = detectSkillMentions(text, 10);
  if (skills.length === 0) return null;
  return (
    <div className="mt-3">
      <div className="text-[11px] font-medium text-slate-500 dark:text-slate-400 mb-1">
        🛠️ 언급된 기술 스킬
      </div>
      <div className="flex flex-wrap gap-2">
        {skills.map((s) => (
          <span
            key={s.skill}
            className="inline-flex items-center gap-1 px-2 py-0.5 text-[11px] rounded-md bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 border border-blue-100 dark:border-blue-900/40"
            title={`${s.skill} — ${s.count}회 언급`}
          >
            {s.skill}
            <span className="text-[9px] text-blue-400 dark:text-blue-500">×{s.count}</span>
          </span>
        ))}
      </div>
    </div>
  );
}

function JDMatchBadge({ resumeText, jdText }: { resumeText: string; jdText: string }) {
  const match = computeJDMatch(resumeText, jdText, 25);
  const tone =
    match.score >= 75
      ? 'bg-green-50 border-green-200 text-green-800 dark:bg-green-900/20 dark:border-green-800 dark:text-green-200'
      : match.score >= 50
        ? 'bg-blue-50 border-blue-200 text-blue-800 dark:bg-blue-900/20 dark:border-blue-800 dark:text-blue-200'
        : 'bg-amber-50 border-amber-200 text-amber-800 dark:bg-amber-900/20 dark:border-amber-800 dark:text-amber-200';
  return (
    <div className={`mt-2 p-3 rounded-lg border text-[12px] leading-relaxed ${tone}`}>
      <div className="flex items-baseline justify-between mb-1.5">
        <span className="font-semibold">🎯 JD 적합도</span>
        <span className="text-[14px] font-bold">{match.score}%</span>
      </div>
      <p className="text-[11px] opacity-90 mb-2">{match.suggestion}</p>
      {match.missing.length > 0 && (
        <div>
          <div className="text-[10px] font-medium opacity-80 mb-1">
            🔴 이력서에 누락된 JD 키워드
          </div>
          <div className="flex flex-wrap gap-1">
            {match.missing.slice(0, 8).map((w) => (
              <span
                key={w}
                className="text-[10px] px-1.5 py-0.5 rounded-md bg-white/60 dark:bg-slate-800/60 border border-current/20"
              >
                {w}
              </span>
            ))}
          </div>
        </div>
      )}
      {match.matched.length > 0 && (
        <div className="mt-2">
          <div className="text-[10px] font-medium opacity-80 mb-1">
            🟢 공통 키워드 ({match.matched.length})
          </div>
          <div className="flex flex-wrap gap-1">
            {match.matched.slice(0, 8).map((w) => (
              <span
                key={w}
                className="text-[10px] px-1.5 py-0.5 rounded-md bg-white/60 dark:bg-slate-800/60 border border-current/20"
              >
                {w}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
