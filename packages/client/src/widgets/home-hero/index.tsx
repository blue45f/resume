import { Suspense, lazy } from 'react';
import { Link } from 'react-router-dom';

const BannerSlider = lazy(() => import('@/components/BannerSlider'));

/**
 * HomeHero — 메인 히어로 섹션 (위젯 레이어)
 * Swiper 기반 배너 + CTA 버튼 그룹을 하나의 응집된 UI로 조합.
 */
interface HomeHeroProps {
  userType?: 'personal' | 'recruiter' | 'company' | 'coach';
  isAuthenticated?: boolean;
}

export default function HomeHero({ userType, isAuthenticated }: HomeHeroProps) {
  const isRecruiter = userType === 'recruiter' || userType === 'company';

  return (
    <section className="w-full" aria-label="메인 히어로">
      <Suspense fallback={<HeroSkeleton />}>
        <BannerSlider />
      </Suspense>

      {!isAuthenticated && (
        <div className="max-w-6xl mx-auto px-4 mt-6 flex flex-wrap items-center justify-center gap-3">
          <Link
            to="/register"
            className="imp-btn px-6 py-3 text-sm font-semibold bg-blue-600 text-white rounded-lg shadow-sm hover:bg-blue-700 transition-colors"
          >
            무료로 시작하기
          </Link>
          <Link
            to="/tutorial"
            className="imp-btn px-6 py-3 text-sm font-semibold bg-white dark:bg-neutral-800 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-neutral-700 rounded-lg hover:bg-slate-50 dark:hover:bg-neutral-700 transition-colors"
          >
            튜토리얼 보기
          </Link>
        </div>
      )}

      {isAuthenticated && (
        <div className="max-w-6xl mx-auto px-4 mt-6 flex flex-wrap items-center justify-center gap-3">
          {isRecruiter ? (
            <>
              <Link
                to="/explore"
                className="imp-btn px-5 py-2.5 text-sm font-semibold bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                인재 탐색
              </Link>
              <Link
                to="/jobs/new"
                className="imp-btn px-5 py-2.5 text-sm font-semibold bg-white dark:bg-neutral-800 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-neutral-700 rounded-lg"
              >
                공고 등록
              </Link>
            </>
          ) : (
            <>
              <Link
                to="/resumes/new"
                className="imp-btn px-5 py-2.5 text-sm font-semibold bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                새 이력서 작성
              </Link>
              <Link
                to="/jobs"
                className="imp-btn px-5 py-2.5 text-sm font-semibold bg-white dark:bg-neutral-800 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-neutral-700 rounded-lg"
              >
                채용 공고 보기
              </Link>
            </>
          )}
        </div>
      )}
    </section>
  );
}

function HeroSkeleton() {
  return (
    <div className="w-full max-w-6xl mx-auto px-4">
      <div className="aspect-[16/6] bg-gradient-to-br from-slate-100 to-slate-200 dark:from-neutral-800 dark:to-neutral-900 rounded-2xl animate-pulse" />
    </div>
  );
}
