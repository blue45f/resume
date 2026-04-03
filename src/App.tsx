import { lazy, Suspense, useEffect } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import ErrorBoundary from '@/components/ErrorBoundary';
import { ToastContainer } from '@/components/Toast';
import OfflineBanner from '@/components/OfflineBanner';
import CookieConsent from '@/components/CookieConsent';
import HomePage from '@/pages/HomePage';
import LoginPage from '@/pages/LoginPage';
import AuthCallbackPage from '@/pages/AuthCallbackPage';
import KeyboardShortcuts from '@/components/KeyboardShortcuts';
import ScrollToTop from '@/components/ScrollToTop';
import ScrollReset from '@/components/ScrollReset';
import QuickActions from '@/components/QuickActions';
import MobileBottomNav from '@/components/MobileBottomNav';
import AnnouncementBanner from '@/components/AnnouncementBanner';
import { fetchMe } from '@/lib/auth';

// Lazy import with auto-retry on chunk load failure (배포 후 해시 변경 대응)
function lazyRetry(fn: () => Promise<any>) {
  return lazy(() => fn().catch(() => {
    // 청크 로드 실패 시 새로고침 (배포로 인한 해시 변경)
    if (!sessionStorage.getItem('chunk-retry')) {
      sessionStorage.setItem('chunk-retry', '1');
      window.location.reload();
    }
    sessionStorage.removeItem('chunk-retry');
    return fn();
  }));
}

// Lazy-loaded pages (non-critical path)
const NewResumePage = lazyRetry(() => import('@/pages/NewResumePage'));
const EditResumePage = lazyRetry(() => import('@/pages/EditResumePage'));
const PreviewPage = lazyRetry(() => import('@/pages/PreviewPage'));
const TemplatesPage = lazyRetry(() => import('@/pages/TemplatesPage'));
const TagsPage = lazyRetry(() => import('@/pages/TagsPage'));
const AutoGeneratePage = lazyRetry(() => import('@/pages/AutoGeneratePage'));
const ExplorePage = lazyRetry(() => import('@/pages/ExplorePage'));
const AboutPage = lazyRetry(() => import('@/pages/AboutPage'));
const TutorialPage = lazyRetry(() => import('@/pages/TutorialPage'));
const TermsPage = lazyRetry(() => import('@/pages/TermsPage'));
const ProfileResumePage = lazyRetry(() => import('@/pages/ProfileResumePage'));
const ApplicationsPage = lazyRetry(() => import('@/pages/ApplicationsPage'));
const CoverLetterPage = lazyRetry(() => import('@/pages/CoverLetterPage'));
const MyCoverLettersPage = lazyRetry(() => import('@/pages/MyCoverLettersPage'));
const ComparePage = lazyRetry(() => import('@/pages/ComparePage'));
const TranslatePage = lazyRetry(() => import('@/pages/TranslatePage'));
const PricingPage = lazyRetry(() => import('@/pages/PricingPage'));
const PaymentPage = lazyRetry(() => import('@/pages/PaymentPage'));
const PaymentResultPage = lazyRetry(() => import('@/pages/PaymentResultPage'));
const SettingsPage = lazyRetry(() => import('@/pages/SettingsPage'));
const AdminPage = lazyRetry(() => import('@/pages/AdminPage'));
const BookmarksPage = lazyRetry(() => import('@/pages/BookmarksPage'));
const MessagesPage = lazyRetry(() => import('@/pages/MessagesPage'));
const ScoutsPage = lazyRetry(() => import('@/pages/ScoutsPage'));
const JobsPage = lazyRetry(() => import('@/pages/JobsPage'));
const JobPostPage = lazyRetry(() => import('@/pages/JobPostPage'));
const RecruiterDashboardPage = lazyRetry(() => import('@/pages/RecruiterDashboardPage'));
const InterviewPrepPage = lazyRetry(() => import('@/pages/InterviewPrepPage'));
const NotificationsPage = lazyRetry(() => import('@/pages/NotificationsPage'));
const ShortLinkPage = lazyRetry(() => import('@/pages/ShortLinkPage'));
const FollowListPage = lazyRetry(() => import('@/pages/FollowListPage'));
const FeedbackPage = lazyRetry(() => import('@/pages/FeedbackPage'));
const NotFoundPage = lazyRetry(() => import('@/pages/NotFoundPage'));

function PageLoader() {
  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
    </div>
  );
}

