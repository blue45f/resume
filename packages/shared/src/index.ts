/**
 * @resume/shared — 클라이언트/서버 공통 타입·유틸·스키마
 *
 * 현재는 재export 중심. 추후 실제 파일을 이쪽으로 이전하면서 확장.
 */

export type UserType = 'personal' | 'recruiter' | 'company' | 'coach';
export type UserRole = 'user' | 'admin' | 'superadmin';
export type ResumeVisibility = 'public' | 'private' | 'link-only';
export type CoachingStatus =
  | 'pending'
  | 'confirmed'
  | 'in-progress'
  | 'completed'
  | 'cancelled'
  | 'refunded';

export const COMMISSION_RATE = 0.15;
export const COACHING_DURATIONS = [30, 45, 60, 90, 120] as const;
export type CoachingDuration = (typeof COACHING_DURATIONS)[number];

export const COMMUNITY_CATEGORIES = [
  'all',
  'scrapped',
  'notice',
  'free',
  'tips',
  'resume',
  'cover-letter',
  'interview',
  'question',
] as const;
export type CommunityCategory = (typeof COMMUNITY_CATEGORIES)[number];

export const STUDY_GROUP_COMPANY_TIERS = [
  'public',
  'large',
  'mid',
  'startup',
  'foreign',
  'sme',
  'freelance',
  'etc',
] as const;
export type StudyGroupCompanyTier = (typeof STUDY_GROUP_COMPANY_TIERS)[number];

export const STUDY_GROUP_CAFE_CATEGORIES = [
  'interview',
  'resume',
  'coding-test',
  'study',
  'networking',
] as const;
export type StudyGroupCafeCategory = (typeof STUDY_GROUP_CAFE_CATEGORIES)[number];

export const STUDY_GROUP_EXPERIENCE_LEVELS = ['new', 'junior', 'mid', 'senior', 'any'] as const;
export type StudyGroupExperienceLevel = (typeof STUDY_GROUP_EXPERIENCE_LEVELS)[number];
