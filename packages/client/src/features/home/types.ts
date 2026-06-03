import type { CSSProperties } from 'react';
import type { Tag } from '@/types/resume';

export interface HomeContent {
  highlights?: { title: string; desc: string; bg: string }[];
  features?: { icon: string; title: string; desc: string; color: string }[];
  testimonials?: { text: string; author: string; stars: number }[];
  socialProofTitle?: string;
}

export type ResumeSortBy = 'updatedAt' | 'title' | 'viewCount';
export type HomeCssVarStyle = CSSProperties & Record<`--${string}`, string>;

export const RESUME_SORT_OPTIONS: { value: ResumeSortBy; label: string }[] = [
  { value: 'updatedAt', label: '최근 수정' },
  { value: 'title', label: '이름순' },
  { value: 'viewCount', label: '조회수' },
];

export const getTagFilterStyle = (tag: Tag, active: boolean): HomeCssVarStyle => ({
  '--home-tag-filter-bg': active ? tag.color : `${tag.color}20`,
  '--home-tag-filter-border': tag.color,
});

export const getResumeTagStyle = (tag: Tag): HomeCssVarStyle => ({
  '--home-resume-tag-bg': `${tag.color}20`,
  '--home-resume-tag-fg': tag.color,
});

export const DEFAULT_HIGHLIGHTS = [
  {
    title: 'AI 분석 5종 세트',
    desc: 'ATS 통과율 검사, JD 매칭도 분석, 예상 면접 질문까지 - 서류 합격률을 높이는 데이터 기반 인사이트',
    bg: 'bg-blue-50 dark:bg-blue-900/20',
  },
  {
    title: '26개 직종별 템플릿',
    desc: '개발자, 디자이너, 마케터 등 직종에 최적화된 레이아웃과 15종 테마로 프로페셔널한 이력서 완성',
    bg: 'bg-cyan-50 dark:bg-cyan-900/20',
  },
  {
    title: '완전 무료로 시작',
    desc: '오픈소스 LLM 활용으로 비용 부담 없이 시작하세요. 핵심 기능 모두 무료, 숨겨진 비용 없음',
    bg: 'bg-emerald-50 dark:bg-emerald-900/20',
  },
];

export const DEFAULT_FEATURES = [
  {
    icon: '✨',
    title: 'AI 이력서 작성',
    desc: '직종별 최적화된 문구를 AI가 자동 생성',
    color: 'from-blue-500 to-sky-600',
  },
  {
    icon: '📊',
    title: 'ATS 점수 분석',
    desc: '채용 시스템 호환성을 실시간으로 분석',
    color: 'from-blue-500 to-cyan-600',
  },
  {
    icon: '🎨',
    title: '전문 템플릿',
    desc: '디자이너가 제작한 고품질 이력서 템플릿',
    color: 'from-emerald-500 to-teal-600',
  },
  {
    icon: '🔗',
    title: '이력서 공유',
    desc: '고유 URL로 이력서를 간편하게 공유',
    color: 'from-amber-500 to-orange-600',
  },
  {
    icon: '📧',
    title: '자기소개서',
    desc: 'AI가 회사/포지션에 맞는 자소서 작성',
    color: 'from-sky-500 to-blue-600',
  },
  {
    icon: '📈',
    title: '커리어 분석',
    desc: '업계 트렌드와 연봉 데이터 인사이트',
    color: 'from-cyan-500 to-blue-600',
  },
];

export const DEFAULT_TESTIMONIALS = [
  { text: 'AI가 자동으로 써준 이력서로 취업에 성공했어요!', author: '소프트웨어 개발자', stars: 5 },
  { text: '템플릿이 너무 예뻐서 면접관에게 칭찬받았습니다.', author: 'UX 디자이너', stars: 5 },
  { text: 'ATS 분석 기능 덕분에 서류 통과율이 높아졌어요.', author: '마케터', stars: 5 },
];
