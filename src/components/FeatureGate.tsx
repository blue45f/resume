import { Link } from 'react-router-dom';
import { getUser } from '@/lib/auth';
import { canAccess, type PlanConfig } from '@/lib/plans';

interface Props {
  feature: keyof PlanConfig['features'];
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

export default function FeatureGate({ feature, children, fallback }: Props) {
  const user = getUser();
  const userPlan = user?.plan || 'free';

  if (canAccess(userPlan, feature)) {
    return <>{children}</>;
  }

  return fallback ? <>{fallback}</> : (
    <div className="p-4 bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-900/20 dark:to-orange-900/20 border border-amber-200 dark:border-amber-800 rounded-xl text-center">
      <span className="text-2xl mb-2 block">&#11088;</span>
      <p className="text-sm font-medium text-amber-800 dark:text-amber-300">프로 플랜 기능</p>
      <p className="text-xs text-amber-600 dark:text-amber-400 mt-1 mb-3">이 기능은 프로 이상 플랜에서 사용 가능합니다</p>
      <Link to="/pricing" className="inline-block px-4 py-1.5 bg-amber-600 text-white text-xs font-medium rounded-lg hover:bg-amber-700 transition-colors">
        업그레이드
      </Link>
    </div>
  );
}
