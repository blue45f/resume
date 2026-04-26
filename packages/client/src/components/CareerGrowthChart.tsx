import { useMemo, useState } from 'react';
import type { Resume } from '@/types/resume';

interface Props {
  resume: Resume;
}

interface YearData {
  year: number;
  experienceYears: number;
  skills: number;
  projects: number;
  companies: number;
  certifications: number;
}

/**
 * CareerGrowthChart — 이력서 데이터를 연도 축으로 누적해 자기 성장 궤적 시각화.
 * 경력 시작 ~ 현재까지 매년 기준: 누적 경력 연수 / 당해 사용 기술 / 진행 프로젝트 /
 * 소속 회사 / 보유 자격증.
 *
 * 순수 SVG — 외부 차트 라이브러리 없음.
 */
export default function CareerGrowthChart({ resume }: Props) {
  const [expanded, setExpanded] = useState(false);
  const [metric, setMetric] = useState<keyof Omit<YearData, 'year'>>('experienceYears');

  const data = useMemo(() => buildYearlyData(resume), [resume]);
  const thisYear = new Date().getFullYear();

  if (data.length === 0) return null;

  const maxValue = Math.max(1, ...data.map((d) => d[metric]));
  const width = 560;
  const height = 180;
  const pad = { top: 20, right: 20, bottom: 28, left: 36 };
  const plotW = width - pad.left - pad.right;
  const plotH = height - pad.top - pad.bottom;
  const stepX = data.length > 1 ? plotW / (data.length - 1) : 0;

  const points = data.map((d, i) => ({
    x: pad.left + i * stepX,
    y: pad.top + plotH - (d[metric] / maxValue) * plotH,
    value: d[metric],
    year: d.year,
  }));

  const linePath = points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ');
  const areaPath = `${linePath} L ${points[points.length - 1].x} ${pad.top + plotH} L ${points[0].x} ${pad.top + plotH} Z`;

  const METRICS: Array<{ key: keyof Omit<YearData, 'year'>; label: string; icon: string }> = [
    { key: 'experienceYears', label: '누적 경력', icon: '📈' },
    { key: 'skills', label: '기술 스택', icon: '⚡' },
    { key: 'projects', label: '프로젝트', icon: '🚀' },
    { key: 'companies', label: '조직 수', icon: '🏢' },
    { key: 'certifications', label: '자격증', icon: '🎖️' },
  ];

  return (
    <div className="imp-card bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-4 no-print">
      <button
        onClick={() => setExpanded((v) => !v)}
        className="w-full flex items-center justify-between focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-accent)] focus-visible:ring-offset-2 rounded-[var(--radius-sm)]"
        aria-expanded={expanded}
      >
        <div className="flex items-center gap-2 min-w-0">
          <span aria-hidden="true" className="text-base">
            📊
          </span>
          <h3 className="text-sm font-semibold text-slate-800 dark:text-slate-200 shrink-0">
            커리어 성장 차트
          </h3>
          <span className="text-[11px] text-slate-500 dark:text-slate-400 truncate">
            {data[0].year}년 → {thisYear}년 · {data.length}년간 궤적
          </span>
        </div>
        <svg
          className={`w-4 h-4 text-slate-400 transition-transform shrink-0 ${expanded ? 'rotate-180' : ''}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
          aria-hidden="true"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {expanded && (
        <div className="mt-4 space-y-3 animate-in fade-in-0 duration-200">
          {/* 메트릭 선택 */}
          <div className="flex flex-wrap gap-2">
            {METRICS.map((m) => (
              <button
                key={m.key}
                onClick={() => setMetric(m.key)}
                className={`px-2.5 py-1 text-[11px] rounded-full border transition-all ${
                  metric === m.key
                    ? 'bg-blue-600 text-white border-blue-600 shadow-sm'
                    : 'bg-white dark:bg-slate-700 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-600 hover:border-blue-300'
                }`}
              >
                <span className="mr-1" aria-hidden="true">
                  {m.icon}
                </span>
                {m.label}
              </button>
            ))}
          </div>

          {/* 차트 */}
          <div className="bg-slate-50 dark:bg-slate-900/30 rounded-lg p-3 border border-slate-100 dark:border-slate-700 overflow-x-auto">
            <svg
              viewBox={`0 0 ${width} ${height}`}
              width="100%"
              preserveAspectRatio="xMidYMid meet"
              className="max-w-full"
              role="img"
              aria-label={`${METRICS.find((m) => m.key === metric)?.label} 연도별 차트`}
            >
              {/* 격자 */}
              {[0, 0.25, 0.5, 0.75, 1].map((ratio, i) => (
                <line
                  key={i}
                  x1={pad.left}
                  x2={pad.left + plotW}
                  y1={pad.top + plotH * (1 - ratio)}
                  y2={pad.top + plotH * (1 - ratio)}
                  stroke="currentColor"
                  strokeOpacity="0.08"
                  className="text-slate-500"
                />
              ))}

              {/* 면적 */}
              <defs>
                <linearGradient id="growth-area" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0" stopColor="#3b82f6" stopOpacity="0.35" />
                  <stop offset="1" stopColor="#3b82f6" stopOpacity="0" />
                </linearGradient>
              </defs>
              <path d={areaPath} fill="url(#growth-area)" />

              {/* 라인 */}
              <path
                d={linePath}
                fill="none"
                stroke="#2563eb"
                strokeWidth={2.5}
                strokeLinecap="round"
                strokeLinejoin="round"
              />

              {/* 포인트 */}
              {points.map((p, i) => (
                <g key={i}>
                  <circle
                    cx={p.x}
                    cy={p.y}
                    r={4}
                    fill="#ffffff"
                    stroke="#2563eb"
                    strokeWidth={2}
                    className="drop-shadow-sm"
                  />
                  {/* 값 라벨 */}
                  <text
                    x={p.x}
                    y={p.y - 8}
                    textAnchor="middle"
                    fontSize="10"
                    fill="#1e293b"
                    className="font-semibold"
                  >
                    {typeof p.value === 'number' && !Number.isInteger(p.value)
                      ? p.value.toFixed(1)
                      : p.value}
                  </text>
                  {/* X축 연도 */}
                  <text
                    x={p.x}
                    y={pad.top + plotH + 18}
                    textAnchor="middle"
                    fontSize="10"
                    fill="#64748b"
                  >
                    {String(p.year).slice(-2)}
                  </text>
                </g>
              ))}

              {/* Y축 max 라벨 */}
              <text x={pad.left - 8} y={pad.top + 4} textAnchor="end" fontSize="9" fill="#94a3b8">
                {typeof maxValue === 'number' && !Number.isInteger(maxValue)
                  ? maxValue.toFixed(1)
                  : maxValue}
              </text>
              <text
                x={pad.left - 8}
                y={pad.top + plotH + 4}
                textAnchor="end"
                fontSize="9"
                fill="#94a3b8"
              >
                0
              </text>
            </svg>
          </div>

          {/* 요약 통계 */}
          <div className="stagger-children grid grid-cols-2 sm:grid-cols-4 gap-2 text-center">
            {[
              {
                label: '시작',
                value: `${data[0].year}년`,
              },
              {
                label: '활동',
                value: `${data.length}년`,
              },
              {
                label: '최고점',
                value: `${maxValue}${metric === 'experienceYears' ? '년' : metric === 'skills' ? '개' : metric === 'projects' ? '개' : metric === 'companies' ? '곳' : '개'}`,
              },
              {
                label: '최근',
                value: `${data[data.length - 1][metric]}`,
              },
            ].map((s) => (
              <div
                key={s.label}
                className="rounded-lg bg-slate-50 dark:bg-slate-700/30 border border-slate-100 dark:border-slate-700 py-2"
              >
                <div className="text-[10px] text-slate-500 dark:text-slate-400">{s.label}</div>
                <div className="text-sm font-bold text-slate-800 dark:text-slate-200 mt-0.5">
                  {s.value}
                </div>
              </div>
            ))}
          </div>

          <p className="text-[10px] text-slate-500 dark:text-slate-400">
            💡 이력서 데이터만으로 자동 계산 — 경력 시작 연도부터 현재까지 연도별 누적 수치.
            면접에서 "지난 5년간 이렇게 성장해왔습니다" 시각적 스토리텔링용.
          </p>
        </div>
      )}
    </div>
  );
}

function buildYearlyData(resume: Resume): YearData[] {
  // 1. 경력·프로젝트 시작 연도 수집
  const allYears: number[] = [];
  for (const e of resume.experiences) {
    const y = parseYear(e.startDate);
    if (y) allYears.push(y);
  }
  for (const p of resume.projects) {
    const y = parseYear(p.startDate);
    if (y) allYears.push(y);
  }
  for (const c of resume.certifications || []) {
    const y = parseYear(c.issueDate);
    if (y) allYears.push(y);
  }

  if (allYears.length === 0) return [];

  const startYear = Math.min(...allYears);
  const thisYear = new Date().getFullYear();
  const years = [];
  for (let y = startYear; y <= thisYear; y++) years.push(y);

  return years.map((year) => {
    // 누적 경력 연수 — 해당 연도 말 기준 합산 (병합)
    const intervals: Array<[number, number]> = [];
    for (const e of resume.experiences) {
      const s = parseYear(e.startDate);
      const end = e.current ? year : (parseYear(e.endDate) ?? s);
      if (!s) continue;
      if (s > year) continue;
      const eEnd = Math.min(end ?? s, year);
      intervals.push([s, eEnd]);
    }
    const experienceYears =
      Math.round((mergeIntervalsToYears(intervals) + Number.EPSILON) * 10) / 10;

    // 당해 이전(해당 연도 포함) 사용한 기술 (stacks 등장 시점 = 경력/프로젝트 startDate 기준)
    const skillSet = new Set<string>();
    for (const e of resume.experiences) {
      const s = parseYear(e.startDate);
      if (!s || s > year) continue;
      (e.techStack || '').split(',').forEach((t) => {
        const trimmed = t.trim();
        if (trimmed) skillSet.add(trimmed.toLowerCase());
      });
    }
    for (const p of resume.projects) {
      const s = parseYear(p.startDate);
      if (!s || s > year) continue;
      (p.techStack || '').split(',').forEach((t) => {
        const trimmed = t.trim();
        if (trimmed) skillSet.add(trimmed.toLowerCase());
      });
    }
    // 스킬 섹션은 "현재 기준"이므로 최근 해에만 합산
    if (year === thisYear) {
      for (const s of resume.skills) {
        s.items.split(',').forEach((t) => {
          const trimmed = t.trim();
          if (trimmed) skillSet.add(trimmed.toLowerCase());
        });
      }
    }

    const projects = resume.projects.filter((p) => {
      const s = parseYear(p.startDate);
      return s !== null && s <= year;
    }).length;

    const companies = new Set(
      resume.experiences
        .filter((e) => {
          const s = parseYear(e.startDate);
          return s !== null && s <= year;
        })
        .map((e) => e.company),
    ).size;

    const certifications = (resume.certifications || []).filter((c) => {
      const y = parseYear(c.issueDate);
      return y !== null && y <= year;
    }).length;

    return {
      year,
      experienceYears,
      skills: skillSet.size,
      projects,
      companies,
      certifications,
    };
  });
}

function parseYear(dateStr: string | undefined): number | null {
  if (!dateStr) return null;
  const y = parseInt(dateStr.slice(0, 4), 10);
  return Number.isFinite(y) && y > 1980 && y < 2100 ? y : null;
}

function mergeIntervalsToYears(intervals: Array<[number, number]>): number {
  if (intervals.length === 0) return 0;
  const sorted = [...intervals].sort((a, b) => a[0] - b[0]);
  const merged: Array<[number, number]> = [sorted[0]];
  for (let i = 1; i < sorted.length; i++) {
    const last = merged[merged.length - 1];
    const curr = sorted[i];
    if (curr[0] <= last[1]) {
      last[1] = Math.max(last[1], curr[1]);
    } else {
      merged.push(curr);
    }
  }
  return merged.reduce((sum, [s, e]) => sum + Math.max(0, e - s), 0);
}
