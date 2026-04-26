import { useEffect, useState } from 'react';
import { fetchInterviewScoreHistory, type InterviewScorePoint } from '@/lib/api';

/**
 * 면접 답변 점수 추세 mini-chart — 최근 30개 분석 결과를 가로 bar 로 시각화.
 * 점수 색상: ≥80 emerald · ≥60 sky · ≥40 amber · <40 rose.
 * 데이터 없으면 null 반환 (자리 차지 안 함).
 */
export default function InterviewScoreHistory() {
  const [points, setPoints] = useState<InterviewScorePoint[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchInterviewScoreHistory()
      .then((rows) => setPoints(rows.slice(-30)))
      .catch(() => setPoints([]))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return null;
  if (points.length === 0) return null;

  const avg = Math.round(points.reduce((a, p) => a + p.analysisScore, 0) / points.length);
  const latest = points[points.length - 1];
  const trend =
    points.length >= 2 ? latest.analysisScore - points[points.length - 2].analysisScore : 0;

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
        <span className="text-2xl font-bold tabular-nums text-slate-800 dark:text-slate-200">
          {latest.analysisScore}
          <span className="text-xs font-normal text-slate-500 dark:text-slate-400 ml-1">/100</span>
        </span>
      </div>
      <div className="flex items-end gap-1 h-14">
        {points.map((p) => {
          const color =
            p.analysisScore >= 80
              ? 'bg-emerald-500'
              : p.analysisScore >= 60
                ? 'bg-sky-500'
                : p.analysisScore >= 40
                  ? 'bg-amber-500'
                  : 'bg-rose-500';
          return (
            <div
              key={p.id}
              className="flex-1 min-w-[6px] flex flex-col items-center"
              title={`${p.analysisScore}점 · ${new Date(p.createdAt).toLocaleDateString('ko-KR')}${p.jobRole ? ' · ' + p.jobRole : ''}`}
            >
              <div
                className={`w-full ${color} rounded-t transition-colors`}
                style={{ height: `${Math.max(4, p.analysisScore * 0.5)}px` }}
                aria-label={`${p.analysisScore}점`}
              />
            </div>
          );
        })}
      </div>
    </section>
  );
}
