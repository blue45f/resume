import type {
  Resume,
  ResumeSummary,
  Template,
  TransformResult,
  LlmProvider,
  Tag,
} from '@/types/resume';
import { getCached, setCache } from './cache';
import { toast } from '@/components/Toast';

import { API_URL } from './config';

// 개발: Vite proxy로 /api → localhost:3001
// 프로덕션: VITE_API_URL 환경변수로 백엔드 URL 지정
const BASE = `${API_URL}/api`;

// ── Global loading progress bar ──────────────────────────────────
let activeRequests = 0;
let progressBarEl: HTMLDivElement | null = null;
let progressTimer: ReturnType<typeof setTimeout> | null = null;
let animationFrame: number | null = null;
let progressValue = 0;

function getProgressBar(): HTMLDivElement {
  if (!progressBarEl) {
    progressBarEl = document.createElement('div');
    progressBarEl.className = 'scroll-progress no-print';
    progressBarEl.style.width = '0%';
    progressBarEl.style.display = 'none';
    document.body.appendChild(progressBarEl);
  }
  return progressBarEl;
}

function animateProgress() {
  if (progressValue < 90) {
    progressValue += (90 - progressValue) * 0.03;
    getProgressBar().style.width = `${progressValue}%`;
    animationFrame = requestAnimationFrame(animateProgress);
  }
}

function showProgress() {
  const bar = getProgressBar();
  progressValue = 10;
  bar.style.display = '';
  bar.style.opacity = '1';
  bar.style.width = '10%';
  if (animationFrame) cancelAnimationFrame(animationFrame);
  animationFrame = requestAnimationFrame(animateProgress);
}

function hideProgress() {
  const bar = getProgressBar();
  if (animationFrame) cancelAnimationFrame(animationFrame);
  progressValue = 100;
  bar.style.width = '100%';
  setTimeout(() => {
    bar.style.opacity = '0';
    setTimeout(() => {
      bar.style.display = 'none';
      bar.style.width = '0%';
      progressValue = 0;
    }, 200);
  }, 150);
}

function trackRequestStart() {
  activeRequests++;
  if (activeRequests === 1) {
    // Only show bar if request takes >500ms
    progressTimer = setTimeout(showProgress, 500);
  }
}

function trackRequestEnd() {
  activeRequests = Math.max(0, activeRequests - 1);
  if (activeRequests === 0) {
    if (progressTimer) {
      clearTimeout(progressTimer);
      progressTimer = null;
    }
    if (getProgressBar().style.display !== 'none') {
      hideProgress();
    }
  }
}

async function fetchWithTimeout(
  url: string,
  options: RequestInit,
  timeoutMs = 30000,
): Promise<Response> {
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await fetch(url, { ...options, signal: controller.signal });
  } finally {
    clearTimeout(id);
  }
}

async function request<T>(url: string, options?: RequestInit, retries = 2): Promise<T> {
  const token = localStorage.getItem('token');
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (token) headers['Authorization'] = `Bearer ${token}`;

  const isTopLevel = retries === 2;
  if (isTopLevel) trackRequestStart();

  const attempt = async (): Promise<T> => {
    const res = await fetchWithTimeout(url, { headers, ...options }, 30000);
    if (res.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
    }
    if (res.status === 502 || res.status === 503 || res.status === 504) {
      throw new TypeError('Server deploying');
    }
    if (!res.ok) {
      const error = await res.json().catch(() => ({ message: res.statusText }));
      throw new Error(error.message || `Request failed: ${res.status}`);
    }
    return res.json();
  };

  try {
    const result = await attempt();
    if (isTopLevel) trackRequestEnd();
    return result;
  } catch (err) {
    // Render 무료 플랜 cold start / 배포 중 대응: exponential backoff 재시도
    const isNetworkError =
      err instanceof TypeError || (err instanceof DOMException && err.name === 'AbortError');
    if (retries > 0 && isNetworkError) {
      const delay = (3 - retries) * 3000; // 3초, 6초
      await new Promise((r) => setTimeout(r, delay));
      return request<T>(url, options, retries - 1);
    }
    if (isTopLevel) trackRequestEnd();
    if (err instanceof DOMException && err.name === 'AbortError') {
      const msg = '서버가 배포 중이거나 시작 중입니다. 30초 후 다시 시도해주세요.';
      toast(msg, 'error');
      throw new Error(msg);
    }
    if (err instanceof TypeError) {
      const msg = '서버에 연결할 수 없습니다. 배포 중일 수 있으니 잠시 후 다시 시도해주세요.';
      toast(msg, 'error');
      throw new Error(msg);
    }
    // Show user-facing error messages via toast
    if (err instanceof Error && err.message) {
      toast(err.message, 'error');
    }
    throw err;
  }
}

