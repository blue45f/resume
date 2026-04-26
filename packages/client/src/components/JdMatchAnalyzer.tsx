import { useState, useEffect, useCallback, useRef } from 'react';
import * as RadixDialog from '@radix-ui/react-dialog';
import { API_URL } from '@/lib/config';
import type { Resume } from '@/types/resume';

interface Props {
  resumeId: string;
  resume: Resume;
  onClose: () => void;
}

interface KeywordMatch {
  found: string[];
  missing: string[];
}

interface SkillsGap {
  resumeSkills: string[];
  requiredSkills: string[];
  overlap: string[];
}

interface JdMatchResult {
  matchScore: number;
  matchGrade: string;
  summary: string;
  keywords: KeywordMatch;
  skillsGap: SkillsGap;
  experienceMatch: { required: string; actual: string; verdict: string };
  matchedSkills?: string[];
  missingSkills?: string[];
  recommendations?: string[];
  coverLetterPoints?: string[];
}

interface JdHistoryEntry {
  id: string;
  jdSnippet: string;
  score: number;
  grade: string;
  date: string;
}

function getHeaders() {
  const token = localStorage.getItem('token');
  const h: Record<string, string> = { 'Content-Type': 'application/json' };
  if (token) h['Authorization'] = `Bearer ${token}`;
  return h;
}

/** Animated circular progress */
function CircularProgress({
  value,
  size = 140,
  strokeWidth = 10,
}: {
  value: number;
  size?: number;
  strokeWidth?: number;
}) {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const [offset, setOffset] = useState(circumference);

  useEffect(() => {
    const timer = setTimeout(() => {
      setOffset(circumference - (value / 100) * circumference);
    }, 100);
    return () => clearTimeout(timer);
  }, [value, circumference]);

  const color =
    value >= 80 ? '#22c55e' : value >= 60 ? '#eab308' : value >= 40 ? '#f97316' : '#ef4444';

  return (
    <div className="relative inline-flex items-center justify-center">
      <svg width={size} height={size} className="-rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="#e2e8f0"
          strokeWidth={strokeWidth}
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={color}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          style={{ transition: 'stroke-dashoffset 1s ease-out' }}
        />
      </svg>
      <div className="absolute flex flex-col items-center">
        <span className="text-3xl font-bold" style={{ color }}>
          {value}
        </span>
        <span className="text-xs text-slate-500">/ 100</span>
      </div>
    </div>
  );
}

