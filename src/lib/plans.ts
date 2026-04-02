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
    customDomain: boolean;
    teamMembers: number;
  };
  badge: string;
  popular?: boolean;
}

export const PLANS: PlanConfig[] = [
  {
    id: 'free',
    name: '무료',
    price: 0,
    yearlyPrice: 0,
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
      customDomain: false,
      teamMembers: 1,
    },
    badge: '🆓',
  },
  {
    id: 'pro',
    name: '프로',
    price: 9900,
    yearlyPrice: 99000,
    features: {
      maxResumes: -1, // unlimited
      aiTransformsPerMonth: -1,
      themes: 10,
      exportFormats: ['txt', 'md', 'pdf'],
      atsCheck: true,
      aiCoaching: true,
      coverLetter: true,
      translation: true,
      jobTracker: true,
      prioritySupport: true,
      customDomain: false,
      teamMembers: 1,
    },
    badge: '⭐',
    popular: true,
  },
  {
    id: 'enterprise',
    name: '엔터프라이즈',
    price: 29900,
    yearlyPrice: 299000,
    features: {
      maxResumes: -1,
      aiTransformsPerMonth: -1,
      themes: 10,
      exportFormats: ['txt', 'md', 'pdf'],
      atsCheck: true,
      aiCoaching: true,
      coverLetter: true,
      translation: true,
      jobTracker: true,
      prioritySupport: true,
      customDomain: true,
      teamMembers: 10,
    },
    badge: '💎',
  },
];

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
