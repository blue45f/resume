/**
 * 이력서 목록(thumbnail/card)에서 사용하는 완성도 계산.
 *
 * 단순 9개 binary 체크 → 가중 + 단계화 + 카테고리 분류로 재설계 (2026-04-26).
 * - 모든 이력서가 같은 % 범주에 몰리는 문제 해결
 * - 사용자 입력 변화에 따라 % 변동성 확보
 * - missing 항목을 별도로 반환해 hover/tooltip에서 노출 가능
 *
 * `ResumeSummary` 타입(목록 응답)만으로 계산되므로 experiences/educations 등은 평가 불가.
 * 상세 페이지(`Resume` 전체)에서는 별도 분석기를 사용한다 (`koreanChecker` 계열).
 */

import type { ResumeSummary } from '@/types/resume';

export type CompletionCategory = 'identity' | 'depth' | 'web' | 'discoverability';

export interface CompletionItem {
  /** Stable key for tooltip i18n / sorting */
  key: string;
  /** Korean label for UX surfaces */
  label: string;
  /** Earned score for this item (may be partial under tiered checks) */
  score: number;
  /** Max possible score for this item */
  max: number;
  /** Higher-level grouping (used for color/section) */
  category: CompletionCategory;
  /** True when item is empty or below the recommended tier */
  missing: boolean;
  /** Optional human hint shown when missing */
  hint?: string;
}

export interface CompletionResult {
  /** Rounded percentage 0..100 */
  pct: number;
  /** Numeric score and ceiling (useful for animations) */
  score: number;
  max: number;
  /** Grade label suitable for color/badging */
  grade: 'excellent' | 'good' | 'fair' | 'low';
  /** All 11 items in display order */
  items: CompletionItem[];
  /** Items with `missing===true`, ordered by max desc (most impactful first) */
  missingItems: CompletionItem[];
}

/** Score for summary length, in tiers (0–15) */
function summaryTier(len: number): number {
  if (len >= 200) return 15;
  if (len >= 100) return 11;
  if (len >= 30) return 6;
  return 0;
}

/** Score for skills count, in tiers (0–15) */
function skillsTier(n: number): number {
  if (n >= 11) return 15;
  if (n >= 6) return 13;
  if (n >= 3) return 9;
  if (n >= 1) return 4;
  return 0;
}

export function computeResumeCompletion(resume: ResumeSummary): CompletionResult {
  const pi = resume.personalInfo;
  const summary = (pi.summary ?? '').trim();
  const summaryLen = summary.length;
  const skillsCount = resume.skills?.length ?? 0;
  const tagsCount = resume.tags?.length ?? 0;

  const items: CompletionItem[] = [
    // ── identity (35점) ────────────────────────────────────────
    {
      key: 'title',
      label: '제목',
      score: resume.title?.trim() ? 3 : 0,
      max: 3,
      category: 'identity',
      missing: !resume.title?.trim(),
      hint: '예: "프론트엔드 개발자 — 김OO"',
    },
    {
      key: 'name',
      label: '이름',
      score: pi.name?.trim() ? 12 : 0,
      max: 12,
      category: 'identity',
      missing: !pi.name?.trim(),
    },
    {
      key: 'email',
      label: '이메일',
      score: pi.email?.trim() ? 8 : 0,
      max: 8,
      category: 'identity',
      missing: !pi.email?.trim(),
    },
    {
      key: 'phone',
      label: '연락처',
      score: pi.phone?.trim() ? 6 : 0,
      max: 6,
      category: 'identity',
      missing: !pi.phone?.trim(),
    },
    {
      key: 'photo',
      label: '프로필 사진',
      score: pi.photo ? 3 : 0,
      max: 3,
      category: 'identity',
      missing: !pi.photo,
      hint: '신뢰감을 주는 정면 사진을 권장합니다',
    },
    {
      key: 'address',
      label: '거주 지역',
      score: pi.address?.trim() ? 3 : 0,
      max: 3,
      category: 'identity',
      missing: !pi.address?.trim(),
    },

    // ── depth (35점) ──────────────────────────────────────────
    {
      key: 'summary',
      label: '자기소개',
      score: summaryTier(summaryLen),
      max: 15,
      category: 'depth',
      missing: summaryLen < 100,
      hint:
        summaryLen === 0
          ? '한 문단(100자 이상) 이상 권장'
          : summaryLen < 100
            ? `${summaryLen}자 — 100자 이상 권장`
            : undefined,
    },
    {
      key: 'skills',
      label: '스킬',
      score: skillsTier(skillsCount),
      max: 15,
      category: 'depth',
      missing: skillsCount < 3,
      hint:
        skillsCount === 0
          ? '핵심 스킬 3개 이상 권장'
          : skillsCount < 3
            ? `${skillsCount}개 — 3개 이상 권장`
            : undefined,
    },
    {
      key: 'tags',
      label: '태그',
      score: tagsCount > 0 ? 5 : 0,
      max: 5,
      category: 'depth',
      missing: tagsCount === 0,
      hint: '직무·산업 태그를 1개 이상 추가하세요',
    },

    // ── web presence (15점) ───────────────────────────────────
    {
      key: 'links',
      label: '외부 링크',
      score:
        (pi.website?.trim() ? 5 : 0) +
        (pi.github?.trim() ? 5 : 0) +
        ((pi.links?.length ?? 0) > 0 ? 5 : 0),
      max: 15,
      category: 'web',
      missing: !(pi.website?.trim() || pi.github?.trim() || (pi.links?.length ?? 0) > 0),
      hint: 'GitHub·블로그·포트폴리오 링크 1개 이상',
    },

    // ── discoverability (15점) ────────────────────────────────
    {
      key: 'visibility',
      label: '공개 설정',
      score: resume.visibility === 'public' ? 10 : resume.visibility === 'link-only' ? 5 : 0,
      max: 10,
      category: 'discoverability',
      missing: resume.visibility !== 'public' && resume.visibility !== 'link-only',
      hint: '검색·헤드헌터 노출을 원하면 공개로',
    },
    {
      key: 'openToWork',
      label: '구직 활성화',
      score: resume.isOpenToWork ? 5 : 0,
      max: 5,
      category: 'discoverability',
      missing: !resume.isOpenToWork,
      hint: '구직 의사를 알리면 매칭 빈도가 늘어납니다',
    },
  ];

  const score = items.reduce((s, i) => s + i.score, 0);
  const max = items.reduce((s, i) => s + i.max, 0);
  const pct = Math.min(100, Math.round((score / max) * 100));

  const grade: CompletionResult['grade'] =
    pct >= 85 ? 'excellent' : pct >= 65 ? 'good' : pct >= 40 ? 'fair' : 'low';

  const missingItems = items.filter((i) => i.missing).sort((a, b) => b.max - a.max);

  return { pct, score, max, grade, items, missingItems };
}
