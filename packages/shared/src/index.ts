/**
 * @resume/shared — 클라이언트/서버 공통 타입·유틸·스키마
 *
 * 현재는 재export 중심. 추후 실제 파일을 이쪽으로 이전하면서 확장.
 */

export type UserType = 'personal' | 'recruiter' | 'company' | 'coach'
export type UserRole = 'user' | 'admin' | 'superadmin'
export type ResumeVisibility = 'public' | 'private' | 'link-only'
export type CoachingStatus =
  | 'pending'
  | 'confirmed'
  | 'in-progress'
  | 'completed'
  | 'cancelled'
  | 'refunded'

export const COMMISSION_RATE = 0.15
export const COACHING_DURATIONS = [30, 45, 60, 90, 120] as const
export type CoachingDuration = (typeof COACHING_DURATIONS)[number]

/**
 * P3-2 — 알림 type 중앙화.
 * 새 type 추가 시 여기와 (필요하면) 클라이언트 NotificationBell/NotificationsPage 의 매핑을
 * 동시에 업데이트해야 한다. server 측은 NotificationsService.create 가 NotificationType 만 허용.
 */
export const NOTIFICATION_TYPES = [
  'system',
  'general',
  'comment',
  'scout',
  'application_status',
  'job_search_match',
  // 이력서 공유 / 조회
  'resume_shared',
  'resume_viewed',
  // 코칭
  'coaching_nudge',
  'coaching_review_request',
  'coaching_review_received',
  // 커피챗
  'coffee_chat_request',
  'coffee_chat_response',
  'coffee_chat_reminder',
  // 커뮤니티
  'community_like',
  // 채용공고
  'job_application_received',
  'job_application_stage',
  // 결제 / 구독
  'subscription_activated',
  'subscription_expired',
  // accepted (회사/리쿠르터)
  'accepted',
  // 1:1 메시지
  'message',
  // admin 공지
  'announcement',
] as const
export type NotificationType = (typeof NOTIFICATION_TYPES)[number]
export const isNotificationType = (v: string): v is NotificationType =>
  (NOTIFICATION_TYPES as readonly string[]).includes(v)

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
] as const
export type CommunityCategory = (typeof COMMUNITY_CATEGORIES)[number]

export const STUDY_GROUP_COMPANY_TIERS = [
  'public',
  'large',
  'mid',
  'startup',
  'foreign',
  'sme',
  'freelance',
  'etc',
] as const
export type StudyGroupCompanyTier = (typeof STUDY_GROUP_COMPANY_TIERS)[number]

export const STUDY_GROUP_CAFE_CATEGORIES = [
  'interview',
  'resume',
  'coding-test',
  'study',
  'networking',
] as const
export type StudyGroupCafeCategory = (typeof STUDY_GROUP_CAFE_CATEGORIES)[number]

export const STUDY_GROUP_EXPERIENCE_LEVELS = ['new', 'junior', 'mid', 'senior', 'any'] as const
export type StudyGroupExperienceLevel = (typeof STUDY_GROUP_EXPERIENCE_LEVELS)[number]
