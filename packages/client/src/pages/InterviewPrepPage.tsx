import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { toast } from '@/components/Toast';
import type { Resume, ResumeSummary } from '@/types/resume';
import { API_URL } from '@/lib/config';
import { useResume, useResumes, usePublicGet } from '@/hooks/useResources';
import RelatedGroupsWidget from '@/features/study-groups/ui/RelatedGroupsWidget';
import InterviewScoreHistory from '@/components/InterviewScoreHistory';
import { analyzeInterviewAnswer } from '@/lib/api';
import { analyzeJdSeniority } from '@/lib/jdSeniorityAnalyzer';
import { buildJdBiasReport } from '@/lib/jdBiasDetector';
import { buildJdCompensationReport } from '@/lib/jdCompensationSignals';
import { buildJdCultureReport } from '@/lib/jdCultureSignals';
import { buildJdKeywordGapReport } from '@/lib/jdKeywordGap';
import { buildSalaryBenchmarkReport } from '@/lib/jdSalaryBenchmark';
import { buildInterviewStrategyReport, FORMAT_LABEL_MAP } from '@/lib/jdInterviewStrategy';
import { buildJdRequirementsReport } from '@/lib/jdRequirementsExtractor';
import { buildJdResumeMatchReport } from '@/lib/jdResumeMatch';
import { buildWorkModalityReport } from '@/lib/jdWorkModality';
import { detectHiringMode } from '@/lib/jdHiringModeDetector';
import { detectJdRedFlags } from '@/lib/jdRedFlagDetector';
import { detectJdTechObsolescence } from '@/lib/jdTechObsolescenceDetector';
import { analyzeJdGrowthOpportunity } from '@/lib/jdGrowthOpportunityAnalyzer';
import { analyzeJdWorkLifeBalance } from '@/lib/jdWorkLifeBalanceAnalyzer';
import { detectJdCultureVagueness } from '@/lib/jdCultureVaguenessDetector';
import { analyzeJdSalaryTransparency } from '@/lib/jdSalaryTransparencyAnalyzer';
import { detectCompanyStage } from '@/lib/jdCompanyStageDetector';
import { buildResumePlainText } from '@/lib/resumeText';
import { tx } from '@/lib/i18n';
import { analyzeInterviewAnswer as analyzeAnswerHeuristic } from '@/lib/interviewAnswerAnalyzer';

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

interface InterviewJobPost {
  id: string;
  company: string;
  position: string;
  description?: string;
  skills?: string;
}

type InterviewJobsResponse =
  | InterviewJobPost[]
  | {
      items?: InterviewJobPost[];
      data?: InterviewJobPost[];
    };

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

function getErrorMessage(error: unknown, fallback: string): string {
  return error instanceof Error ? error.message : fallback;
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
        <span className="text-xs text-slate-500 dark:text-slate-400">남은 시간</span>
      </div>
    </div>
  );
}

function JdSeniorityHint({ text }: { text: string }) {
  const analysis = useMemo(() => analyzeJdSeniority(text), [text]);
  if (analysis.level === 'unspecified' && analysis.signals.length === 0) return null;
  return (
    <aside
      className={`jd-seniority-hint jd-seniority-hint--${analysis.tone}`}
      aria-label="채용공고 연차 분석"
    >
      <div className="jd-seniority-hint__head">
        <span className="jd-seniority-hint__eyebrow">JD seniority</span>
        <span className="jd-seniority-hint__label">{analysis.label}</span>
      </div>
      <p className="jd-seniority-hint__detail">{analysis.detail}</p>
      {analysis.signals.length > 0 && (
        <ul className="jd-seniority-hint__signals">
          {analysis.signals.slice(0, 4).map((signal, idx) => (
            <li key={`${signal.keyword}-${idx}`} className="jd-seniority-hint__signal">
              <span className="jd-seniority-hint__signal-source">{signal.source}</span>
              <span className="jd-seniority-hint__signal-keyword">{signal.keyword}</span>
            </li>
          ))}
        </ul>
      )}
    </aside>
  );
}

function JdBiasHint({ text }: { text: string }) {
  const report = useMemo(() => buildJdBiasReport(text), [text]);
  if (report.totalCount === 0) return null;
  return (
    <aside className={`jd-bias-hint jd-bias-hint--${report.tone}`} aria-label="채용공고 편향 신호">
      <div className="jd-bias-hint__head">
        <span className="jd-bias-hint__eyebrow">JD bias signals</span>
        <span className="jd-bias-hint__label">{report.label}</span>
      </div>
      <p className="jd-bias-hint__summary">{report.summary}</p>
      <ul className="jd-bias-hint__findings">
        {report.findings.slice(0, 4).map((finding, idx) => (
          <li key={`${finding.category}-${idx}`} className="jd-bias-hint__finding">
            <div className="jd-bias-hint__finding-row">
              <span
                className={`jd-bias-hint__severity jd-bias-hint__severity--${finding.severity}`}
              >
                {finding.severity === 'high'
                  ? '심각'
                  : finding.severity === 'medium'
                    ? '주의'
                    : '참고'}
              </span>
              <code className="jd-bias-hint__excerpt">{finding.excerpt}</code>
            </div>
            <p className="jd-bias-hint__detail">{finding.detail}</p>
            <p className="jd-bias-hint__suggestion">→ {finding.suggestion}</p>
          </li>
        ))}
        {report.findings.length > 4 && (
          <li className="jd-bias-hint__more">+ {report.findings.length - 4}건 더</li>
        )}
      </ul>
    </aside>
  );
}

function JdCompensationHint({ text }: { text: string }) {
  const report = useMemo(() => buildJdCompensationReport(text), [text]);
  if (text.trim().length < 30) return null;
  const presentCount = report.categories.filter((c) => c.present).length;
  if (presentCount === 0 && !report.salaryRangeText) return null;
  return (
    <aside
      className={`jd-comp-hint jd-comp-hint--${report.tone}`}
      aria-label="채용공고 보상 투명도"
    >
      <header className="jd-comp-hint__head">
        <span className="jd-comp-hint__eyebrow">Compensation transparency</span>
        <span className="jd-comp-hint__label">{report.label}</span>
      </header>
      <p className="jd-comp-hint__summary">{report.summary}</p>
      <div className="jd-comp-hint__meter" aria-hidden="true">
        <span style={{ ['--comp-fill' as string]: `${report.transparencyScore / 100}` }} />
      </div>
      <ul className="jd-comp-hint__categories">
        {report.categories.map((cat) => (
          <li
            key={cat.category}
            className={`jd-comp-hint__category${cat.present ? ' jd-comp-hint__category--present' : ''}`}
          >
            <span className="jd-comp-hint__category-mark" aria-hidden="true">
              {cat.present ? '✓' : '○'}
            </span>
            <span className="jd-comp-hint__category-label">{cat.label}</span>
            {cat.excerpts[0] && (
              <code className="jd-comp-hint__category-excerpt">{cat.excerpts[0]}</code>
            )}
          </li>
        ))}
      </ul>
    </aside>
  );
}

