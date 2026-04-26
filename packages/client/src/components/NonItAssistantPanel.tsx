import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import type { Resume } from '@/types/resume';
import { ROUTES } from '@/lib/routes';
import {
  detectNonItCategory,
  NON_IT_GUIDES,
  NON_IT_CATEGORY_KEYS,
  type NonItCategory,
} from '@/lib/nonItGuide';

interface Props {
  resume: Resume;
}

/**
 * NonItAssistantPanel — 비-IT 직군(영업/마케팅/재무/공기업/교육/제조 등) 이력서 작성 어시스턴트.
 * - 경력 텍스트로부터 직군 자동 감지 (수동 변경 가능)
 * - 성과 표현 템플릿 · 추천 자격증 · 자기소개서 4대 항목 · 면접 포인트 제공
 * - NCS 안내 (공기업/공무원)
 */
export default function NonItAssistantPanel({ resume }: Props) {
  const detected = useMemo(() => detectNonItCategory(resume), [resume]);
  const [category, setCategory] = useState<NonItCategory>(detected ?? 'other-it');
  const [expanded, setExpanded] = useState(false);
  const [tab, setTab] = useState<'achieve' | 'cert' | 'cover' | 'interview'>('achieve');
  const guide = NON_IT_GUIDES[category];

  const copy = async (txt: string) => {
    try {
      await navigator.clipboard.writeText(txt);
    } catch {
      /* noop */
    }
  };

  return (
    <div className="imp-card bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-4 no-print">
      <button
        onClick={() => setExpanded((v) => !v)}
        className="w-full flex items-center justify-between focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-accent)] focus-visible:ring-offset-2 rounded-[var(--radius-sm)]"
        aria-expanded={expanded}
      >
        <div className="flex items-center gap-2 min-w-0">
          <span aria-hidden className="text-base">
            {guide.emoji}
          </span>
          <h3 className="text-sm font-semibold text-slate-800 dark:text-slate-200 shrink-0">
            {guide.label} 이력서 어시스턴트
          </h3>
          <span className="text-[11px] text-slate-500 dark:text-slate-400 hidden sm:inline truncate">
            비-IT 직군 전용 · 성과 표현 · 자격증 · 자소서
          </span>
        </div>
        <svg
          className={`w-4 h-4 text-slate-400 transition-transform shrink-0 ${expanded ? 'rotate-180' : ''}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
          aria-hidden
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {expanded && (
        <div className="mt-4 space-y-3 animate-in fade-in-0 duration-200">
          {/* 카테고리 선택 */}
          <div>
            <div className="flex items-center gap-2 mb-2 flex-wrap">
              <span className="text-[11px] font-medium text-slate-500 dark:text-slate-400">
                직군
              </span>
              {detected && detected !== category && (
                <button
                  type="button"
                  onClick={() => setCategory(detected)}
                  className="text-[10px] px-1.5 py-0.5 rounded bg-blue-50 text-blue-600 dark:bg-blue-900/30 dark:text-blue-300 hover:bg-blue-100"
                >
                  자동감지: {NON_IT_GUIDES[detected].label} 적용
                </button>
              )}
            </div>
            <div className="flex flex-wrap gap-2">
              {NON_IT_CATEGORY_KEYS.map((k) => (
                <button
                  key={k}
                  onClick={() => setCategory(k)}
                  className={`px-2.5 py-1 text-[11px] rounded-full border transition-all ${
                    category === k
                      ? 'bg-blue-600 text-white border-blue-600'
                      : 'bg-white dark:bg-slate-700 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-600 hover:border-blue-300'
                  }`}
                >
                  <span aria-hidden className="mr-0.5">
                    {NON_IT_GUIDES[k].emoji}
                  </span>
                  {NON_IT_GUIDES[k].label}
                </button>
              ))}
            </div>
          </div>

          {/* 탭 */}
          <div
            role="tablist"
            aria-label="비-IT 이력서 어시스턴트 탭"
            className="flex border-b border-slate-200 dark:border-slate-700"
          >
            {(
              [
                { id: 'achieve', label: '성과 표현', icon: '📈' },
                { id: 'cert', label: '추천 자격증', icon: '🎓' },
                { id: 'cover', label: '자소서 항목', icon: '✍️' },
                { id: 'interview', label: '면접 포인트', icon: '🎤' },
              ] as const
            ).map((t) => (
              <button
                key={t.id}
                role="tab"
                aria-selected={tab === t.id}
                onClick={() => setTab(t.id)}
                className={`flex items-center gap-2 px-3 py-2 text-xs font-medium border-b-2 -mb-px transition-colors ${
                  tab === t.id
                    ? 'border-blue-600 text-blue-700 dark:text-blue-300'
                    : 'border-transparent text-slate-500 hover:text-slate-700 dark:hover:text-slate-200'
                }`}
              >
                <span aria-hidden>{t.icon}</span>
                <span>{t.label}</span>
              </button>
            ))}
          </div>

          {tab === 'achieve' && (
            <div className="space-y-2">
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                경력사항에 수치·지표를 포함하면 ATS 점수와 면접관 설득력이 함께 오릅니다. 복사해서
                채워 넣으세요.
              </p>
              <ul className="space-y-1.5">
                {guide.achievementTemplates.map((tpl, i) => (
                  <li
                    key={i}
                    className="flex items-start gap-2 p-2.5 rounded-lg bg-slate-50 dark:bg-slate-700/30 border border-slate-100 dark:border-slate-700"
                  >
                    <span className="flex-1 text-sm text-slate-700 dark:text-slate-300 leading-relaxed">
                      {tpl}
                    </span>
                    <button
                      type="button"
                      onClick={() => copy(tpl)}
                      className="text-[11px] px-2 py-1 rounded-md border border-slate-200 dark:border-slate-600 text-slate-500 dark:text-slate-300 hover:border-blue-400 hover:text-blue-600 transition-colors shrink-0"
                    >
                      복사
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {tab === 'cert' && (
            <div className="space-y-2">
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                이 직군에서 채용공고 우대 조건으로 자주 등장하는 자격증입니다.
              </p>
              <div className="flex flex-wrap gap-2">
                {guide.recommendedCertifications.map((c) => (
                  <span
                    key={c}
                    className="px-2.5 py-1 text-xs rounded-full bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 border border-blue-100 dark:border-blue-800/40"
                  >
                    {c}
                  </span>
                ))}
              </div>
            </div>
          )}

          {tab === 'cover' && (
            <div className="space-y-2.5">
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                자기소개서 주요 항목과 작성 팁. 샘플을 복사해 자신의 경험으로 바꿔 쓰세요.
              </p>
              {guide.coverLetterTopics.map((t, i) => (
                <details
                  key={i}
                  className="rounded-lg border border-slate-100 dark:border-slate-700 bg-slate-50/60 dark:bg-slate-700/20"
                >
                  <summary className="cursor-pointer px-3 py-2 text-sm font-medium text-slate-700 dark:text-slate-200 flex items-center justify-between gap-2 list-none">
                    <span>{t.title}</span>
                    <span className="text-[10px] text-slate-500 dark:text-slate-400">펼치기</span>
                  </summary>
                  <div className="px-3 pb-3 space-y-1.5">
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 italic">
                      💡 {t.prompt}
                    </p>
                    <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed bg-white dark:bg-slate-800 rounded p-2 border border-slate-100 dark:border-slate-700">
                      {t.sample}
                    </p>
                    <button
                      type="button"
                      onClick={() => copy(t.sample)}
                      className="text-[11px] px-2 py-0.5 rounded border border-slate-200 dark:border-slate-600 text-slate-500 hover:text-blue-600 hover:border-blue-400"
                    >
                      샘플 복사
                    </button>
                  </div>
                </details>
              ))}
            </div>
          )}

          {tab === 'interview' && (
            <div className="space-y-2">
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                이 직군 면접에서 자주 나오는 질문 유형. 각 질문을 클릭하면 모의면접으로 연결됩니다.
              </p>
              <ul className="space-y-1.5">
                {guide.interviewFocus.map((q, i) => (
                  <li key={i}>
                    <Link
                      to={ROUTES.interview.mock({ question: q })}
                      className="flex items-start gap-2 p-2 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700/40 border border-transparent hover:border-slate-200 dark:hover:border-slate-700 transition-colors group"
                    >
                      <span className="shrink-0 mt-0.5 text-[11px] px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-700 text-slate-500 dark:text-slate-400 group-hover:bg-blue-100 group-hover:text-blue-700 dark:group-hover:bg-blue-900/30 dark:group-hover:text-blue-300">
                        Q{i + 1}
                      </span>
                      <span className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed group-hover:text-blue-700 dark:group-hover:text-blue-300">
                        {q}
                      </span>
                      <span
                        aria-hidden
                        className="ml-auto shrink-0 text-xs text-slate-300 group-hover:text-blue-500 transition-colors"
                      >
                        →
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
              <div className="flex flex-wrap gap-2 pt-1">
                <Link
                  to={ROUTES.interview.prep}
                  className="inline-flex items-center gap-1 text-[11px] px-2.5 py-1 rounded-full bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 border border-blue-100 hover:bg-blue-100 dark:hover:bg-blue-900/40 transition-colors"
                >
                  🎤 면접 준비 페이지로
                </Link>
                <Link
                  to={ROUTES.interview.studyGroups}
                  className="inline-flex items-center gap-1 text-[11px] px-2.5 py-1 rounded-full bg-slate-50 dark:bg-slate-700/40 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:border-blue-400 transition-colors"
                >
                  👥 스터디 그룹 찾기
                </Link>
                <Link
                  to={`${ROUTES.community.list}?category=interview`}
                  className="inline-flex items-center gap-1 text-[11px] px-2.5 py-1 rounded-full bg-slate-50 dark:bg-slate-700/40 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:border-blue-400 transition-colors"
                >
                  💬 면접 후기 읽기
                </Link>
              </div>
              {guide.ncs && (
                <div className="mt-2 p-3 rounded-lg bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800/40 text-xs text-amber-800 dark:text-amber-200 leading-relaxed">
                  <span className="font-semibold">NCS 안내:</span> {guide.ncs}
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