// Email Auth
export const registerUser = (data: { email: string; password: string; name: string }) =>
  request<{ token: string }>(`${BASE}/auth/register`, {
    method: 'POST',
    body: JSON.stringify(data),
  });
export const loginUser = (data: { email: string; password: string }) =>
  request<{ token: string }>(`${BASE}/auth/login`, { method: 'POST', body: JSON.stringify(data) });

// Resumes
export const fetchResumes = async (): Promise<ResumeSummary[]> => {
  const res = await request<{ data: ResumeSummary[] }>(`${BASE}/resumes`);
  return res.data;
};
export const fetchResume = (id: string) => request<Resume>(`${BASE}/resumes/${id}`);
export const createResume = (data: Omit<Resume, 'id' | 'createdAt' | 'updatedAt'>) =>
  request<Resume>(`${BASE}/resumes`, { method: 'POST', body: JSON.stringify(data) });
export const updateResume = (id: string, data: Omit<Resume, 'id' | 'createdAt' | 'updatedAt'>) =>
  request<Resume>(`${BASE}/resumes/${id}`, { method: 'PUT', body: JSON.stringify(data) });
export const deleteResume = (id: string) =>
  request<{ success: boolean }>(`${BASE}/resumes/${id}`, { method: 'DELETE' });
export const duplicateResume = (id: string) =>
  request<Resume>(`${BASE}/resumes/${id}/duplicate`, { method: 'POST' });
export const setResumeVisibility = (id: string, visibility: string) =>
  request<{ id: string; visibility: string }>(`${BASE}/resumes/${id}/visibility`, {
    method: 'PATCH',
    body: JSON.stringify({ visibility }),
  });
export const fetchPublicResumes = () => request<ResumeSummary[]>(`${BASE}/resumes/public`);
export const updateResumeSlug = (id: string, slug: string) =>
  request<{ id: string; slug: string }>(`${BASE}/resumes/${id}/slug`, {
    method: 'PATCH',
    body: JSON.stringify({ slug }),
  });

// Bookmarks
export const addBookmark = (resumeId: string) =>
  request<{ bookmarked: boolean }>(`${BASE}/resumes/${resumeId}/bookmark`, { method: 'POST' });
export const removeBookmark = (resumeId: string) =>
  request<{ bookmarked: boolean }>(`${BASE}/resumes/${resumeId}/bookmark`, { method: 'DELETE' });
export const fetchBookmarks = () =>
  request<{ id: string; resumeId: string; title: string; name: string; createdAt: string }[]>(
    `${BASE}/resumes/bookmarks/list`,
  );

// Analytics
export const fetchDashboard = () => request<any>(`${BASE}/resumes/dashboard/analytics`);
export const fetchResumeTrend = (resumeId: string) =>
  request<{ version: number; sections: number; createdAt: string }[]>(
    `${BASE}/resumes/trend/${resumeId}`,
  );
export const fetchPopularSkills = () =>
  request<{ name: string; count: number }[]>(`${BASE}/resumes/popular-skills`);
export const fetchResumeAnalytics = (resumeId: string) =>
  request<any>(`${BASE}/resumes/analytics/${resumeId}`);