function JdCultureHint({ text }: { text: string }) {
  const report = useMemo(() => buildJdCultureReport(text), [text]);
  const [expanded, setExpanded] = useState(false);
  if (text.trim().length < 30) return null;
  if (report.hits.length === 0 && report.concreteSignals === 0) return null;

  const fill = Math.max(0.04, Math.min(1, report.specificityScore / 100));
  const visibleHits = expanded ? report.hits : report.hits.slice(0, 2);
  const remaining = report.hits.length - visibleHits.length;

  return (
    <aside
      className={`jd-culture-hint jd-culture-hint--${report.tone}`}
      aria-label="채용공고 문화 신호"
    >
      <header className="jd-culture-hint__head">
        <span className="jd-culture-hint__eyebrow">Culture specificity</span>
        <span className="jd-culture-hint__label">{report.label}</span>
      </header>

      <div
        className="jd-culture-hint__meter"
        role="progressbar"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={report.specificityScore}
        aria-label="문화 표현 구체성"
      >
        <span
          className="jd-culture-hint__meter-fill"
          style={{ ['--culture-fill' as never]: String(fill) }}
        />
      </div>

      <p className="jd-culture-hint__summary">{report.summary}</p>

      {report.concreteSignals > 0 && (
        <p className="jd-culture-hint__concrete">
          구체 신호 <strong>{report.concreteSignals}개</strong> 발견 (숫자·명시 프로그램 등)
        </p>
      )}

      {visibleHits.length > 0 && (
        <ul className="jd-culture-hint__hits" aria-label="모호한 문화 표현">
          {visibleHits.map((hit, i) => (
            <li
              key={`${hit.match}-${i}`}
              className={`jd-culture-hint__hit jd-culture-hint__hit--${hit.severity}`}
            >
              <div className="jd-culture-hint__hit-head">
                <span className="jd-culture-hint__hit-cat">{hit.categoryLabel}</span>
                <mark className="jd-culture-hint__hit-match">{hit.match}</mark>
              </div>
              <p className="jd-culture-hint__hit-concern">{hit.concern}</p>
              <p className="jd-culture-hint__hit-question">면접 질문 → {hit.interviewQuestion}</p>
            </li>
          ))}
        </ul>
      )}

      {remaining > 0 && (
        <button
          type="button"
          className="jd-culture-hint__more"
          onClick={() => setExpanded(true)}
          aria-expanded={false}
        >
          + {remaining}개 더 보기
        </button>
      )}
      {expanded && report.hits.length > 2 && (
        <button
          type="button"
          className="jd-culture-hint__more"
          onClick={() => setExpanded(false)}
          aria-expanded
        >
          접기
        </button>
      )}
    </aside>
  );
}

function JdKeywordGapHint({ jdText, resumeText }: { jdText: string; resumeText: string }) {
  const report = useMemo(() => buildJdKeywordGapReport(jdText, resumeText), [jdText, resumeText]);
  const [expanded, setExpanded] = useState(false);
  if (jdText.trim().length < 30) return null;
  if (report.jdKeywords.length === 0) return null;

  const fill = Math.max(0.04, Math.min(1, report.matchScore / 100));
  const categories = (Object.keys(report.byCategory) as (keyof typeof report.byCategory)[]).filter(
    (cat) => report.byCategory[cat].length > 0,
  );

  return (
    <aside
      className={`jd-gap-hint jd-gap-hint--${report.matchScore >= 80 ? 'good' : report.matchScore >= 50 ? 'neutral' : 'warning'}`}
      aria-label="JD 키워드 갭 분석"
    >
      <header className="jd-gap-hint__head">
        <span className="jd-gap-hint__eyebrow">Keyword match</span>
        <span className="jd-gap-hint__label">{report.label}</span>
      </header>

      <div
        className="jd-gap-hint__meter"
        role="progressbar"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={report.matchScore}
        aria-label="키워드 일치율"
      >
        <span
          className="jd-gap-hint__meter-fill"
          style={{ ['--gap-fill' as never]: String(fill) }}
        />
      </div>

      <p className="jd-gap-hint__summary">{report.summary}</p>

      {expanded &&
        categories.map((cat) => {
          const items = report.byCategory[cat];
          if (items.length === 0) return null;
          return (
            <div key={cat} className="jd-gap-hint__cat-group">
              <span className="jd-gap-hint__cat-label">{items[0]!.categoryLabel}</span>
              <div className="jd-gap-hint__chips">
                {items.map((k) => (
                  <span
                    key={k.keyword}
                    className={`jd-gap-hint__chip jd-gap-hint__chip--${k.status}`}
                  >
                    {k.keyword}
                  </span>
                ))}
              </div>
            </div>
          );
        })}

      {!expanded && report.missing.length > 0 && (
        <div className="jd-gap-hint__missing-preview">
          <span className="jd-gap-hint__cat-label">누락 키워드</span>
          <div className="jd-gap-hint__chips">
            {report.missing.slice(0, 6).map((k) => (
              <span key={k.keyword} className="jd-gap-hint__chip jd-gap-hint__chip--missing">
                {k.keyword}
              </span>
            ))}
            {report.missing.length > 6 && (
              <span className="jd-gap-hint__chip jd-gap-hint__chip--more">
                +{report.missing.length - 6}
              </span>
            )}
          </div>
        </div>
      )}

      <button type="button" className="jd-gap-hint__toggle" onClick={() => setExpanded((v) => !v)}>
        {expanded ? '접기' : '전체 키워드 보기'}
      </button>
    </aside>
  );
}

function JdWorkModalityHint({ text }: { text: string }) {
  const report = useMemo(() => buildWorkModalityReport(text), [text]);
  if (text.trim().length < 30) return null;
  if (report.modality === 'unknown' && !report.relocationRequired) return null;

  const toneClass =
    report.modality === 'remote'
      ? 'good'
      : report.modality === 'hybrid' || report.modality === 'flexible'
        ? 'neutral'
        : report.modality === 'onsite'
          ? 'warning'
          : 'neutral';

  const icon =
    report.modality === 'remote'
      ? '🏠'
      : report.modality === 'hybrid'
        ? '🔀'
        : report.modality === 'onsite'
          ? '🏢'
          : report.modality === 'flexible'
            ? '⏱'
            : '❓';

  return (
    <aside
      className={`jd-modality-hint jd-modality-hint--${toneClass}`}
      aria-label="근무 방식 분석"
    >
      <header className="jd-modality-hint__head">
        <span className="jd-modality-hint__eyebrow">Work modality</span>
        <span className="jd-modality-hint__label">
          {icon} {report.label}
        </span>
      </header>
      <p className="jd-modality-hint__summary">{report.summary}</p>
      {report.signals.length > 0 && (
        <ul className="jd-modality-hint__signals" aria-label="근무 방식 관련 문구">
          {report.signals.map((s, i) => (
            <li key={i} className="jd-modality-hint__signal">
              <code>{s}</code>
            </li>
          ))}
        </ul>
      )}
    </aside>
  );
}

