import type { Resume, ResumeSummary, Template, TransformResult, LlmProvider, Tag } from '@/types/resume';
import { getCached, setCache } from './cache';

// 개발: Vite proxy로 /api → localhost:3001
// 프로덕션: VITE_API_URL 환경변수로 백엔드 URL 지정
const API_URL = import.meta.env.VITE_API_URL || '';
const BASE = `${API_URL}/api`;

async function request<T>(url: string, options?: RequestInit): Promise<T> {
  const token = localStorage.getItem('token');
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (token) headers['Authorization'] = `Bearer ${token}`;

  try {
    const res = await fetch(url, { headers, ...options });
    if (res.status === 401) {
      // Token expired - clear auth
      localStorage.removeItem('token');
      localStorage.removeItem('user');
    }
    if (!res.ok) {
      const error = await res.json().catch(() => ({ message: res.statusText }));
      throw new Error(error.message || `Request failed: ${res.status}`);
    }
    return res.json();
  } catch (err) {
    if (err instanceof TypeError && err.message === 'Failed to fetch') {
      throw new Error('서버에 연결할 수 없습니다. 네트워크를 확인해주세요.');
    }
    throw err;
  }
}

// Email Auth
export const registerUser = (data: { email: string; password: string; name: string }) =>
  request<{ token: string }>(`${BASE}/auth/register`, { method: 'POST', body: JSON.stringify(data) });
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
  request<{ id: string; visibility: string }>(`${BASE}/resumes/${id}/visibility`, { method: 'PATCH', body: JSON.stringify({ visibility }) });
export const fetchPublicResumes = () => request<ResumeSummary[]>(`${BASE}/resumes/public`);

// Bookmarks
export const addBookmark = (resumeId: string) =>
  request<{ bookmarked: boolean }>(`${BASE}/resumes/${resumeId}/bookmark`, { method: 'POST' });
export const removeBookmark = (resumeId: string) =>
  request<{ bookmarked: boolean }>(`${BASE}/resumes/${resumeId}/bookmark`, { method: 'DELETE' });
export const fetchBookmarks = () =>
  request<{ id: string; resumeId: string; title: string; name: string; createdAt: string }[]>(`${BASE}/resumes/bookmarks/list`);

// Analytics
export const fetchDashboard = () => request<any>(`${BASE}/resumes/dashboard/analytics`);
export const fetchResumeTrend = (resumeId: string) =>
  request<{ version: number; sections: number; createdAt: string }[]>(`${BASE}/resumes/trend/${resumeId}`);
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
export const createTemplate = (data: { name: string; description?: string; category?: string; prompt?: string; layout?: string }) =>
  request<Template>(`${BASE}/templates`, { method: 'POST', body: JSON.stringify(data) });
export const updateTemplate = (id: string, data: Partial<Template>) =>
  request<Template>(`${BASE}/templates/${id}`, { method: 'PUT', body: JSON.stringify(data) });
export const deleteTemplate = (id: string) =>
  request<{ success: boolean }>(`${BASE}/templates/${id}`, { method: 'DELETE' });

// Local Transform (LLM 불필요)
export const localTransform = (resumeId: string, data: { preset?: string; templateId?: string }) =>
  request<{ text: string; method: string; preset?: string; templateName?: string }>(
    `${BASE}/templates/local-transform/${resumeId}`, { method: 'POST', body: JSON.stringify(data) },
  );
export const fetchPresets = () =>
  request<{ id: string; name: string; description: string }[]>(`${BASE}/templates/presets/list`);

// LLM Transform (유료/무료 LLM 사용)
export const transformResume = (
  resumeId: string,
  data: { templateType: string; targetLanguage?: string; jobDescription?: string; provider?: string },
) => request<TransformResult>(`${BASE}/resumes/${resumeId}/transform`, { method: 'POST', body: JSON.stringify(data) });

export const fetchTransformHistory = (resumeId: string) =>
  request<TransformResult[]>(`${BASE}/resumes/${resumeId}/transform/history`);

export const fetchLlmProviders = (resumeId: string) =>
  request<LlmProvider[]>(`${BASE}/resumes/${resumeId}/transform/providers`);

