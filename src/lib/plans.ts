export type PlanId = 'free' | 'standard' | 'premium';

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
    id: 'standard',
    name: '스탠다드',
    price: 2900,
    yearlyPrice: 29000,
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
    id: 'premium',
    name: '프리미엄',
    price: 5900,
    yearlyPrice: 59000,
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
    id: 'standard' as PlanId,
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
    id: 'premium' as PlanId,
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
  return PLANS.find(p => p.id === planId) || PLANS[0];
}

export function canAccess(userPlan: string, feature: keyof PlanConfig['features'], userRole?: string): boolean {
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