/** Venn-style skill overlap visualization */
function SkillsVenn({ skillsGap }: { skillsGap: SkillsGap }) {
  const onlyResume = skillsGap.resumeSkills.filter((s) => !skillsGap.overlap.includes(s));
  const onlyRequired = skillsGap.requiredSkills.filter((s) => !skillsGap.overlap.includes(s));

  return (
    <div className="space-y-3">
      <div className="flex items-start gap-2">
        {/* Resume-only circle */}
        <div className="flex-1 relative">
          <div className="bg-blue-50 dark:bg-blue-900/30 border-2 border-blue-300 dark:border-blue-700 rounded-2xl p-3 min-h-[80px]">
            <h5 className="text-xs font-bold text-blue-700 dark:text-blue-400 mb-2">보유 기술</h5>
            <div className="flex flex-wrap gap-1">
              {onlyResume.map((s, i) => (
                <span
                  key={i}
                  className="px-2 py-1 text-xs bg-blue-100 dark:bg-blue-800 text-blue-700 dark:text-blue-300 rounded-full"
                >
                  {s}
                </span>
              ))}
              {onlyResume.length === 0 && <span className="text-xs text-slate-400">-</span>}
            </div>
          </div>
        </div>

        {/* Overlap */}
        <div className="flex-1 relative">
          <div className="bg-green-50 dark:bg-green-900/30 border-2 border-green-300 dark:border-green-700 rounded-2xl p-3 min-h-[80px]">
            <h5 className="text-xs font-bold text-green-700 dark:text-green-400 mb-2">매칭</h5>
            <div className="flex flex-wrap gap-1">
              {skillsGap.overlap.map((s, i) => (
                <span
                  key={i}
                  className="px-2 py-1 text-xs bg-green-100 dark:bg-green-800 text-green-700 dark:text-green-300 rounded-full font-medium"
                >
                  {s}
                </span>
              ))}
              {skillsGap.overlap.length === 0 && <span className="text-xs text-slate-400">-</span>}
            </div>
          </div>
        </div>

        {/* Required-only circle */}
        <div className="flex-1 relative">
          <div className="bg-red-50 dark:bg-red-900/30 border-2 border-red-300 dark:border-red-700 rounded-2xl p-3 min-h-[80px]">
            <h5 className="text-xs font-bold text-red-700 dark:text-red-400 mb-2">필요 기술</h5>
            <div className="flex flex-wrap gap-1">
              {onlyRequired.map((s, i) => (
                <span
                  key={i}
                  className="px-2 py-1 text-xs bg-red-100 dark:bg-red-800 text-red-700 dark:text-red-300 rounded-full"
                >
                  {s}
                </span>
              ))}
              {onlyRequired.length === 0 && <span className="text-xs text-slate-400">-</span>}
            </div>
          </div>
        </div>
      </div>

      {/* Coverage bar */}
      <div>
        <div className="flex justify-between text-xs text-slate-500 mb-1">
          <span>기술 커버리지</span>
          <span>
            {skillsGap.requiredSkills.length > 0
              ? Math.round((skillsGap.overlap.length / skillsGap.requiredSkills.length) * 100)
              : 0}
            %
          </span>
        </div>
        <div className="h-2 bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden">
          <div
            className="h-full bg-emerald-500 rounded-full transition-all duration-700"
            style={{
              width: `${skillsGap.requiredSkills.length > 0 ? (skillsGap.overlap.length / skillsGap.requiredSkills.length) * 100 : 0}%`,
            }}
          />
        </div>
      </div>
    </div>
  );
}

const JD_HISTORY_KEY = 'jd-match-history';

function loadHistory(): JdHistoryEntry[] {
  try {
    return JSON.parse(localStorage.getItem(JD_HISTORY_KEY) || '[]');
  } catch {
    return [];
  }
}

function saveHistory(entries: JdHistoryEntry[]) {
  localStorage.setItem(JD_HISTORY_KEY, JSON.stringify(entries.slice(0, 20)));
}

type ActiveTab = 'analyze' | 'history' | 'coverletter';

