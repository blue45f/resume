import { useQuery } from '@tanstack/react-query';
import {
  fetchResumes,
  fetchResume,
  fetchBookmarks,
  fetchJobs,
  fetchJob,
  fetchCoverLetters,
  fetchCoverLetter,
  fetchScouts,
  fetchSentScouts,
  fetchConversations,
  fetchMessages,
  fetchFollowers,
  fetchFollowing,
  fetchApplications,
  fetchApplicationStats,
  fetchCoaches,
  fetchCoach,
  fetchMyCoachingSessions,
  fetchProfile,
  fetchPopularSkills,
  fetchDashboard,
  fetchTags,
  fetchTemplates,
  fetchPublicTemplates,
  fetchTransformHistory,
  fetchLlmProviders,
  fetchAttachments,
  fetchVersions,
  fetchInterviewAnswers,
  fetchJobInterviewQuestions,
  fetchStudyGroups,
  fetchStudyGroup,
  fetchStudyGroupQuestions,
  fetchUnreadMessageCount,
  fetchShareLinks,
  fetchUsage,
  fetchLinkedAccounts,
  fetchAdminUsers,
  fetchPublicResumes,
  fetchResumeTrend,
  fetchResumeAnalytics,
  fetchTransformUsage,
  fetchPresets,
  type ListJobQuestionsParams,
} from '@/lib/api';
import { getToken } from '@/lib/auth';

const hasToken = () => !!getToken();

// ── Resumes ──────────────────────────────────
export function useResumes(enabled = true) {
  return useQuery({
    queryKey: ['resumes'],
    queryFn: fetchResumes,
    enabled: enabled && hasToken(),
  });
}

export function useResume(id: string | undefined) {
  return useQuery({
    queryKey: ['resume', id],
    queryFn: () => fetchResume(id!),
    enabled: !!id,
  });
}

export function usePublicResumes() {
  return useQuery({
    queryKey: ['resumes', 'public'],
    queryFn: fetchPublicResumes,
  });
}

export function useResumeTrend(id: string | undefined) {
  return useQuery({
    queryKey: ['resume-trend', id],
    queryFn: () => fetchResumeTrend(id!),
    enabled: !!id,
  });
}

export function useResumeAnalytics(id: string | undefined) {
  return useQuery({
    queryKey: ['resume-analytics', id],
    queryFn: () => fetchResumeAnalytics(id!),
    enabled: !!id,
  });
}

// ── Bookmarks ────────────────────────────────
export function useBookmarks(enabled = true) {
  return useQuery({
    queryKey: ['bookmarks'],
    queryFn: fetchBookmarks,
    enabled: enabled && hasToken(),
  });
}

// ── Tags ─────────────────────────────────────
export function useTags(enabled = true) {
  return useQuery({
    queryKey: ['tags'],
    queryFn: fetchTags,
    enabled,
  });
}

// ── Templates ────────────────────────────────
export function useTemplates() {
  return useQuery({
    queryKey: ['templates'],
    queryFn: fetchTemplates,
  });
}

export function usePublicTemplates(category?: string) {
  return useQuery({
    queryKey: ['templates', 'public', category ?? 'all'],
    queryFn: () => fetchPublicTemplates(category),
  });
}

export function usePresets() {
  return useQuery({
    queryKey: ['presets'],
    queryFn: fetchPresets,
  });
}

// ── Jobs ─────────────────────────────────────
export function useJobs(query?: string) {
  return useQuery({
    queryKey: ['jobs', query ?? ''],
    queryFn: () => fetchJobs(query),
  });
}

export function useJob(id: string | undefined) {
  return useQuery({
    queryKey: ['job', id],
    queryFn: () => fetchJob(id!),
    enabled: !!id,
  });
}

// ── Cover Letters ────────────────────────────
export function useCoverLetters() {
  return useQuery({
    queryKey: ['cover-letters'],
    queryFn: fetchCoverLetters,
    enabled: hasToken(),
  });
}

export function useCoverLetter(id: string | undefined) {
  return useQuery({
    queryKey: ['cover-letter', id],
    queryFn: () => fetchCoverLetter(id!),
    enabled: !!id,
  });
}

// ── Scouts / Social ──────────────────────────
export function useScouts() {
  return useQuery({
    queryKey: ['scouts'],
    queryFn: fetchScouts,
    enabled: hasToken(),
  });
}

export function useSentScouts(enabled = true) {
  return useQuery({
    queryKey: ['scouts', 'sent'],
    queryFn: fetchSentScouts,
    enabled: enabled && hasToken(),
  });
}

export function useFollowers() {
  return useQuery({
    queryKey: ['followers'],
    queryFn: fetchFollowers,
    enabled: hasToken(),
  });
}

export function useFollowing() {
  return useQuery({
    queryKey: ['following'],
    queryFn: fetchFollowing,
    enabled: hasToken(),
  });
}

// ── Messages ─────────────────────────────────
export function useConversations() {
  return useQuery({
    queryKey: ['conversations'],
    queryFn: fetchConversations,
    enabled: hasToken(),
  });
}

export function useMessages(partnerId: string | undefined) {
  return useQuery({
    queryKey: ['messages', partnerId],
    queryFn: () => fetchMessages(partnerId!),
    enabled: !!partnerId,
  });
}

