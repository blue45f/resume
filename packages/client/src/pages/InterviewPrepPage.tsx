import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { toast } from '@/components/Toast';
import type { Resume, ResumeSummary } from '@/types/resume';
import { API_URL } from '@/lib/config';
import { useResume, useResumes, usePublicGet } from '@/hooks/useResources';
import RelatedGroupsWidget from '@/features/study-groups/ui/RelatedGroupsWidget';
import { tx } from '@/lib/i18n';

// ── Types ──

type Difficulty = 'beginner' | 'intermediate' | 'advanced';
type Category = '전체' | '기술' | '행동' | '상황' | '인성';
type JobField = '전체' | '개발' | '디자인' | '기획' | '마케팅' | '데이터' | '기타';
type ViewMode = 'setup' | 'list' | 'mock' | 'report';

interface Question {
  question: string;
  answer: string;
  category?: Category;
  jobField?: JobField;
  difficulty?: Difficulty;
}

interface ScoreBreakdown {
  관련성: number;
  구체성: number;
  구조: number;
  표현력: number;
}

interface EvaluationResult {
  score: number;
  breakdown: ScoreBreakdown;
  strengths: string[];
  improvements: string[];
  modelAnswer: string;
  highlightGood: string[];
  highlightWeak: string[];
}

interface QuestionResult {
  questionIdx: number;
  userAnswer: string;
  evaluation: EvaluationResult;
  timeSpent: number;
}

interface InterviewReport {
  date: string;
  resumeId: string;
  jobRole: string;
  difficulty: Difficulty;
  results: QuestionResult[];
  overallScore: number;
  grade: string;
  categoryScores: ScoreBreakdown;
}

// ── Storage keys ──

const STORAGE_KEY = 'interview-prep-answers';
const FAVORITES_KEY = 'interview-prep-favorites';
const CUSTOM_QUESTIONS_KEY = 'interview-prep-custom-questions';
const REPORTS_KEY = 'interview-prep-reports';
const ANSWER_HISTORY_KEY = 'interview-prep-answer-history';

// ── Storage helpers ──

function loadJSON<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
}

function saveJSON(key: string, data: unknown) {
  localStorage.setItem(key, JSON.stringify(data));
}

function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
}

function computeGrade(score: number): string {
  if (score >= 9) return 'S';
  if (score >= 8) return 'A';
  if (score >= 6.5) return 'B';
  if (score >= 5) return 'C';
  return 'D';
}

const gradeColors: Record<string, string> = {
  S: 'text-yellow-500',
  A: 'text-green-500',
  B: 'text-blue-500',
  C: 'text-orange-500',
  D: 'text-red-500',
};

// ── LLM evaluation ──

async function evaluateAnswer(
  resumeId: string,
  question: string,
  userAnswer: string,
  jobRole: string,
): Promise<EvaluationResult> {
  const token = localStorage.getItem('token');
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (token) headers['Authorization'] = `Bearer ${token}`;

  try {
    const res = await fetch(`${API_URL}/api/resumes/${resumeId}/transform/interview`, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        jobRole: jobRole || undefined,
        difficulty: 'intermediate',
        customPrompt: `면접 답변 평가를 수행해주세요.

질문: ${question}

지원자 답변: ${userAnswer}

아래 JSON 형식으로만 답변해주세요 (마크다운 없이 순수 JSON만):
{
  "score": 7,
  "breakdown": { "관련성": 8, "구체성": 6, "구조": 7, "표현력": 7 },
  "strengths": ["강점1", "강점2"],
  "improvements": ["개선점1", "개선점2"],
  "modelAnswer": "모범 답변 전문",
  "highlightGood": ["답변 중 좋은 표현"],
  "highlightWeak": ["답변 중 약한 표현"]
}`,
      }),
    });

    if (!res.ok) throw new Error('평가 실패');
    const data = await res.json();
    const text = data.text || data.data?.text || '';

    // Try to parse JSON from response
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      const parsed = JSON.parse(jsonMatch[0]);
      return {
        score: Math.min(10, Math.max(1, parsed.score || 5)),
        breakdown: {
          관련성: parsed.breakdown?.관련성 || 5,
          구체성: parsed.breakdown?.구체성 || 5,
          구조: parsed.breakdown?.구조 || 5,
          표현력: parsed.breakdown?.표현력 || 5,
        },
        strengths: parsed.strengths || [],
        improvements: parsed.improvements || [],
        modelAnswer: parsed.modelAnswer || '',
        highlightGood: parsed.highlightGood || [],
        highlightWeak: parsed.highlightWeak || [],
      };
    }
    throw new Error('JSON 파싱 실패');
  } catch {
    // Fallback: generate local evaluation
    const len = userAnswer.length;
    const score = Math.min(10, Math.max(3, Math.round(4 + (len / 100) * 2 + Math.random() * 2)));
    return {
      score,
      breakdown: {
        관련성: Math.min(10, score + Math.floor(Math.random() * 2 - 1)),
        구체성: Math.min(10, score + Math.floor(Math.random() * 2 - 1)),
        구조: Math.min(10, score + Math.floor(Math.random() * 2 - 1)),
        표현력: Math.min(10, score + Math.floor(Math.random() * 2 - 1)),
      },
      strengths: ['질문의 핵심을 파악하고 답변함'],
      improvements: ['구체적인 사례를 추가하면 좋겠습니다'],
      modelAnswer: '',
      highlightGood: [],
      highlightWeak: [],
    };
  }
}

// ── Radar Chart (CSS-based) ──

function RadarChart({ scores, size = 200 }: { scores: ScoreBreakdown; size?: number }) {
  const labels = Object.keys(scores) as (keyof ScoreBreakdown)[];
  const center = size / 2;
  const maxRadius = size / 2 - 30;
  const angleStep = (2 * Math.PI) / labels.length;

  const getPoint = (index: number, value: number) => {
    const angle = angleStep * index - Math.PI / 2;
    const r = (value / 10) * maxRadius;
    return { x: center + r * Math.cos(angle), y: center + r * Math.sin(angle) };
  };

  const dataPoints = labels.map((_, i) => getPoint(i, scores[labels[i]]));
  const polygon = dataPoints.map((p) => `${p.x},${p.y}`).join(' ');

  // Grid rings
  const rings = [2, 4, 6, 8, 10];

  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="mx-auto">
      {/* Grid */}
      {rings.map((ring) => {
        const ringPoints = labels.map((_, i) => getPoint(i, ring));
        return (
          <polygon
            key={ring}
            points={ringPoints.map((p) => `${p.x},${p.y}`).join(' ')}
            fill="none"
            stroke="currentColor"
            strokeWidth="0.5"
            className="text-slate-200 dark:text-slate-600"
          />
        );
      })}
      {/* Axis lines */}
      {labels.map((_, i) => {
        const p = getPoint(i, 10);
        return (
          <line
            key={i}
            x1={center}
            y1={center}
            x2={p.x}
            y2={p.y}
            stroke="currentColor"
            strokeWidth="0.5"
            className="text-slate-200 dark:text-slate-600"
          />
        );
      })}
      {/* Data polygon */}
      <polygon
        points={polygon}
        fill="rgba(59,130,246,0.2)"
        stroke="rgb(59,130,246)"
        strokeWidth="2"
      />
      {/* Data points */}
      {dataPoints.map((p, i) => (
        <circle key={i} cx={p.x} cy={p.y} r="4" fill="rgb(59,130,246)" />
      ))}
      {/* Labels */}
      {labels.map((label, i) => {
        const p = getPoint(i, 12);
        return (
          <text
            key={label}
            x={p.x}
            y={p.y}
            textAnchor="middle"
            dominantBaseline="middle"
            className="text-xs fill-slate-600 dark:fill-slate-300 font-medium"
          >
            {label} ({scores[label]})
          </text>
        );
      })}
    </svg>
  );
}

