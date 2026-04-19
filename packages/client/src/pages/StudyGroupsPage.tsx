import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link, useSearchParams } from 'react-router-dom';
import {
  STUDY_GROUP_COMPANY_TIERS,
  STUDY_GROUP_CAFE_CATEGORIES,
  STUDY_GROUP_EXPERIENCE_LEVELS,
} from '@resume/shared';
import { API_URL } from '@/lib/config';
import { ROUTES } from '@/lib/routes';
import { tx } from '@/lib/i18n';

const TIER_LABEL: Record<string, string> = {
  public: '공공기관·공기업',
  large: '대기업',
  mid: '중견기업',
  startup: '스타트업',
  foreign: '외국계',
  sme: '중소기업',
  freelance: '프리랜서',
  etc: '기타',
};

const CAFE_LABEL: Record<string, string> = {
  interview: '면접 스터디',
  resume: '이력서 첨삭',
  'coding-test': '코딩 테스트',
  study: '기술 공부',
  networking: '네트워킹',
};

const EXPERIENCE_LABEL: Record<string, string> = {
  new: '신입',
  junior: '주니어 (1-3년)',
  mid: '중간 (4-7년)',
  senior: '시니어 (8년+)',
  any: '전체',
};

interface StudyGroup {
  id: string;
  name: string;
  description: string;
  companyName?: string | null;
  companyTier: string;
  cafeCategory: string;
  experienceLevel: string;
  memberCount: number;
  maxMembers: number;
  isPrivate: boolean;
  createdAt: string;
}

function FilterChip({
  value,
  label,
  active,
  onClick,
}: {
  value: string;
  label: string;
  active: boolean;
  onClick: (value: string) => void;
}) {
  return (
    <button
      type="button"
      onClick={() => onClick(active ? '' : value)}
      className={`inline-flex items-center gap-1 px-3 h-8 rounded-full text-xs font-medium transition-all ${
        active
          ? 'bg-blue-600 text-white shadow-sm'
          : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
      }`}
    >
      {label}
    </button>
  );
}

