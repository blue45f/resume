import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { API_URL } from '@/lib/config';

export default function ShortLinkPage() {
  const { code } = useParams<{ code: string }>();
  const navigate = useNavigate();
  const [error, setError] = useState(false);

  useEffect(() => {
    if (!code) return;
    fetch(`${API_URL}/api/resumes/short/${code}`)
      .then(r => {
        if (!r.ok) throw new Error();
        return r.json();
      })
      .then(data => {
        navigate(`/resumes/${data.id}/preview`, { replace: true });
      })
      .catch(() => setError(true));
  }, [code, navigate]);

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-900">
        <div className="text-center px-4">
          <p className="text-6xl font-black text-slate-200 dark:text-slate-700 mb-4">404</p>
          <p className="text-slate-600 dark:text-slate-400 mb-4">이력서를 찾을 수 없습니다</p>
          <button onClick={() => navigate('/')} className="text-blue-600 hover:underline">홈으로</button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
    </div>
  );
}
