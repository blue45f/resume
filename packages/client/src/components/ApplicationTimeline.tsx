import { useMemo, useState } from 'react';

interface Props {
  applicationId: string;
  status: string;
  appliedDate?: string;
  createdAt: string;
  updatedAt: string;
}

const STAGES = [
  {
    key: 'applied',
    label: '지원완료',
    color: 'bg-blue-500',
    lightColor: 'bg-blue-100 dark:bg-blue-900/30',
    textColor: 'text-blue-600 dark:text-blue-400',
    avgDays: 0,
  },
  {
    key: 'screening',
    label: '서류심사',
    color: 'bg-sky-500',
    lightColor: 'bg-sky-100 dark:bg-sky-900/30',
    textColor: 'text-sky-600 dark:text-sky-400',
    avgDays: 7,
  },
  {
    key: 'interview',
    label: '면접',
    color: 'bg-amber-500',
    lightColor: 'bg-amber-100 dark:bg-amber-900/30',
    textColor: 'text-amber-600 dark:text-amber-400',
    avgDays: 14,
  },
  {
    key: 'offer',
    label: '최종합격',
    color: 'bg-green-500',
    lightColor: 'bg-green-100 dark:bg-green-900/30',
    textColor: 'text-green-600 dark:text-green-400',
    avgDays: 7,
  },
];

const TERMINAL_STAGES: Record<
  string,
  { label: string; color: string; lightColor: string; textColor: string }
> = {
  rejected: {
    label: '불합격',
    color: 'bg-red-500',
    lightColor: 'bg-red-100 dark:bg-red-900/30',
    textColor: 'text-red-600 dark:text-red-400',
  },
  withdrawn: {
    label: '취소',
    color: 'bg-slate-400',
    lightColor: 'bg-slate-100 dark:bg-slate-700',
    textColor: 'text-slate-500 dark:text-slate-400',
  },
};

interface TimelineEntry {
  key: string;
  label: string;
  date: string | null;
  daysInStage: number | null;
  isActive: boolean;
  isCurrent: boolean;
  isTerminal: boolean;
  color: string;
  lightColor: string;
  textColor: string;
}

function getStorageKey(appId: string) {
  return `app_timeline_${appId}`;
}

