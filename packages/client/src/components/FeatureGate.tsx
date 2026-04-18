import { Link } from 'react-router-dom';
import { getUser } from '@/lib/auth';
import { canAccess, isMonetizationEnabled, type PlanConfig } from '@/lib/plans';

interface Props {
  feature: keyof PlanConfig['features'];
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

export default function FeatureGate({ feature, children, fallback }: Props) {
  const user = getUser();
  const userPlan = user?.plan || 'free';

  if (canAccess(userPlan, feature, user?.role)) {
    return <>{children}</>;
  }

  if (fallback) return <>{fallback}</>;

  // 유료화 OFF → 안내 없이 그냥 통과 (canAccess가 true를 반환하므로 여기 도달하지 않음)
  // 유료화 ON → 업그레이드 안내
  if (!isMonetizationEnabled()) return <>{children}</>;

  return (
    <div className="p-4 bg-gradient-to-br from-indigo-50 to-purple-50 dark:from-indigo-900/20 dark:to-purple-900/20 border border-indigo-200 dark:border-indigo-800 rounded-xl text-center">
      <span className="text-2xl mb-2 block">⭐</span>
      <p className="text-sm font-medium text-indigo-800 dark:text-indigo-300">프로 플랜 기능</p>
      <p className="text-xs text-indigo-600 dark:text-indigo-400 mt-1 mb-3">
        이 기능은 프로 이상 플랜에서 사용 가능합니다
      </p>
      <Link
        to="/pricing"
        className="inline-block px-4 py-1.5 bg-indigo-600 text-white text-xs font-medium rounded-lg hover:bg-indigo-700 transition-colors"
      >
        플랜 업그레이드
      </Link>
    </div>
  );
}