export default function JdMatchAnalyzer({ resumeId, resume, onClose }: Props) {
  const [jd, setJd] = useState('');
  const [loading, setLoading] = useState(false);
  const [optimizing, setOptimizing] = useState(false);
  const [coverLetterLoading, setCoverLetterLoading] = useState(false);
  const [error, setError] = useState('');
  const [result, setResult] = useState<JdMatchResult | null>(null);
  const [coverLetter, setCoverLetter] = useState('');
  const [coverLetterEditing, setCoverLetterEditing] = useState(false);
  const [history, setHistory] = useState<JdHistoryEntry[]>(loadHistory);
  const [tab, setTab] = useState<ActiveTab>('analyze');
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Extract skills from resume for local analysis fallback
  const extractResumeSkills = useCallback((): string[] => {
    const skills: string[] = [];
    resume.skills.forEach((s) => {
      s.items.split(',').forEach((item) => {
        const trimmed = item.trim();
        if (trimmed) skills.push(trimmed);
      });
    });
    resume.experiences.forEach((e) => {
      if (e.techStack) {
        e.techStack.split(',').forEach((item) => {
          const trimmed = item.trim();
          if (trimmed && !skills.includes(trimmed)) skills.push(trimmed);
        });
      }
    });
    resume.projects.forEach((p) => {
      if (p.techStack) {
        p.techStack.split(',').forEach((item) => {
          const trimmed = item.trim();
          if (trimmed && !skills.includes(trimmed)) skills.push(trimmed);
        });
      }
    });
    return skills;
  }, [resume]);

  const runAnalysis = async () => {
    if (!jd.trim() || jd.length < 20) return;
    setLoading(true);
    setError('');
    setResult(null);

    try {
      const res = await fetch(`${API_URL}/api/resumes/${resumeId}/transform/job-match`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify({ jobDescription: jd }),
      });

      if (!res.ok) {
        throw new Error((await res.json().catch(() => ({}))).message || '분석 실패');
      }

      const data = await res.json();
      const analysis = data.analysis;

      // Normalize the API response into our structured result
      const resumeSkills = extractResumeSkills();
      const matched = analysis.matchedSkills || [];
      const missing = analysis.missingSkills || [];

      // Build keywords from the JD text
      const jdWords = jd
        .toLowerCase()
        .replace(/[^\w가-힣\s]/g, ' ')
        .split(/\s+/)
        .filter((w) => w.length > 2);
      const resumeText = JSON.stringify(resume).toLowerCase();
      const foundKeywords: string[] = [];
      const missingKeywords: string[] = [];
      const seen = new Set<string>();
      for (const word of jdWords) {
        if (seen.has(word)) continue;
        seen.add(word);
        if (resumeText.includes(word)) foundKeywords.push(word);
        else missingKeywords.push(word);
      }

      // Estimate experience
      let totalYears = 0;
      for (const exp of resume.experiences) {
        const start = exp.startDate ? new Date(exp.startDate) : null;
        const end = exp.current ? new Date() : exp.endDate ? new Date(exp.endDate) : null;
        if (start && end) {
          totalYears += (end.getTime() - start.getTime()) / (365.25 * 24 * 60 * 60 * 1000);
        }
      }
      const actualYearsStr = `${Math.round(totalYears)}년`;

      // Try to extract required years from JD
      const yearsMatch = jd.match(/(\d+)\s*년\s*(이상|경력)/);
      const requiredYearsStr = yearsMatch ? `${yearsMatch[1]}년 이상` : '명시되지 않음';
      const verdict = yearsMatch
        ? totalYears >= parseInt(yearsMatch[1])
          ? '충족'
          : '부족'
        : '확인 필요';

      const matchResult: JdMatchResult = {
        matchScore: analysis.matchScore || 0,
        matchGrade: analysis.matchGrade || 'C',
        summary: analysis.summary || '',
        keywords: {
          found: foundKeywords.slice(0, 20),
          missing: missingKeywords.slice(0, 15),
        },
        skillsGap: {
          resumeSkills,
          requiredSkills: [...matched, ...missing],
          overlap: matched,
        },
        experienceMatch: {
          required: requiredYearsStr,
          actual: actualYearsStr,
          verdict,
        },
        matchedSkills: matched,
        missingSkills: missing,
        recommendations: analysis.recommendations || [],
        coverLetterPoints: analysis.coverLetterPoints || [],
      };

      setResult(matchResult);

      // Save to history
      const entry: JdHistoryEntry = {
        id: Date.now().toString(),
        jdSnippet: jd.substring(0, 100) + (jd.length > 100 ? '...' : ''),
        score: matchResult.matchScore,
        grade: matchResult.matchGrade,
        date: new Date().toISOString(),
      };
      const newHistory = [entry, ...history.filter((h) => h.id !== entry.id)].slice(0, 20);
      setHistory(newHistory);
      saveHistory(newHistory);
    } catch (e: any) {
      setError(e.message || '분석 중 오류가 발생했습니다');
    } finally {
      setLoading(false);
    }
  };

  const runOptimize = async () => {
    if (!jd.trim() || !result) return;
    setOptimizing(true);
    setError('');

    try {
      const res = await fetch(`${API_URL}/api/resumes/${resumeId}/transform`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify({
          templateType: 'custom',
          jobDescription: jd,
        }),
      });

      if (!res.ok) throw new Error((await res.json().catch(() => ({}))).message || '최적화 실패');
      // Optimization done - the transform endpoint handles saving
      setError('');
      alert('JD에 맞춰 이력서가 최적화되었습니다. 변환 기록에서 확인하세요.');
    } catch (e: any) {
      setError(e.message);
    } finally {
      setOptimizing(false);
    }
  };

  const runCoverLetter = async () => {
    if (!jd.trim()) return;
    setCoverLetterLoading(true);
    setError('');
    setCoverLetter('');

    try {
      const res = await fetch(`${API_URL}/api/resumes/${resumeId}/transform/job-match`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify({
          jobDescription: jd,
          generateCoverLetter: true,
        }),
      });

      if (!res.ok)
        throw new Error((await res.json().catch(() => ({}))).message || '자소서 생성 실패');
      const data = await res.json();
      const cl = data.coverLetter || data.analysis?.coverLetter || '';
      if (cl) {
        setCoverLetter(cl);
        setTab('coverletter');
      } else {
        // Fallback: generate locally from coverLetterPoints
        const points = result?.coverLetterPoints || data.analysis?.coverLetterPoints || [];
        const fallbackCl = generateLocalCoverLetter(resume, jd, points);
        setCoverLetter(fallbackCl);
        setTab('coverletter');
      }
    } catch (e: any) {
      // Fallback to local generation
      const points = result?.coverLetterPoints || [];
      const fallbackCl = generateLocalCoverLetter(resume, jd, points);
      setCoverLetter(fallbackCl);
      setTab('coverletter');
    } finally {
      setCoverLetterLoading(false);
    }
  };

  const clearHistory = () => {
    setHistory([]);
    saveHistory([]);
  };

  return (
    <RadixDialog.Root
      open
      onOpenChange={(o) => {
        if (!o) onClose();
      }}
    >
      <RadixDialog.Portal>
        <RadixDialog.Overlay className="fixed inset-0 z-[90] bg-black/30 animate-fade-in" />
        <RadixDialog.Content
          aria-label="JD 매칭 분석"
          aria-describedby={undefined}
          className="fixed z-[91] top-0 right-0 w-full max-w-2xl h-full bg-white dark:bg-neutral-800 shadow-2xl overflow-y-auto focus:outline-none animate-slide-in-right"
        >
          {/* Header */}
          <div className="sticky top-0 bg-white dark:bg-neutral-800 border-b border-neutral-200 dark:border-neutral-700 px-4 py-3 flex items-center justify-between z-10">
            <RadixDialog.Title className="font-bold text-neutral-900 dark:text-neutral-100">
              JD 매칭 분석기
            </RadixDialog.Title>
            <RadixDialog.Close asChild>
              <button
                className="p-1 text-neutral-400 hover:text-neutral-600 rounded text-xl"
                aria-label="닫기"
              >
                &times;
              </button>
            </RadixDialog.Close>
          </div>

          {/* Tabs */}
          <div className="flex border-b border-slate-100 dark:border-slate-700">
            {[
              { id: 'analyze' as ActiveTab, label: '분석' },
              { id: 'coverletter' as ActiveTab, label: '맞춤 자소서' },
              { id: 'history' as ActiveTab, label: '히스토리' },
            ].map((t) => (
              <button
                key={t.id}
                onClick={() => setTab(t.id)}
                className={`flex-1 py-3 text-sm font-medium transition-colors ${
                  tab === t.id
                    ? 'text-blue-600 border-b-2 border-blue-600 bg-blue-50/50 dark:bg-blue-900/30'
                    : 'text-slate-500 dark:text-slate-400 hover:text-slate-700'
                }`}
              >
                {t.label}
                {t.id === 'history' && history.length > 0 && (
                  <span className="ml-1 text-xs bg-slate-200 dark:bg-slate-600 text-slate-600 dark:text-slate-300 px-1.5 py-0.5 rounded-full">
                    {history.length}
                  </span>
                )}
              </button>
            ))}
          </div>

          <div className="p-4">
            {error && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
                {error}
              </div>
            )}

            {/* ===== Analysis Tab ===== */}
            {tab === 'analyze' && (
              <div className="space-y-5">
                {/* JD Input */}
                <div>
                  <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
                    채용공고 (Job Description) 붙여넣기
                  </label>
                  <textarea
                    ref={textareaRef}
                    value={jd}
                    onChange={(e) => setJd(e.target.value)}
                    className="w-full px-3 py-3 border border-slate-300 dark:border-slate-600 rounded-xl text-sm h-40 resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-slate-700 dark:text-slate-100 placeholder:text-slate-400"
                    placeholder="채용공고의 자격 요건, 우대 사항, 직무 설명을 여기에 붙여넣으세요...&#10;&#10;예시:&#10;- 3년 이상의 React/TypeScript 개발 경력&#10;- RESTful API 설계 및 개발 경험&#10;- Git을 활용한 협업 경험"
                  />
                  <div className="flex items-center justify-between mt-2">
                    <span className="text-xs text-slate-400">
                      {jd.length}자{jd.length < 20 && jd.length > 0 ? ' (최소 20자 이상 입력)' : ''}
                    </span>
                    <button
                      onClick={runAnalysis}
                      disabled={loading || jd.length < 20}
                      className="px-5 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors flex items-center gap-2"
                    >
                      {loading ? (
                        <>
                          <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                          분석 중...
                        </>
                      ) : (
                        '분석하기'
                      )}
                    </button>
                  </div>
                </div>

                {/* Results */}
                {result && (
                  <div className="space-y-5 animate-fade-in">
                    {/* Overall Score */}
                    <div className="text-center p-6 bg-slate-50 dark:from-slate-900/50 dark:to-blue-900/20 rounded-2xl">
                      <CircularProgress value={result.matchScore} />
                      <div className="mt-3">
                        <span className="text-lg font-bold text-slate-800 dark:text-slate-200">
                          {result.matchGrade} 매칭
                        </span>
                      </div>
                      <p className="text-sm text-slate-600 dark:text-slate-400 mt-2 max-w-md mx-auto">
                        {result.summary}
                      </p>
                    </div>

                    {/* Keyword Match */}
                    <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-4">
                      <h4 className="text-sm font-semibold text-slate-800 dark:text-slate-200 mb-3">
                        키워드 매칭
                      </h4>
                      <div className="space-y-3">
                        <div>
                          <span className="text-xs font-medium text-green-700 dark:text-green-400 mb-1 block">
                            발견된 키워드 ({result.keywords.found.length})
                          </span>
                          <div className="flex flex-wrap gap-2">
                            {result.keywords.found.slice(0, 15).map((kw, i) => (
                              <span
                                key={i}
                                className="px-2 py-1 text-xs bg-green-100 dark:bg-green-900/40 text-green-700 dark:text-green-400 rounded-full"
                              >
                                {kw}
                              </span>
                            ))}
                          </div>
                        </div>
                        <div>
                          <span className="text-xs font-medium text-red-700 dark:text-red-400 mb-1 block">
                            누락된 키워드 ({result.keywords.missing.length})
                          </span>
                          <div className="flex flex-wrap gap-2">
                            {result.keywords.missing.slice(0, 15).map((kw, i) => (
                              <span
                                key={i}
                                className="px-2 py-1 text-xs bg-red-100 dark:bg-red-900/40 text-red-700 dark:text-red-400 rounded-full"
                              >
                                {kw}
                              </span>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Skills Gap - Venn */}
                    <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-4">
                      <h4 className="text-sm font-semibold text-slate-800 dark:text-slate-200 mb-3">
                        기술 스택 갭 분석
                      </h4>
                      <SkillsVenn skillsGap={result.skillsGap} />
                    </div>

                    {/* Experience Match */}
                    <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-4">
                      <h4 className="text-sm font-semibold text-slate-800 dark:text-slate-200 mb-3">
                        경력 매칭
                      </h4>
                      <div className="grid grid-cols-3 gap-3 text-center">
                        <div className="p-3 bg-slate-50 dark:bg-slate-700 rounded-lg">
                          <div className="text-xs text-slate-500 dark:text-slate-400 mb-1">
                            요구 경력
                          </div>
                          <div className="text-sm font-bold text-slate-800 dark:text-slate-200">
                            {result.experienceMatch.required}
                          </div>
                        </div>
                        <div className="p-3 bg-slate-50 dark:bg-slate-700 rounded-lg">
                          <div className="text-xs text-slate-500 dark:text-slate-400 mb-1">
                            보유 경력
                          </div>
                          <div className="text-sm font-bold text-slate-800 dark:text-slate-200">
                            {result.experienceMatch.actual}
                          </div>
                        </div>
                        <div
                          className={`p-3 rounded-lg ${
                            result.experienceMatch.verdict === '충족'
                              ? 'bg-green-50 dark:bg-green-900/30'
                              : result.experienceMatch.verdict === '부족'
                                ? 'bg-red-50 dark:bg-red-900/30'
                                : 'bg-amber-50 dark:bg-amber-900/30'
                          }`}
                        >
                          <div className="text-xs text-slate-500 dark:text-slate-400 mb-1">
                            판정
                          </div>
                          <div
                            className={`text-sm font-bold ${
                              result.experienceMatch.verdict === '충족'
                                ? 'text-green-600'
                                : result.experienceMatch.verdict === '부족'
                                  ? 'text-red-600'
                                  : 'text-amber-600'
                            }`}
                          >
                            {result.experienceMatch.verdict}
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Recommendations */}
                    {result.recommendations && result.recommendations.length > 0 && (
                      <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-4">
                        <h4 className="text-sm font-semibold text-slate-800 dark:text-slate-200 mb-3">
                          수정 제안
                        </h4>
                        <ul className="space-y-2">
                          {result.recommendations.map((r, i) => (
                            <li
                              key={i}
                              className="flex items-start gap-2 text-sm text-slate-600 dark:text-slate-400"
                            >
                              <span className="text-blue-500 mt-0.5 shrink-0">&#8226;</span>
                              <span>{r}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {/* Action Buttons */}
                    <div className="flex gap-3">
                      <button
                        onClick={runOptimize}
                        disabled={optimizing}
                        className="flex-1 py-3 bg-sky-600 text-white text-sm font-semibold rounded-xl hover:bg-sky-700 disabled:opacity-50 transition-colors flex items-center justify-center gap-2"
                      >
                        {optimizing ? (
                          <>
                            <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                            최적화 중...
                          </>
                        ) : (
                          '맞춤 이력서 생성'
                        )}
                      </button>
                      <button
                        onClick={runCoverLetter}
                        disabled={coverLetterLoading}
                        className="flex-1 py-3 bg-emerald-600 text-white text-sm font-semibold rounded-xl hover:bg-emerald-700 disabled:opacity-50 transition-colors flex items-center justify-center gap-2"
                      >
                        {coverLetterLoading ? (
                          <>
                            <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                            생성 중...
                          </>
                        ) : (
                          '맞춤 자소서 생성'
                        )}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* ===== Cover Letter Tab ===== */}
            {tab === 'coverletter' && (
              <div className="space-y-4">
                {!coverLetter ? (
                  <div className="text-center py-12">
                    <div className="text-4xl mb-4">&#9997;&#65039;</div>
                    <p className="text-sm text-slate-500 dark:text-slate-400 mb-4">
                      JD를 분석한 후 &quot;맞춤 자소서 생성&quot; 버튼을 클릭하세요.
                    </p>
                    {jd.trim().length >= 20 && (
                      <button
                        onClick={runCoverLetter}
                        disabled={coverLetterLoading}
                        className="px-6 py-2.5 bg-emerald-600 text-white text-sm font-medium rounded-lg hover:bg-emerald-700 disabled:opacity-50 transition-colors"
                      >
                        {coverLetterLoading ? '생성 중...' : '맞춤 자소서 생성'}
                      </button>
                    )}
                  </div>
                ) : (
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <h3 className="text-sm font-semibold text-slate-800 dark:text-slate-200">
                        생성된 자소서
                      </h3>
                      <div className="flex gap-2">
                        <button
                          onClick={() => setCoverLetterEditing(!coverLetterEditing)}
                          className="text-xs px-3 py-1.5 bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors"
                        >
                          {coverLetterEditing ? '미리보기' : '편집'}
                        </button>
                        <button
                          onClick={() => {
                            navigator.clipboard.writeText(coverLetter);
                            alert('자소서가 클립보드에 복사되었습니다.');
                          }}
                          className="text-xs px-3 py-1.5 bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-lg hover:bg-blue-200 transition-colors"
                        >
                          복사
                        </button>
                      </div>
                    </div>

                    {coverLetterEditing ? (
                      <textarea
                        value={coverLetter}
                        onChange={(e) => setCoverLetter(e.target.value)}
                        className="w-full px-4 py-3 border border-slate-300 dark:border-slate-600 rounded-xl text-sm min-h-[400px] resize-y focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-slate-700 dark:text-slate-100 leading-relaxed"
                      />
                    ) : (
                      <div className="bg-slate-50 dark:bg-slate-900 rounded-xl p-5 text-sm text-slate-700 dark:text-slate-300 leading-relaxed whitespace-pre-wrap border border-slate-200 dark:border-slate-700 min-h-[300px]">
                        {coverLetter}
                      </div>
                    )}

                    <button
                      onClick={runCoverLetter}
                      disabled={coverLetterLoading}
                      className="w-full py-2 text-sm text-slate-500 hover:text-slate-700 transition-colors"
                    >
                      {coverLetterLoading ? '재생성 중...' : '다시 생성하기'}
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* ===== History Tab ===== */}
            {tab === 'history' && (
              <div className="space-y-4">
                {history.length === 0 ? (
                  <div className="text-center py-12">
                    <div className="text-4xl mb-4">&#128202;</div>
                    <p className="text-sm text-slate-500 dark:text-slate-400">
                      아직 JD 매칭 히스토리가 없습니다.
                    </p>
                  </div>
                ) : (
                  <>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-slate-500">{history.length}개 기록</span>
                      <button
                        onClick={clearHistory}
                        className="text-xs text-red-500 hover:text-red-700 transition-colors"
                      >
                        전체 삭제
                      </button>
                    </div>
                    <div className="space-y-2">
                      {history.map((entry) => {
                        const scoreColor =
                          entry.score >= 80
                            ? 'text-green-600 bg-green-50'
                            : entry.score >= 60
                              ? 'text-amber-600 bg-amber-50'
                              : 'text-red-600 bg-red-50';
                        return (
                          <div
                            key={entry.id}
                            className="flex items-center gap-3 p-3 bg-slate-50 dark:bg-slate-700/50 rounded-xl border border-slate-200 dark:border-slate-600"
                          >
                            <div
                              className={`w-12 h-12 rounded-xl flex items-center justify-center font-bold text-lg ${scoreColor}`}
                            >
                              {entry.score}
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm text-slate-700 dark:text-slate-300 truncate">
                                {entry.jdSnippet}
                              </p>
                              <p className="text-xs text-slate-400 mt-0.5">
                                {new Date(entry.date).toLocaleDateString('ko-KR')} &middot;{' '}
                                {entry.grade} 등급
                              </p>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </>
                )}
              </div>
            )}
          </div>
        </RadixDialog.Content>
      </RadixDialog.Portal>
    </RadixDialog.Root>
  );
}

/** Fallback local cover letter generator */
function generateLocalCoverLetter(resume: Resume, _jd: string, points: string[]): string {
  const name = resume.personalInfo.name || '지원자';
  const skills = resume.skills.map((s) => s.items).join(', ');
  const expSummary = resume.experiences
    .map((e) => `${e.company}에서 ${e.position}으로 근무`)
    .join(', ');

  const pointsText =
    points.length > 0
      ? points.map((p, i) => `${i + 1}. ${p}`).join('\n')
      : '- 해당 직무에 대한 열정과 관심\n- 기존 경력을 통해 축적한 실무 역량\n- 지속적인 성장과 기여 의지';

  return `안녕하세요, ${name}입니다.

귀사의 채용공고를 보고 지원하게 되었습니다.

[지원 동기]
채용공고에서 요구하시는 역량과 저의 경력이 잘 부합한다고 판단하여 지원합니다.

[핵심 역량]
${pointsText}

[경력 요약]
${expSummary || '관련 프로젝트 및 학습 경험을 통해 역량을 키워왔습니다.'}

[보유 기술]
${skills || '채용공고에 명시된 기술 스택에 대한 학습과 실무 경험이 있습니다.'}

[마무리]
귀사와 함께 성장하며 기여할 수 있는 기회를 주시면 감사하겠습니다.
면접 기회를 주시면 더 자세히 말씀드리겠습니다.

감사합니다.
${name} 드림`;
}