function JdSalaryBenchmarkHint({ text }: { text: string }) {
  const report = useMemo(() => buildSalaryBenchmarkReport(text), [text]);
  const [showTips, setShowTips] = useState(false);
  if (text.trim().length < 30) return null;

  const toneClass = report.isBelowMarket
    ? 'warning'
    : report.jdRange && report.jdRange.max >= report.marketRange.max * 0.95
      ? 'good'
      : 'neutral';

  return (
    <aside className={`jd-salary-hint jd-salary-hint--${toneClass}`} aria-label="연봉 벤치마크">
      <header className="jd-salary-hint__head">
        <span className="jd-salary-hint__eyebrow">Salary benchmark</span>
        <span className="jd-salary-hint__label">{report.label}</span>
      </header>

      <dl className="jd-salary-hint__grid">
        <div className="jd-salary-hint__cell">
          <dt>시장 범위</dt>
          <dd>
            {report.marketRange.min.toLocaleString()}~{report.marketRange.max.toLocaleString()}만원
          </dd>
        </div>
        <div className="jd-salary-hint__cell">
          <dt>협상 앵커</dt>
          <dd>{report.negotiationAnchor.toLocaleString()}만원</dd>
        </div>
      </dl>

      <p className="jd-salary-hint__assessment">{report.assessment}</p>

      <button
        type="button"
        className="jd-salary-hint__tips-toggle"
        onClick={() => setShowTips((v) => !v)}
      >
        {showTips ? '협상 팁 접기' : '협상 팁 보기'}
      </button>

      {showTips && (
        <ul className="jd-salary-hint__tips" aria-label="연봉 협상 팁">
          {report.tips.map((tip, i) => (
            <li key={i} className="jd-salary-hint__tip">
              {tip}
            </li>
          ))}
        </ul>
      )}
    </aside>
  );
}

function JdInterviewStrategyHint({ text }: { text: string }) {
  const report = useMemo(() => buildInterviewStrategyReport(text), [text]);
  const [expanded, setExpanded] = useState(false);
  if (text.trim().length < 30) return null;

  return (
    <aside className="jd-strategy-hint" aria-label="면접 전략 추천">
      <header className="jd-strategy-hint__head">
        <span className="jd-strategy-hint__eyebrow">Interview strategy</span>
        <span className="jd-strategy-hint__label">{report.label}</span>
      </header>

      <p className="jd-strategy-hint__summary">{report.summary}</p>

      <div className="jd-strategy-hint__formats" aria-label="예상 면접 형식">
        <span className="jd-strategy-hint__formats-title">예상 면접 형식</span>
        <div className="jd-strategy-hint__format-chips">
          {report.formats.map((fmt, i) => (
            <span
              key={fmt}
              className={`jd-strategy-hint__format-chip ${i === 0 ? 'jd-strategy-hint__format-chip--primary' : ''}`}
            >
              {FORMAT_LABEL_MAP[fmt]}
            </span>
          ))}
        </div>
      </div>

      <button
        type="button"
        className="jd-strategy-hint__toggle"
        onClick={() => setExpanded((v) => !v)}
      >
        {expanded ? '준비 영역 접기' : `준비 영역 ${report.prepAreas.length}개 보기`}
      </button>

      {expanded && (
        <ul className="jd-strategy-hint__areas" aria-label="준비 영역">
          {report.prepAreas.map((area) => (
            <li
              key={area.area}
              className={`jd-strategy-hint__area jd-strategy-hint__area--${area.priority}`}
            >
              <div className="jd-strategy-hint__area-head">
                <strong>{area.area}</strong>
                <span className="jd-strategy-hint__area-priority">
                  {area.priority === 'high' ? '필수' : area.priority === 'medium' ? '중요' : '권장'}
                </span>
              </div>
              <p className="jd-strategy-hint__area-reason">{area.reason}</p>
              <ul className="jd-strategy-hint__resources">
                {area.resources.map((r, i) => (
                  <li key={i}>{r}</li>
                ))}
              </ul>
            </li>
          ))}
        </ul>
      )}
    </aside>
  );
}

const CATEGORY_LABEL: Record<string, string> = {
  tech: '기술',
  experience: '경험',
  education: '학력',
  soft: '소프트',
  other: '기타',
};

function JdRequirementsHint({ text }: { text: string }) {
  const report = useMemo(() => buildJdRequirementsReport(text), [text]);
  const [expanded, setExpanded] = useState(false);
  if (text.trim().length < 30) return null;
  if (!report.hasSections && report.requiredCount === 0 && report.preferredCount === 0) return null;

  const hasPreferred = report.preferredCount > 0;
  const visiblePreferred = expanded ? report.preferred : report.preferred.slice(0, 3);
  const remaining = report.preferred.length - visiblePreferred.length;

  return (
    <aside className="jd-req-hint" aria-label="채용공고 자격요건 분석">
      <header className="jd-req-hint__head">
        <span className="jd-req-hint__eyebrow">Requirements</span>
        <span className="jd-req-hint__label">{report.summary}</span>
      </header>

      {report.required.length > 0 && (
        <section className="jd-req-hint__section" aria-label="필수 요건">
          <h4 className="jd-req-hint__section-title">필수 자격요건 ({report.requiredCount})</h4>
          <ul className="jd-req-hint__list">
            {report.required.map((req, i) => (
              <li key={i} className={`jd-req-hint__item jd-req-hint__item--${req.category}`}>
                <span className="jd-req-hint__cat-badge" aria-label={CATEGORY_LABEL[req.category]}>
                  {CATEGORY_LABEL[req.category]}
                </span>
                <span className="jd-req-hint__item-text">{req.text}</span>
              </li>
            ))}
          </ul>
        </section>
      )}

      {hasPreferred && (
        <section className="jd-req-hint__section" aria-label="우대 사항">
          <h4 className="jd-req-hint__section-title">우대 사항 ({report.preferredCount})</h4>
          <ul className="jd-req-hint__list">
            {visiblePreferred.map((req, i) => (
              <li
                key={i}
                className={`jd-req-hint__item jd-req-hint__item--${req.category} jd-req-hint__item--preferred`}
              >
                <span
                  className="jd-req-hint__cat-badge jd-req-hint__cat-badge--preferred"
                  aria-label={CATEGORY_LABEL[req.category]}
                >
                  {CATEGORY_LABEL[req.category]}
                </span>
                <span className="jd-req-hint__item-text">{req.text}</span>
              </li>
            ))}
          </ul>
          {remaining > 0 && (
            <button
              type="button"
              className="jd-req-hint__toggle"
              onClick={() => setExpanded((v) => !v)}
            >
              {expanded ? '접기' : `+${remaining}개 더 보기`}
            </button>
          )}
        </section>
      )}

      {!report.hasSections && report.unclassified.length > 0 && (
        <p className="jd-req-hint__fallback">
          섹션 구분 없이 {report.unclassified.length}개 항목 감지 (자격요건·우대사항 헤더 추가 시
          분류됩니다)
        </p>
      )}
    </aside>
  );
}

