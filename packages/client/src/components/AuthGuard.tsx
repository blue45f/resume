import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getUser } from '@/lib/auth';
import { toast } from '@/components/Toast';

interface Props {
  children: React.ReactNode;
}

export default function AuthGuard({ children }: Props) {
  const user = getUser();
  const navigate = useNavigate();

  useEffect(() => {
    if (!user) {
      toast('로그인이 필요합니다', 'error');
      navigate('/login', { replace: true });
    }
  }, [user, navigate]);

  if (!user) return null;

  return <>{children}</>;
}
