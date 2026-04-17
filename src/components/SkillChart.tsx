import { memo, useEffect, useState, type ReactElement } from 'react';
import type { Resume } from '@/types/resume';

interface Props {
  resume: Resume;
}

interface SkillData {
  category: string;
  count: number;
  items: string[];
}

/** Proficiency labels by item count ratio */
const PROFICIENCY_LABELS = ['입문', '초급', '중급', '고급', '전문가'] as const;
const PROFICIENCY_COLORS = [
  'text-slate-400 bg-slate-100 dark:bg-slate-700',
  'text-blue-500 bg-blue-50 dark:bg-blue-900/30',
  'text-green-500 bg-green-50 dark:bg-green-900/30',
  'text-amber-500 bg-amber-50 dark:bg-amber-900/30',
  'text-purple-500 bg-purple-50 dark:bg-purple-900/30',
] as const;
const PROFICIENCY_BAR_COLORS = [
  'from-slate-300 to-slate-400',
  'from-blue-400 to-blue-500',
  'from-green-400 to-emerald-500',
  'from-amber-400 to-orange-500',
  'from-purple-500 to-pink-500',
] as const;

function getProficiencyIndex(count: number, maxCount: number): number {
  const ratio = count / maxCount;
  if (ratio <= 0.2) return 0;
  if (ratio <= 0.4) return 1;
  if (ratio <= 0.6) return 2;
  if (ratio <= 0.8) return 3;
  return 4;
}

/** SVG Radar/Spider chart using CSS-based SVG */
function RadarChart({ data, maxCount }: { data: SkillData[]; maxCount: number }) {
  const [animatedScale, setAnimatedScale] = useState(0);
  const n = data.length;

  useEffect(() => {
    const timer = setTimeout(() => setAnimatedScale(1), 100);
    return () => clearTimeout(timer);
  }, []);

  if (n < 3) return null; // Need at least 3 categories for a radar

  const cx = 120;
  const cy = 120;
  const maxR = 90;
  const levels = 5;
  const angleStep = (2 * Math.PI) / n;

  // Grid circles
  const gridLines: ReactElement[] = [];
  for (let lv = 1; lv <= levels; lv++) {
    const r = (lv / levels) * maxR;
    const points = Array.from({ length: n }, (_, i) => {
      const angle = i * angleStep - Math.PI / 2;
      return `${cx + r * Math.cos(angle)},${cy + r * Math.sin(angle)}`;
    }).join(' ');
    gridLines.push(
      <polygon
        key={`grid-${lv}`}
        points={points}
        fill="none"
        stroke="currentColor"
        strokeWidth={0.5}
        className="text-slate-200 dark:text-slate-600"
      />
    );
  }

  // Axis lines
  const axisLines = data.map((_, i) => {
    const angle = i * angleStep - Math.PI / 2;
    const x2 = cx + maxR * Math.cos(angle);
    const y2 = cy + maxR * Math.sin(angle);
    return (
      <line
        key={`axis-${i}`}
        x1={cx} y1={cy} x2={x2} y2={y2}
        stroke="currentColor" strokeWidth={0.5}
        className="text-slate-200 dark:text-slate-600"
      />
    );
  });

  // Data polygon
  const dataPoints = data.map((d, i) => {
    const ratio = Math.min(d.count / maxCount, 1) * animatedScale;
    const r = ratio * maxR;
    const angle = i * angleStep - Math.PI / 2;
    return `${cx + r * Math.cos(angle)},${cy + r * Math.sin(angle)}`;
  }).join(' ');

  // Labels
  const labels = data.map((d, i) => {
    const angle = i * angleStep - Math.PI / 2;
    const labelR = maxR + 18;
    const x = cx + labelR * Math.cos(angle);
    const y = cy + labelR * Math.sin(angle);
    return (
      <text
        key={`label-${i}`}
        x={x} y={y}
        textAnchor="middle"
        dominantBaseline="central"
        className="fill-slate-600 dark:fill-slate-400"
        fontSize={10}
        fontWeight={500}
      >
        {d.category.length > 8 ? d.category.slice(0, 8) + '..' : d.category}
      </text>
    );
  });

  // Data points (circles at vertices)
  const dots = data.map((d, i) => {
    const ratio = Math.min(d.count / maxCount, 1) * animatedScale;
    const r = ratio * maxR;
    const angle = i * angleStep - Math.PI / 2;
    const x = cx + r * Math.cos(angle);
    const y = cy + r * Math.sin(angle);
    return (
      <circle
        key={`dot-${i}`}
        cx={x} cy={y} r={3}
        className="fill-blue-500 dark:fill-blue-400"
        style={{ transition: 'cx 0.8s ease-out, cy 0.8s ease-out' }}
      />
    );
  });

  return (
    <div className="flex justify-center">
      <svg width={240} height={240} viewBox="0 0 240 240" className="overflow-visible">
        {gridLines}
        {axisLines}
        <polygon
          points={dataPoints}
          fill="rgba(59,130,246,0.15)"
          stroke="rgb(59,130,246)"
          strokeWidth={2}
          className="dark:stroke-blue-400"
          style={{ transition: 'all 0.8s ease-out' }}
        />
        {dots}
        {labels}
      </svg>
    </div>
  );
}

