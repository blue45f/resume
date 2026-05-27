import { describe, expect, it } from 'vitest';
import { buildApplicationSearchInsights } from './applicationSearchInsights';
import type { JobApplication } from './api';

const baseApplication = (overrides: Partial<JobApplication>): JobApplication => ({
  id: overrides.id ?? 'app-1',
  company: overrides.company ?? '테스트컴퍼니',
  position: overrides.position ?? 'Frontend Engineer',
  status: overrides.status ?? 'applied',
  createdAt: overrides.createdAt ?? '2026-05-20T09:00:00Z',
  updatedAt: overrides.updatedAt ?? '2026-05-20T09:00:00Z',
  ...overrides,
});

describe('buildApplicationSearchInsights', () => {
  it('returns null when there are no applications to analyze', () => {
    expect(buildApplicationSearchInsights([])).toBeNull();
  });

  it('calculates interview conversion from applied applications only', () => {
    const insights = buildApplicationSearchInsights(
      [
        baseApplication({ id: 'saved', status: 'saved' }),
        baseApplication({ id: 'applied', status: 'applied' }),
        baseApplication({ id: 'interview', status: 'interview' }),
        baseApplication({ id: 'offer', status: 'offer' }),
      ],
      new Date('2026-05-22T12:00:00Z'),
    );

    expect(insights?.cards.find((card) => card.id === 'conversion')?.value).toBe('67%');
    expect(insights?.cards.find((card) => card.id === 'interviews')?.value).toBe('1건');
  });

  it('prioritizes overdue deadlines as the main bottleneck', () => {
    const insights = buildApplicationSearchInsights(
      [
        baseApplication({
          id: 'overdue',
          status: 'applied',
          deadline: '2026-05-25',
          updatedAt: '2026-05-24T09:00:00Z',
        }),
        baseApplication({
          id: 'stale',
          status: 'applied',
          updatedAt: '2026-05-01T09:00:00Z',
        }),
      ],
      new Date('2026-05-27T12:00:00Z'),
    );

    expect(insights?.focus.value).toBe('마감 초과 1건');
    expect(insights?.focus.tone).toBe('danger');
  });

  it('deduplicates follow-up risk when one application is both stale and near deadline', () => {
    const insights = buildApplicationSearchInsights(
      [
        baseApplication({
          id: 'same-risk',
          status: 'applied',
          deadline: '2026-05-30',
          updatedAt: '2026-05-01T09:00:00Z',
        }),
      ],
      new Date('2026-05-27T12:00:00Z'),
    );

    expect(insights?.cards.find((card) => card.id === 'risk')?.value).toBe('1건');
  });
});