function JdResumeMatchHint({ jdText, resumeText }: { jdText: string; resumeText: string }) {
  const report = useMemo(() => buildJdResumeMatchReport(jdText, resumeText), [jdText, resumeText]);
  if (jdText.trim().length < 30 || resumeText.trim().length < 50) return null;
  if (report.coverageItems.length === 0) return null;

  const fill = Math.max(0.04, report.matchScore / 100);

  return (
    <aside
      className={`jd-match-hint jd-match-hint--${report.tone}`}
      aria-label="JD-이력서 매칭 점수"
    >
      <header className="jd-match-hint__head">
        <span className="jd-match-hint__eyebrow">Resume match</span>
        <span className="jd-match-hint__label">{report.label}</span>
      </header>

      <div
        className="jd-match-hint__meter"
        role="progressbar"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={report.matchScore}
        aria-label="이력서 매칭 점수"
      >
        <span
          className="jd-match-hint__meter-fill"
          style={{ ['--match-fill' as never]: String(fill) }}
        />
      </div>

      <p className="jd-match-hint__summary">{report.summary}</p>

      {report.requiredCoverage.length > 0 && (
        <ul className="jd-match-hint__coverage-list" aria-label="필수 요건 커버리지">
          {report.requiredCoverage.map((item, i) => (
            <li
              key={i}
              className={`jd-match-hint__coverage-item${item.covered ? ' jd-match-hint__coverage-item--covered' : ' jd-match-hint__coverage-item--missing'}`}
            >
              <span className="jd-match-hint__coverage-icon" aria-hidden="true">
                {item.covered ? '✓' : '○'}
              </span>
              <span className="jd-match-hint__coverage-text">{item.requirement.text}</span>
            </li>
          ))}
        </ul>
      )}

      {report.gaps.length > 0 && (
        <p className="jd-match-hint__gap-hint">
          미충족 {report.gaps.length}개 항목을 이력서에 추가하면 매칭 점수가 올라갑니다.
        </p>
      )}
    </aside>
  );
}

// ── JD Hiring Mode ──

function JdHiringModeHint({ text }: { text: string }) {
  const report = useMemo(() => detectHiringMode(text), [text]);
  if (text.trim().length < 30) return null;
  if (report.mode === 'unclear') return null;

  const toneMap: Record<string, string> = {
    batch: 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-700',
    rolling: 'bg-emerald-50 dark:bg-emerald-900/20 border-emerald-200 dark:border-emerald-700',
    mixed: 'bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-700',
    unclear: '',
  };
  const labelMap: Record<string, string> = {
    batch: 'text-blue-700 dark:text-blue-300',
    rolling: 'text-emerald-700 dark:text-emerald-300',
    mixed: 'text-amber-700 dark:text-amber-300',
    unclear: '',
  };

  return (
    <aside
      className={`rounded-lg border p-3 text-sm ${toneMap[report.mode]}`}
      aria-label="채용 방식 분석"
    >
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs font-semibold uppercase tracking-wide opacity-50">
          Hiring mode
        </span>
        <span className={`font-bold text-xs ${labelMap[report.mode]}`}>{report.modeLabel}</span>
      </div>
      <div className="flex flex-wrap gap-1 mb-2">
        {report.batchSignals.map((s) => (
          <span
            key={s.label}
            className="text-xs bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300 rounded px-1.5 py-0.5"
          >
            {s.label}
          </span>
        ))}
        {report.rollingSignals.map((s) => (
          <span
            key={s.label}
            className="text-xs bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300 rounded px-1.5 py-0.5"
          >
            {s.label}
          </span>
        ))}
      </div>
      <ul className="space-y-1">
        {report.tips.map((tip, i) => (
          <li key={i} className="text-xs opacity-70 flex gap-1.5">
            <span>•</span>
            <span>{tip}</span>
          </li>
        ))}
      </ul>
    </aside>
  );
}

// ── JD Red Flag ──

function JdRedFlagHint({ text }: { text: string }) {
  const report = useMemo(() => detectJdRedFlags(text), [text]);
  if (text.trim().length < 30) return null;
  if (report.riskLevel === 'clean') return null;

  const containerClass =
    report.riskLevel === 'high'
      ? 'bg-rose-50 dark:bg-rose-900/20 border-rose-200 dark:border-rose-700'
      : report.riskLevel === 'moderate'
        ? 'bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-700'
        : 'bg-neutral-50 dark:bg-neutral-800/40 border-neutral-200 dark:border-neutral-700';

  const badgeClass =
    report.riskLevel === 'high'
      ? 'text-rose-700 dark:text-rose-300'
      : report.riskLevel === 'moderate'
        ? 'text-amber-700 dark:text-amber-300'
        : 'text-neutral-500';

  const riskLabel =
    report.riskLevel === 'high' ? '⚠ 고위험' : report.riskLevel === 'moderate' ? '주의' : '참고';

  const severityChipClass = (sev: string) =>
    sev === 'high'
      ? 'bg-rose-100 dark:bg-rose-900/40 text-rose-700 dark:text-rose-300'
      : sev === 'medium'
        ? 'bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-300'
        : 'bg-neutral-100 dark:bg-neutral-700 text-neutral-600 dark:text-neutral-300';

  return (
    <aside
      className={`rounded-lg border p-3 text-sm ${containerClass}`}
      aria-label="채용공고 레드플래그 분석"
    >
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs font-semibold uppercase tracking-wide opacity-50">Red flags</span>
        <span className={`font-bold text-xs ${badgeClass}`}>{riskLabel}</span>
      </div>
      <p className="text-xs opacity-70 mb-2">{report.summary}</p>
      <ul className="space-y-1.5">
        {report.flags.map((f, i) => (
          <li key={i} className="flex flex-col gap-0.5">
            <div className="flex items-center gap-1.5">
              <span
                className={`text-xs rounded px-1.5 py-0.5 font-medium ${severityChipClass(f.severity)}`}
              >
                {f.category}
              </span>
              <span className="text-xs font-mono opacity-60">"{f.matched}"</span>
            </div>
            <span className="text-xs opacity-60 pl-1">{f.reason}</span>
          </li>
        ))}
      </ul>
    </aside>
  );
}

