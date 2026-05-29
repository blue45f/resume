// Plan ID·가격은 서버 billing.service PLANS(정본, 실제 charge/grant/gate 사용)와 일치시킨다.
// 서버가 user.plan 에 free/pro/enterprise 를 쓰므로 클라도 동일 vocab 을 써야 게이팅이 풀린다.
// features 모델(게이팅 키)은 클라 고유 — FeatureGate 가 의존하므로 유지.
// 가격(월/연): pro 9900/99000, enterprise 49000/490000 (서버 priceMonthlyKRW/priceYearlyKRW).
export type PlanId = 'free' | 'pro' | 'enterprise';

export interface PlanConfig {
  id: PlanId;
  name: string;
  price: number; // monthly KRW
  yearlyPrice: number;
  features: {
    maxResumes: number;
    aiTransformsPerMonth: number;
    themes: number;
    exportFormats: string[];
    atsCheck: boolean;
    aiCoaching: boolean;
    coverLetter: boolean;
    translation: boolean;
    jobTracker: boolean;
    prioritySupport: boolean;
    scoutMessages: number; // 리크루터 스카우트 월 발송 수
    jobPosts: number; // 채용 공고 등록 수
  };
  badge: string;
  popular?: boolean;
  description: string;
}

export const PLANS: PlanConfig[] = [
  {
    id: 'free',
    name: '무료',
    price: 0,
    yearlyPrice: 0,
    description: '취업 준비의 첫 걸음',
    features: {
      maxResumes: 3,
      aiTransformsPerMonth: 5,
      themes: 3,
      exportFormats: ['txt'],
      atsCheck: true,
      aiCoaching: false,
      coverLetter: false,
      translation: false,
      jobTracker: true,
      prioritySupport: false,
      scoutMessages: 0,
      jobPosts: 0,
    },
    badge: '🆓',
  },
  {
    id: 'pro',
    name: 'Pro',
    price: 9900,
    yearlyPrice: 99000,
    description: '본격적인 취업 활동에',
    features: {
      maxResumes: 10,
      aiTransformsPerMonth: 30,
      themes: 10,
      exportFormats: ['txt', 'md'],
      atsCheck: true,
      aiCoaching: true,
      coverLetter: true,
      translation: false,
      jobTracker: true,
      prioritySupport: false,
      scoutMessages: 5,
      jobPosts: 3,
    },
    badge: '⭐',
    popular: true,
  },
  {
    id: 'enterprise',
    name: 'Enterprise',
    price: 49000,
    yearlyPrice: 490000,
    description: '모든 기능 무제한',
    features: {
      maxResumes: -1,
      aiTransformsPerMonth: -1,
      themes: 15,
      exportFormats: ['txt', 'md', 'pdf'],
      atsCheck: true,
      aiCoaching: true,
      coverLetter: true,
      translation: true,
      jobTracker: true,
      prioritySupport: true,
      scoutMessages: -1,
      jobPosts: -1,
    },
    badge: '💎',
  },
];

// 리쿠르터 표시용 카탈로그. ID 는 게이팅을 위해 서버 vocab(free/pro/enterprise)과 일치시키되,
// 가격(19900/49900)은 시커와 다른 리쿠르터 전용 값으로 유지한다. 단 서버 billing 은 단일
// 카탈로그(9900/49000)만 charge 하므로, 리쿠르터 차등 과금이 필요하면 서버에 리쿠르터 카탈로그
// 추가가 선행되어야 한다(docs/PAYMENT_ACTIVATION.md). 현재는 게이팅만 정상화.
export const RECRUITER_PLANS: PlanConfig[] = [
  {
    id: 'free' as PlanId,
    name: '무료',
    price: 0,
    yearlyPrice: 0,
    description: '기본 채용 활동',
    features: {
      maxResumes: 0,
      aiTransformsPerMonth: 0,
      themes: 0,
      exportFormats: [],
      atsCheck: false,
      aiCoaching: false,
      coverLetter: false,
      translation: false,
      jobTracker: false,
      prioritySupport: false,
      scoutMessages: 3,
      jobPosts: 1,
    },
    badge: '🆓',
  },
  {
    id: 'pro',
    name: '비즈니스',
    price: 19900,
    yearlyPrice: 199000,
    description: '적극적인 채용 활동',
    features: {
      maxResumes: 0,
      aiTransformsPerMonth: 0,
      themes: 0,
      exportFormats: [],
      atsCheck: false,
      aiCoaching: false,
      coverLetter: false,
      translation: false,
      jobTracker: false,
      prioritySupport: true,
      scoutMessages: 30,
      jobPosts: 10,
    },
    badge: '🏢',
    popular: true,
  },
  {
    id: 'enterprise',
    name: '프리미엄',
    price: 49900,
    yearlyPrice: 499000,
    description: '대규모 채용',
    features: {
      maxResumes: 0,
      aiTransformsPerMonth: 0,
      themes: 0,
      exportFormats: [],
      atsCheck: false,
      aiCoaching: false,
      coverLetter: false,
      translation: false,
      jobTracker: false,
      prioritySupport: true,
      scoutMessages: -1,
      jobPosts: -1,
    },
    badge: '💎',
  },
];

export function getPlansForUserType(userType?: string): PlanConfig[] {
  if (userType === 'recruiter' || userType === 'company') return RECRUITER_PLANS;
  return PLANS;
}

export function getPlan(planId: string): PlanConfig {
  return PLANS.find((p) => p.id === planId) || PLANS[0];
}

// 유료화 비활성화 여부를 런타임에 확인 (system-config/public API 응답 캐시)
let _monetizationEnabled: boolean | null = null;
export function setMonetizationEnabled(v: boolean) {
  _monetizationEnabled = v;
}
export function isMonetizationEnabled(): boolean {
  return _monetizationEnabled !== false;
}

export function canAccess(
  userPlan: string,
  feature: keyof PlanConfig['features'],
  userRole?: string,
): boolean {
  // 유료화 OFF → 모든 사용자 모든 기능 접근 가능
  if (_monetizationEnabled === false) return true;
  // admin/superadmin은 모든 기능 사용 가능
  if (userRole === 'admin' || userRole === 'superadmin') return true;
  const plan = getPlan(userPlan);
  const value = plan.features[feature];
  if (typeof value === 'boolean') return value;
  if (typeof value === 'number') return value !== 0;
  return true;
}

export function formatPrice(price: number): string {
  if (price === 0) return '무료';
  return `₩${price.toLocaleString()}`;
}
