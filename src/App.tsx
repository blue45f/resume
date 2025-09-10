import { BrowserRouter, Routes, Route } from 'react-router-dom';
import ErrorBoundary from '@/components/ErrorBoundary';
import { ToastContainer } from '@/components/Toast';
import HomePage from '@/pages/HomePage';
import NewResumePage from '@/pages/NewResumePage';
import EditResumePage from '@/pages/EditResumePage';
import PreviewPage from '@/pages/PreviewPage';
import TemplatesPage from '@/pages/TemplatesPage';
import TagsPage from '@/pages/TagsPage';
import LoginPage from '@/pages/LoginPage';
import AuthCallbackPage from '@/pages/AuthCallbackPage';
import AutoGeneratePage from '@/pages/AutoGeneratePage';
import ExplorePage from '@/pages/ExplorePage';
import AboutPage from '@/pages/AboutPage';
import TutorialPage from '@/pages/TutorialPage';
import TermsPage from '@/pages/TermsPage';
import ProfileResumePage from '@/pages/ProfileResumePage';

export default function App() {
  return (
    <ErrorBoundary>
      <BrowserRouter>
        <div className="min-h-screen flex flex-col bg-slate-50">
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/auth/callback" element={<AuthCallbackPage />} />
            <Route path="/auto-generate" element={<AutoGeneratePage />} />
            <Route path="/resumes/new" element={<NewResumePage />} />
            <Route path="/resumes/:id/edit" element={<EditResumePage />} />
            <Route path="/resumes/:id/preview" element={<PreviewPage />} />
            <Route path="/templates" element={<TemplatesPage />} />
            <Route path="/tags" element={<TagsPage />} />
            <Route path="/explore" element={<ExplorePage />} />
            <Route path="/about" element={<AboutPage />} />
            <Route path="/tutorial" element={<TutorialPage />} />
            <Route path="/terms" element={<TermsPage />} />
            <Route path="/@:username/:slug" element={<ProfileResumePage />} />
          </Routes>
        </div>
        <ToastContainer />
      </BrowserRouter>
    </ErrorBoundary>
  );
}