// ── JD Tech Obsolescence ──

function JdTechObsolescenceHint({ text }: { text: string }) {
  const report = useMemo(() => detectJdTechObsolescence(text), [text]);
  if (text.trim().length < 30) return null;
  if (report.risk === 'none') return null;

  const containerClass =
    report.risk === 'high'
      ? 'bg-rose-50 dark:bg-rose-900/20 border-rose-200 dark:border-rose-700'
      : report.risk === 'moderate'
        ? 'bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-700'
        : 'bg-neutral-50 dark:bg-neutral-800/40 border-neutral-200 dark:border-neutral-700';

  const badgeClass =
    report.risk === 'high'
      ? 'text-rose-700 dark:text-rose-300'
      : report.risk === 'moderate'
        ? 'text-amber-700 dark:text-amber-300'
        : 'text-neutral-500';

  const levelChipClass = (level: string) =>
    level === 'eol'
      ? 'bg-rose-100 dark:bg-rose-900/40 text-rose-700 dark:text-rose-300'
      : level === 'declining'
        ? 'bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-300'
        : 'bg-neutral-100 dark:bg-neutral-700 text-neutral-600 dark:text-neutral-300';

  const riskLabel =
    report.risk === 'high' ? '⚠ 고위험' : report.risk === 'moderate' ? '주의' : '참고';

  return (
    <aside
      className={`rounded-lg border p-3 text-sm ${containerClass}`}
      aria-label="기술 스택 노후화 분석"
    >
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs font-semibold uppercase tracking-wide opacity-50">Tech Debt</span>
        <span className={`font-bold text-xs ${badgeClass}`}>{riskLabel}</span>
      </div>
      <p className="text-xs opacity-70 mb-2">{report.summary}</p>
      <ul className="space-y-1.5">
        {report.techs.map((tech, i) => (
          <li key={i} className="flex flex-col gap-0.5">
            <div className="flex items-center gap-1.5 flex-wrap">
              <span
                className={`text-xs rounded px-1.5 py-0.5 font-medium ${levelChipClass(tech.level)}`}
              >
                {tech.name}
              </span>
              <span className="text-xs opacity-50">→ {tech.modernAlternative}</span>
            </div>
            <span className="text-xs opacity-60 pl-1">{tech.reason}</span>
          </li>
        ))}
      </ul>
    </aside>
  );
}

// ── JD Company Stage ──

function JdWorkLifeBalanceHint({ text }: { text: string }) {
  const report = useMemo(() => analyzeJdWorkLifeBalance(text), [text]);
  if (text.trim().length < 30) return null;
  if (report.rating === 'excellent') return null;

  const containerClass =
    report.rating === 'concern'
      ? 'bg-rose-50 dark:bg-rose-900/20 border-rose-200 dark:border-rose-700'
      : report.rating === 'neutral'
        ? 'bg-neutral-50 dark:bg-neutral-800/40 border-neutral-200 dark:border-neutral-700'
        : 'bg-sky-50 dark:bg-sky-900/20 border-sky-200 dark:border-sky-700';

  const badgeClass =
    report.rating === 'concern'
      ? 'text-rose-700 dark:text-rose-300'
      : report.rating === 'neutral'
        ? 'text-neutral-500'
        : 'text-sky-700 dark:text-sky-300';

  const ratingLabel =
    report.rating === 'concern' ? '주의' : report.rating === 'neutral' ? '미언급' : '보통';

  return (
    <aside className={`rounded-lg border p-3 text-sm ${containerClass}`} aria-label="워라밸 분석">
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs font-semibold uppercase tracking-wide opacity-50">WLB</span>
        <span className={`font-bold text-xs ${badgeClass}`}>{ratingLabel}</span>
      </div>
      <p className="text-xs opacity-70 mb-2">{report.summary}</p>
      {report.redFlags.length > 0 && (
        <ul className="space-y-0.5 mb-2">
          {report.redFlags.map((flag, i) => (
            <li key={i} className="text-xs text-rose-600 dark:text-rose-400">
              ⚠ {flag}
            </li>
          ))}
        </ul>
      )}
      {report.interviewQuestions.length > 0 && (
        <div>
          <p className="text-xs opacity-50 mb-1">면접에서 확인할 항목:</p>
          <ul className="space-y-0.5">
            {report.interviewQuestions.map((q, i) => (
              <li key={i} className="text-xs opacity-60">
                → {q}
              </li>
            ))}
          </ul>
        </div>
      )}
    </aside>
  );
}

function JdCultureVaguenessHint({ text }: { text: string }) {
  const report = useMemo(() => detectJdCultureVagueness(text), [text]);
  if (text.trim().length < 30) return null;
  if (report.clarity === 'concrete') return null;
  if (report.vagueCount === 0 && report.concreteCount === 0) return null;

  const containerClass =
    report.riskLevel === 'high'
      ? 'bg-rose-50 dark:bg-rose-900/20 border-rose-200 dark:border-rose-700'
      : report.riskLevel === 'medium'
        ? 'bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-700'
        : 'bg-neutral-50 dark:bg-neutral-800/40 border-neutral-200 dark:border-neutral-700';

  const badgeClass =
    report.riskLevel === 'high'
      ? 'text-rose-700 dark:text-rose-300'
      : report.riskLevel === 'medium'
        ? 'text-amber-700 dark:text-amber-300'
        : 'text-neutral-500';

  const clarityLabel: Record<string, string> = {
    concrete: '구체적',
    mixed: '혼재',
    vague: '모호',
    none: '미언급',
  };

  return (
    <aside
      className={`rounded-lg border p-3 text-sm ${containerClass}`}
      aria-label="문화·가치 모호성 분석"
    >
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs font-semibold uppercase tracking-wide opacity-50">Culture</span>
        <span className={`font-bold text-xs ${badgeClass}`}>{clarityLabel[report.clarity]}</span>
      </div>
      <p className="text-xs opacity-70 mb-2">{report.summary}</p>
      {report.vagueSignals.length > 0 && (
        <div className="flex flex-wrap gap-1 mb-2">
          {report.vagueSignals.slice(0, 4).map((s, i) => (
            <span
              key={i}
              className="text-xs bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-300 rounded px-1.5 py-0.5"
            >
              {s.excerpt.slice(0, 20)}
            </span>
          ))}
        </div>
      )}
      {report.interviewQuestions.length > 0 && (
        <div>
          <p className="text-xs opacity-50 mb-1">면접에서 확인할 항목:</p>
          <ul className="space-y-0.5">
            {report.interviewQuestions.map((q, i) => (
              <li key={i} className="text-xs opacity-60">
                → {q}
              </li>
            ))}
          </ul>
        </div>
      )}
    </aside>
  );
}

