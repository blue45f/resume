import { Link } from 'react-router-dom';
import { ROUTES } from '@/lib/routes';
import { t } from '@/lib/i18n';
import HomeHeroVisual from '@/components/HomeHeroVisual';
import SiteStatsBar from './SiteStatsBar';
import type { HomeContent } from './types';

interface HomeLandingProps {
  highlights: NonNullable<HomeContent['highlights']>;
  features: NonNullable<HomeContent['features']>;
  testimonials: NonNullable<HomeContent['testimonials']>;
  socialProofTitle: string;
  onImport: () => void;
}

export default function HomeLanding({
  highlights,
  features,
  testimonials,
  socialProofTitle,
  onImport,
}: HomeLandingProps) {
  return (
    <div className="py-10 sm:py-16 animate-fade-in">
      {/* Hero — Editorial typographic. left-aligned, asymmetric, no gradient text or mesh blobs.
          ".impeccable.md" 톤(refined/professional/calm) + 진중한 데이터 신뢰감. */}
      <section
        aria-label="이력서공방 소개"
        className="home-hero-stage relative mb-12 sm:mb-16 grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-10"
      >
        <HomeHeroVisual />
        {/* main column — 헤드라인 + 카피 + CTA */}
        <div className="lg:col-span-8">
          <div className="inline-flex items-center gap-2 mb-6 sm:mb-8 text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-700 dark:text-slate-300">
            <span className="relative flex w-2 h-2" aria-hidden="true">
              <span className="absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75 animate-ping" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
            </span>
            AI 기반 이력서·자기소개서 플랫폼
          </div>

          <h1 className="home-hero-title font-black text-slate-900 dark:text-slate-50 mb-6 tracking-[-0.035em] leading-[0.95] text-balance">
            서류 합격률,
            <br />
            <span className="text-sky-700 dark:text-sky-400">데이터로</span> 올립니다.
          </h1>

          <p className="text-base sm:text-lg text-slate-600 dark:text-slate-400 max-w-xl leading-relaxed mb-9">
            5종 AI 분석, 26개 직종 템플릿, 실시간 미리보기.{' '}
            <span className="text-slate-800 dark:text-slate-200 font-medium">
              합격으로 가는 거리를 가장 짧게.
            </span>
          </p>

          <div className="home-hero-actions flex flex-col sm:flex-row items-stretch sm:items-center gap-3 mb-4">
            <Link
              to={ROUTES.resume.new}
              className="home-hero-cta home-hero-cta--primary btn-shine imp-btn inline-flex items-center justify-center gap-2 px-7 py-3.5 bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 font-semibold rounded-xl text-base shadow-sm focus-ring-accent"
            >
              무료로 시작하기
              <svg
                className="w-4 h-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                aria-hidden="true"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M13 7l5 5m0 0l-5 5m5-5H6"
                />
              </svg>
            </Link>
            <Link
              to={ROUTES.resume.explore}
              className="home-hero-cta home-hero-cta--ghost imp-btn inline-flex items-center justify-center gap-2 px-6 py-3.5 bg-transparent text-slate-700 dark:text-slate-300 font-medium rounded-xl border border-slate-300 dark:border-slate-600 text-base focus-ring-accent"
            >
              이력서 탐색
              <svg
                className="w-4 h-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                aria-hidden="true"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 5l7 7-7 7"
                />
              </svg>
            </Link>
          </div>

          {/* 빠른 시작 옵션 — 신규 사용자가 처음부터 이력서 작성 부담을 느끼지 않도록 */}
          <div className="home-hero-meta mb-10 flex flex-wrap items-center gap-x-4 gap-y-2 text-xs text-slate-600 dark:text-slate-400">
            <span className="home-hero-meta__title font-semibold text-slate-700 dark:text-slate-300">
              빠른 시작:
            </span>
            <Link
              to={ROUTES.resume.autoGenerate}
              className="home-hero-quick-link home-hero-quick-link--pill inline-flex items-center gap-1"
            >
              <span aria-hidden="true">📄</span> PDF/이미지 업로드
            </Link>
            <Link
              to={ROUTES.resume.autoGenerate}
              className="home-hero-quick-link home-hero-quick-link--pill inline-flex items-center gap-1"
            >
              <span aria-hidden="true">🔗</span> 채용공고 URL 만으로
            </Link>
            <Link
              to={ROUTES.resume.autoGenerate}
              className="home-hero-quick-link home-hero-quick-link--pill inline-flex items-center gap-1"
            >
              <span aria-hidden="true">✨</span> AI 자동 생성
            </Link>
          </div>
        </div>

        {/* aside column — typographic data points (큰 숫자 + uppercase label).
            데이터 신뢰감 강조: 사용자가 "5종 AI 분석"이 진짜 임을 한눈에. */}
        <aside
          aria-label="플랫폼 핵심 지표"
          className="home-hero-aside home-hero-stats lg:col-span-4 lg:border-l lg:border-slate-200 dark:lg:border-slate-800 lg:pl-8 flex flex-col gap-6 lg:gap-7 items-start"
        >
          <div className="home-hero-stat home-hero-stat--item home-hero-stat--delay-0 flex-1 lg:flex-initial">
            <div className="text-[10px] font-semibold uppercase tracking-[0.2em] text-slate-500 dark:text-slate-500 mb-1">
              AI 분석
            </div>
            <div className="home-hero-stat__value number-ticker font-black text-slate-900 dark:text-slate-100 tabular-nums leading-none tracking-tight">
              5
              <span className="text-sky-700 dark:text-sky-400 text-[0.55em] font-bold align-top ml-0.5">
                종
              </span>
            </div>
          </div>
          <div className="home-hero-stat home-hero-stat--item home-hero-stat--delay-120 flex-1 lg:flex-initial">
            <div className="text-[10px] font-semibold uppercase tracking-[0.2em] text-slate-500 dark:text-slate-500 mb-1">
              직종 템플릿
            </div>
            <div className="home-hero-stat__value number-ticker font-black text-slate-900 dark:text-slate-100 tabular-nums leading-none tracking-tight">
              26
              <span className="text-sky-700 dark:text-sky-400 text-[0.55em] font-bold align-top ml-0.5">
                개
              </span>
            </div>
          </div>
          <div className="home-hero-stat home-hero-stat--item home-hero-stat--delay-240 flex-1 lg:flex-initial">
            <div className="text-[10px] font-semibold uppercase tracking-[0.2em] text-slate-500 dark:text-slate-500 mb-1">
              실시간
            </div>
            <div className="home-hero-stat__value number-ticker font-black text-slate-900 dark:text-slate-100 leading-none tracking-tight">
              Live
              <span className="text-emerald-600 dark:text-emerald-400 text-[0.55em] font-bold align-top ml-0.5 animate-pulse">
                ●
              </span>
            </div>
          </div>
        </aside>
      </section>

      {/* Platform stats — 동적 운영 데이터 (SiteStatsBar는 그대로 유지) */}
      <SiteStatsBar />

      {/* Action grid — asymmetric (1 feature + 3 secondary).
          동일 카드 4개 반복 → primary 1개 강조 + secondary 3개 컴팩트. */}
      <div className="home-feature-grid home-grid-hero-actions home-hero-action-grid stagger-children grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-12 gap-3 sm:gap-4 max-w-3xl mx-auto mb-10 mt-12">
        {/* Primary feature — 새 이력서 */}
        <Link
          to={ROUTES.resume.new}
          className="home-hero-action-card home-hero-action-card--primary sm:col-span-2 lg:col-span-6 lg:row-span-1 flex items-center gap-5 p-6 sm:p-7 bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 rounded-2xl relative overflow-hidden"
        >
          <span className="w-12 h-12 flex items-center justify-center rounded-xl bg-white/15 dark:bg-slate-900/10 shrink-0">
            <svg
              className="w-6 h-6"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              aria-hidden="true"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
              />
            </svg>
          </span>
          <div className="flex-1 min-w-0">
            <div className="text-[10px] font-semibold uppercase tracking-[0.18em] text-sky-300 dark:text-sky-700 mb-1">
              primary
            </div>
            <div className="font-bold text-base sm:text-lg leading-tight">
              {t('home.directWrite')}
            </div>
            <div className="text-xs text-sky-100/90 dark:text-slate-600 mt-1">
              템플릿 선택 후 작성
            </div>
          </div>
          <svg
            className="w-5 h-5 text-sky-200 dark:text-sky-700 shrink-0"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            aria-hidden="true"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M13 7l5 5m0 0l-5 5m5-5H6"
            />
          </svg>
        </Link>

        {/* Secondary 1 — AI 생성 */}
        <Link
          to={ROUTES.resume.autoGenerate}
          className="home-hero-action-card home-hero-action-card--secondary lg:col-span-2 flex flex-col gap-2 p-5 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700"
        >
          <span className="w-9 h-9 flex items-center justify-center rounded-lg bg-cyan-50 dark:bg-cyan-900/20 text-cyan-700 dark:text-cyan-300">
            <svg
              className="w-4 h-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              aria-hidden="true"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"
              />
            </svg>
          </span>
          <div>
            <div className="font-semibold text-sm text-slate-800 dark:text-slate-200 leading-snug">
              {t('home.aiGenerate')}
            </div>
            <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
              텍스트 붙여넣기만
            </div>
          </div>
        </Link>

        {/* Secondary 2 — Quick import */}
        <button
          type="button"
          onClick={onImport}
          aria-label="이력서 임포트 모달 열기"
          className="home-hero-action-card home-hero-action-card--secondary lg:col-span-2 flex flex-col gap-2 p-5 text-left bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700"
        >
          <span className="w-9 h-9 flex items-center justify-center rounded-lg bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-300">
            <svg
              className="w-4 h-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              aria-hidden="true"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
              />
            </svg>
          </span>
          <div>
            <div className="font-semibold text-sm text-slate-800 dark:text-slate-200 leading-snug">
              {t('home.quickImport')}
            </div>
            <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
              텍스트 붙여넣기
            </div>
          </div>
        </button>

        {/* Secondary 3 — 탐색 */}
        <Link
          to={ROUTES.resume.explore}
          className="home-hero-action-card home-hero-action-card--secondary lg:col-span-2 flex flex-col gap-2 p-5 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700"
        >
          <span className="w-9 h-9 flex items-center justify-center rounded-lg bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300">
            <svg
              className="w-4 h-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              aria-hidden="true"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
              />
            </svg>
          </span>
          <div>
            <div className="font-semibold text-sm text-slate-800 dark:text-slate-200 leading-snug">
              {t('home.explore')}
            </div>
            <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
              공개 이력서 탐색
            </div>
          </div>
        </Link>
      </div>

      {/* Section divider — left-aligned editorial heading (gradient line 제거) */}
      <div className="flex items-baseline gap-3 mt-14 mb-7">
        <h2 className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-700 dark:text-slate-300">
          주요 기능
        </h2>
        <div className="flex-1 h-px bg-slate-200 dark:bg-slate-800" />
      </div>

      {/* Feature highlights — solid surface + sapphire accent (emoji 카드 정리) */}
      <div className="home-feature-grid home-grid-highlights stagger-children home-feature-highlights grid grid-cols-1 md:grid-cols-3 gap-4 mb-12">
        {highlights.map((f, i) => (
          <div
            key={f.title}
            className="home-feature-card home-feature-card--highlight relative bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl p-5 overflow-hidden"
          >
            <div
              aria-hidden="true"
              className="absolute top-0 left-0 right-0 h-px bg-sky-700 dark:bg-sky-400"
            />
            <div className="text-[10px] font-semibold uppercase tracking-[0.18em] text-sky-700 dark:text-sky-400 mb-2">
              {`0${i + 1}`}
            </div>
            <h3 className="text-base font-bold text-slate-900 dark:text-slate-100 mb-1.5 tracking-tight">
              {f.title}
            </h3>
            <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">{f.desc}</p>
          </div>
        ))}
      </div>

      {/* Bottom links — 통일 색상 (sky-700) + 화살표 마이크로 인터랙션 */}
      <div className="home-bottom-links flex flex-wrap items-center gap-x-6 gap-y-2 mt-12">
        {[
          { to: ROUTES.tutorial, label: '사용 가이드' },
          { to: ROUTES.pricing, label: '요금제' },
          { to: ROUTES.jobs.list, label: '채용 공고' },
        ].map((link) => (
          <Link
            key={link.to}
            to={link.to}
            className="home-bottom-link inline-flex items-center gap-2 text-sm font-medium"
          >
            {link.label}
            <svg
              className="w-3.5 h-3.5"
              fill="none"
              stroke="currentColor"
              strokeWidth={2}
              viewBox="0 0 24 24"
              aria-hidden="true"
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6" />
            </svg>
          </Link>
        ))}
      </div>

      {/* Features Grid — gradient icon → solid + 단색 background */}
      <div className="stagger-children grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mt-12">
        {features.map((feat, i) => (
          <div
            key={i}
            className="home-feature-card p-5 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 cursor-default"
          >
            <div className="w-10 h-10 rounded-xl bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-200 flex items-center justify-center text-lg mb-3">
              {feat.icon}
            </div>
            <h3 className="font-semibold text-slate-800 dark:text-slate-200 text-sm mb-1">
              {feat.title}
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
              {feat.desc}
            </p>
          </div>
        ))}
      </div>

      {/* Social Proof */}
      <div className="mt-14 reveal">
        <h2 className="text-xl font-bold text-center text-slate-800 dark:text-slate-200 mb-8">
          {socialProofTitle}
        </h2>
        <div className="stagger-children grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
          {testimonials.map((review, i) => (
            <div
              key={i}
              className="p-4 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700"
            >
              <div className="flex gap-0.5 mb-2">
                {Array.from({ length: review.stars }).map((_, j) => (
                  <span key={j} className="text-amber-400 text-sm">
                    ★
                  </span>
                ))}
              </div>
              <p className="text-sm text-slate-700 dark:text-slate-300 mb-3 leading-relaxed">
                "{review.text}"
              </p>
              <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                — {review.author}
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