export function useUnreadMessageCount() {
  return useQuery({
    queryKey: ['messages', 'unread-count'],
    queryFn: fetchUnreadMessageCount,
    enabled: hasToken(),
  });
}

// ── Applications ─────────────────────────────
export function useApplications() {
  return useQuery({
    queryKey: ['applications'],
    queryFn: fetchApplications,
    enabled: hasToken(),
  });
}

export function useApplicationStats() {
  return useQuery({
    queryKey: ['applications', 'stats'],
    queryFn: fetchApplicationStats,
    enabled: hasToken(),
  });
}

// ── Coaching ─────────────────────────────────
export function useCoaches(
  params: { specialty?: string; minRate?: number; maxRate?: number } = {},
) {
  return useQuery({
    queryKey: ['coaches', params],
    queryFn: () => fetchCoaches(params),
  });
}

export function useCoach(id: string | undefined) {
  return useQuery({
    queryKey: ['coach', id],
    queryFn: () => fetchCoach(id!),
    enabled: !!id,
  });
}

export function useMyCoachingSessions() {
  return useQuery({
    queryKey: ['coaching-sessions', 'my'],
    queryFn: fetchMyCoachingSessions,
    enabled: hasToken(),
  });
}

// ── Profile / Auth ───────────────────────────
export function useProfile() {
  return useQuery({
    queryKey: ['profile'],
    queryFn: fetchProfile,
    enabled: hasToken(),
  });
}

export function useLinkedAccounts() {
  return useQuery({
    queryKey: ['linked-accounts'],
    queryFn: fetchLinkedAccounts,
    enabled: hasToken(),
  });
}

export function useAdminUsers(search?: string) {
  return useQuery({
    queryKey: ['admin', 'users', search ?? ''],
    queryFn: () => fetchAdminUsers(search),
    enabled: hasToken(),
  });
}

// ── Dashboard / Analytics ────────────────────
export function useDashboard() {
  return useQuery({
    queryKey: ['dashboard'],
    queryFn: fetchDashboard,
    enabled: hasToken(),
  });
}

export function usePopularSkills() {
  return useQuery({
    queryKey: ['popular-skills'],
    queryFn: fetchPopularSkills,
  });
}

// ── Transform / AI ───────────────────────────
export function useTransformHistory(resumeId: string | undefined) {
  return useQuery({
    queryKey: ['transform-history', resumeId],
    queryFn: () => fetchTransformHistory(resumeId!),
    enabled: !!resumeId,
  });
}

export function useLlmProviders(resumeId: string | undefined) {
  return useQuery({
    queryKey: ['llm-providers', resumeId],
    queryFn: () => fetchLlmProviders(resumeId!),
    enabled: !!resumeId,
  });
}

export function useTransformUsage(resumeId: string | undefined) {
  return useQuery({
    queryKey: ['transform-usage', resumeId],
    queryFn: () => fetchTransformUsage(resumeId!),
    enabled: !!resumeId,
  });
}

// ── Resume Add-ons ───────────────────────────
export function useAttachments(resumeId: string | undefined) {
  return useQuery({
    queryKey: ['attachments', resumeId],
    queryFn: () => fetchAttachments(resumeId!),
    enabled: !!resumeId,
  });
}

export function useVersions(resumeId: string | undefined) {
  return useQuery({
    queryKey: ['versions', resumeId],
    queryFn: () => fetchVersions(resumeId!),
    enabled: !!resumeId,
  });
}

export function useShareLinks(resumeId: string | undefined) {
  return useQuery({
    queryKey: ['share-links', resumeId],
    queryFn: () => fetchShareLinks(resumeId!),
    enabled: !!resumeId,
  });
}

// ── Interview ────────────────────────────────
export function useInterviewAnswers() {
  return useQuery({
    queryKey: ['interview-answers'],
    queryFn: fetchInterviewAnswers,
    enabled: hasToken(),
  });
}

export function useJobInterviewQuestions(params: ListJobQuestionsParams = {}) {
  return useQuery({
    queryKey: ['job-interview-questions', params],
    queryFn: () => fetchJobInterviewQuestions(params),
  });
}

// ── Study Groups ─────────────────────────────
export function useStudyGroups(params?: {
  q?: string;
  companyName?: string;
  jobPostId?: string;
  jobKey?: string;
  mine?: boolean;
  page?: number;
  limit?: number;
}) {
  return useQuery({
    queryKey: ['study-groups', params],
    queryFn: () => fetchStudyGroups(params),
  });
}

export function useStudyGroup(id: string | undefined) {
  return useQuery({
    queryKey: ['study-group', id],
    queryFn: () => fetchStudyGroup(id!),
    enabled: !!id,
  });
}

export function useStudyGroupQuestions(id: string | undefined) {
  return useQuery({
    queryKey: ['study-group-questions', id],
    queryFn: () => fetchStudyGroupQuestions(id!),
    enabled: !!id,
  });
}

// ── Health / Usage ───────────────────────────
export function useUsage() {
  return useQuery({
    queryKey: ['usage'],
    queryFn: fetchUsage,
    enabled: hasToken(),
  });
}