function JdSalaryTransparencyHint({ text }: { text: string }) {
  const report = useMemo(() => analyzeJdSalaryTransparency(text), [text]);
  if (text.trim().length < 30) return null;
  if (report.transparency === 'transparent') return null;

  const containerClass =
    report.transparency === 'silent'
      ? 'bg-rose-50 dark:bg-rose-900/20 border-rose-200 dark:border-rose-700'
      : report.transparency === 'opaque'
        ? 'bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-700'
        : 'bg-neutral-50 dark:bg-neutral-800/40 border-neutral-200 dark:border-neutral-700';

  const badgeClass =
    report.transparency === 'silent'
      ? 'text-rose-700 dark:text-rose-300'
      : report.transparency === 'opaque'
        ? 'text-amber-700 dark:text-amber-300'
        : 'text-sky-700 dark:text-sky-300';

  const transparencyLabel: Record<string, string> = {
    transparent: '공개',
    partial: '부분 공개',
    opaque: '모호',
    silent: '미공개',
  };

  return (
    <aside
      className={`rounded-lg border p-3 text-sm ${containerClass}`}
      aria-label="연봉 투명성 분석"
    >
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs font-semibold uppercase tracking-wide opacity-50">연봉</span>
        <span className={`font-bold text-xs ${badgeClass}`}>
          {transparencyLabel[report.transparency]}
        </span>
      </div>
      <p className="text-xs opacity-70 mb-2">{report.summary}</p>
      {report.disclosureSignals.length > 0 && (
        <div className="flex flex-wrap gap-1 mb-2">
          {report.disclosureSignals.slice(0, 3).map((s, i) => (
            <span
              key={i}
              className="text-xs bg-sky-100 dark:bg-sky-900/40 text-sky-700 dark:text-sky-300 rounded px-1.5 py-0.5"
            >
              {s.excerpt.slice(0, 24)}
            </span>
          ))}
        </div>
      )}
      {report.negotiationTips.length > 0 && (
        <div>
          <p className="text-xs opacity-50 mb-1">협상 전략:</p>
          <ul className="space-y-0.5">
            {report.negotiationTips.map((tip, i) => (
              <li key={i} className="text-xs opacity-60">
                → {tip}
              </li>
            ))}
          </ul>
        </div>
      )}
    </aside>
  );
}

function JdCompanyStageHint({ text }: { text: string }) {
  const report = useMemo(() => detectCompanyStage(text), [text]);
  if (text.trim().length < 30) return null;
  if (report.stage === 'unclear') return null;

  const stageColor: Record<string, string> = {
    startup: 'bg-emerald-50 dark:bg-emerald-900/20 border-emerald-200 dark:border-emerald-700',
    scaleup: 'bg-sky-50 dark:bg-sky-900/20 border-sky-200 dark:border-sky-700',
    enterprise: 'bg-neutral-50 dark:bg-neutral-800/40 border-neutral-200 dark:border-neutral-700',
    foreign: 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-700',
    public: 'bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-700',
  };
  const stageLabel: Record<string, string> = {
    startup: 'text-emerald-700 dark:text-emerald-300',
    scaleup: 'text-sky-700 dark:text-sky-300',
    enterprise: 'text-neutral-600 dark:text-neutral-300',
    foreign: 'text-blue-700 dark:text-blue-300',
    public: 'text-amber-700 dark:text-amber-300',
  };

  return (
    <aside
      className={`rounded-lg border p-3 text-sm ${stageColor[report.stage] ?? ''}`}
      aria-label="회사 규모/단계 분석"
    >
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs font-semibold uppercase tracking-wide opacity-50">
          Company stage
        </span>
        <span className={`font-bold text-xs ${stageLabel[report.stage] ?? ''}`}>
          {report.stageLabel}
          {report.confidence === 'high' ? '' : ' (추정)'}
        </span>
      </div>
      {report.signals.length > 0 && (
        <div className="flex flex-wrap gap-1 mb-2">
          {report.signals.map((s) => (
            <span
              key={s.label}
              className="text-xs bg-white/60 dark:bg-black/20 rounded px-1.5 py-0.5 opacity-80"
            >
              {s.label}
            </span>
          ))}
        </div>
      )}
      <ul className="space-y-1">
        {report.tips.map((tip, i) => (
          <li key={i} className="text-xs opacity-70 flex gap-1.5">
            <span>•</span>
            <span>{tip}</span>
          </li>
        ))}
      </ul>
    </aside>
  );
}

// ── JD Growth Opportunity ──

function JdGrowthOpportunityHint({ text }: { text: string }) {
  const report = useMemo(() => analyzeJdGrowthOpportunity(text), [text]);
  if (text.trim().length < 30) return null;
  if (report.rating === 'rich') return null;

  const containerClass =
    report.rating === 'none'
      ? 'bg-neutral-50 dark:bg-neutral-800/40 border-neutral-200 dark:border-neutral-700'
      : report.rating === 'sparse'
        ? 'bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-700'
        : 'bg-sky-50 dark:bg-sky-900/20 border-sky-200 dark:border-sky-700';

  const badgeClass =
    report.rating === 'none'
      ? 'text-neutral-500'
      : report.rating === 'sparse'
        ? 'text-amber-700 dark:text-amber-300'
        : 'text-sky-700 dark:text-sky-300';

  const ratingLabel =
    report.rating === 'none' ? '미언급' : report.rating === 'sparse' ? '부족' : '보통';

  const typeIcon: Record<string, string> = {
    learning_budget: '📚',
    mentoring: '🧑‍🏫',
    conference: '🎤',
    promotion_path: '📈',
    tech_challenges: '⚙️',
    global_exposure: '🌏',
    ownership: '🔑',
    cross_functional: '🤝',
  };

  return (
    <aside
      className={`rounded-lg border p-3 text-sm ${containerClass}`}
      aria-label="성장 기회 분석"
    >
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs font-semibold uppercase tracking-wide opacity-50">Growth</span>
        <span className={`font-bold text-xs ${badgeClass}`}>{ratingLabel}</span>
      </div>
      <p className="text-xs opacity-70 mb-2">{report.summary}</p>
      {report.types.size > 0 && (
        <div className="flex flex-wrap gap-1 mb-2">
          {Array.from(report.types).map((t) => (
            <span
              key={t}
              className="text-xs bg-sky-100 dark:bg-sky-900/40 text-sky-700 dark:text-sky-300 rounded px-1.5 py-0.5"
            >
              {typeIcon[t] ?? '✓'} {t.replace(/_/g, ' ')}
            </span>
          ))}
        </div>
      )}
      {report.missingAreas.length > 0 && (
        <div>
          <p className="text-xs opacity-50 mb-1">면접에서 확인할 항목:</p>
          <ul className="space-y-0.5">
            {report.missingAreas.map((area, i) => (
              <li key={i} className="text-xs opacity-60">
                → {area}
              </li>
            ))}
          </ul>
        </div>
      )}
    </aside>
  );
}