// Tags
export const fetchTags = async (): Promise<(Tag & { resumeCount: number })[]> => {
  const cached = getCached<(Tag & { resumeCount: number })[]>('tags', 2 * 60 * 1000);
  if (cached) return cached;
  const data = await request<(Tag & { resumeCount: number })[]>(`${BASE}/tags`);
  setCache('tags', data);
  return data;
};
export const createTag = (data: { name: string; color?: string }) =>
  request<Tag>(`${BASE}/tags`, { method: 'POST', body: JSON.stringify(data) });
export const deleteTag = (id: string) =>
  request<{ success: boolean }>(`${BASE}/tags/${id}`, { method: 'DELETE' });
export const addTagToResume = (tagId: string, resumeId: string) =>
  request<{ success: boolean }>(`${BASE}/tags/${tagId}/resumes/${resumeId}`, { method: 'POST' });
export const removeTagFromResume = (tagId: string, resumeId: string) =>
  request<{ success: boolean }>(`${BASE}/tags/${tagId}/resumes/${resumeId}`, { method: 'DELETE' });

// Templates
export const fetchTemplates = async (): Promise<Template[]> => {
  const cached = getCached<Template[]>('templates', 5 * 60 * 1000);
  if (cached) return cached;
  const data = await request<Template[]>(`${BASE}/templates`);
  setCache('templates', data);
  return data;
};
export const fetchTemplate = (id: string) => request<Template>(`${BASE}/templates/${id}`);
export const createTemplate = (data: {
  name: string;
  description?: string;
  category?: string;
  prompt?: string;
  layout?: string;
}) => request<Template>(`${BASE}/templates`, { method: 'POST', body: JSON.stringify(data) });
export const updateTemplate = (id: string, data: Partial<Template>) =>
  request<Template>(`${BASE}/templates/${id}`, { method: 'PUT', body: JSON.stringify(data) });
export const deleteTemplate = (id: string) =>
  request<{ success: boolean }>(`${BASE}/templates/${id}`, { method: 'DELETE' });
export const fetchPublicTemplates = (category?: string) => {
  const qs = category ? `?category=${encodeURIComponent(category)}` : '';
  return request<Template[]>(`${BASE}/templates/public${qs}`);
};

// Local Transform (LLM 불필요)
export const localTransform = (resumeId: string, data: { preset?: string; templateId?: string }) =>
  request<{ text: string; method: string; preset?: string; templateName?: string }>(
    `${BASE}/templates/local-transform/${resumeId}`,
    { method: 'POST', body: JSON.stringify(data) },
  );
export const fetchPresets = () =>
  request<{ id: string; name: string; description: string }[]>(`${BASE}/templates/presets/list`);

// LLM Transform (유료/무료 LLM 사용)
export const transformResume = (
  resumeId: string,
  data: {
    templateType: string;
    targetLanguage?: string;
    jobDescription?: string;
    provider?: string;
  },
) =>
  request<TransformResult>(`${BASE}/resumes/${resumeId}/transform`, {
    method: 'POST',
    body: JSON.stringify(data),
  });

export const fetchTransformHistory = (resumeId: string) =>
  request<TransformResult[]>(`${BASE}/resumes/${resumeId}/transform/history`);

export const fetchLlmProviders = (resumeId: string) =>
  request<LlmProvider[]>(`${BASE}/resumes/${resumeId}/transform/providers`);

