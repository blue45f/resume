import { useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { usePublicGet } from '@/hooks/useResources';

export default function ShortLinkPage() {
  const { code } = useParams<{ code: string }>();
  const navigate = useNavigate();
  const { data, isError } = usePublicGet<{ id: string }>(
    ['short-link', code],
    `/api/resumes/short/${code}`,
    { enabled: !!code, staleTime: 0 },
  );

  useEffect(() => {
    if (data?.id) {
      navigate(`/resumes/${data.id}/preview`, { replace: true });
    }
  }, [data, navigate]);

  if (isError) {
    return (
      <div className="flex-1 flex items-center justify-center bg-slate-50 dark:bg-slate-900">
        <div className="text-center px-4">
          <p className="text-6xl font-black text-slate-200 dark:text-slate-700 mb-4">404</p>
          <p className="text-slate-600 dark:text-slate-400 mb-4">이력서를 찾을 수 없습니다</p>
          <button onClick={() => navigate('/')} className="text-blue-600 hover:underline">
            홈으로
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex items-center justify-center">
      <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
    </div>
  );
}