// LLM Transform Streaming
export async function* transformResumeStream(
  resumeId: string,
  data: { templateType: string; targetLanguage?: string; jobDescription?: string; provider?: string },
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
        try { yield JSON.parse(line.slice(6)); } catch { /* skip */ }
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
export const fetchApplicationStats = () => request<{ total: number; byStatus: Record<string, number> }>(`${BASE}/applications/stats`);
export const createApplication = (data: Partial<JobApplication>) =>
  request<JobApplication>(`${BASE}/applications`, { method: 'POST', body: JSON.stringify(data) });
export const updateApplication = (id: string, data: Partial<JobApplication>) =>
  request<JobApplication>(`${BASE}/applications/${id}`, { method: 'PUT', body: JSON.stringify(data) });
export const deleteApplication = (id: string) =>
  request<{ success: boolean }>(`${BASE}/applications/${id}`, { method: 'DELETE' });

// AI Analysis
export const analyzeResumeFeedback = (resumeId: string, provider?: string) =>
  request<any>(`${BASE}/resumes/${resumeId}/transform/feedback`, {
    method: 'POST', body: JSON.stringify({ provider }),
  });
export const analyzeJobMatch = (resumeId: string, jobDescription: string, provider?: string) =>
  request<any>(`${BASE}/resumes/${resumeId}/transform/job-match`, {
    method: 'POST', body: JSON.stringify({ jobDescription, provider }),
  });
export const generateInterviewQuestions = (resumeId: string, jobRole?: string, provider?: string) =>
  request<any>(`${BASE}/resumes/${resumeId}/transform/interview`, {
    method: 'POST', body: JSON.stringify({ jobRole, provider }),
  });
export const fetchTransformUsage = (resumeId: string) =>
  request<{ totalTransformations: number; totalTokensUsed: number }>(`${BASE}/resumes/${resumeId}/transform/usage`);

// Translation
export const translateResume = (resumeId: string, targetLanguage: string) =>
  request<{ text: string }>(`${BASE}/resumes/${resumeId}/transform`, {
    method: 'POST',
    body: JSON.stringify({ templateType: 'english', targetLanguage }),
  });

// Share Links
export const createShareLink = (resumeId: string, data: { expiresInHours?: number; password?: string }) =>
  request<{ id: string; token: string; expiresAt: string; hasPassword: boolean }>(
    `${BASE}/resumes/${resumeId}/share`, { method: 'POST', body: JSON.stringify(data) },
  );
export const fetchShareLinks = (resumeId: string) =>
  request<{ id: string; token: string; expiresAt: string; hasPassword: boolean; isExpired: boolean }[]>(
    `${BASE}/resumes/${resumeId}/share`,
  );
export const deleteShareLink = (id: string) =>
  request<{ success: boolean }>(`${BASE}/share/${id}`, { method: 'DELETE' });

// Attachments
export const uploadAttachment = async (resumeId: string, file: File, category?: string, description?: string) => {
  const formData = new FormData();
  formData.append('file', file);
  if (category) formData.append('category', category);
  if (description) formData.append('description', description);
  const token = localStorage.getItem('token');
  const headers: Record<string, string> = {};
  if (token) headers['Authorization'] = `Bearer ${token}`;
  const res = await fetch(`${BASE}/resumes/${resumeId}/attachments`, {
    method: 'POST', headers, body: formData,
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
export const sendScoutMessage = (data: { receiverId: string; resumeId?: string; company: string; position: string; message: string }) =>
  request<any>(`${BASE}/social/scout`, { method: 'POST', body: JSON.stringify(data) });
export const fetchScouts = () => request<any[]>(`${BASE}/social/scouts`);

// Messages
export const sendDirectMessage = (receiverId: string, content: string) =>
  request<any>(`${BASE}/social/messages/${receiverId}`, { method: 'POST', body: JSON.stringify({ content }) });
export const fetchConversations = () => request<any[]>(`${BASE}/social/messages`);
export const fetchMessages = (partnerId: string) => request<any[]>(`${BASE}/social/messages/${partnerId}`);

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
export const createJob = (data: any) => request<any>(`${BASE}/jobs`, { method: 'POST', body: JSON.stringify(data) });
export const deleteJob = (id: string) => request<{ success: boolean }>(`${BASE}/jobs/${id}`, { method: 'DELETE' });
