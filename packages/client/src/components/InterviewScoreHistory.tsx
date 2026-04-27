import { useEffect, useState } from 'react';
import * as RadixDialog from '@radix-ui/react-dialog';
import {
  fetchInterviewScoreHistory,
  fetchInterviewAnswerDetail,
  type InterviewScorePoint,
  type InterviewAnswerDetail,
} from '@/lib/api';

/**
 * 면접 답변 점수 추세 mini-chart — 최근 30개 분석 결과를 가로 bar 로 시각화.
 * 점수 색상: ≥80 emerald · ≥60 sky · ≥40 amber · <40 rose.
 * 데이터 없으면 null 반환 (자리 차지 안 함).
 */
type ViewMode = 'daily' | 'weekly';

export default function InterviewScoreHistory() {
  const [points, setPoints] = useState<InterviewScorePoint[]>([]);
  const [allPoints, setAllPoints] = useState<InterviewScorePoint[]>([]);
  const [loading, setLoading] = useState(true);
  const [detail, setDetail] = useState<InterviewAnswerDetail | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [viewMode, setViewMode] = useState<ViewMode>('daily');

  useEffect(() => {
    fetchInterviewScoreHistory()
      .then((rows) => {
        setAllPoints(rows);
        setPoints(rows.slice(-30));
      })
      .catch(() => setPoints([]))
      .finally(() => setLoading(false));
  }, []);

  const openDetail = async (id: string) => {
    setDetailLoading(true);
    try {
      const d = await fetchInterviewAnswerDetail(id);
      setDetail(d);
    } catch {
      // toast 는 request 에서 이미 처리
    } finally {
      setDetailLoading(false);
    }
  };

  if (loading) return null;
  if (points.length === 0) return null;

  const avg = Math.round(points.reduce((a, p) => a + p.analysisScore, 0) / points.length);
  const latest = points[points.length - 1];
  const trend =
    points.length >= 2 ? latest.analysisScore - points[points.length - 2].analysisScore : 0;

  // Weekly aggregation — ISO week 단위 평균
  const weekKey = (iso: string) => {
    const d = new Date(iso);
    const t = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()));
    const day = t.getUTCDay() || 7;
    t.setUTCDate(t.getUTCDate() + 4 - day);
    const yearStart = new Date(Date.UTC(t.getUTCFullYear(), 0, 1));
    const weekNo = Math.ceil(((+t - +yearStart) / 86400000 + 1) / 7);
    return `${t.getUTCFullYear()}-W${String(weekNo).padStart(2, '0')}`;
  };
  const weeklyMap = new Map<string, { sum: number; count: number; latestId: string }>();
  for (const p of allPoints) {
    const k = weekKey(p.createdAt);
    const cur = weeklyMap.get(k) || { sum: 0, count: 0, latestId: p.id };
    cur.sum += p.analysisScore;
    cur.count++;
    cur.latestId = p.id;
    weeklyMap.set(k, cur);
  }
  const weeklyPoints = Array.from(weeklyMap.entries())
    .map(([week, v]) => ({
      id: v.latestId,
      week,
      avgScore: Math.round(v.sum / v.count),
      count: v.count,
    }))
    .slice(-12); // 최근 12주

  // 같은 질문 재답변 grouping — question text 기준
  const byQuestion = new Map<string, InterviewScorePoint[]>();
  points.forEach((p) => {
    const key = p.question.trim();
    if (!byQuestion.has(key)) byQuestion.set(key, []);
    byQuestion.get(key)!.push(p);
  });
  const repeatedQuestions = Array.from(byQuestion.entries())
    .filter(([, arr]) => arr.length >= 2)
    .map(([q, arr]) => {
      const first = arr[0].analysisScore;
      const last = arr[arr.length - 1].analysisScore;
      return {
        question: q,
        attempts: arr.length,
        delta: last - first,
        latestId: arr[arr.length - 1].id,
      };
    })
    .sort((a, b) => Math.abs(b.delta) - Math.abs(a.delta))
    .slice(0, 3);

  return (
    <section className="imp-card p-4 mb-4" aria-label="면접 답변 점수 추세">
      <div className="flex items-center justify-between mb-3">
        <div>
          <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-300">
            내 면접 답변 점수 추세
          </h3>
          <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
            최근 90일 · {points.length}개 분석 · 평균 {avg}점
            {trend !== 0 && (
              <span
                className={`ml-2 font-semibold ${trend > 0 ? 'text-emerald-600' : 'text-rose-600'}`}
              >
                {trend > 0 ? '▲' : '▼'} {Math.abs(trend)}
              </span>
            )}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex bg-slate-100 dark:bg-slate-700 rounded-md p-0.5 text-[10px] font-medium">
            {(['daily', 'weekly'] as ViewMode[]).map((m) => (
              <button
                key={m}
                onClick={() => setViewMode(m)}
                className={`px-2 py-0.5 rounded transition-colors ${
                  viewMode === m
                    ? 'bg-white dark:bg-slate-600 text-slate-900 dark:text-slate-100 shadow-sm'
                    : 'text-slate-500 dark:text-slate-400'
                }`}
              >
                {m === 'daily' ? '일별' : '주별'}
              </button>
            ))}
          </div>
          <span className="text-2xl font-bold tabular-nums text-slate-800 dark:text-slate-200">
            {latest.analysisScore}
            <span className="text-xs font-normal text-slate-500 dark:text-slate-400 ml-1">
              /100
            </span>
          </span>
        </div>
      </div>
      {/* 같은 질문 재답변 — 점수 변화 표시 */}
      {repeatedQuestions.length > 0 && (
        <div className="mb-3 space-y-1">
          {repeatedQuestions.map((rq) => (
            <button
              key={rq.latestId}
              type="button"
              onClick={() => openDetail(rq.latestId)}
              className="w-full flex items-center justify-between gap-2 text-left text-xs px-2 py-1.5 rounded-md bg-slate-50 dark:bg-slate-700/40 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
            >
              <span className="truncate text-slate-700 dark:text-slate-300">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 mr-1">
                  📈 재도전 ×{rq.attempts}
                </span>
                {rq.question}
              </span>
              <span
                className={`shrink-0 text-xs font-bold tabular-nums ${
                  rq.delta > 0
                    ? 'text-emerald-600 dark:text-emerald-400'
                    : rq.delta < 0
                      ? 'text-rose-600 dark:text-rose-400'
                      : 'text-slate-500'
                }`}
              >
                {rq.delta > 0 ? '+' : ''}
                {rq.delta}점
              </span>
            </button>
          ))}
        </div>
      )}
      <div className="flex items-end gap-1 h-14">
        {viewMode === 'daily'
          ? points.map((p) => {
              const color =
                p.analysisScore >= 80
                  ? 'bg-emerald-500'
                  : p.analysisScore >= 60
                    ? 'bg-sky-500'
                    : p.analysisScore >= 40
                      ? 'bg-amber-500'
                      : 'bg-rose-500';
              return (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => openDetail(p.id)}
                  className="flex-1 min-w-[6px] flex flex-col items-center group cursor-pointer"
                  title={`클릭: 답변 detail · ${p.analysisScore}점 · ${new Date(p.createdAt).toLocaleDateString('ko-KR')}${p.jobRole ? ' · ' + p.jobRole : ''}`}
                >
                  <div
                    className={`w-full ${color} rounded-t transition-all group-hover:opacity-80 group-hover:-translate-y-0.5`}
                    style={{ height: `${Math.max(4, p.analysisScore * 0.5)}px` }}
                    aria-label={`${p.analysisScore}점 — 클릭해서 답변 보기`}
                  />
                </button>
              );
            })
          : weeklyPoints.map((w) => {
              const color =
                w.avgScore >= 80
                  ? 'bg-emerald-500'
                  : w.avgScore >= 60
                    ? 'bg-sky-500'
                    : w.avgScore >= 40
                      ? 'bg-amber-500'
                      : 'bg-rose-500';
              return (
                <button
                  key={w.week}
                  type="button"
                  onClick={() => openDetail(w.id)}
                  className="flex-1 min-w-[14px] flex flex-col items-center group cursor-pointer"
                  title={`${w.week} 주차 평균 ${w.avgScore}점 · ${w.count}개 답변`}
                >
                  <div
                    className={`w-full ${color} rounded-t transition-all group-hover:opacity-80 group-hover:-translate-y-0.5`}
                    style={{ height: `${Math.max(4, w.avgScore * 0.5)}px` }}
                    aria-label={`${w.week} 평균 ${w.avgScore}점`}
                  />
                  <span className="text-[8px] text-slate-400 mt-0.5 tabular-nums">
                    {w.week.slice(-3)}
                  </span>
                </button>
              );
            })}
      </div>

      <RadixDialog.Root open={!!detail} onOpenChange={(o) => !o && setDetail(null)}>
        <RadixDialog.Portal>
          <RadixDialog.Overlay className="fixed inset-0 z-[100] bg-black/40 animate-fade-in" />
          <RadixDialog.Content
            aria-label="면접 답변 상세"
            className="fixed z-[101] left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[calc(100%-2rem)] max-w-2xl max-h-[90dvh] overflow-y-auto bg-white dark:bg-neutral-800 rounded-2xl shadow-2xl p-6 focus:outline-none"
          >
            {detail && (
              <div className="space-y-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <RadixDialog.Title className="text-base font-bold text-slate-900 dark:text-slate-100">
                      {detail.question}
                    </RadixDialog.Title>
                    <RadixDialog.Description className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                      {new Date(detail.createdAt).toLocaleString('ko-KR')}
                      {detail.jobRole && ` · ${detail.jobRole}`}
                    </RadixDialog.Description>
                  </div>
                  <span className="text-2xl font-bold tabular-nums text-blue-600 dark:text-blue-400 shrink-0">
                    {detail.analysisScore}
                    <span className="text-xs font-normal text-slate-500 ml-0.5">/100</span>
                  </span>
                </div>
                <div className="bg-slate-50 dark:bg-slate-900 rounded-lg p-3">
                  <p className="text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-1">
                    내 답변
                  </p>
                  <p className="text-sm text-slate-700 dark:text-slate-300 whitespace-pre-wrap leading-relaxed">
                    {detail.answer}
                  </p>
                </div>
                {detail.analysis && (
                  <>
                    {detail.analysis.strengths.length > 0 && (
                      <div>
                        <p className="text-[11px] font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400 mb-1">
                          강점
                        </p>
                        <ul className="text-sm text-slate-700 dark:text-slate-300 space-y-1">
                          {detail.analysis.strengths.map((s, i) => (
                            <li key={i}>✓ {s}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                    {detail.analysis.improvements.length > 0 && (
                      <div>
                        <p className="text-[11px] font-bold uppercase tracking-wider text-sky-600 dark:text-sky-400 mb-1">
                          개선 행동
                        </p>
                        <ul className="text-sm text-slate-700 dark:text-slate-300 space-y-1">
                          {detail.analysis.improvements.map((s, i) => (
                            <li key={i}>→ {s}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                    {detail.analysis.rewrittenAnswer && (
                      <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-3 border border-blue-200 dark:border-blue-800/40">
                        <p className="text-[11px] font-bold uppercase tracking-wider text-blue-700 dark:text-blue-400 mb-1">
                          리라이트 답변
                        </p>
                        <p className="text-sm text-blue-800 dark:text-blue-200 whitespace-pre-wrap leading-relaxed">
                          {detail.analysis.rewrittenAnswer}
                        </p>
                      </div>
                    )}
                  </>
                )}
                <RadixDialog.Close asChild>
                  <button className="w-full py-2 text-sm rounded-lg bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-600">
                    닫기
                  </button>
                </RadixDialog.Close>
              </div>
            )}
            {detailLoading && !detail && (
              <p className="text-sm text-slate-500 text-center py-8">불러오는 중...</p>
            )}
          </RadixDialog.Content>
        </RadixDialog.Portal>
      </RadixDialog.Root>
    </section>
  );
}