export default function StudyGroupsPage() {
  const [params, setParams] = useSearchParams();
  const [search, setSearch] = useState('');

  const companyTier = params.get('companyTier') || '';
  const cafeCategory = params.get('cafeCategory') || '';
  const experienceLevel = params.get('experienceLevel') || '';
  const sort = params.get('sort') || 'recent';
  const openOnly = params.get('openOnly') === '1';
  const minMembers = params.get('minMembers') || '';

  const setFilter = (key: string, value: string) => {
    const next = new URLSearchParams(params);
    if (value) next.set(key, value);
    else next.delete(key);
    setParams(next);
  };

  const { data, isLoading } = useQuery({
    queryKey: [
      'study-groups',
      { companyTier, cafeCategory, experienceLevel, sort, openOnly, minMembers, search },
    ],
    queryFn: async () => {
      const sp = new URLSearchParams();
      if (companyTier) sp.set('companyTier', companyTier);
      if (cafeCategory) sp.set('cafeCategory', cafeCategory);
      if (experienceLevel) sp.set('experienceLevel', experienceLevel);
      if (sort && sort !== 'recent') sp.set('sort', sort);
      if (openOnly) sp.set('openOnly', '1');
      if (minMembers) sp.set('minMembers', minMembers);
      if (search) sp.set('q', search);
      const res = await fetch(`${API_URL}/api/study-groups?${sp}`);
      if (!res.ok) throw new Error('Failed');
      return res.json() as Promise<{ items: StudyGroup[]; total: number }>;
    },
  });

  const groups = data?.items || [];

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6 sm:py-8 space-y-6">
      {/* Header */}
      <header className="space-y-2">
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
          {tx('study.cafe')}
        </h1>
        <p className="text-sm text-slate-600 dark:text-slate-400">
          공기업·대기업·스타트업별로 면접 준비와 이력서 첨삭을 함께하는 스터디 그룹을 찾아보세요
        </p>
      </header>

      {/* Search + CTA */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="flex-1 relative">
          <input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="그룹명·기업명·직무로 검색"
            className="w-full h-11 pl-10 pr-4 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <svg
            className="absolute left-3 top-3.5 w-4 h-4 text-slate-400"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="m21 21-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
            />
          </svg>
        </div>
        <Link
          to={ROUTES.interview.newStudyGroup}
          className="imp-btn inline-flex items-center justify-center h-11 px-5 bg-blue-600 text-white text-sm font-semibold rounded-lg hover:bg-blue-700 transition-colors whitespace-nowrap"
        >
          + 새 스터디 만들기
        </Link>
      </div>

      {/* Filters */}
      <div className="space-y-3">
        <div>
          <div className="text-[11px] font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-2">
            기업 유형
          </div>
          <div className="flex flex-wrap gap-2">
            {STUDY_GROUP_COMPANY_TIERS.map((tier) => (
              <FilterChip
                key={tier}
                value={tier}
                label={TIER_LABEL[tier] || tier}
                active={companyTier === tier}
                onClick={(v) => setFilter('companyTier', v)}
              />
            ))}
          </div>
        </div>
        <div>
          <div className="text-[11px] font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-2">
            카페 주제
          </div>
          <div className="flex flex-wrap gap-2">
            {STUDY_GROUP_CAFE_CATEGORIES.map((cat) => (
              <FilterChip
                key={cat}
                value={cat}
                label={CAFE_LABEL[cat] || cat}
                active={cafeCategory === cat}
                onClick={(v) => setFilter('cafeCategory', v)}
              />
            ))}
          </div>
        </div>
        <div>
          <div className="text-[11px] font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-2">
            경력
          </div>
          <div className="flex flex-wrap gap-2">
            {STUDY_GROUP_EXPERIENCE_LEVELS.map((lvl) => (
              <FilterChip
                key={lvl}
                value={lvl}
                label={EXPERIENCE_LABEL[lvl] || lvl}
                active={experienceLevel === lvl}
                onClick={(v) => setFilter('experienceLevel', v)}
              />
            ))}
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3 pt-2 border-t border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-2">
            <label className="text-[11px] font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              정렬
            </label>
            <select
              value={sort}
              onChange={(e) => setFilter('sort', e.target.value === 'recent' ? '' : e.target.value)}
              className="h-8 px-2 text-xs rounded-md border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800"
            >
              <option value="recent">최신순</option>
              <option value="oldest">오래된순</option>
              <option value="members">멤버 많은순</option>
              <option value="seats">여유석 많은순</option>
              <option value="active">최근 활동순</option>
            </select>
          </div>
          <label className="inline-flex items-center gap-1.5 text-xs text-slate-600 dark:text-slate-400 cursor-pointer">
            <input
              type="checkbox"
              checked={openOnly}
              onChange={(e) => setFilter('openOnly', e.target.checked ? '1' : '')}
              className="rounded border-slate-300 dark:border-slate-600 text-blue-600 focus:ring-blue-500"
            />
            빈 자리만
          </label>
          <div className="flex items-center gap-2">
            <label
              htmlFor="minMembers"
              className="text-[11px] font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400"
            >
              최소 인원
            </label>
            <input
              id="minMembers"
              type="number"
              min={0}
              max={200}
              value={minMembers}
              onChange={(e) => setFilter('minMembers', e.target.value)}
              className="h-8 w-16 px-2 text-xs rounded-md border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800"
              placeholder="0"
            />
          </div>
          {(companyTier ||
            cafeCategory ||
            experienceLevel ||
            sort !== 'recent' ||
            openOnly ||
            minMembers) && (
            <button
              type="button"
              onClick={() => setParams(new URLSearchParams())}
              className="ml-auto text-xs text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 underline underline-offset-2"
            >
              필터 초기화
            </button>
          )}
        </div>
      </div>

      {/* Results */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <div
              key={i}
              className="imp-card p-5 h-40 animate-pulse bg-slate-100 dark:bg-slate-800"
            />
          ))}
        </div>
      ) : groups.length === 0 ? (
        <div className="imp-card p-12 text-center">
          <div className="text-4xl mb-3">🧑‍🤝‍🧑</div>
          <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-2">
            조건에 맞는 스터디가 없어요
          </h3>
          <p className="text-sm text-slate-600 dark:text-slate-400 mb-4">
            필터를 바꿔 다시 검색하거나, 직접 새 스터디를 만들어보세요
          </p>
          <Link
            to={ROUTES.interview.newStudyGroup}
            className="imp-btn inline-flex items-center gap-2 px-5 h-10 bg-blue-600 text-white text-sm font-semibold rounded-lg hover:bg-blue-700"
          >
            + 새 스터디 만들기
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {groups.map((g) => (
            <Link
              key={g.id}
              to={ROUTES.interview.studyGroup(g.id)}
              className="imp-card p-5 block hover:-translate-y-0.5 transition-transform"
            >
              <div className="flex items-start justify-between gap-2 mb-2">
                <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100 line-clamp-2">
                  {g.name}
                </h3>
                {g.isPrivate && <span className="badge-xs badge-neutral shrink-0">비공개</span>}
              </div>
              <p className="text-xs text-slate-600 dark:text-slate-400 line-clamp-2 mb-3">
                {g.description || '(설명 없음)'}
              </p>
              <div className="flex flex-wrap items-center gap-1.5 mb-3">
                {g.companyName && <span className="badge-xs badge-blue">{g.companyName}</span>}
                <span className="badge-xs badge-cyan">
                  {TIER_LABEL[g.companyTier] || g.companyTier}
                </span>
                <span className="badge-xs badge-neutral">
                  {CAFE_LABEL[g.cafeCategory] || g.cafeCategory}
                </span>
              </div>
              <div className="flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400">
                <span>{EXPERIENCE_LABEL[g.experienceLevel] || g.experienceLevel}</span>
                <span>
                  {g.memberCount}/{g.maxMembers}명
                </span>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
