import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import Header from '@/components/Header';
import ResumePreview from '@/components/ResumePreview';
import type { Resume } from '@/types/resume';

const API_URL = import.meta.env.VITE_API_URL || '';

export default function ProfileResumePage() {
  const { username, slug } = useParams<{ username: string; slug: string }>();
  const [resume, setResume] = useState<Resume | null>(null);
  const [notFound, setNotFound] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!username || !slug) return;
    let cancelled = false;
    fetch(`${API_URL}/api/resumes/@${username}/${slug}`)
      .then(res => {
        if (!res.ok) throw new Error('Not found');
        return res.json();
      })
      .then(data => { if (!cancelled) { setResume(data); setLoading(false); } })
      .catch(() => { if (!cancelled) { setNotFound(true); setLoading(false); } });
    return () => { cancelled = true; };
  }, [username, slug]);

  if (loading) {
    return (
      <>
        <Header />
        <main id="main-content" className="flex-1 py-8 px-4" role="main">
          <div className="bg-white p-8 sm:p-12 max-w-[210mm] mx-auto shadow-lg animate-pulse">
            <div className="text-center mb-10 pb-6 border-b-2 border-slate-200">
              <div className="h-8 bg-slate-200 rounded w-48 mx-auto mb-3" />
              <div className="h-4 bg-slate-100 rounded w-64 mx-auto" />
            </div>
            <div className="space-y-3">
              {[1,2,3].map(i => (<div key={i}><div className="h-5 bg-slate-100 rounded w-3/4 mb-1" /><div className="h-3 bg-slate-50 rounded w-full" /></div>))}
            </div>
          </div>
        </main>
      </>
    );
  }

  if (notFound || !resume) {
    return (
      <>
        <Header />
        <main id="main-content" className="flex-1 flex items-center justify-center" role="main">
          <div className="text-center px-4">
            <p className="text-5xl mb-4">📄</p>
            <p className="text-lg text-slate-700 mb-2">이력서를 찾을 수 없습니다</p>
            <p className="text-sm text-slate-500 mb-4">@{username}/{slug}</p>
            <Link to="/explore" className="text-blue-600 hover:underline">공개 이력서 탐색</Link>
          </div>
        </main>
      </>
    );
  }

  return (
    <>
      <Header />
      <main id="main-content" className="flex-1" role="main">
        {/* Toolbar */}
        <div className="no-print sticky top-14 sm:top-16 z-40 bg-slate-50 border-b border-slate-200">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-2.5 flex items-center justify-between">
            <div className="flex items-center gap-2 text-sm text-slate-500">
              <Link to="/explore" className="hover:text-slate-700">&larr; 탐색</Link>
              <span className="text-slate-300">|</span>
              <span className="font-medium text-slate-700">@{username}/{slug}</span>
            </div>
            <button
              onClick={() => window.print()}
              className="px-3 py-1.5 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 transition-colors"
            >
              PDF / 인쇄
            </button>
          </div>
        </div>

        <div className="py-6 sm:py-8 px-4">
          <ResumePreview ref={null} resume={resume} />
        </div>
      </main>
    </>
  );
}
