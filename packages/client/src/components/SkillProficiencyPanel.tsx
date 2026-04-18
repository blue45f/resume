import { useMemo, useState } from 'react';
import type { Resume } from '@/types/resume';
import { analyzeSkillProficiency, type ProficiencyLevel } from '@/lib/skillProficiency';

interface Props {
  resume: Resume;
}

const LEVEL_META: Record<
  ProficiencyLevel,
  { label: string; color: string; bar: string; chip: string }
> = {
  Expert: {
    label: '전문가',
    color: 'text-blue-700',
    bar: '#2563eb',
    chip: 'text-blue-700 bg-blue-50 border-blue-200 dark:bg-blue-900/20 dark:border-blue-800 dark:text-blue-400',
  },
  Advanced: {
    label: '숙련',
    color: 'text-green-700',
    bar: '#16a34a',
    chip: 'text-green-700 bg-green-50 border-green-200 dark:bg-green-900/20 dark:border-green-800 dark:text-green-400',
  },
  Intermediate: {
    label: '중급',
    color: 'text-amber-700',
    bar: '#d97706',
    chip: 'text-amber-700 bg-amber-50 border-amber-200 dark:bg-amber-900/20 dark:border-amber-800 dark:text-amber-400',
  },
  Novice: {
    label: '입문',
    color: 'text-slate-600',
    bar: '#94a3b8',
    chip: 'text-slate-700 bg-slate-50 border-slate-200 dark:bg-slate-800 dark:border-slate-700 dark:text-slate-300',
  },
};

/**
 * SkillProficiencyPanel — 이력서 분석으로 각 스킬의 숙련도를 자동 추정.
 * 경력 년수·프로젝트 사용·본문 언급을 종합해 Novice→Expert 4단계로 분류.
 */
export default function SkillProficiencyPanel({ resume }: Props) {
  const [expanded, setExpanded] = useState(false);
  const [filter, setFilter] = useState<ProficiencyLevel | 'all'>('all');

  const analysis = useMemo(() => analyzeSkillProficiency(resume), [resume]);

  const filtered = filter === 'all' ? analysis : analysis.filter((a) => a.level === filter);

  const levelCounts = useMemo(() => {
    const counts: Record<ProficiencyLevel, number> = {
      Expert: 0,
      Advanced: 0,
      Intermediate: 0,
      Novice: 0,
    };
    for (const a of analysis) counts[a.level]++;
    return counts;
  }, [analysis]);

  if (analysis.length === 0) return null;

  return (
    <div className="imp-card bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-4 no-print">
      <button
        onClick={() => setExpanded((v) => !v)}
        className="w-full flex items-center justify-between focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-accent)] focus-visible:ring-offset-2 rounded-[var(--radius-sm)]"
        aria-expanded={expanded}
      >
        <div className="flex items-center gap-2 min-w-0">
          <span aria-hidden="true" className="text-base">
            ⚡
          </span>
          <h3 className="text-sm font-semibold text-slate-800 dark:text-slate-200 shrink-0">
            스킬 숙련도 자동 추정
          </h3>
          <span className="text-xs text-slate-500 dark:text-slate-400 truncate">
            전문가 {levelCounts.Expert} · 숙련 {levelCounts.Advanced} · 중급{' '}
            {levelCounts.Intermediate}
            {levelCounts.Novice > 0 ? ` · 입문 ${levelCounts.Novice}` : ''}
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
          {/* 필터 */}
          <div className="flex flex-wrap gap-2">
            <FilterChip active={filter === 'all'} onClick={() => setFilter('all')}>
              전체 {analysis.length}
            </FilterChip>
            {(['Expert', 'Advanced', 'Intermediate', 'Novice'] as ProficiencyLevel[]).map((lvl) => (
              <FilterChip
                key={lvl}
                active={filter === lvl}
                onClick={() => setFilter(lvl)}
                level={lvl}
                count={levelCounts[lvl]}
              />
            ))}
          </div>

          {/* 스킬 리스트 */}
          <div className="space-y-2">
            {filtered.map((p) => {
              const meta = LEVEL_META[p.level];
              return (
                <div
                  key={p.skill}
                  className="flex items-center gap-3 p-2.5 rounded-lg bg-slate-50/60 dark:bg-slate-700/30 border border-slate-100 dark:border-slate-700"
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-sm font-semibold text-slate-800 dark:text-slate-200 truncate">
                        {p.skill}
                      </span>
                      <span
                        className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full border ${meta.chip} shrink-0`}
                      >
                        {meta.label}
                      </span>
                      <span className="text-[10px] text-slate-400 dark:text-slate-500 shrink-0">
                        {p.score}점
                      </span>
                    </div>
                    {/* 레벨 바 */}
                    <div className="bg-slate-200 dark:bg-slate-700 rounded-full h-1.5 overflow-hidden">
                      <div
                        className="h-1.5 rounded-full transition-all"
                        style={{ width: `${p.score}%`, backgroundColor: meta.bar }}
                      />
                    </div>
                    {/* 근거 */}
                    <div className="mt-1 text-[10px] text-slate-500 dark:text-slate-400">
                      {p.evidence.join(' · ') || '데이터 부족'}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          <p className="text-[11px] text-slate-400 dark:text-slate-500 leading-relaxed mt-2">
            💡 경력 년수 · 프로젝트 사용 · 본문 언급 빈도를 종합한 자동 추정. LLM 없이 이력서
            데이터만 분석하며 면접관 시선에서 예상 숙련도를 미리 확인할 수 있습니다.
          </p>
        </div>
      )}
    </div>
  );
}

function FilterChip({
  active,
  onClick,
  level,
  count,
  children,
}: {
  active: boolean;
  onClick: () => void;
  level?: ProficiencyLevel;
  count?: number;
  children?: React.ReactNode;
}) {
  const levelBg = level ? LEVEL_META[level].bar : '#2563eb';
  return (
    <button
      onClick={onClick}
      className={`px-2.5 py-1 text-[11px] rounded-full border transition-all ${
        active
          ? 'text-white border-transparent shadow-sm'
          : 'bg-white dark:bg-slate-700 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-600 hover:border-slate-400'
      }`}
      style={active ? { backgroundColor: levelBg } : undefined}
    >
      {children ??
        `${level ? LEVEL_META[level].label : ''}${count !== undefined ? ` ${count}` : ''}`}
    </button>
  );
}
