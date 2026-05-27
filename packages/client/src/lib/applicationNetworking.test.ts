import { describe, expect, it } from 'vitest';
import {
  buildNetworkingSearchUrl,
  buildRecruiterOutreachMessage,
  getApplicationNetworkingInsight,
} from './applicationNetworking';
import type { JobApplication } from './api';

const baseApplication = (overrides: Partial<JobApplication>): JobApplication => ({
  id: overrides.id ?? 'app-1',
  company: overrides.company ?? '토스',
  position: overrides.position ?? 'Frontend Engineer',
  status: overrides.status ?? 'applied',
  createdAt: overrides.createdAt ?? '2026-05-20T09:00:00Z',
  updatedAt: overrides.updatedAt ?? '2026-05-20T09:00:00Z',
  ...overrides,
});

describe('getApplicationNetworkingInsight', () => {
  it('detects email and LinkedIn hints from application notes', () => {
    const insight = getApplicationNetworkingInsight(
      baseApplication({
        notes: 'Recruiter: jane@company.com / https://linkedin.com/in/jane',
      }),
    );

    expect(insight.hasContactHint).toBe(true);
    expect(insight.contactHints).toEqual(['jane@company.com', 'https://linkedin.com/in/jane']);
    expect(insight.status).toBe('ready');
  });

  it('asks for contact discovery when notes do not include a networking hint', () => {
    const insight = getApplicationNetworkingInsight(
      baseApplication({ notes: 'JD 키워드 정리 필요' }),
    );

    expect(insight.hasContactHint).toBe(false);
    expect(insight.status).toBe('missing');
    expect(insight.nextAction).toContain('채용 담당자');
  });
});

describe('buildRecruiterOutreachMessage', () => {
  it('builds a concise Korean outreach message for the tracked role', () => {
    const message = buildRecruiterOutreachMessage(
      baseApplication({
        company: '카카오',
        position: 'Backend Engineer',
      }),
    );

    expect(message).toContain('카카오 Backend Engineer');
    expect(message).toContain('짧게 여쭙고 싶어 연락드립니다');
    expect(message.length).toBeLessThan(280);
  });
});

describe('buildNetworkingSearchUrl', () => {
  it('creates a LinkedIn people search URL scoped to company and role', () => {
    const url = buildNetworkingSearchUrl(
      baseApplication({
        company: '라인 플러스',
        position: 'Data Analyst',
      }),
    );

    expect(url).toContain('https://www.linkedin.com/search/results/people/');
    expect(decodeURIComponent(url)).toContain('라인 플러스 Data Analyst recruiter hiring');
  });
});