// ── Answer Quick Score (heuristic, zero-cost) ──

function AnswerQuickScore({ text }: { text: string }) {
  const analysis = useMemo(() => analyzeAnswerHeuristic(text), [text]);
  if (text.length < 30) return null;

  const STAR_KEYS = [
    { key: 'situation', label: 'S' },
    { key: 'task', label: 'T' },
    { key: 'action', label: 'A' },
    { key: 'result', label: 'R' },
  ] as const;

  const scoreColor =
    analysis.score >= 75
      ? 'text-emerald-600 dark:text-emerald-400'
      : analysis.score >= 50
        ? 'text-amber-600 dark:text-amber-400'
        : 'text-rose-600 dark:text-rose-400';

  return (
    <div className="mt-2 flex flex-wrap items-center gap-3 text-xs text-slate-500 dark:text-slate-400">
      <span className={`font-bold tabular-nums ${scoreColor}`}>{analysis.score}점</span>
      <span className="flex gap-1" aria-label="STAR 구조 신호">
        {STAR_KEYS.map(({ key, label }) => (
          <span
            key={key}
            className={`w-5 h-5 rounded-full flex items-center justify-center font-semibold text-[10px] ${
              analysis.starSignals[key]
                ? 'bg-emerald-100 dark:bg-emerald-900/40 text-emerald-600 dark:text-emerald-400'
                : 'bg-slate-100 dark:bg-slate-700 text-slate-400'
            }`}
            title={`STAR: ${key}`}
          >
            {label}
          </span>
        ))}
      </span>
      {analysis.fillerCount > 0 && (
        <span className="text-amber-500">필러 {analysis.fillerCount}개</span>
      )}
      {analysis.tips[0] && (
        <span className="truncate max-w-[200px] text-slate-400 dark:text-slate-500">
          {analysis.tips[0]}
        </span>
      )}
    </div>
  );
}

// ── Main Component ──