export default function App() {
  // 앱 시작 시 서버에서 최신 프로필 동기화 (role/plan 등)
  useEffect(() => {
    fetchMe().catch(() => {});
  }, []);

  return (
    <ErrorBoundary>
      <OfflineBanner />
      <BrowserRouter>
        <ScrollReset />
        <a href="#main-content" className="sr-only focus:not-sr-only focus:fixed focus:top-2 focus:left-2 focus:z-[9999] focus:px-4 focus:py-2 focus:bg-blue-600 focus:text-white focus:rounded-lg focus:text-sm focus:font-medium">
          본문으로 건너뛰기
        </a>
        <AnnouncementBanner />
        <div className="min-h-screen flex flex-col bg-slate-50 overflow-x-hidden">
          <Routes>
            {/* Critical path - eager loaded */}
            <Route path="/" element={<HomePage />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/auth/callback" element={<AuthCallbackPage />} />

            {/* Lazy-loaded routes */}
            <Route path="/auto-generate" element={<Suspense fallback={<PageLoader />}><AutoGeneratePage /></Suspense>} />
            <Route path="/resumes/new" element={<Suspense fallback={<PageLoader />}><NewResumePage /></Suspense>} />
            <Route path="/resumes/:id/edit" element={<Suspense fallback={<PageLoader />}><EditResumePage /></Suspense>} />
            <Route path="/resumes/:id/preview" element={<Suspense fallback={<PageLoader />}><PreviewPage /></Suspense>} />
            <Route path="/templates" element={<Suspense fallback={<PageLoader />}><TemplatesPage /></Suspense>} />
            <Route path="/tags" element={<Suspense fallback={<PageLoader />}><TagsPage /></Suspense>} />
            <Route path="/applications" element={<Suspense fallback={<PageLoader />}><ApplicationsPage /></Suspense>} />
            <Route path="/explore" element={<Suspense fallback={<PageLoader />}><ExplorePage /></Suspense>} />
            <Route path="/about" element={<Suspense fallback={<PageLoader />}><AboutPage /></Suspense>} />
            <Route path="/tutorial" element={<Suspense fallback={<PageLoader />}><TutorialPage /></Suspense>} />
            <Route path="/terms" element={<Suspense fallback={<PageLoader />}><TermsPage /></Suspense>} />
            <Route path="/cover-letter" element={<Suspense fallback={<PageLoader />}><CoverLetterPage /></Suspense>} />
            <Route path="/my-cover-letters" element={<Suspense fallback={<PageLoader />}><MyCoverLettersPage /></Suspense>} />
            <Route path="/compare" element={<Suspense fallback={<PageLoader />}><ComparePage /></Suspense>} />
            <Route path="/translate" element={<Suspense fallback={<PageLoader />}><TranslatePage /></Suspense>} />
            <Route path="/pricing" element={<Suspense fallback={<PageLoader />}><PricingPage /></Suspense>} />
            <Route path="/payment" element={<Suspense fallback={<PageLoader />}><PaymentPage /></Suspense>} />
            <Route path="/payment/success" element={<Suspense fallback={<PageLoader />}><PaymentResultPage /></Suspense>} />
            <Route path="/payment/fail" element={<Suspense fallback={<PageLoader />}><PaymentResultPage /></Suspense>} />
            <Route path="/settings" element={<Suspense fallback={<PageLoader />}><SettingsPage /></Suspense>} />
            <Route path="/bookmarks" element={<Suspense fallback={<PageLoader />}><BookmarksPage /></Suspense>} />
            <Route path="/messages" element={<Suspense fallback={<PageLoader />}><MessagesPage /></Suspense>} />
            <Route path="/scouts" element={<Suspense fallback={<PageLoader />}><ScoutsPage /></Suspense>} />
            <Route path="/jobs/new" element={<Suspense fallback={<PageLoader />}><JobPostPage /></Suspense>} />
            <Route path="/jobs" element={<Suspense fallback={<PageLoader />}><JobsPage /></Suspense>} />
            <Route path="/recruiter" element={<Suspense fallback={<PageLoader />}><RecruiterDashboardPage /></Suspense>} />
            <Route path="/interview-prep" element={<Suspense fallback={<PageLoader />}><InterviewPrepPage /></Suspense>} />
            <Route path="/social/follows" element={<Suspense fallback={<PageLoader />}><FollowListPage /></Suspense>} />
            <Route path="/feedback" element={<Suspense fallback={<PageLoader />}><FeedbackPage /></Suspense>} />
            <Route path="/notifications" element={<Suspense fallback={<PageLoader />}><NotificationsPage /></Suspense>} />
            <Route path="/admin" element={<Suspense fallback={<PageLoader />}><AdminPage /></Suspense>} />
            <Route path="/r/:code" element={<Suspense fallback={<PageLoader />}><ShortLinkPage /></Suspense>} />
            <Route path="/@:username/:slug" element={<Suspense fallback={<PageLoader />}><ProfileResumePage /></Suspense>} />
            <Route path="*" element={<Suspense fallback={<PageLoader />}><NotFoundPage /></Suspense>} />
          </Routes>
        </div>
        <MobileBottomNav />
        <QuickActions />
        <ScrollToTop />
        <KeyboardShortcuts />
        <CookieConsent />
        <ToastContainer />
      </BrowserRouter>
    </ErrorBoundary>
  );
}
