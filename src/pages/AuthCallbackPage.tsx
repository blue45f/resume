import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { handleAuthCallback } from '@/lib/auth';

export default function AuthCallbackPage() {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const [error, setError] = useState('');

  useEffect(() => {
    const token = params.get('token');
    if (!token) {
      setError('인증 토큰이 없습니다');
      return;
    }

    handleAuthCallback(token)
      .then(() => navigate('/'))
      .catch(() => {
        setError('인증에 실패했습니다');
        setTimeout(() => navigate('/login'), 2000);
      });
  }, [params, navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50">
      {error ? (
        <p className="text-red-600">{error}</p>
      ) : (
        <p className="text-slate-500">로그인 처리 중...</p>
      )}
    </div>
  );
}