export default function InterviewPrepPage() {
  const [searchParams] = useSearchParams();
  const [selectedResumeId, setSelectedResumeId] = useState(searchParams.get('resumeId') || '');
  const [jobRole, setJobRole] = useState(
    searchParams.get('position') || searchParams.get('jobRole') || '',
  );
  const [jobDescription, setJobDescription] = useState('');
  const [difficulty, setDifficulty] = useState<Difficulty>('intermediate');
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

  // ── AI 깊이 분석 (LLM endpoint, save=true 로 score history 누적) ──
  const [aiAnalyzing, setAiAnalyzing] = useState(false);
  const [aiAnalysis, setAiAnalysis] = useState<{
    overallScore: number;
    strengths: string[];
    weaknesses: string[];
    improvements: string[];
    rewrittenAnswer: string;
    starBreakdown: { situation: string; task: string; action: string; result: string };
  } | null>(null);

  const runAiAnalysis = async (question: string, answer: string) => {
    if (!answer.trim()) return;
    setAiAnalyzing(true);
    setAiAnalysis(null);
    try {
      const result = await analyzeInterviewAnswer({
        question,
        answer,
        jobRole: jobRole || undefined,
        save: true,
      });
      setAiAnalysis(result);
      toast(`AI 분석 완료 — ${result.overallScore}점`, 'success');
    } catch (err: unknown) {
      toast(getErrorMessage(err, 'AI 분석 실패'), 'error');
    } finally {
      setAiAnalyzing(false);
    }
  };

  // ── Related study groups (cross-feature recommendation) ──
  const selectedResumeQuery = useResume(selectedResumeId || undefined);
  const selectedResumeDetail: Resume | null =
    (selectedResumeQuery.data as Resume | undefined) ?? null;

  const resumeTextForGap = useMemo(
    () => buildResumePlainText(selectedResumeDetail),
    [selectedResumeDetail],
  );

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
  const jobsQuery = usePublicGet<InterviewJobsResponse>(['interview-prep-jobs'], '/api/jobs', {
    staleTime: 60_000,
  });
  const resumes = useMemo<ResumeSummary[]>(
    () => (resumesQuery.data ? (resumesQuery.data as ResumeSummary[]) : []),
    [resumesQuery.data],
  );
  const jobPosts = useMemo<InterviewJobPost[]>(() => {
    const d = jobsQuery.data;
    if (!d) return [];
    const items = Array.isArray(d) ? d : d.items || d.data || [];
    return items.slice(0, 30);
  }, [jobsQuery.data]);

  useEffect(() => {
    document.title = '면접 준비 — 이력서공방';
    return () => {
      document.title = '이력서공방 - AI 기반 이력서 관리 플랫폼';
    };
  }, []);

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
        .split(/\d+[.)]\s/)
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
    } catch (e: unknown) {
      toast(getErrorMessage(e, '생성에 실패했습니다'), 'error');
    } finally {
      setLoading(false);
    }
  }, [selectedResumeId, jobRole, difficulty, jobDescription, customQuestions]);

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
                  <div className="stagger-children grid grid-cols-2 gap-x-6 gap-y-2">
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
                <div className="stagger-children grid grid-cols-1 sm:grid-cols-2 gap-4">
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

                {/* AI 깊이 분석 — heuristic 위에 LLM 한 단계 더 */}
                <div className="border-t border-slate-200 dark:border-slate-700 pt-4">
                  {!aiAnalysis ? (
                    <button
                      onClick={() =>
                        runAiAnalysis(questions[mockCurrentIdx]?.question || '', mockAnswer)
                      }
                      disabled={aiAnalyzing || !mockAnswer.trim()}
                      className="w-full py-2.5 bg-blue-600 text-white text-sm font-medium rounded-xl hover:bg-blue-700 disabled:opacity-50 transition-colors flex items-center justify-center gap-2"
                    >
                      {aiAnalyzing ? (
                        <>
                          <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                          AI 깊이 분석 중...
                        </>
                      ) : (
                        <>🤖 AI 깊이 분석 (점수 추세 누적)</>
                      )}
                    </button>
                  ) : (
                    <div className="space-y-3 animate-fade-in">
                      <div className="flex items-baseline justify-between">
                        <h4 className="text-sm font-semibold text-slate-800 dark:text-slate-100">
                          🤖 AI 깊이 분석
                        </h4>
                        <span className="text-2xl font-bold tabular-nums text-blue-600 dark:text-blue-400">
                          {aiAnalysis.overallScore}
                          <span className="text-xs font-normal text-slate-500 ml-1">/100</span>
                        </span>
                      </div>
                      {aiAnalysis.strengths.length > 0 && (
                        <div>
                          <p className="text-[11px] font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400 mb-1">
                            강점
                          </p>
                          <ul className="text-xs text-slate-700 dark:text-slate-300 space-y-1">
                            {aiAnalysis.strengths.map((s, i) => (
                              <li key={i} className="flex gap-1">
                                <span className="text-emerald-500">✓</span>
                                {s}
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                      {aiAnalysis.weaknesses.length > 0 && (
                        <div>
                          <p className="text-[11px] font-bold uppercase tracking-wider text-amber-600 dark:text-amber-400 mb-1">
                            약점
                          </p>
                          <ul className="text-xs text-slate-700 dark:text-slate-300 space-y-1">
                            {aiAnalysis.weaknesses.map((s, i) => (
                              <li key={i} className="flex gap-1">
                                <span className="text-amber-500">!</span>
                                {s}
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                      {aiAnalysis.improvements.length > 0 && (
                        <div>
                          <p className="text-[11px] font-bold uppercase tracking-wider text-sky-600 dark:text-sky-400 mb-1">
                            개선 행동
                          </p>
                          <ul className="text-xs text-slate-700 dark:text-slate-300 space-y-1">
                            {aiAnalysis.improvements.map((s, i) => (
                              <li key={i} className="flex gap-1">
                                <span className="text-sky-500">→</span>
                                {s}
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                      {aiAnalysis.rewrittenAnswer && (
                        <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-3 border border-blue-200 dark:border-blue-800/40">
                          <div className="flex items-center justify-between mb-1">
                            <p className="text-[11px] font-bold uppercase tracking-wider text-blue-700 dark:text-blue-400">
                              리라이트 답변
                            </p>
                            <button
                              onClick={() => {
                                setMockAnswer(aiAnalysis.rewrittenAnswer);
                                toast('리라이트 답변이 적용되었습니다', 'success');
                              }}
                              className="text-[10px] px-2 py-0.5 bg-blue-600 text-white rounded hover:bg-blue-700"
                            >
                              적용
                            </button>
                          </div>
                          <p className="text-xs text-blue-800 dark:text-blue-200 leading-relaxed whitespace-pre-wrap">
                            {aiAnalysis.rewrittenAnswer}
                          </p>
                        </div>
                      )}
                      <button
                        onClick={() => setAiAnalysis(null)}
                        className="w-full py-1.5 text-xs text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200"
                      >
                        AI 분석 닫기
                      </button>
                    </div>
                  )}
                </div>

                {/* Next button */}
                <div className="flex justify-center">
                  <button
                    onClick={() => {
                      setAiAnalysis(null);
                      handleMockNextQuestion();
                    }}
                    className="px-8 py-3 bg-sky-700 text-white font-medium rounded-xl hover:from-blue-700 hover:to-sky-700 transition-all shadow-sm text-sm"
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
                    <span className="text-xs text-slate-500 dark:text-slate-400">
                      {mockAnswer.length}자
                    </span>
                    <span className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1">
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
                  <AnswerQuickScore text={mockAnswer} />
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
                    className="px-8 py-2.5 bg-sky-700 text-white font-medium rounded-xl hover:from-blue-700 hover:to-sky-700 disabled:opacity-50 transition-all shadow-sm text-sm flex items-center gap-2"
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
            <div className="bg-sky-700 px-6 py-10 text-center text-white">
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
              <div className="stagger-children grid grid-cols-1 sm:grid-cols-2 gap-4">
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
                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
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
                className="w-full sm:w-auto px-6 py-3 bg-sky-700 text-white font-medium rounded-xl hover:from-blue-700 hover:to-sky-700 transition-all shadow-sm text-sm"
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
                      <span className="text-xs text-slate-500 dark:text-slate-400">
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
          <h1 className="heading-accent text-xl sm:text-2xl font-bold text-slate-900 dark:text-slate-100">
            {tx('interview.prep')}
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            AI가 이력서 기반으로 예상 면접 질문과 모범 답변을 생성합니다
          </p>
        </div>

        {/* 점수 추세 — 데이터 없으면 자동 hide */}
        <InterviewScoreHistory />

        {/* Setup */}
        <div className="imp-card p-6 mb-6">
          <div className="stagger-children grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
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
                    className="text-xs text-sky-700 dark:text-sky-400 hover:underline"
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
                      className="w-full text-left px-3 py-2 hover:bg-sky-50 dark:hover:bg-sky-900/20 transition-colors"
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
              {jobDescription.trim().length >= 30 && (
                <>
                  <JdRequirementsHint text={jobDescription} />
                  <JdResumeMatchHint jdText={jobDescription} resumeText={resumeTextForGap} />
                  <JdSeniorityHint text={jobDescription} />
                  <JdCompensationHint text={jobDescription} />
                  <JdCultureHint text={jobDescription} />
                  <JdBiasHint text={jobDescription} />
                  <JdKeywordGapHint jdText={jobDescription} resumeText={resumeTextForGap} />
                  <JdWorkModalityHint text={jobDescription} />
                  <JdSalaryBenchmarkHint text={jobDescription} />
                  <JdInterviewStrategyHint text={jobDescription} />
                  <JdHiringModeHint text={jobDescription} />
                  <JdRedFlagHint text={jobDescription} />
                  <JdTechObsolescenceHint text={jobDescription} />
                  <JdGrowthOpportunityHint text={jobDescription} />
                  <JdWorkLifeBalanceHint text={jobDescription} />
                  <JdCultureVaguenessHint text={jobDescription} />
                  <JdSalaryTransparencyHint text={jobDescription} />
                  <JdCompanyStageHint text={jobDescription} />
                </>
              )}
            </div>
          </div>

          {/* Difficulty selector */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-200 mb-1.5">
              {tx('interview.difficulty.label')}
            </label>
            <div className="stagger-children grid grid-cols-2 sm:grid-cols-3 gap-2">
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
                    className="text-xs text-slate-500 dark:text-slate-400 hover:text-slate-600"
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
                  <div className="text-xs text-slate-500 dark:text-slate-400 mt-1">
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
            className="w-full py-3 min-h-[48px] bg-sky-700 text-white font-medium rounded-xl hover:from-blue-700 hover:to-sky-700 disabled:opacity-50 transition-all duration-200 shadow-sm"
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
                        ? 'bg-sky-700 text-white'
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
                            <span className="text-xs px-1.5 py-0.5 bg-sky-50 dark:bg-sky-900/20 text-sky-500 dark:text-sky-400 rounded">
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