function loadTimelineHistory(appId: string): Record<string, string> {
  try {
    const raw = localStorage.getItem(getStorageKey(appId));
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

function saveTimelineHistory(appId: string, history: Record<string, string>) {
  localStorage.setItem(getStorageKey(appId), JSON.stringify(history));
}

export default function ApplicationTimeline({
  applicationId,
  status,
  appliedDate,
  createdAt,
  updatedAt,
}: Props) {
  const [expanded, setExpanded] = useState(false);

  const timeline = useMemo(() => {
    // Load persisted stage dates
    const history = loadTimelineHistory(applicationId);
    const startDate = appliedDate || createdAt;
    const stageOrder = STAGES.map((s) => s.key);
    const currentIdx = stageOrder.indexOf(status);
    const isTerminal = status === 'rejected' || status === 'withdrawn';

    // Ensure current status date is recorded
    if (!history[status]) {
      history[status] = updatedAt;
      if (!history['applied']) history['applied'] = startDate;
      saveTimelineHistory(applicationId, history);
    }

    const entries: TimelineEntry[] = STAGES.map((stage, i) => {
      const isActive = isTerminal ? i <= Math.max(0, currentIdx) : i <= currentIdx;
      const isCurrent = !isTerminal && stage.key === status;
      const date = history[stage.key] || null;

      let daysInStage: number | null = null;
      if (date && i > 0) {
        const prevStage = STAGES[i - 1];
        const prevDate = history[prevStage.key];
        if (prevDate) {
          daysInStage = Math.max(
            0,
            Math.round((new Date(date).getTime() - new Date(prevDate).getTime()) / 86400000),
          );
        }
      }

      // If current stage, calculate days since entering
      if (isCurrent) {
        const entryDate = date || updatedAt;
        daysInStage = Math.max(
          0,
          Math.round((Date.now() - new Date(entryDate).getTime()) / 86400000),
        );
      }

      return {
        key: stage.key,
        label: stage.label,
        date,
        daysInStage,
        isActive,
        isCurrent,
        isTerminal: false,
        color: stage.color,
        lightColor: stage.lightColor,
        textColor: stage.textColor,
      };
    });

    // Add terminal stage if applicable
    if (isTerminal) {
      const terminal = TERMINAL_STAGES[status];
      entries.push({
        key: status,
        label: terminal.label,
        date: history[status] || updatedAt,
        daysInStage: null,
        isActive: true,
        isCurrent: true,
        isTerminal: true,
        color: terminal.color,
        lightColor: terminal.lightColor,
        textColor: terminal.textColor,
      });
    }

    return entries;
  }, [applicationId, status, appliedDate, createdAt, updatedAt]);

  // Calculate total days
  const totalDays = useMemo(() => {
    const start = new Date(appliedDate || createdAt).getTime();
    return Math.max(0, Math.round((Date.now() - start) / 86400000));
  }, [appliedDate, createdAt]);

  // Determine expected next step
  const nextStep = useMemo(() => {
    const stageOrder = STAGES.map((s) => s.key);
    const idx = stageOrder.indexOf(status);
    if (status === 'rejected' || status === 'withdrawn' || status === 'offer') return null;
    if (idx < stageOrder.length - 1) {
      const next = STAGES[idx + 1];
      return { label: next.label, avgDays: next.avgDays };
    }
    return null;
  }, [status]);

  // Progress percentage for the bar
  const progressPct = useMemo(() => {
    const stageOrder = STAGES.map((s) => s.key);
    const idx = stageOrder.indexOf(status);
    if (status === 'offer') return 100;
    if (status === 'rejected' || status === 'withdrawn') {
      return Math.max(10, ((idx + 1) / stageOrder.length) * 100);
    }
    return Math.max(5, ((idx + 0.5) / stageOrder.length) * 100);
  }, [status]);

  // Bar color based on terminal status
  const barColor =
    status === 'rejected'
      ? 'bg-gradient-to-r from-blue-500 via-sky-500 to-red-500'
      : status === 'withdrawn'
        ? 'bg-gradient-to-r from-blue-500 to-slate-400'
        : status === 'offer'
          ? 'bg-gradient-to-r from-blue-500 via-sky-500 via-amber-500 to-green-500'
          : 'bg-gradient-to-r from-blue-500 via-sky-500 to-amber-500';

  return (
    <div className="mt-3">
      {/* Compact progress bar (always visible) */}
      <div className="flex items-center gap-2 mb-1">
        <div className="flex-1 h-1.5 bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden">
          <div
            className={`h-full rounded-full transition-all duration-500 ${barColor}`}
            style={{ width: `${progressPct}%` }}
          />
        </div>
        <button
          onClick={() => setExpanded(!expanded)}
          className="text-xs text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors shrink-0"
        >
          {totalDays}일 경과
          <svg
            className={`w-3 h-3 inline ml-0.5 transition-transform ${expanded ? 'rotate-180' : ''}`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </button>
      </div>

      {expanded && (
        <div className="mt-2 animate-fade-in bg-slate-50 dark:bg-slate-900/50 rounded-lg p-3">
          {/* Timeline nodes */}
          <div className="relative">
            {timeline.map((entry, i) => (
              <div key={entry.key} className="flex items-start gap-3 pb-3 last:pb-0">
                {/* Vertical line + dot */}
                <div className="flex flex-col items-center">
                  <div
                    className={`w-3 h-3 rounded-full border-2 shrink-0 ${
                      entry.isCurrent
                        ? `${entry.color} border-white dark:border-slate-900 ring-2 ring-offset-1 ring-offset-slate-50 dark:ring-offset-slate-900 ${entry.color.replace('bg-', 'ring-')}`
                        : entry.isActive
                          ? `${entry.color} border-white dark:border-slate-900`
                          : 'bg-slate-200 dark:bg-slate-600 border-slate-100 dark:border-slate-800'
                    }`}
                  />
                  {i < timeline.length - 1 && (
                    <div
                      className={`w-0.5 flex-1 min-h-[20px] ${
                        entry.isActive && timeline[i + 1]?.isActive
                          ? entry.color.replace('bg-', 'bg-').replace('500', '300')
                          : 'bg-slate-200 dark:bg-slate-700'
                      }`}
                    />
                  )}
                </div>

                {/* Content */}
                <div className={`flex-1 -mt-0.5 ${entry.isCurrent ? '' : 'opacity-75'}`}>
                  <div className="flex items-center gap-2">
                    <span
                      className={`text-xs font-semibold ${entry.isActive ? entry.textColor : 'text-slate-400'}`}
                    >
                      {entry.label}
                    </span>
                    {entry.isCurrent && !entry.isTerminal && (
                      <span
                        className={`px-1.5 py-0.5 text-xs rounded-full ${entry.lightColor} ${entry.textColor} font-medium animate-pulse`}
                      >
                        현재
                      </span>
                    )}
                    {entry.isTerminal && (
                      <span
                        className={`px-1.5 py-0.5 text-xs rounded-full ${entry.lightColor} ${entry.textColor} font-medium`}
                      >
                        종료
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-2 mt-0.5">
                    {entry.date && (
                      <span className="text-xs text-slate-400">
                        {new Date(entry.date).toLocaleDateString('ko-KR', {
                          month: 'short',
                          day: 'numeric',
                        })}
                      </span>
                    )}
                    {entry.daysInStage !== null && entry.daysInStage > 0 && (
                      <span className="text-xs text-slate-400">({entry.daysInStage}일)</span>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Next step indicator */}
          {nextStep && (
            <div className="mt-2 pt-2 border-t border-dashed border-slate-200 dark:border-slate-700">
              <div className="flex items-center gap-2">
                <svg
                  className="w-3.5 h-3.5 text-slate-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M13 7l5 5m0 0l-5 5m5-5H6"
                  />
                </svg>
                <span className="text-xs text-slate-500 dark:text-slate-400">
                  다음 단계:{' '}
                  <span className="font-medium text-slate-700 dark:text-slate-300">
                    {nextStep.label}
                  </span>
                  {nextStep.avgDays > 0 && (
                    <span className="ml-1 text-slate-400">(평균 {nextStep.avgDays}일 소요)</span>
                  )}
                </span>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
