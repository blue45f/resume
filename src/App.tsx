import { lazy, Suspense } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import ErrorBoundary from '@/components/ErrorBoundary';
import { ToastContainer } from '@/components/Toast';
import CookieConsent from '@/components/CookieConsent';
import HomePage from '@/pages/HomePage';
import LoginPage from '@/pages/LoginPage';
import AuthCallbackPage from '@/pages/AuthCallbackPage';
import KeyboardShortcuts from '@/components/KeyboardShortcuts';
import ScrollToTop from '@/components/ScrollToTop';
import ScrollReset from '@/components/ScrollReset';
import QuickActions from '@/components/QuickActions';

// Lazy-loaded pages (non-critical path)
const NewResumePage = lazy(() => import('@/pages/NewResumePage'));
const EditResumePage = lazy(() => import('@/pages/EditResumePage'));
const PreviewPage = lazy(() => import('@/pages/PreviewPage'));
const TemplatesPage = lazy(() => import('@/pages/TemplatesPage'));
const TagsPage = lazy(() => import('@/pages/TagsPage'));
const AutoGeneratePage = lazy(() => import('@/pages/AutoGeneratePage'));
const ExplorePage = lazy(() => import('@/pages/ExplorePage'));
const AboutPage = lazy(() => import('@/pages/AboutPage'));
const TutorialPage = lazy(() => import('@/pages/TutorialPage'));
const TermsPage = lazy(() => import('@/pages/TermsPage'));
const ProfileResumePage = lazy(() => import('@/pages/ProfileResumePage'));
const ApplicationsPage = lazy(() => import('@/pages/ApplicationsPage'));
const CoverLetterPage = lazy(() => import('@/pages/CoverLetterPage'));
const MyCoverLettersPage = lazy(() => import('@/pages/MyCoverLettersPage'));
const ComparePage = lazy(() => import('@/pages/ComparePage'));
const TranslatePage = lazy(() => import('@/pages/TranslatePage'));
const PricingPage = lazy(() => import('@/pages/PricingPage'));
const PaymentPage = lazy(() => import('@/pages/PaymentPage'));
const PaymentResultPage = lazy(() => import('@/pages/PaymentResultPage'));
const SettingsPage = lazy(() => import('@/pages/SettingsPage'));
const AdminPage = lazy(() => import('@/pages/AdminPage'));
const NotFoundPage = lazy(() => import('@/pages/NotFoundPage'));

function PageLoader() {
  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
    </div>
  );
}

export default function App() {
  return (
    <ErrorBoundary>
      <BrowserRouter>
        <ScrollReset />
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
            <Route path="/admin" element={<Suspense fallback={<PageLoader />}><AdminPage /></Suspense>} />
            <Route path="/@:username/:slug" element={<Suspense fallback={<PageLoader />}><ProfileResumePage /></Suspense>} />
            <Route path="*" element={<Suspense fallback={<PageLoader />}><NotFoundPage /></Suspense>} />
          </Routes>
        </div>
        <QuickActions />
        <ScrollToTop />
        <KeyboardShortcuts />
        <CookieConsent />
        <ToastContainer />
      </BrowserRouter>
    </ErrorBoundary>
  );
}
