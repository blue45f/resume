import { useFeatureToggle } from '@/hooks/useResources';

interface Props {
  /** feature.X.enabled 에서 X 부분 (예: 'ai.resume', 'messaging') */
  feature: string;
  /** 기능 한글 라벨 (예: "AI 이력서 변환") */
  label: string;
  /** 활성 상태일 때 렌더할 자식 */
  children: React.ReactNode;
  /** 비활성 시 className 커스터마이즈 */
  disabledClassName?: string;
}

/**
 * admin 에서 토글된 기능을 감지해 비활성 상태면 안내 배너만 보여주는 래퍼.
 * 활성이면 children 을 그대로 렌더.
 *
 * 사용 예:
 *   <FeatureDisabledBanner feature="ai.resume" label="AI 이력서 변환">
 *     <ResumeForm />
 *   </FeatureDisabledBanner>
 */
export default function FeatureDisabledBanner({
  feature,
  label,
  children,
  disabledClassName = '',
}: Props) {
  const enabled = useFeatureToggle(feature);
  if (enabled) return <>{children}</>;
  return (
    <div
      className={`p-6 rounded-xl bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 text-center ${disabledClassName}`}
    >
      <div className="text-3xl mb-2">🛠️</div>
      <h3 className="text-sm font-semibold text-amber-900 dark:text-amber-200">
        {label} 기능이 일시 중단되었습니다
      </h3>
      <p className="text-xs text-amber-700 dark:text-amber-300 mt-2 leading-relaxed">
        관리자가 이 기능을 잠시 비활성화했습니다. 곧 다시 이용하실 수 있으니 잠시 후 다시 방문해
        주세요.
      </p>
    </div>
  );
}
