import { describe, expect, it } from 'vitest';
import { buildApplicationActivityQueue } from './applicationActivityQueue';
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

describe('buildApplicationActivityQueue', () => {
  it('prioritizes overdue deadlines before stale follow-up tasks', () => {
    const queue = buildApplicationActivityQueue(
      [
        baseApplication({
          id: 'stale',
          company: '네이버',
          updatedAt: '2026-05-01T09:00:00Z',
        }),
        baseApplication({
          id: 'overdue',
          company: '카카오',
          deadline: '2026-05-25',
          updatedAt: '2026-05-24T09:00:00Z',
        }),
      ],
      { now: new Date('2026-05-27T12:00:00Z') },
    );

    expect(queue[0]).toMatchObject({
      applicationId: 'overdue',
      type: 'deadline',
      tone: 'danger',
    });
    expect(queue[0].dueLabel).toBe('마감 2일 초과');
  });

  it('creates interview preparation tasks for upcoming interview dates', () => {
    const queue = buildApplicationActivityQueue(
      [
        baseApplication({
          id: 'interview',
          company: '라인',
          status: 'interview',
          interviewDate: '2026-05-28',
        }),
      ],
      { now: new Date('2026-05-27T12:00:00Z') },
    );

    expect(queue[0]).toMatchObject({
      applicationId: 'interview',
      type: 'interview',
      title: '면접 준비',
      dueLabel: '면접 1일 전',
    });
  });

  it('adds networking discovery for active applications without contact hints', () => {
    const queue = buildApplicationActivityQueue(
      [
        baseApplication({
          id: 'networking',
          company: '토스',
          priority: 'high',
          notes: 'JD 키워드만 정리됨',
          updatedAt: '2026-05-27T09:00:00Z',
        }),
      ],
      { now: new Date('2026-05-27T12:00:00Z') },
    );

    expect(queue.some((item) => item.type === 'networking')).toBe(true);
    expect(queue.find((item) => item.type === 'networking')?.detail).toContain('담당자');
  });

  it('does not create follow-up tasks for terminal applications', () => {
    const queue = buildApplicationActivityQueue(
      [
        baseApplication({
          id: 'rejected',
          status: 'rejected',
          updatedAt: '2026-05-01T09:00:00Z',
        }),
      ],
      { now: new Date('2026-05-27T12:00:00Z') },
    );

    expect(queue.some((item) => item.type === 'follow-up')).toBe(false);
  });

  it('turns very stale active applications into close-out guidance instead of another follow-up', () => {
    const queue = buildApplicationActivityQueue(
      [
        baseApplication({
          id: 'ghosted',
          company: '쿠팡',
          status: 'screening',
          updatedAt: '2026-04-30T09:00:00Z',
        }),
      ],
      { now: new Date('2026-05-27T12:00:00Z') },
    );

    expect(queue[0]).toMatchObject({
      applicationId: 'ghosted',
      type: 'close-out',
      title: '무응답 정리',
      tone: 'warning',
    });
    expect(queue.some((item) => item.type === 'follow-up')).toBe(false);
  });
});
