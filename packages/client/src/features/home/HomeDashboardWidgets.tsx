import { lazy, Suspense } from 'react'
import { Link } from 'react-router-dom'

import CommunityWidget from './CommunityWidget'
import InterviewDiscoveryWidget from './InterviewDiscoveryWidget'
import WeeklyGoalWidget from './WeeklyGoalWidget'

import type { JobApplication } from '@/lib/api'
import type { User } from '@/lib/auth'
import type { ResumeSummary, Resume } from '@/types/resume'

import ApplicationReadinessPanel from '@/components/ApplicationReadinessPanel'
import ApplicationStreakStrip from '@/components/ApplicationStreakStrip'
import HiringTrends from '@/components/HiringTrends'
import NetworkStats from '@/components/NetworkStats'
import OnboardingBanner from '@/components/OnboardingBanner'
import ProfileCompleteness from '@/components/ProfileCompleteness'
import ProfileViewers from '@/components/ProfileViewers'
import ProfileWizard from '@/components/ProfileWizard'
import RecentActivity from '@/components/RecentActivity'
import SharedWithMeSection from '@/components/SharedWithMeSection'
import WeeklyRecapCard from '@/components/WeeklyRecapCard'
import { t } from '@/lib/i18n'
import { ROUTES } from '@/lib/routes'
import CareerLevel from '@/widgets/career-level'
import InterviewRoulette from '@/widgets/interview-roulette'
import { ResumeHealthBoost } from '@/widgets/resume-health-boost'
import ResumeHealthRing from '@/widgets/resume-health-ring'

// 차트 의존(recharts ~437KB)이 무거워 lazy load — 홈 진입 후 점진 로딩.
const DashboardStats = lazy(() => import('@/components/DashboardStats'))
const CareerInsights = lazy(() => import('@/components/CareerInsights'))

interface HomeDashboardWidgetsProps {
  user: User | null
  resumes: ResumeSummary[]
  applications: JobApplication[]
  bookmarks: { id: string; resumeId: string; title: string; name: string }[]
  filteredCount: number
  wizardResume: Resume | null
}

export default function HomeDashboardWidgets({
  user,
  resumes,
  applications,
  bookmarks,
  filteredCount,
  wizardResume,
}: HomeDashboardWidgetsProps) {
  return (
    <>
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-6">
        <h1 className="heading-accent text-xl sm:text-2xl font-bold text-slate-900 dark:text-slate-100">
          {t('home.myResumes')} ({filteredCount})
        </h1>
      </div>

      <ProfileCompleteness />
      <OnboardingBanner />
      <WeeklyRecapCard />
      <ApplicationStreakStrip applications={applications} />
      <ApplicationReadinessPanel resumes={resumes} applications={applications} />

      {wizardResume && resumes.length > 0 && (
        <ProfileWizard resume={wizardResume} resumeId={resumes[0].id} />
      )}

      {/* 창의적 위젯: 이력서 헬스 링 + 커리어 레벨 (2열) */}
      {user && resumes.length > 0 && (
        <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_minmax(0,360px)] gap-4 mb-6">
          <ResumeHealthRing resumes={resumes} />
          <CareerLevel user={user} resumes={resumes} />
        </div>
      )}

      <Suspense fallback={<div className="h-32" />}>
        <DashboardStats />
      </Suspense>

      <ProfileViewers />

      <NetworkStats />

      {user && (!user.plan || user.plan === 'free') && resumes.length >= 2 && (
        <aside className="home-pro-prompt animate-fade-in">
          <div>
            <span className="home-pro-prompt__eyebrow">Pro</span>
            <p className="home-pro-prompt__title">프로 플랜으로 업그레이드</p>
            <p className="home-pro-prompt__lede">무제한 AI 변환, 자소서, 번역 기능을 사용하세요.</p>
          </div>
          <Link to={ROUTES.pricing} className="home-pro-prompt__cta">
            요금제 보기
          </Link>
        </aside>
      )}

      {bookmarks.length > 0 && (
        <section className="home-bookmarks">
          <header className="home-bookmarks__head">
            <span className="home-bookmarks__eyebrow">Saved</span>
            <h3 className="home-bookmarks__title">북마크한 이력서</h3>
          </header>
          <div className="home-bookmarks__list">
            {bookmarks.slice(0, 5).map((b) => (
              <Link
                key={b.id}
                to={ROUTES.resume.preview(b.resumeId)}
                className="home-bookmarks__chip"
              >
                {b.title || b.name || '이력서'}
              </Link>
            ))}
          </div>
        </section>
      )}

      <SharedWithMeSection />

      <RecentActivity />

      <HiringTrends />

      <Suspense fallback={<div className="h-32" />}>
        <CareerInsights />
      </Suspense>

      <CommunityWidget />

      <InterviewDiscoveryWidget />

      {/* 창의적 위젯: 면접 질문 룰렛 */}
      <InterviewRoulette />

      {user?.userType === 'personal' && <WeeklyGoalWidget />}

      {/* 이력서 건강도 진단 — 다음 한 걸음 인사이트 */}
      {resumes.length > 0 && <ResumeHealthBoost resumes={resumes} />}
    </>
  )
}