/** Animated skill bar */
function SkillBar({ d, maxCount, delay }: { d: SkillData; maxCount: number; delay: number }) {
  const [animatedWidth, setAnimatedWidth] = useState(0);
  const profIdx = getProficiencyIndex(d.count, maxCount);
  const profLabel = PROFICIENCY_LABELS[profIdx];
  const profColor = PROFICIENCY_COLORS[profIdx];
  const barColor = PROFICIENCY_BAR_COLORS[profIdx];

  useEffect(() => {
    const timer = setTimeout(() => setAnimatedWidth((d.count / maxCount) * 100), 100 + delay);
    return () => clearTimeout(timer);
  }, [d.count, maxCount, delay]);

  return (
    <div>
      <div className="flex items-center justify-between mb-1">
        <span className="text-xs font-medium text-slate-700 dark:text-slate-300">{d.category}</span>
        <div className="flex items-center gap-2">
          <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-full ${profColor}`}>
            {profLabel}
          </span>
          <span className="text-xs text-slate-400 dark:text-slate-500 tabular-nums">{d.count}개</span>
        </div>
      </div>
      <div className="bg-slate-100 dark:bg-slate-700 rounded-full h-2.5 overflow-hidden">
        <div
          className={`h-2.5 rounded-full bg-gradient-to-r ${barColor} transition-all duration-700 ease-out`}
          style={{ width: `${animatedWidth}%` }}
        />
      </div>
    </div>
  );
}

/** Collapsible category section showing individual items */
function CategorySection({ d, maxCount }: { d: SkillData; maxCount: number }) {
  const [open, setOpen] = useState(false);
  const profIdx = getProficiencyIndex(d.count, maxCount);
  const barColor = PROFICIENCY_BAR_COLORS[profIdx];

  return (
    <div className="border border-slate-100 dark:border-slate-700 rounded-lg overflow-hidden">
      <button
        type="button"
        onClick={() => setOpen(v => !v)}
        className="w-full flex items-center justify-between px-3 py-2 text-left hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors"
      >
        <div className="flex items-center gap-2">
          <div className={`w-2 h-2 rounded-full bg-gradient-to-r ${barColor}`} />
          <span className="text-xs font-medium text-slate-700 dark:text-slate-300">{d.category}</span>
          <span className="text-[10px] text-slate-400 dark:text-slate-500">{d.count}개</span>
        </div>
        <svg
          className={`w-3.5 h-3.5 text-slate-400 transition-transform duration-200 ${open ? 'rotate-180' : ''}`}
          fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
        </svg>
      </button>
      {open && (
        <div className="px-3 pb-3 pt-1 flex flex-wrap gap-1.5">
          {d.items.map((item) => (
            <span
              key={item}
              className="px-2 py-1 text-[11px] font-medium rounded-md bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300"
            >
              {item}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}

function SkillChart({ resume }: Props) {
  const [viewMode, setViewMode] = useState<'bar' | 'radar'>('bar');
  const skills = resume.skills;
  if (skills.length === 0) return null;

  const data: SkillData[] = skills.map(s => ({
    category: s.category,
    count: s.items.split(',').map(i => i.trim()).filter(Boolean).length,
    items: s.items.split(',').map(i => i.trim()).filter(Boolean),
  }));

  const maxCount = Math.max(...data.map(d => d.count), 1);

  return (
    <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-4 no-print">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <svg className="w-5 h-5 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 3v11.25A2.25 2.25 0 006 16.5h2.25M3.75 3h-1.5m1.5 0h16.5m0 0h1.5m-1.5 0v11.25A2.25 2.25 0 0118 16.5h-2.25m-7.5 0h7.5m-7.5 0l-1 3m8.5-3l1 3m0 0l.5 1.5m-.5-1.5h-9.5m0 0l-.5 1.5" />
          </svg>
          <h3 className="text-sm font-semibold text-slate-800 dark:text-slate-200">기술 분포</h3>
        </div>
        {/* View toggle */}
        {data.length >= 3 && (
          <div className="flex items-center bg-slate-100 dark:bg-slate-700 rounded-lg p-0.5">
            <button
              onClick={() => setViewMode('bar')}
              className={`px-2.5 py-1 text-[11px] font-medium rounded-md transition-colors ${
                viewMode === 'bar'
                  ? 'bg-white dark:bg-slate-600 text-slate-800 dark:text-slate-200 shadow-sm'
                  : 'text-slate-500 dark:text-slate-400 hover:text-slate-700'
              }`}
            >
              바
            </button>
            <button
              onClick={() => setViewMode('radar')}
              className={`px-2.5 py-1 text-[11px] font-medium rounded-md transition-colors ${
                viewMode === 'radar'
                  ? 'bg-white dark:bg-slate-600 text-slate-800 dark:text-slate-200 shadow-sm'
                  : 'text-slate-500 dark:text-slate-400 hover:text-slate-700'
              }`}
            >
              레이더
            </button>
          </div>
        )}
      </div>

      {/* Radar chart */}
      {viewMode === 'radar' && data.length >= 3 && (
        <div className="mb-4">
          <RadarChart data={data} maxCount={maxCount} />
        </div>
      )}

      {/* Bar chart with proficiency labels */}
      {viewMode === 'bar' && (
        <div className="space-y-3 mb-4">
          {data.map((d, idx) => (
            <SkillBar key={d.category} d={d} maxCount={maxCount} delay={idx * 80} />
          ))}
        </div>
      )}

      {/* Proficiency legend */}
      <div className="flex flex-wrap items-center gap-2 mb-4 px-1">
        <span className="text-[10px] text-slate-400 dark:text-slate-500">숙련도:</span>
        {PROFICIENCY_LABELS.map((label, idx) => (
          <span
            key={label}
            className={`text-[10px] font-medium px-1.5 py-0.5 rounded-full ${PROFICIENCY_COLORS[idx]}`}
          >
            {label}
          </span>
        ))}
      </div>

      {/* Collapsible category sections */}
      <div className="space-y-1.5">
        {data.map(d => (
          <CategorySection key={d.category} d={d} maxCount={maxCount} />
        ))}
      </div>
    </div>
  );
}

export default memo(SkillChart);
