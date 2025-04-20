import type { Resume, ResumeSummary, Template, TransformResult, LlmProvider, Tag } from '@/types/resume';

const BASE = '/api';

async function request<T>(url: string, options?: RequestInit): Promise<T> {
  const res = await fetch(url, {
    headers: { 'Content-Type': 'application/json' },
    ...options,
  });
  if (!res.ok) {
    const error = await res.json().catch(() => ({ message: res.statusText }));
    throw new Error(error.message || `Request failed: ${res.status}`);
  }
  return res.json();
}

// Resumes
export const fetchResumes = () => request<ResumeSummary[]>(`${BASE}/resumes`);
export const fetchResume = (id: string) => request<Resume>(`${BASE}/resumes/${id}`);
export const createResume = (data: Omit<Resume, 'id' | 'createdAt' | 'updatedAt'>) =>
  request<Resume>(`${BASE}/resumes`, { method: 'POST', body: JSON.stringify(data) });
export const updateResume = (id: string, data: Omit<Resume, 'id' | 'createdAt' | 'updatedAt'>) =>
  request<Resume>(`${BASE}/resumes/${id}`, { method: 'PUT', body: JSON.stringify(data) });
export const deleteResume = (id: string) =>
  request<{ success: boolean }>(`${BASE}/resumes/${id}`, { method: 'DELETE' });
export const duplicateResume = (id: string) =>
  request<Resume>(`${BASE}/resumes/${id}/duplicate`, { method: 'POST' });

// Tags
export const fetchTags = () => request<(Tag & { resumeCount: number })[]>(`${BASE}/tags`);
export const createTag = (data: { name: string; color?: string }) =>
  request<Tag>(`${BASE}/tags`, { method: 'POST', body: JSON.stringify(data) });
export const deleteTag = (id: string) =>
  request<{ success: boolean }>(`${BASE}/tags/${id}`, { method: 'DELETE' });
export const addTagToResume = (tagId: string, resumeId: string) =>
  request<{ success: boolean }>(`${BASE}/tags/${tagId}/resumes/${resumeId}`, { method: 'POST' });
export const removeTagFromResume = (tagId: string, resumeId: string) =>
  request<{ success: boolean }>(`${BASE}/tags/${tagId}/resumes/${resumeId}`, { method: 'DELETE' });

// Templates
export const fetchTemplates = () => request<Template[]>(`${BASE}/templates`);
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
  const res = await fetch(`${BASE}/resumes/${resumeId}/transform/stream`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
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