// LLM Transform Streaming
export async function* transformResumeStream(
  resumeId: string,
  data: {
    templateType: string;
    targetLanguage?: string;
    jobDescription?: string;
    provider?: string;
  },
): AsyncGenerator<{ type: string; text?: string; id?: string; tokensUsed?: number }> {
  const token = localStorage.getItem('token');
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (token) headers['Authorization'] = `Bearer ${token}`;

  const res = await fetch(`${API_URL}/api/resumes/${resumeId}/transform/stream`, {
    method: 'POST',
    headers,
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error('Transform stream failed');
  if (!res.body) throw new Error('No response body');

  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let buffer = '';

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split('\n');
    buffer = lines.pop() || '';
    for (const line of lines) {
      if (line.startsWith('data: ')) {
        try {
          yield JSON.parse(line.slice(6));
        } catch {
          /* skip */
        }
      }
    }
  }
}

// Versions
export const fetchVersions = (resumeId: string) =>
  request<{ id: string; versionNumber: number; description: string; createdAt: string }[]>(
    `${BASE}/resumes/${resumeId}/versions`,
  );
export const restoreVersion = (resumeId: string, versionId: string) =>
  request<{ success: boolean; restoredVersion: number }>(
    `${BASE}/resumes/${resumeId}/versions/${versionId}/restore`,
    { method: 'POST' },
  );

// Export
export const exportResumeText = (id: string) => `${BASE}/resumes/${id}/export/text`;
export const exportResumeMarkdown = (id: string) => `${BASE}/resumes/${id}/export/markdown`;
export const exportResumeJson = (id: string) => `${BASE}/resumes/${id}/export/json`;

// Job Applications
export interface JobApplication {
  id: string;
  company: string;
  position: string;
  url?: string;
  status: string;
  appliedDate?: string;
  notes?: string;
  salary?: string;
  location?: string;
  resumeId?: string;
  visibility?: string;
  createdAt: string;
  updatedAt: string;
}

export const fetchApplications = () => request<JobApplication[]>(`${BASE}/applications`);
export const fetchApplicationStats = () =>
  request<{ total: number; byStatus: Record<string, number> }>(`${BASE}/applications/stats`);
export const createApplication = (data: Partial<JobApplication>) =>
  request<JobApplication>(`${BASE}/applications`, { method: 'POST', body: JSON.stringify(data) });
export const updateApplication = (id: string, data: Partial<JobApplication>) =>
  request<JobApplication>(`${BASE}/applications/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  });
export const deleteApplication = (id: string) =>
  request<{ success: boolean }>(`${BASE}/applications/${id}`, { method: 'DELETE' });

// AI Analysis
export const analyzeResumeFeedback = (resumeId: string, provider?: string) =>
  request<any>(`${BASE}/resumes/${resumeId}/transform/feedback`, {
    method: 'POST',
    body: JSON.stringify({ provider }),
  });
export const analyzeJobMatch = (resumeId: string, jobDescription: string, provider?: string) =>
  request<any>(`${BASE}/resumes/${resumeId}/transform/job-match`, {
    method: 'POST',
    body: JSON.stringify({ jobDescription, provider }),
  });
export const generateInterviewQuestions = (resumeId: string, jobRole?: string, provider?: string) =>
  request<any>(`${BASE}/resumes/${resumeId}/transform/interview`, {
    method: 'POST',
    body: JSON.stringify({ jobRole, provider }),
  });
export const fetchTransformUsage = (resumeId: string) =>
  request<{ totalTransformations: number; totalTokensUsed: number }>(
    `${BASE}/resumes/${resumeId}/transform/usage`,
  );

// AI Inline Assist
export const aiInlineAssist = (resumeId: string, text: string, type: string) =>
  request<{ original: string; improved: string; type: string; tokensUsed: number }>(
    `${BASE}/resumes/${resumeId}/transform/inline-assist`,
    { method: 'POST', body: JSON.stringify({ text, type }) },
  );

// Translation
export const translateResume = (resumeId: string, targetLanguage: string) =>
  request<{ text: string }>(`${BASE}/resumes/${resumeId}/transform`, {
    method: 'POST',
    body: JSON.stringify({ templateType: 'english', targetLanguage }),
  });

// Share Links
export const createShareLink = (
  resumeId: string,
  data: { expiresInHours?: number; password?: string },
) =>
  request<{ id: string; token: string; expiresAt: string; hasPassword: boolean }>(
    `${BASE}/resumes/${resumeId}/share`,
    { method: 'POST', body: JSON.stringify(data) },
  );
export const fetchShareLinks = (resumeId: string) =>
  request<
    { id: string; token: string; expiresAt: string; hasPassword: boolean; isExpired: boolean }[]
  >(`${BASE}/resumes/${resumeId}/share`);
export const deleteShareLink = (id: string) =>
  request<{ success: boolean }>(`${BASE}/share/${id}`, { method: 'DELETE' });

// Attachments
export const uploadAttachment = async (
  resumeId: string,
  file: File,
  category?: string,
  description?: string,
) => {
  const formData = new FormData();
  formData.append('file', file);
  if (category) formData.append('category', category);
  if (description) formData.append('description', description);
  const token = localStorage.getItem('token');
  const headers: Record<string, string> = {};
  if (token) headers['Authorization'] = `Bearer ${token}`;
  const res = await fetch(`${BASE}/resumes/${resumeId}/attachments`, {
    method: 'POST',
    headers,
    body: formData,
  });
  if (!res.ok) throw new Error('Upload failed');
  return res.json();
};
export const fetchAttachments = (resumeId: string) =>
  request<any[]>(`${BASE}/resumes/${resumeId}/attachments`);
export const deleteAttachment = (id: string) =>
  request<{ success: boolean }>(`${BASE}/attachments/${id}`, { method: 'DELETE' });

// Social
export const followUser = (userId: string) =>
  request<{ followed: boolean }>(`${BASE}/social/follow/${userId}`, { method: 'POST' });
export const unfollowUser = (userId: string) =>
  request<{ followed: boolean }>(`${BASE}/social/follow/${userId}`, { method: 'DELETE' });
export const fetchFollowers = () => request<any[]>(`${BASE}/social/followers`);
export const fetchFollowing = () => request<any[]>(`${BASE}/social/following`);
export const sendScoutMessage = (data: {
  receiverId: string;
  resumeId?: string;
  company: string;
  position: string;
  message: string;
}) => request<any>(`${BASE}/social/scout`, { method: 'POST', body: JSON.stringify(data) });
export const fetchScouts = () => request<any[]>(`${BASE}/social/scouts`);

// Messages
export const sendDirectMessage = (receiverId: string, content: string) =>
  request<any>(`${BASE}/social/messages/${receiverId}`, {
    method: 'POST',
    body: JSON.stringify({ content }),
  });
export const fetchConversations = () => request<any[]>(`${BASE}/social/messages`);
export const fetchMessages = (partnerId: string) =>
  request<any[]>(`${BASE}/social/messages/${partnerId}`);

// Cover Letters
export const fetchCoverLetters = () => request<any[]>(`${BASE}/cover-letters`);
export const fetchCoverLetter = (id: string) => request<any>(`${BASE}/cover-letters/${id}`);
export const deleteCoverLetter = (id: string) =>
  request<{ success: boolean }>(`${BASE}/cover-letters/${id}`, { method: 'DELETE' });

// Jobs
export const fetchJobs = (query?: string) => {
  const qs = query ? `?q=${encodeURIComponent(query)}` : '';
  return request<any[]>(`${BASE}/jobs${qs}`);
};
export const fetchJob = (id: string) => request<any>(`${BASE}/jobs/${id}`);
export const createJob = (data: any) =>
  request<any>(`${BASE}/jobs`, { method: 'POST', body: JSON.stringify(data) });
export const updateJob = (id: string, data: any) =>
  request<any>(`${BASE}/jobs/${id}`, { method: 'PUT', body: JSON.stringify(data) });
export const deleteJob = (id: string) =>
  request<{ success: boolean }>(`${BASE}/jobs/${id}`, { method: 'DELETE' });

// Notifications
export const fetchNotifications = () => request<any[]>(`${BASE}/notifications`);
export const markAllNotificationsRead = () =>
  request<{ success: boolean }>(`${BASE}/notifications/read-all`, { method: 'POST' });
export const markNotificationRead = (id: string) =>
  request<any>(`${BASE}/notifications/${id}/read`, { method: 'PATCH' });
export const deleteNotification = (id: string) =>
  request<{ success: boolean }>(`${BASE}/notifications/${id}`, { method: 'DELETE' });
export const deleteNotificationsBulk = (ids: string[]) =>
  request<{ success: boolean; deleted: number }>(`${BASE}/notifications/delete-bulk`, {
    method: 'POST',
    body: JSON.stringify({ ids }),
  });

// Cover Letter Create
export const createCoverLetter = (data: any) =>
  request<any>(`${BASE}/cover-letters`, { method: 'POST', body: JSON.stringify(data) });

// Health / Usage
export const fetchUsage = () =>
  request<{ feature: string; count: number }[]>(`${BASE}/health/usage`);

// Auth helpers (use request() to avoid raw fetch duplication)
export const changePassword = (currentPassword: string, newPassword: string) =>
  request<{ success: boolean; message: string }>(`${BASE}/auth/change-password`, {
    method: 'POST',
    body: JSON.stringify({ currentPassword, newPassword }),
  });
export const deleteAccount = () =>
  request<{ success: boolean }>(`${BASE}/auth/account`, { method: 'DELETE' });
export const updateProfile = (data: {
  userType?: string;
  name?: string;
  companyName?: string;
  companyTitle?: string;
}) => request<any>(`${BASE}/auth/profile`, { method: 'PATCH', body: JSON.stringify(data) });
export const fetchProfile = () => request<any>(`${BASE}/auth/me`);
export const fetchLinkedAccounts = () => request<any>(`${BASE}/auth/linked-accounts`);
export const fetchAdminUsers = (search?: string) => {
  const qs = search ? `?search=${encodeURIComponent(search)}` : '';
  return request<any[]>(`${BASE}/auth/admin/users${qs}`);
};
export const setUserRole = (userId: string, role: string) =>
  request<any>(`${BASE}/auth/admin/users/${userId}/role`, {
    method: 'POST',
    body: JSON.stringify({ role }),
  });

// Scout
export const markScoutRead = (id: string) =>
  request<any>(`${BASE}/social/scouts/${id}/read`, { method: 'POST' });

// Unread message count
export const fetchUnreadMessageCount = () =>
  request<{ count: number }>(`${BASE}/social/messages/unread/count`);

// Interview Answers
export interface InterviewAnswer {
  id: string;
  question: string;
  answer: string;
  resumeId?: string | null;
  jobRole?: string | null;
  createdAt: string;
}

export const saveInterviewAnswer = (data: {
  question: string;
  answer: string;
  resumeId?: string;
  jobRole?: string;
}) =>
  request<InterviewAnswer>(`${BASE}/interview/answers`, {
    method: 'POST',
    body: JSON.stringify(data),
  });

export const fetchInterviewAnswers = () => request<InterviewAnswer[]>(`${BASE}/interview/answers`);

export const deleteInterviewAnswer = (id: string) =>
  request<{ success: boolean }>(`${BASE}/interview/answers/${id}`, { method: 'DELETE' });

// Scout management
export const fetchSentScouts = () => request<any[]>(`${BASE}/social/scouts/sent`);
export const respondToScout = (id: string, status: string) =>
  request<any>(`${BASE}/social/scouts/${id}/respond`, {
    method: 'POST',
    body: JSON.stringify({ status }),
  });
export const sendBulkScout = (data: { targetIds: string[]; message: string; company: string }) =>
  request<any>(`${BASE}/social/scouts/bulk`, {
    method: 'POST',
    body: JSON.stringify(data),
  });

// ── Per-Job Expected Questions + Shared Bank ──────────────────────
export interface JobInterviewQuestion {
  id: string;
  jobPostId: string | null;
  curatedJobId: string | null;
  companyName: string;
  position: string;
  question: string;
  sampleAnswer: string;
  category: string;
  difficulty: string;
  source: string;
  authorId: string | null;
  upvotes: number;
  createdAt: string;
  updatedAt: string;
  author?: { id: string; name: string; avatar: string } | null;
  _count?: { votes: number };
  myVote?: boolean;
}

export interface ListJobQuestionsParams {
  company?: string;
  position?: string;
  jobPostId?: string;
  curatedJobId?: string;
  limit?: number;
}

export const fetchJobInterviewQuestions = (params: ListJobQuestionsParams = {}) => {
  const qs = new URLSearchParams();
  if (params.company) qs.set('company', params.company);
  if (params.position) qs.set('position', params.position);
  if (params.jobPostId) qs.set('jobPostId', params.jobPostId);
  if (params.curatedJobId) qs.set('curatedJobId', params.curatedJobId);
  if (params.limit) qs.set('limit', String(params.limit));
  const q = qs.toString();
  return request<JobInterviewQuestion[]>(`${BASE}/job-interview-questions${q ? `?${q}` : ''}`);
};

export const createJobInterviewQuestion = (data: {
  jobPostId?: string;
  curatedJobId?: string;
  companyName: string;
  position: string;
  question: string;
  sampleAnswer?: string;
  category?: string;
  difficulty?: string;
  source?: string;
}) =>
  request<JobInterviewQuestion>(`${BASE}/job-interview-questions`, {
    method: 'POST',
    body: JSON.stringify(data),
  });

export const upvoteJobInterviewQuestion = (id: string) =>
  request<{ upvoted: boolean }>(`${BASE}/job-interview-questions/${id}/upvote`, {
    method: 'POST',
  });

export const deleteJobInterviewQuestion = (id: string) =>
  request<{ success: boolean }>(`${BASE}/job-interview-questions/${id}`, { method: 'DELETE' });

export const aiGenerateJobInterviewQuestions = (data: {
  jobPostId?: string;
  curatedJobId?: string;
  companyName: string;
  position: string;
  description?: string;
  requirements?: string;
  skills?: string;
  count?: number;
  persist?: boolean;
}) =>
  request<{
    questions: Array<
      Partial<JobInterviewQuestion> & {
        question: string;
        sampleAnswer: string;
        category: string;
        difficulty: string;
      }
    >;
    persisted: boolean;
    provider?: string;
    model?: string;
  }>(`${BASE}/job-interview-questions/ai-generate`, {
    method: 'POST',
    body: JSON.stringify(data),
  });

// Study Groups (면접 스터디 그룹)
export interface StudyGroup {
  id: string;
  name: string;
  description: string;
  jobPostId: string | null;
  jobKey: string | null;
  companyName: string | null;
  position: string | null;
  ownerId: string;
  isPrivate: boolean;
  maxMembers: number;
  memberCount: number;
  createdAt: string;
  updatedAt: string;
  owner?: { id: string; name: string; avatar: string };
  members?: Array<{
    id: string;
    userId: string;
    role: string;
    joinedAt: string;
    user: { id: string; name: string; avatar: string };
  }>;
}

export interface StudyGroupQuestion {
  id: string;
  groupId: string;
  userId: string;
  question: string;
  sampleAnswer: string;
  category: string;
  difficulty: string;
  upvotes: number;
  createdAt: string;
  user?: { id: string; name: string; avatar: string };
}

export interface StudyGroupListResponse {
  items: StudyGroup[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export const fetchStudyGroups = (params?: {
  q?: string;
  companyName?: string;
  jobPostId?: string;
  jobKey?: string;
  mine?: boolean;
  page?: number;
  limit?: number;
}) => {
  const qs = new URLSearchParams();
  if (params?.q) qs.set('q', params.q);
  if (params?.companyName) qs.set('companyName', params.companyName);
  if (params?.jobPostId) qs.set('jobPostId', params.jobPostId);
  if (params?.jobKey) qs.set('jobKey', params.jobKey);
  if (params?.mine) qs.set('mine', 'true');
  if (params?.page) qs.set('page', String(params.page));
  if (params?.limit) qs.set('limit', String(params.limit));
  const suffix = qs.toString() ? `?${qs.toString()}` : '';
  return request<StudyGroupListResponse>(`${BASE}/study-groups${suffix}`);
};

export const fetchStudyGroup = (id: string) => request<StudyGroup>(`${BASE}/study-groups/${id}`);

export const createStudyGroup = (data: {
  name: string;
  description?: string;
  jobPostId?: string | null;
  jobKey?: string | null;
  companyName?: string | null;
  position?: string | null;
  isPrivate?: boolean;
  maxMembers?: number;
}) =>
  request<StudyGroup>(`${BASE}/study-groups`, {
    method: 'POST',
    body: JSON.stringify(data),
  });

export const joinStudyGroup = (id: string) =>
  request<{ id: string; groupId: string; userId: string; role: string; joinedAt: string }>(
    `${BASE}/study-groups/${id}/join`,
    { method: 'POST' },
  );

export const leaveStudyGroup = (id: string) =>
  request<{ success: boolean }>(`${BASE}/study-groups/${id}/leave`, { method: 'DELETE' });

export const deleteStudyGroup = (id: string) =>
  request<{ success: boolean }>(`${BASE}/study-groups/${id}`, { method: 'DELETE' });

export const fetchStudyGroupQuestions = (id: string) =>
  request<StudyGroupQuestion[]>(`${BASE}/study-groups/${id}/questions`);

export const addStudyGroupQuestion = (
  id: string,
  data: { question: string; sampleAnswer?: string; category?: string; difficulty?: string },
) =>
  request<StudyGroupQuestion>(`${BASE}/study-groups/${id}/questions`, {
    method: 'POST',
    body: JSON.stringify(data),
  });

// ── Coaching ──────────────────────────────────────────────
export interface CoachUser {
  id: string;
  name: string;
  username: string;
  avatar: string;
}

export interface CoachProfile {
  id: string;
  userId: string;
  specialty: string;
  bio: string;
  hourlyRate: number;
  yearsExp: number;
  languages: string;
  availableHours: string;
  totalSessions: number;
  avgRating: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  user?: CoachUser;
}

export type CoachingSessionStatus =
  | 'requested'
  | 'confirmed'
  | 'completed'
  | 'cancelled'
  | 'refunded';

export interface CoachingSession {
  id: string;
  coachId: string;
  clientId: string;
  scheduledAt: string;
  duration: number;
  totalPrice: number;
  commission: number;
  coachEarn: number;
  status: CoachingSessionStatus;
  meetingUrl: string;
  note: string;
  rating: number | null;
  review: string;
  createdAt: string;
  updatedAt: string;
  coach?: CoachProfile;
  client?: CoachUser;
}

export interface MySessionsResponse {
  asClient: CoachingSession[];
  asCoach: CoachingSession[];
}

export const fetchCoaches = (
  params: { specialty?: string; minRate?: number; maxRate?: number } = {},
) => {
  const qs = new URLSearchParams();
  if (params.specialty) qs.set('specialty', params.specialty);
  if (params.minRate != null) qs.set('minRate', String(params.minRate));
  if (params.maxRate != null) qs.set('maxRate', String(params.maxRate));
  const query = qs.toString();
  return request<CoachProfile[]>(`${BASE}/coaching/coaches${query ? `?${query}` : ''}`);
};

export const fetchCoach = (id: string) => request<CoachProfile>(`${BASE}/coaching/coaches/${id}`);

export const upsertCoachProfile = (data: {
  specialty: string;
  bio?: string;
  hourlyRate?: number;
  yearsExp?: number;
  languages?: string;
  availableHours?: string;
  isActive?: boolean;
}) =>
  request<CoachProfile>(`${BASE}/coaching/coach-profile`, {
    method: 'POST',
    body: JSON.stringify(data),
  });

export const bookCoachingSession = (data: {
  coachId: string;
  scheduledAt: string;
  duration?: number;
  note?: string;
}) =>
  request<CoachingSession>(`${BASE}/coaching/sessions`, {
    method: 'POST',
    body: JSON.stringify(data),
  });

export const fetchMyCoachingSessions = () =>
  request<MySessionsResponse>(`${BASE}/coaching/sessions/my`);

export const updateCoachingSessionStatus = (
  id: string,
  data: { status: CoachingSessionStatus; meetingUrl?: string },
) =>
  request<CoachingSession>(`${BASE}/coaching/sessions/${id}/status`, {
    method: 'PATCH',
    body: JSON.stringify(data),
  });

export const reviewCoachingSession = (id: string, data: { rating: number; review?: string }) =>
  request<CoachingSession>(`${BASE}/coaching/sessions/${id}/review`, {
    method: 'POST',
    body: JSON.stringify(data),
  });