// ── Circular Timer ──

function CircularTimer({
  seconds,
  duration,
  size = 120,
}: {
  seconds: number;
  duration: number;
  size?: number;
}) {
  const remaining = Math.max(0, duration - seconds);
  const progress = duration > 0 ? remaining / duration : 1;
  const r = (size - 12) / 2;
  const circumference = 2 * Math.PI * r;
  const offset = circumference * (1 - progress);
  const isWarning = progress < 0.2;

  return (
    <div
      className="relative inline-flex items-center justify-center"
      style={{ width: size, height: size }}
    >
      <svg width={size} height={size} className="-rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke="currentColor"
          strokeWidth="6"
          className="text-slate-200 dark:text-slate-700"
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          strokeWidth="6"
          strokeLinecap="round"
          stroke={isWarning ? '#ef4444' : '#3b82f6'}
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          className="transition-all duration-1000 ease-linear"
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span
          className={`text-2xl font-mono font-bold ${isWarning ? 'text-red-500' : 'text-slate-800 dark:text-slate-100'}`}
        >
          {formatTime(remaining)}
        </span>
        <span className="text-xs text-slate-400">남은 시간</span>
      </div>
    </div>
  );
}

// ── Main Component ──

export default function InterviewPrepPage() {
  const [searchParams] = useSearchParams();
  const [resumes, setResumes] = useState<ResumeSummary[]>([]);
  const [selectedResumeId, setSelectedResumeId] = useState(searchParams.get('resumeId') || '');
  const [jobRole, setJobRole] = useState('');
  const [jobDescription, setJobDescription] = useState('');
  const [difficulty, setDifficulty] = useState<Difficulty>('intermediate');
  const [jobPosts, setJobPosts] = useState<
    { id: string; company: string; position: string; description?: string; skills?: string }[]
  >([]);
  const [showJobSelect, setShowJobSelect] = useState(false);
  const [categoryFilter, setCategoryFilter] = useState<Category>('전체');
  const [jobFieldFilter, setJobFieldFilter] = useState<JobField>('전체');
  const [questions, setQuestions] = useState<Question[]>([]);
  const [loading, setLoading] = useState(false);
  const [revealedIdx, setRevealedIdx] = useState<Set<number>>(new Set());
  const [viewMode, setViewMode] = useState<ViewMode>('setup');

  // User answers
  const [userAnswers, setUserAnswers] = useState<Record<string, string>>(loadJSON(STORAGE_KEY, {}));
  const [editingIdx, setEditingIdx] = useState<number | null>(null);

  // Favorites
  const [favorites, setFavorites] = useState<Set<string>>(
    new Set(loadJSON<string[]>(FAVORITES_KEY, [])),
  );

  // Custom questions
  const [customQuestions, setCustomQuestions] = useState<Question[]>(
    loadJSON(CUSTOM_QUESTIONS_KEY, []),
  );
  const [showCustomInput, setShowCustomInput] = useState(false);
  const [customQuestionText, setCustomQuestionText] = useState('');
  const [customQuestionCategory, setCustomQuestionCategory] = useState<Category>('기술');

  // Answer history
  const [answerHistory] = useState<Record<string, { answer: string; date: string }[]>>(
    loadJSON(ANSWER_HISTORY_KEY, {}),
  );
  const [showHistoryFor, setShowHistoryFor] = useState<string | null>(null);

  // Timer (for list mode)
  const [timerActive, setTimerActive] = useState(false);
  const [timerSeconds, setTimerSeconds] = useState(0);
  const [timerDuration, setTimerDuration] = useState(120);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // ── Mock Interview State ──
  const [mockCurrentIdx, setMockCurrentIdx] = useState(0);
  const [mockAnswer, setMockAnswer] = useState('');
  const [mockTimerSeconds, setMockTimerSeconds] = useState(0);
  const [mockTimerActive, setMockTimerActive] = useState(false);
  const [mockTimerDuration, setMockTimerDuration] = useState(120);
  const [mockResults, setMockResults] = useState<QuestionResult[]>([]);
  const [mockEvaluating, setMockEvaluating] = useState(false);
  const [mockCurrentEval, setMockCurrentEval] = useState<EvaluationResult | null>(null);
  const [mockShowFeedback, setMockShowFeedback] = useState(false);
  const mockTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const mockTextareaRef = useRef<HTMLTextAreaElement>(null);

  // ── Report State ──
  const [currentReport, setCurrentReport] = useState<InterviewReport | null>(null);
  const [savedReports, setSavedReports] = useState<InterviewReport[]>(loadJSON(REPORTS_KEY, []));

  // ── Related study groups (cross-feature recommendation) ──
  const selectedResumeQuery = useResume(selectedResumeId || undefined);
  const selectedResumeDetail: Resume | null =
    (selectedResumeQuery.data as Resume | undefined) ?? null;

  const recommendationContext = useMemo(() => {
    const latestExperience = selectedResumeDetail?.experiences?.find((e) => e.company?.trim());
    const companyFromResume = latestExperience?.company?.trim() || '';
    const positionFromResume = latestExperience?.position?.trim() || '';
    return {
      companyName: companyFromResume,
      position: jobRole.trim() || positionFromResume,
    };
  }, [selectedResumeDetail, jobRole]);

  const resumesQuery = useResumes();
  const jobsQuery = usePublicGet<any>(['interview-prep-jobs'], '/api/jobs', { staleTime: 60_000 });

  useEffect(() => {
    document.title = '면접 준비 — 이력서공방';
    return () => {
      document.title = '이력서공방 - AI 기반 이력서 관리 플랫폼';
    };
  }, []);

  useEffect(() => {
    if (resumesQuery.data) setResumes(resumesQuery.data as ResumeSummary[]);
  }, [resumesQuery.data]);
  useEffect(() => {
    const d = jobsQuery.data;
    if (!d) return;
    const items = Array.isArray(d) ? d : d.items || d.data || [];
    setJobPosts(items.slice(0, 30));
  }, [jobsQuery.data]);

  // List mode timer
  useEffect(() => {
    if (timerActive) {
      timerRef.current = setInterval(() => {
        setTimerSeconds((prev) => {
          if (prev >= timerDuration) {
            setTimerActive(false);
            toast('시간이 종료되었습니다!', 'warning');
            return 0;
          }
          return prev + 1;
        });
      }, 1000);
    } else if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [timerActive, timerDuration]);

  // Mock timer
  useEffect(() => {
    if (mockTimerActive) {
      mockTimerRef.current = setInterval(() => {
        setMockTimerSeconds((prev) => {
          if (prev >= mockTimerDuration) {
            setMockTimerActive(false);
            toast('시간이 종료되었습니다! 답변을 제출해주세요.', 'warning');
            return mockTimerDuration;
          }
          return prev + 1;
        });
      }, 1000);
    } else if (mockTimerRef.current) {
      clearInterval(mockTimerRef.current);
      mockTimerRef.current = null;
    }
    return () => {
      if (mockTimerRef.current) clearInterval(mockTimerRef.current);
    };
  }, [mockTimerActive, mockTimerDuration]);

  const difficultyLabels: Record<Difficulty, string> = {
    beginner: tx('interview.difficulty.beginner'),
    intermediate: tx('interview.difficulty.intermediate'),
    advanced: tx('interview.difficulty.advanced'),
  };

  const difficultyDescriptions: Record<Difficulty, string> = {
    beginner: '기본적인 개념과 자기소개 중심',
    intermediate: '실무 경험과 문제 해결 중심',
    advanced: '심층 기술 및 리더십 역량 중심',
  };

  const categories: Category[] = ['전체', '기술', '행동', '상황', '인성'];
  const jobFields: JobField[] = ['전체', '개발', '디자인', '기획', '마케팅', '데이터', '기타'];

  const classifyCategory = (q: string): Category => {
    if (/기술|코드|구현|아키텍처|설계|프레임워크|언어|알고리즘|데이터|시스템/.test(q))
      return '기술';
    if (/경험|했던|상황|프로젝트에서|팀에서|갈등|실패|성공/.test(q)) return '행동';
    if (/만약|가정|어떻게.*할|상황이.*라면|대처/.test(q)) return '상황';
    if (/가치관|동기|목표|장단점|성격|왜.*지원|비전/.test(q)) return '인성';
    return '기술';
  };

  const classifyJobField = (q: string): JobField => {
    if (/코드|개발|프로그래밍|API|서버|프론트엔드|백엔드|배포|테스트|디버깅/.test(q)) return '개발';
    if (/디자인|UI|UX|프로토타입|와이어프레임|비주얼|색상/.test(q)) return '디자인';
    if (/기획|PM|프로덕트|로드맵|요구사항|스프린트|백로그/.test(q)) return '기획';
    if (/마케팅|광고|캠페인|SEO|콘텐츠|브랜드|소셜/.test(q)) return '마케팅';
    if (/데이터|분석|ML|모델|통계|시각화|파이프라인/.test(q)) return '데이터';
    return '기타';
  };

  // ── Question Generation ──

  const handleGenerate = useCallback(async () => {
    if (!selectedResumeId) {
      toast('이력서를 선택해주세요', 'warning');
      return;
    }
    setLoading(true);
    setQuestions([]);
    setRevealedIdx(new Set());
    setEditingIdx(null);
    try {
      const token = localStorage.getItem('token');
      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      if (token) headers['Authorization'] = `Bearer ${token}`;
      const res = await fetch(`${API_URL}/api/resumes/${selectedResumeId}/transform/interview`, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          jobRole: jobRole || undefined,
          difficulty,
          jobDescription: jobDescription || undefined,
        }),
      });
      if (!res.ok) throw new Error('생성에 실패했습니다');
      const data = await res.json();
      const text = data.text || data.data?.text || '';
      const parsed: Question[] = text
        .split(/\d+[\.\)]\s/)
        .filter(Boolean)
        .map((q: string) => {
          const parts = q.split(/모범\s*답변|샘플\s*답변|답변\s*예시/i);
          const question = parts[0]?.trim() || q.trim();
          return {
            question,
            answer: parts[1]?.trim() || '',
            category: classifyCategory(question),
            jobField: classifyJobField(question),
            difficulty,
          };
        });
      const combined =
        parsed.length > 0
          ? parsed
          : [
              {
                question: text,
                answer: '',
                category: '기술' as Category,
                jobField: '기타' as JobField,
                difficulty,
              },
            ];
      // Append custom questions
      setQuestions([...combined, ...customQuestions]);
      setViewMode('list');
      toast('면접 질문이 생성되었습니다', 'success');
    } catch (e: any) {
      toast(e.message || '생성에 실패했습니다', 'error');
    } finally {
      setLoading(false);
    }
  }, [selectedResumeId, jobRole, difficulty, customQuestions]);

  // ── Helpers ──

  const toggleReveal = (idx: number) => {
    setRevealedIdx((prev) => {
      const next = new Set(prev);
      if (next.has(idx)) next.delete(idx);
      else next.add(idx);
      return next;
    });
  };

  const handleSaveAnswer = (questionKey: string, answer: string) => {
    const updated = { ...userAnswers, [questionKey]: answer };
    setUserAnswers(updated);
    saveJSON(STORAGE_KEY, updated);

    // Save to history
    const history = loadJSON<Record<string, { answer: string; date: string }[]>>(
      ANSWER_HISTORY_KEY,
      {},
    );
    if (!history[questionKey]) history[questionKey] = [];
    history[questionKey].unshift({ answer, date: new Date().toISOString() });
    if (history[questionKey].length > 10) history[questionKey] = history[questionKey].slice(0, 10);
    saveJSON(ANSWER_HISTORY_KEY, history);

    setEditingIdx(null);
    toast('답변이 저장되었습니다', 'success');
  };

  const getQuestionKey = (q: Question, idx: number) =>
    `${selectedResumeId}-${idx}-${q.question.slice(0, 30)}`;

  const toggleFavorite = (questionKey: string) => {
    setFavorites((prev) => {
      const next = new Set(prev);
      if (next.has(questionKey)) next.delete(questionKey);
      else next.add(questionKey);
      saveJSON(FAVORITES_KEY, [...next]);
      return next;
    });
  };

  const addCustomQuestion = () => {
    if (!customQuestionText.trim()) return;
    const q: Question = {
      question: customQuestionText.trim(),
      answer: '',
      category: customQuestionCategory,
      jobField: classifyJobField(customQuestionText),
      difficulty: 'intermediate',
    };
    const updated = [...customQuestions, q];
    setCustomQuestions(updated);
    saveJSON(CUSTOM_QUESTIONS_KEY, updated);
    setCustomQuestionText('');
    setShowCustomInput(false);
    toast('커스텀 질문이 추가되었습니다', 'success');

    // Add to current questions if already generated
    if (questions.length > 0) {
      setQuestions((prev) => [...prev, q]);
    }
  };

  const filteredQuestions = useMemo(() => {
    let filtered = questions;
    if (categoryFilter !== '전체') filtered = filtered.filter((q) => q.category === categoryFilter);
    if (jobFieldFilter !== '전체') filtered = filtered.filter((q) => q.jobField === jobFieldFilter);
    return filtered;
  }, [questions, categoryFilter, jobFieldFilter]);

  const answeredCount = questions.filter((q, i) => userAnswers[getQuestionKey(q, i)]).length;

  const startTimer = () => {
    setTimerSeconds(0);
    setTimerActive(true);
  };
  const stopTimer = () => {
    setTimerActive(false);
    setTimerSeconds(0);
  };
  const timerProgress = timerDuration > 0 ? (timerSeconds / timerDuration) * 100 : 0;

  // ── Mock Interview Functions ──

  const startMockInterview = () => {
    if (questions.length === 0) {
      toast('먼저 질문을 생성해주세요', 'warning');
      return;
    }
    setViewMode('mock');
    setMockCurrentIdx(0);
    setMockAnswer('');
    setMockResults([]);
    setMockCurrentEval(null);
    setMockShowFeedback(false);
    setMockTimerSeconds(0);
    setMockTimerActive(true);
    setTimeout(() => mockTextareaRef.current?.focus(), 100);
  };

  const handleMockSubmitAnswer = async () => {
    if (!mockAnswer.trim()) {
      toast('답변을 입력해주세요', 'warning');
      return;
    }
    setMockTimerActive(false);
    setMockEvaluating(true);

    const timeSpent = mockTimerSeconds;
    const currentQ = questions[mockCurrentIdx];

    try {
      const evaluation = await evaluateAnswer(
        selectedResumeId,
        currentQ.question,
        mockAnswer,
        jobRole,
      );
      setMockCurrentEval(evaluation);
      setMockShowFeedback(true);
      setMockResults((prev) => [
        ...prev,
        {
          questionIdx: mockCurrentIdx,
          userAnswer: mockAnswer,
          evaluation,
          timeSpent,
        },
      ]);
    } catch {
      toast('평가에 실패했습니다', 'error');
    } finally {
      setMockEvaluating(false);
    }
  };

  const handleMockNextQuestion = () => {
    const nextIdx = mockCurrentIdx + 1;
    if (nextIdx >= questions.length) {
      // All questions done, generate report
      generateReport([...mockResults]);
      return;
    }
    setMockCurrentIdx(nextIdx);
    setMockAnswer('');
    setMockCurrentEval(null);
    setMockShowFeedback(false);
    setMockTimerSeconds(0);
    setMockTimerActive(true);
    setTimeout(() => mockTextareaRef.current?.focus(), 100);
  };

  const handleSkipQuestion = () => {
    setMockResults((prev) => [
      ...prev,
      {
        questionIdx: mockCurrentIdx,
        userAnswer: '(건너뜀)',
        evaluation: {
          score: 0,
          breakdown: { 관련성: 0, 구체성: 0, 구조: 0, 표현력: 0 },
          strengths: [],
          improvements: ['질문을 건너뛰었습니다'],
          modelAnswer: '',
          highlightGood: [],
          highlightWeak: [],
        },
        timeSpent: mockTimerSeconds,
      },
    ]);
    handleMockNextQuestion();
  };

  const finishMockEarly = () => {
    if (mockResults.length === 0) {
      setViewMode('list');
      return;
    }
    generateReport(mockResults);
  };

  // ── Report Generation ──

  const generateReport = (results: QuestionResult[]) => {
    const validResults = results.filter((r) => r.evaluation.score > 0);
    const overallScore =
      validResults.length > 0
        ? Math.round(
            (validResults.reduce((s, r) => s + r.evaluation.score, 0) / validResults.length) * 10,
          ) / 10
        : 0;

    const avgBreakdown: ScoreBreakdown = { 관련성: 0, 구체성: 0, 구조: 0, 표현력: 0 };
    if (validResults.length > 0) {
      for (const r of validResults) {
        avgBreakdown.관련성 += r.evaluation.breakdown.관련성;
        avgBreakdown.구체성 += r.evaluation.breakdown.구체성;
        avgBreakdown.구조 += r.evaluation.breakdown.구조;
        avgBreakdown.표현력 += r.evaluation.breakdown.표현력;
      }
      avgBreakdown.관련성 = Math.round((avgBreakdown.관련성 / validResults.length) * 10) / 10;
      avgBreakdown.구체성 = Math.round((avgBreakdown.구체성 / validResults.length) * 10) / 10;
      avgBreakdown.구조 = Math.round((avgBreakdown.구조 / validResults.length) * 10) / 10;
      avgBreakdown.표현력 = Math.round((avgBreakdown.표현력 / validResults.length) * 10) / 10;
    }

    const report: InterviewReport = {
      date: new Date().toISOString(),
      resumeId: selectedResumeId,
      jobRole: jobRole || '미지정',
      difficulty,
      results,
      overallScore,
      grade: computeGrade(overallScore),
      categoryScores: avgBreakdown,
    };

    setCurrentReport(report);
    setViewMode('report');
    setMockTimerActive(false);
  };

  const saveReport = () => {
    if (!currentReport) return;
    const updated = [currentReport, ...savedReports].slice(0, 50);
    setSavedReports(updated);
    saveJSON(REPORTS_KEY, updated);
    toast('결과가 저장되었습니다', 'success');
  };

  const restartMock = () => {
    setViewMode('mock');
    setMockCurrentIdx(0);
    setMockAnswer('');
    setMockResults([]);
    setMockCurrentEval(null);
    setMockShowFeedback(false);
    setMockTimerSeconds(0);
    setMockTimerActive(true);
  };

  // ── Highlight helper ──
  const highlightText = (text: string, goodPhrases: string[], weakPhrases: string[]) => {
    if (!goodPhrases.length && !weakPhrases.length) return <span>{text}</span>;
    const result = text;
    const segments: { text: string; type: 'good' | 'weak' | 'normal' }[] = [];

    // Simple approach: split and tag
    let remaining = result;
    while (remaining.length > 0) {
      let earliestIdx = remaining.length;
      let earliestPhrase = '';
      let earliestType: 'good' | 'weak' = 'good';

      for (const phrase of goodPhrases) {
        const idx = remaining.indexOf(phrase);
        if (idx !== -1 && idx < earliestIdx) {
          earliestIdx = idx;
          earliestPhrase = phrase;
          earliestType = 'good';
        }
      }
      for (const phrase of weakPhrases) {
        const idx = remaining.indexOf(phrase);
        if (idx !== -1 && idx < earliestIdx) {
          earliestIdx = idx;
          earliestPhrase = phrase;
          earliestType = 'weak';
        }
      }

      if (earliestIdx === remaining.length) {
        segments.push({ text: remaining, type: 'normal' });
        break;
      }

      if (earliestIdx > 0) {
        segments.push({ text: remaining.slice(0, earliestIdx), type: 'normal' });
      }
      segments.push({ text: earliestPhrase, type: earliestType });
      remaining = remaining.slice(earliestIdx + earliestPhrase.length);
    }

    return (
      <span>
        {segments.map((seg, i) => {
          if (seg.type === 'good')
            return (
              <mark
                key={i}
                className="bg-green-200 dark:bg-green-800/50 text-green-800 dark:text-green-200 rounded px-0.5"
              >
                {seg.text}
              </mark>
            );
          if (seg.type === 'weak')
            return (
              <mark
                key={i}
                className="bg-orange-200 dark:bg-orange-800/50 text-orange-800 dark:text-orange-200 rounded px-0.5"
              >
                {seg.text}
              </mark>
            );
          return <span key={i}>{seg.text}</span>;
        })}
      </span>
    );
  };

  // ══════════════════════════════════════════════
  // RENDER: Mock Interview (Full-screen)
  // ══════════════════════════════════════════════
  if (viewMode === 'mock') {
    const currentQ = questions[mockCurrentIdx];
    return (
      <div className="fixed inset-0 z-50 bg-white dark:bg-slate-900 flex flex-col">
        {/* Top bar */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50">
          <div className="flex items-center gap-4">
            <button
              onClick={finishMockEarly}
              className="text-sm text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 transition-colors"
            >
              ← 나가기
            </button>
            <span className="text-sm font-medium text-slate-700 dark:text-slate-300">
              모의 면접
            </span>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-sm text-slate-500 dark:text-slate-400">
              {mockCurrentIdx + 1} / {questions.length}
            </span>
            {/* Progress dots */}
            <div className="hidden sm:flex items-center gap-1">
              {questions.map((_, i) => (
                <div
                  key={i}
                  className={`w-2 h-2 rounded-full transition-colors ${
                    i < mockCurrentIdx
                      ? 'bg-green-500'
                      : i === mockCurrentIdx
                        ? 'bg-blue-500'
                        : 'bg-slate-300 dark:bg-slate-600'
                  }`}
                />
              ))}
            </div>
          </div>
        </div>

        {/* Main content */}
        <div className="flex-1 flex flex-col items-center justify-center px-6 py-8 overflow-y-auto">
          <div className="w-full max-w-3xl space-y-8">
            {/* Timer */}
            <div className="flex justify-center">
              <CircularTimer seconds={mockTimerSeconds} duration={mockTimerDuration} size={140} />
            </div>

            {/* Question */}
            <div className="text-center">
              <span
                className={`inline-block text-xs px-2 py-1 rounded-lg mb-3 ${
                  currentQ?.category === '기술'
                    ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-600'
                    : currentQ?.category === '행동'
                      ? 'bg-green-100 dark:bg-green-900/30 text-green-600'
                      : currentQ?.category === '상황'
                        ? 'bg-sky-100 dark:bg-sky-900/30 text-sky-600'
                        : 'bg-orange-100 dark:bg-orange-900/30 text-orange-600'
                }`}
              >
                {currentQ?.category || '일반'}
              </span>
              <h2 className="text-xl sm:text-2xl font-semibold text-slate-900 dark:text-slate-100 leading-relaxed">
                Q{mockCurrentIdx + 1}. {currentQ?.question}
              </h2>
            </div>

            {/* Feedback display (after evaluation) */}
            {mockShowFeedback && mockCurrentEval ? (
              <div className="space-y-6 animate-fade-in">
                {/* Score */}
                <div className="flex items-center justify-center gap-6">
                  <div className="text-center">
                    <div
                      className={`text-5xl font-bold ${
                        mockCurrentEval.score >= 8
                          ? 'text-green-500'
                          : mockCurrentEval.score >= 6
                            ? 'text-blue-500'
                            : mockCurrentEval.score >= 4
                              ? 'text-orange-500'
                              : 'text-red-500'
                      }`}
                    >
                      {mockCurrentEval.score}
                    </div>
                    <div className="text-sm text-slate-500 dark:text-slate-400 mt-1">/ 10점</div>
                  </div>
                  <div className="grid grid-cols-2 gap-x-6 gap-y-2">
                    {(Object.entries(mockCurrentEval.breakdown) as [string, number][]).map(
                      ([key, val]) => (
                        <div key={key} className="flex items-center gap-2">
                          <span className="text-xs text-slate-500 dark:text-slate-400 w-12">
                            {key}
                          </span>
                          <div className="w-20 h-1.5 bg-slate-200 dark:bg-slate-700 rounded-full">
                            <div
                              className="h-1.5 bg-blue-500 rounded-full transition-all"
                              style={{ width: `${val * 10}%` }}
                            />
                          </div>
                          <span className="text-xs font-medium text-slate-600 dark:text-slate-300">
                            {val}
                          </span>
                        </div>
                      ),
                    )}
                  </div>
                </div>

                {/* User's answer with highlights */}
                <div className="bg-slate-50 dark:bg-slate-800/50 rounded-xl p-4 border border-slate-200 dark:border-slate-700">
                  <h4 className="text-xs font-medium text-slate-500 dark:text-slate-400 mb-2">
                    내 답변
                  </h4>
                  <p className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed whitespace-pre-wrap">
                    {highlightText(
                      mockAnswer,
                      mockCurrentEval.highlightGood,
                      mockCurrentEval.highlightWeak,
                    )}
                  </p>
                </div>

                {/* Strengths & Improvements */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="bg-green-50 dark:bg-green-900/10 rounded-xl p-4 border border-green-200 dark:border-green-800/50">
                    <h4 className="text-xs font-medium text-green-600 dark:text-green-400 mb-2 flex items-center gap-1">
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
                          d="M5 13l4 4L19 7"
                        />
                      </svg>
                      강점
                    </h4>
                    <ul className="space-y-1">
                      {mockCurrentEval.strengths.map((s, i) => (
                        <li key={i} className="text-sm text-green-700 dark:text-green-300">
                          - {s}
                        </li>
                      ))}
                    </ul>
                  </div>
                  <div className="bg-orange-50 dark:bg-orange-900/10 rounded-xl p-4 border border-orange-200 dark:border-orange-800/50">
                    <h4 className="text-xs font-medium text-orange-600 dark:text-orange-400 mb-2 flex items-center gap-1">
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
                          d="M12 9v2m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                        />
                      </svg>
                      개선점
                    </h4>
                    <ul className="space-y-1">
                      {mockCurrentEval.improvements.map((s, i) => (
                        <li key={i} className="text-sm text-orange-700 dark:text-orange-300">
                          - {s}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>

                {/* Model answer */}
                {mockCurrentEval.modelAnswer && (
                  <div className="bg-blue-50 dark:bg-blue-900/10 rounded-xl p-4 border border-blue-200 dark:border-blue-800/50">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="text-xs font-medium text-blue-600 dark:text-blue-400">
                        모범 답변
                      </h4>
                      <button
                        onClick={() => {
                          setMockAnswer(mockCurrentEval!.modelAnswer);
                          toast('모범 답변이 적용되었습니다', 'success');
                        }}
                        className="text-xs px-2 py-1 bg-blue-100 dark:bg-blue-800/30 text-blue-600 dark:text-blue-400 rounded-lg hover:bg-blue-200 dark:hover:bg-blue-800/50 transition-colors"
                      >
                        적용
                      </button>
                    </div>
                    <p className="text-sm text-blue-700 dark:text-blue-300 leading-relaxed whitespace-pre-wrap">
                      {mockCurrentEval.modelAnswer}
                    </p>
                  </div>
                )}

                {/* Next button */}
                <div className="flex justify-center">
                  <button
                    onClick={handleMockNextQuestion}
                    className="px-8 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-medium rounded-xl hover:from-blue-700 hover:to-indigo-700 transition-all shadow-sm text-sm"
                  >
                    {mockCurrentIdx + 1 >= questions.length ? '결과 보기' : '다음 질문 →'}
                  </button>
                </div>
              </div>
            ) : (
              <>
                {/* Answer textarea */}
                <div>
                  <textarea
                    ref={mockTextareaRef}
                    value={mockAnswer}
                    onChange={(e) => setMockAnswer(e.target.value)}
                    rows={8}
                    placeholder="답변을 입력하세요... (실제 면접처럼 구체적으로 작성해보세요)"
                    className="w-full px-4 py-3 border border-slate-200 dark:border-slate-600 rounded-xl text-sm dark:bg-slate-800 dark:text-slate-100 focus:ring-2 focus:ring-blue-500 focus:outline-none resize-none leading-relaxed"
                    disabled={mockEvaluating}
                  />
                  <div className="flex items-center justify-between mt-2">
                    <span className="text-xs text-slate-400">{mockAnswer.length}자</span>
                    <span className="text-xs text-slate-400 flex items-center gap-1">
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
                          d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z"
                        />
                      </svg>
                      음성 입력 (준비 중)
                    </span>
                  </div>
                </div>

                {/* Action buttons */}
                <div className="flex items-center justify-center gap-3">
                  <button
                    onClick={handleSkipQuestion}
                    className="px-5 py-2.5 bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 rounded-xl hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors text-sm"
                    disabled={mockEvaluating}
                  >
                    건너뛰기
                  </button>
                  <button
                    onClick={handleMockSubmitAnswer}
                    disabled={mockEvaluating || !mockAnswer.trim()}
                    className="px-8 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-medium rounded-xl hover:from-blue-700 hover:to-indigo-700 disabled:opacity-50 transition-all shadow-sm text-sm flex items-center gap-2"
                  >
                    {mockEvaluating ? (
                      <>
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
                        AI 평가 중...
                      </>
                    ) : (
                      '답변 제출'
                    )}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    );
  }

  // ══════════════════════════════════════════════
  // RENDER: Report Card
  // ══════════════════════════════════════════════
  if (viewMode === 'report' && currentReport) {
    const { overallScore, grade, categoryScores, results } = currentReport;
    const validResults = results.filter((r) => r.evaluation.score > 0);
    const skippedCount = results.length - validResults.length;

    // Find strongest and weakest
    const breakdownEntries = Object.entries(categoryScores) as [string, number][];
    const strongest = [...breakdownEntries].sort((a, b) => b[1] - a[1])[0];
    const weakest = [...breakdownEntries].sort((a, b) => a[1] - b[1])[0];

    return (
      <>
        <Header />
        <main className="flex-1 max-w-4xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
          <div className="imp-card overflow-hidden">
            {/* Report header */}
            <div className="bg-gradient-to-br from-blue-600 to-indigo-700 px-6 py-10 text-center text-white">
              <h1 className="text-2xl font-bold mb-2">면접 연습 리포트</h1>
              <p className="text-blue-200 text-sm">
                {new Date(currentReport.date).toLocaleDateString('ko-KR')} | {currentReport.jobRole}{' '}
                | {difficultyLabels[currentReport.difficulty]}
              </p>

              {/* Grade */}
              <div className="mt-6 inline-flex items-center justify-center w-24 h-24 rounded-full border-4 border-white/30 bg-white/10">
                <span className="text-5xl font-black">{grade}</span>
              </div>
              <div className="mt-3">
                <span className="text-3xl font-bold">{overallScore}</span>
                <span className="text-blue-200 text-lg"> / 10</span>
              </div>
              <p className="text-sm text-blue-200 mt-1">
                {validResults.length}개 답변 완료 {skippedCount > 0 && `| ${skippedCount}개 건너뜀`}
              </p>
            </div>

            {/* Radar chart */}
            <div className="px-6 py-8 border-b border-slate-200 dark:border-slate-700">
              <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-4 text-center">
                영역별 점수
              </h3>
              <RadarChart scores={categoryScores} size={240} />
            </div>

            {/* Analysis */}
            <div className="px-6 py-6 border-b border-slate-200 dark:border-slate-700">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="bg-green-50 dark:bg-green-900/10 rounded-xl p-4 border border-green-200 dark:border-green-800/50">
                  <h4 className="text-sm font-medium text-green-600 dark:text-green-400 mb-1">
                    가장 강한 영역
                  </h4>
                  <p className="text-lg font-bold text-green-700 dark:text-green-300">
                    {strongest[0]}
                  </p>
                  <p className="text-sm text-green-600 dark:text-green-400">
                    {strongest[1]} / 10점
                  </p>
                </div>
                <div className="bg-orange-50 dark:bg-orange-900/10 rounded-xl p-4 border border-orange-200 dark:border-orange-800/50">
                  <h4 className="text-sm font-medium text-orange-600 dark:text-orange-400 mb-1">
                    보완이 필요한 영역
                  </h4>
                  <p className="text-lg font-bold text-orange-700 dark:text-orange-300">
                    {weakest[0]}
                  </p>
                  <p className="text-sm text-orange-600 dark:text-orange-400">
                    {weakest[1]} / 10점
                  </p>
                </div>
              </div>
            </div>

            {/* Per-question results */}
            <div className="px-6 py-6 border-b border-slate-200 dark:border-slate-700">
              <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-4">
                질문별 결과
              </h3>
              <div className="space-y-3">
                {results.map((r, i) => {
                  const q = questions[r.questionIdx];
                  return (
                    <div
                      key={i}
                      className="flex items-center gap-3 p-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-200 dark:border-slate-700"
                    >
                      <div
                        className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold shrink-0 ${
                          r.evaluation.score >= 8
                            ? 'bg-green-100 text-green-600 dark:bg-green-900/30'
                            : r.evaluation.score >= 6
                              ? 'bg-blue-100 text-blue-600 dark:bg-blue-900/30'
                              : r.evaluation.score >= 4
                                ? 'bg-orange-100 text-orange-600 dark:bg-orange-900/30'
                                : 'bg-red-100 text-red-600 dark:bg-red-900/30'
                        }`}
                      >
                        {r.evaluation.score > 0 ? r.evaluation.score : '-'}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-slate-700 dark:text-slate-300 truncate">
                          {q?.question || `질문 ${r.questionIdx + 1}`}
                        </p>
                        <p className="text-xs text-slate-400 mt-0.5">
                          {r.evaluation.score > 0
                            ? `소요 시간: ${formatTime(r.timeSpent)}`
                            : '건너뜀'}
                        </p>
                      </div>
                      {r.evaluation.score > 0 && (
                        <span
                          className={`text-xs font-bold px-2 py-1 rounded-lg ${gradeColors[computeGrade(r.evaluation.score)]}`}
                        >
                          {computeGrade(r.evaluation.score)}
                        </span>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Actions */}
            <div className="px-6 py-6 flex flex-col sm:flex-row items-center gap-3 justify-center">
              <button
                onClick={restartMock}
                className="w-full sm:w-auto px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-medium rounded-xl hover:from-blue-700 hover:to-indigo-700 transition-all shadow-sm text-sm"
              >
                다시 연습하기
              </button>
              <button
                onClick={saveReport}
                className="w-full sm:w-auto px-6 py-3 bg-green-600 text-white font-medium rounded-xl hover:bg-green-700 transition-all shadow-sm text-sm"
              >
                결과 저장
              </button>
              <button
                onClick={() => setViewMode('list')}
                className="w-full sm:w-auto px-6 py-3 bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 rounded-xl hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors text-sm"
              >
                질문 목록으로
              </button>
            </div>

            {/* Saved reports history */}
            {savedReports.length > 0 && (
              <div className="px-6 py-6 border-t border-slate-200 dark:border-slate-700">
                <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-3">
                  이전 연습 기록
                </h3>
                <div className="space-y-2 max-h-48 overflow-y-auto">
                  {savedReports.slice(0, 10).map((r, i) => (
                    <div
                      key={i}
                      className="flex items-center justify-between p-2.5 bg-slate-50 dark:bg-slate-800/50 rounded-lg border border-slate-200 dark:border-slate-700 text-sm"
                    >
                      <div className="flex items-center gap-3">
                        <span className={`text-lg font-bold ${gradeColors[r.grade]}`}>
                          {r.grade}
                        </span>
                        <div>
                          <span className="text-slate-700 dark:text-slate-300">
                            {r.overallScore}점
                          </span>
                          <span className="text-slate-400 mx-1">|</span>
                          <span className="text-slate-500 dark:text-slate-400">{r.jobRole}</span>
                        </div>
                      </div>
                      <span className="text-xs text-slate-400">
                        {new Date(r.date).toLocaleDateString('ko-KR')}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </main>
        <Footer />
      </>
    );
  }

  // ══════════════════════════════════════════════
  // RENDER: Setup + List mode
  // ══════════════════════════════════════════════
  return (
    <>
      <Header />
      <main
        id="main-content"
        className="flex-1 max-w-4xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-6 sm:py-8"
        role="main"
      >
        <div className="mb-6">
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-slate-100">
            {tx('interview.prep')}
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            AI가 이력서 기반으로 예상 면접 질문과 모범 답변을 생성합니다
          </p>
        </div>

        {/* Setup */}
        <div className="imp-card p-6 mb-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-200 mb-1">
                이력서 선택 *
              </label>
              <select
                value={selectedResumeId}
                onChange={(e) => setSelectedResumeId(e.target.value)}
                className="w-full px-3 py-2.5 min-h-[44px] border border-slate-200 dark:border-slate-600 rounded-xl text-sm dark:bg-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-blue-500"
              >
                <option value="">이력서를 선택하세요</option>
                {resumes.map((r) => (
                  <option key={r.id} value={r.id}>
                    {r.title || '제목 없음'}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-200 mb-1">
                지원 직무 (선택)
              </label>
              <input
                value={jobRole}
                onChange={(e) => setJobRole(e.target.value)}
                placeholder="예: 프론트엔드 개발자"
                className="w-full px-3 py-2.5 min-h-[44px] border border-slate-200 dark:border-slate-600 rounded-xl text-sm dark:bg-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-sm font-medium text-slate-700 dark:text-slate-200">
                  채용공고 / JD (선택)
                </label>
                {jobPosts.length > 0 && (
                  <button
                    type="button"
                    onClick={() => setShowJobSelect(!showJobSelect)}
                    className="text-xs text-indigo-600 dark:text-indigo-400 hover:underline"
                  >
                    {showJobSelect ? '닫기' : '채용공고에서 선택'}
                  </button>
                )}
              </div>
              {showJobSelect && (
                <div className="mb-2 max-h-40 overflow-y-auto border border-slate-200 dark:border-slate-600 rounded-xl divide-y divide-slate-100 dark:divide-slate-700">
                  {jobPosts.map((job) => (
                    <button
                      key={job.id}
                      type="button"
                      onClick={() => {
                        const jd = [
                          job.position,
                          job.description,
                          job.skills ? `요구기술: ${job.skills}` : '',
                        ]
                          .filter(Boolean)
                          .join('\n');
                        setJobDescription(jd);
                        setJobRole(job.position);
                        setShowJobSelect(false);
                      }}
                      className="w-full text-left px-3 py-2 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 transition-colors"
                    >
                      <span className="text-xs font-medium text-slate-800 dark:text-slate-200">
                        {job.company}
                      </span>
                      <span className="text-xs text-slate-500 dark:text-slate-400 ml-1.5">
                        {job.position}
                      </span>
                    </button>
                  ))}
                </div>
              )}
              <textarea
                value={jobDescription}
                onChange={(e) => setJobDescription(e.target.value)}
                placeholder="채용공고 내용이나 자격요건을 붙여넣으면 맞춤 질문이 생성됩니다"
                rows={3}
                className="w-full px-3 py-2.5 border border-slate-200 dark:border-slate-600 rounded-xl text-sm dark:bg-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-blue-500 resize-none"
              />
            </div>
          </div>

          {/* Difficulty selector */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-200 mb-1.5">
              {tx('interview.difficulty.label')}
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {(Object.keys(difficultyLabels) as Difficulty[]).map((d) => (
                <button
                  key={d}
                  onClick={() => setDifficulty(d)}
                  className={`p-2.5 rounded-xl border text-left transition-all duration-200 ${
                    difficulty === d
                      ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/30 ring-1 ring-blue-500'
                      : 'border-slate-200 dark:border-slate-600 hover:border-slate-300 dark:hover:border-slate-500'
                  }`}
                >
                  <span className="text-sm font-medium text-slate-900 dark:text-slate-100">
                    {difficultyLabels[d]}
                  </span>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                    {difficultyDescriptions[d]}
                  </p>
                </button>
              ))}
            </div>
          </div>

          {/* Timer option */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-200 mb-1.5">
              모의 면접 타이머
            </label>
            <div className="flex items-center gap-3">
              <select
                value={mockTimerDuration}
                onChange={(e) => {
                  setMockTimerDuration(Number(e.target.value));
                  setTimerDuration(Number(e.target.value));
                }}
                className="px-3 py-2 border border-slate-200 dark:border-slate-600 rounded-xl text-sm dark:bg-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-blue-500"
              >
                <option value={60}>1분</option>
                <option value={120}>2분</option>
                <option value={180}>3분</option>
                <option value={300}>5분</option>
              </select>
              <span className="text-xs text-slate-500 dark:text-slate-400">질문당 답변 시간</span>
            </div>
          </div>

          {/* Custom question input */}
          <div className="mb-4">
            {showCustomInput ? (
              <div className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-200 dark:border-slate-700 space-y-3">
                <div className="flex items-center justify-between">
                  <label className="text-sm font-medium text-slate-700 dark:text-slate-200">
                    커스텀 질문 추가
                  </label>
                  <button
                    onClick={() => setShowCustomInput(false)}
                    className="text-xs text-slate-400 hover:text-slate-600"
                  >
                    닫기
                  </button>
                </div>
                <textarea
                  value={customQuestionText}
                  onChange={(e) => setCustomQuestionText(e.target.value)}
                  placeholder="연습하고 싶은 면접 질문을 입력하세요..."
                  rows={2}
                  className="w-full px-3 py-2 border border-slate-200 dark:border-slate-600 rounded-lg text-sm dark:bg-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-blue-500 focus:outline-none resize-none"
                />
                <div className="flex items-center gap-3">
                  <select
                    value={customQuestionCategory}
                    onChange={(e) => setCustomQuestionCategory(e.target.value as Category)}
                    className="px-2 py-1.5 border border-slate-200 dark:border-slate-600 rounded-lg text-xs dark:bg-slate-900 dark:text-slate-100"
                  >
                    {categories
                      .filter((c) => c !== '전체')
                      .map((c) => (
                        <option key={c} value={c}>
                          {c}
                        </option>
                      ))}
                  </select>
                  <button
                    onClick={addCustomQuestion}
                    className="text-xs px-3 py-1.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium"
                  >
                    추가
                  </button>
                </div>
                {customQuestions.length > 0 && (
                  <div className="text-xs text-slate-400 mt-1">
                    커스텀 질문 {customQuestions.length}개 등록됨
                  </div>
                )}
              </div>
            ) : (
              <button
                onClick={() => setShowCustomInput(true)}
                className="text-sm text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 4v16m8-8H4"
                  />
                </svg>
                커스텀 질문 추가
              </button>
            )}
          </div>

          <button
            onClick={handleGenerate}
            disabled={loading || !selectedResumeId}
            className="w-full py-3 min-h-[48px] bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-medium rounded-xl hover:from-blue-700 hover:to-indigo-700 disabled:opacity-50 transition-all duration-200 shadow-sm"
          >
            {loading ? (
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
                AI 생성 중...
              </span>
            ) : (
              tx('interview.generate')
            )}
          </button>
        </div>

        {/* Sidebar: related study groups */}
        {recommendationContext.companyName && (
          <div className="mb-6">
            <RelatedGroupsWidget
              companyName={recommendationContext.companyName}
              position={recommendationContext.position}
            />
          </div>
        )}

        {/* Questions */}
        {questions.length > 0 && (
          <div className="space-y-4">
            {/* Header with tracker, mock button, filters, timer */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <h2 className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                  예상 질문 ({questions.length}개)
                </h2>
                <span className="text-xs px-2 py-1 bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400 rounded-lg font-medium">
                  {answeredCount}/{questions.length} 완료
                </span>
              </div>

              <div className="flex items-center gap-2">
                {/* Mock interview button */}
                <button
                  onClick={startMockInterview}
                  className="flex items-center gap-2 text-xs px-4 py-2 bg-neutral-900 dark:bg-white text-white rounded-xl hover:bg-neutral-800 dark:hover:bg-neutral-100 transition-all font-medium shadow-sm"
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
                      d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z"
                    />
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                  모의 면접 시작
                </button>

                {/* Timer */}
                {timerActive ? (
                  <>
                    <div className="flex items-center gap-2 px-3 py-1.5 bg-orange-50 dark:bg-orange-900/20 rounded-xl">
                      <div className="relative w-6 h-6">
                        <svg className="w-6 h-6 -rotate-90" viewBox="0 0 24 24">
                          <circle
                            cx="12"
                            cy="12"
                            r="10"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                            className="text-orange-200 dark:text-orange-900"
                          />
                          <circle
                            cx="12"
                            cy="12"
                            r="10"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                            className="text-orange-500"
                            strokeDasharray={`${(1 - timerProgress / 100) * 62.83} 62.83`}
                            strokeLinecap="round"
                          />
                        </svg>
                      </div>
                      <span
                        className={`text-sm font-mono font-bold ${timerSeconds > timerDuration * 0.8 ? 'text-red-600 dark:text-red-400' : 'text-orange-600 dark:text-orange-400'}`}
                      >
                        {formatTime(timerDuration - timerSeconds)}
                      </span>
                    </div>
                    <button
                      onClick={stopTimer}
                      className="text-xs px-2 py-1 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                    >
                      중지
                    </button>
                  </>
                ) : (
                  <button
                    onClick={startTimer}
                    className="flex items-center gap-2 text-xs px-3 py-1.5 bg-orange-50 dark:bg-orange-900/20 text-orange-600 dark:text-orange-400 rounded-xl hover:bg-orange-100 dark:hover:bg-orange-900/40 transition-colors font-medium"
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
                        d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                      />
                    </svg>
                    타이머 시작
                  </button>
                )}
              </div>
            </div>

            {/* Filters row */}
            <div className="flex flex-wrap gap-4">
              {/* Category filter */}
              <div className="flex flex-wrap gap-2">
                {categories.map((cat) => (
                  <button
                    key={cat}
                    onClick={() => setCategoryFilter(cat)}
                    className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors ${
                      categoryFilter === cat
                        ? 'bg-blue-600 text-white'
                        : 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-600'
                    }`}
                  >
                    {cat}
                    {cat !== '전체' && (
                      <span className="ml-1 opacity-70">
                        ({questions.filter((q) => q.category === cat).length})
                      </span>
                    )}
                  </button>
                ))}
              </div>
              {/* Job field filter */}
              <div className="flex flex-wrap gap-2">
                {jobFields.map((jf) => (
                  <button
                    key={jf}
                    onClick={() => setJobFieldFilter(jf)}
                    className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors ${
                      jobFieldFilter === jf
                        ? 'bg-indigo-600 text-white'
                        : 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-600'
                    }`}
                  >
                    {jf}
                  </button>
                ))}
              </div>
            </div>

            {/* Progress bar */}
            <div className="w-full bg-slate-100 dark:bg-slate-700 rounded-full h-1.5">
              <div
                className="bg-green-500 h-1.5 rounded-full transition-all duration-500"
                style={{
                  width: `${questions.length > 0 ? (answeredCount / questions.length) * 100 : 0}%`,
                }}
              />
            </div>

            {/* Question cards */}
            {filteredQuestions.map((q) => {
              const originalIdx = questions.indexOf(q);
              const questionKey = getQuestionKey(q, originalIdx);
              const savedAnswer = userAnswers[questionKey] || '';
              const isFavorite = favorites.has(questionKey);
              const history = answerHistory[questionKey] || [];

              return (
                <div key={originalIdx} className="imp-card p-4 animate-fade-in-up">
                  <div className="flex items-start gap-3">
                    <span
                      className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold shrink-0 mt-0.5 ${
                        savedAnswer
                          ? 'bg-green-100 dark:bg-green-900/30 text-green-600'
                          : 'bg-blue-100 dark:bg-blue-900/30 text-blue-600'
                      }`}
                    >
                      {originalIdx + 1}
                    </span>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <p className="text-sm font-medium text-slate-900 dark:text-slate-100 leading-relaxed">
                          {q.question}
                        </p>
                        <div className="flex items-center gap-1 shrink-0">
                          {/* Favorite button */}
                          <button
                            onClick={() => toggleFavorite(questionKey)}
                            className={`p-1 rounded transition-colors ${
                              isFavorite
                                ? 'text-yellow-500 hover:text-yellow-600'
                                : 'text-slate-300 dark:text-slate-600 hover:text-yellow-400'
                            }`}
                            title={isFavorite ? '즐겨찾기 해제' : '즐겨찾기'}
                          >
                            <svg
                              className="w-4 h-4"
                              fill={isFavorite ? 'currentColor' : 'none'}
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z"
                              />
                            </svg>
                          </button>
                          {/* Tags */}
                          {q.category && (
                            <span className="text-xs px-1.5 py-0.5 bg-slate-100 dark:bg-slate-700 text-slate-500 dark:text-slate-400 rounded">
                              {q.category}
                            </span>
                          )}
                          {q.jobField && q.jobField !== '기타' && (
                            <span className="text-xs px-1.5 py-0.5 bg-indigo-50 dark:bg-indigo-900/20 text-indigo-500 dark:text-indigo-400 rounded">
                              {q.jobField}
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Model answer */}
                      {q.answer && (
                        <div className="mt-2">
                          <button
                            onClick={() => toggleReveal(originalIdx)}
                            className="text-xs text-blue-600 dark:text-blue-400 hover:underline py-1"
                          >
                            {revealedIdx.has(originalIdx) ? '모범 답변 숨기기' : '모범 답변 보기'}
                          </button>
                          {revealedIdx.has(originalIdx) && (
                            <div className="mt-2 p-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg animate-fade-in">
                              <p className="text-sm text-green-800 dark:text-green-300 whitespace-pre-wrap leading-relaxed">
                                {q.answer}
                              </p>
                            </div>
                          )}
                        </div>
                      )}

                      {/* Answer history */}
                      {history.length > 0 && (
                        <div className="mt-2">
                          <button
                            onClick={() =>
                              setShowHistoryFor(showHistoryFor === questionKey ? null : questionKey)
                            }
                            className="text-xs text-sky-600 dark:text-sky-400 hover:underline py-1"
                          >
                            이전 답변 ({history.length}개){' '}
                            {showHistoryFor === questionKey ? '숨기기' : '보기'}
                          </button>
                          {showHistoryFor === questionKey && (
                            <div className="mt-2 space-y-2 max-h-40 overflow-y-auto">
                              {history.map((h, hi) => (
                                <div
                                  key={hi}
                                  className="p-2 bg-sky-50 dark:bg-sky-900/10 border border-sky-200 dark:border-sky-800/50 rounded-lg"
                                >
                                  <div className="flex items-center justify-between mb-1">
                                    <span className="text-xs text-sky-500 dark:text-sky-400">
                                      {new Date(h.date).toLocaleDateString('ko-KR')}{' '}
                                      {new Date(h.date).toLocaleTimeString('ko-KR', {
                                        hour: '2-digit',
                                        minute: '2-digit',
                                      })}
                                    </span>
                                  </div>
                                  <p className="text-xs text-slate-600 dark:text-slate-400 whitespace-pre-wrap">
                                    {h.answer}
                                  </p>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      )}

                      {/* User answer section */}
                      <div className="mt-3">
                        {editingIdx === originalIdx ? (
                          <div className="space-y-2">
                            <textarea
                              defaultValue={savedAnswer}
                              id={`answer-${originalIdx}`}
                              rows={4}
                              placeholder="나의 답변을 작성하세요..."
                              className="w-full px-3 py-2 border border-slate-200 dark:border-slate-600 rounded-lg text-sm dark:bg-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-blue-500 focus:outline-none resize-none"
                            />
                            <div className="flex gap-2">
                              <button
                                onClick={() => {
                                  const el = document.getElementById(
                                    `answer-${originalIdx}`,
                                  ) as HTMLTextAreaElement;
                                  if (el && el.value.trim())
                                    handleSaveAnswer(questionKey, el.value.trim());
                                  else toast('답변을 입력해주세요', 'warning');
                                }}
                                className="text-xs px-3 py-1.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
                              >
                                답변 저장
                              </button>
                              <button
                                onClick={() => setEditingIdx(null)}
                                className="text-xs px-3 py-1.5 bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors"
                              >
                                취소
                              </button>
                            </div>
                          </div>
                        ) : savedAnswer ? (
                          <div className="p-3 bg-blue-50 dark:bg-blue-900/10 border border-blue-200 dark:border-blue-800/50 rounded-lg">
                            <div className="flex items-center justify-between mb-1">
                              <span className="text-xs font-medium text-blue-600 dark:text-blue-400">
                                내 답변
                              </span>
                              <button
                                onClick={() => setEditingIdx(originalIdx)}
                                className="text-xs text-blue-600 dark:text-blue-400 hover:underline"
                              >
                                수정
                              </button>
                            </div>
                            <p className="text-sm text-slate-700 dark:text-slate-300 whitespace-pre-wrap leading-relaxed">
                              {savedAnswer}
                            </p>
                          </div>
                        ) : (
                          <button
                            onClick={() => setEditingIdx(originalIdx)}
                            className="text-xs text-slate-500 dark:text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 hover:underline py-1 transition-colors"
                          >
                            + 내 답변 작성
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>
      <Footer />
    </>
  );
}
