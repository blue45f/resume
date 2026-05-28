import { useCallback, useEffect, useMemo, useState } from 'react';
import type { JobApplication } from '@/lib/api';
import {
  buildApplicationStreakReport,
  readApplicationTarget,
  writeApplicationTarget,
} from '@/lib/applicationStreakTracker';

interface Props {
  applications?: JobApplication[];
}

const MIN_TARGET = 1;
const MAX_TARGET = 20;

function formatMonthDay(weekStart: string): string {
  const date = new Date(`${weekStart}T00:00:00Z`);
  if (Number.isNaN(date.getTime())) return weekStart;
  const month = date.getUTCMonth() + 1;
  const day = date.getUTCDate();
  return `${month}/${day}`;
}

export default function ApplicationStreakStrip({ applications = [] }: Props) {
  const [target, setTarget] = useState<number>(() => readApplicationTarget());
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState<string>(String(target));

  useEffect(() => {
    setDraft(String(target));
  }, [target]);

  const report = useMemo(
    () => buildApplicationStreakReport(applications, { target }),
    [applications, target],
  );

  const commitDraft = useCallback(() => {
    const parsed = Number(draft);
    if (!Number.isFinite(parsed)) {
      setDraft(String(target));
      setEditing(false);
      return;
    }
    const saved = writeApplicationTarget(parsed);
    setTarget(saved);
    setDraft(String(saved));
    setEditing(false);
  }, [draft, target]);

  if (applications.length === 0 && report.currentStreak === 0) return null;

  const max = report.weeks.reduce((acc, w) => Math.max(acc, w.count), target);

  return (
    <section className={`streak-strip streak-strip--${report.tone}`} aria-label="주간 지원 페이스">
      <header className="streak-strip__head">
        <div className="streak-strip__lead">
          <span className="streak-strip__eyebrow">Weekly streak</span>
          <p className="streak-strip__title">{report.label}</p>
          <p className="streak-strip__summary">{report.summary}</p>
        </div>
        <div className="streak-strip__target">
          <label className="streak-strip__target-label" htmlFor="streak-target">
            주간 목표
          </label>
          {editing ? (
            <input
              id="streak-target"
              type="number"
              min={MIN_TARGET}
              max={MAX_TARGET}
              value={draft}
              autoFocus
              onChange={(e) => setDraft(e.target.value)}
              onBlur={commitDraft}
              onKeyDown={(e) => {
                if (e.key === 'Enter') commitDraft();
                if (e.key === 'Escape') {
                  setDraft(String(target));
                  setEditing(false);
                }
              }}
              className="streak-strip__target-input"
              aria-label="주간 지원 목표"
            />
          ) : (
            <button
              type="button"
              onClick={() => setEditing(true)}
              className="streak-strip__target-button"
              aria-label={`주간 목표 ${target}건 수정`}
            >
              <strong>{target}</strong>
              <span>건</span>
            </button>
          )}
        </div>
      </header>

      <div className="streak-strip__metrics">
        <div className="streak-strip__metric">
          <span className="streak-strip__metric-label">이번 주</span>
          <span className="streak-strip__metric-value">
            {report.thisWeekCount}
            <small> / {report.target}</small>
          </span>
        </div>
        <div className="streak-strip__metric">
          <span className="streak-strip__metric-label">연속</span>
          <span className="streak-strip__metric-value">
            {report.currentStreak}
            <small>주</small>
          </span>
        </div>
        <div className="streak-strip__metric">
          <span className="streak-strip__metric-label">최고 연속</span>
          <span className="streak-strip__metric-value">
            {report.bestStreak}
            <small>주</small>
          </span>
        </div>
        <div className="streak-strip__metric">
          <span className="streak-strip__metric-label">최고 주간</span>
          <span className="streak-strip__metric-value">
            {report.bestWeek?.count ?? 0}
            <small>건</small>
          </span>
        </div>
      </div>

      <div className="streak-strip__chart" aria-hidden="true">
        {report.weeks.map((week) => {
          const fill = max > 0 ? week.count / max : 0;
          return (
            <div
              key={week.weekStart}
              className={`streak-strip__bar${week.metTarget ? ' streak-strip__bar--met' : ''}`}
              title={`${formatMonthDay(week.weekStart)} · ${week.count}건`}
            >
              <span
                className="streak-strip__bar-fill"
                style={{ ['--streak-bar-fill' as string]: `${fill}` }}
              />
              <span className="streak-strip__bar-label">{formatMonthDay(week.weekStart)}</span>
            </div>
          );
        })}
      </div>
    </section>
  );
}
