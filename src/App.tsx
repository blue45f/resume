import { BrowserRouter, Routes, Route } from 'react-router-dom';
import HomePage from '@/pages/HomePage';
import NewResumePage from '@/pages/NewResumePage';
import EditResumePage from '@/pages/EditResumePage';
import PreviewPage from '@/pages/PreviewPage';
import TemplatesPage from '@/pages/TemplatesPage';
import TagsPage from '@/pages/TagsPage';
import LoginPage from '@/pages/LoginPage';
import AuthCallbackPage from '@/pages/AuthCallbackPage';
import AutoGeneratePage from '@/pages/AutoGeneratePage';

export default function App() {
  return (
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
        </Routes>
      </div>
    </BrowserRouter>
  );
}
