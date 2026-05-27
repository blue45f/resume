import { describe, expect, it } from 'vitest';
import { buildApplicationStageGuidance } from './applicationStageGuidance';
import type { JobApplication } from './api';

const baseApplication = (overrides: Partial<JobApplication>): JobApplication => ({
  id: overrides.id ?? 'app-1',
  company: overrides.company ?? '토스',
  position: overrides.position ?? 'Frontend Engineer',
  status: overrides.status ?? 'applied',
  createdAt: overrides.createdAt ?? '2026-05-20T09:00:00Z',
  updatedAt: overrides.updatedAt ?? '2026-05-26T09:00:00Z',
  ...overrides,
});

describe('buildApplicationStageGuidance', () => {
  it('builds an applied-stage checklist around resume, contact, and follow-up readiness', () => {
    const guidance = buildApplicationStageGuidance(
      baseApplication({
        status: 'applied',
        resumeId: '',
        notes: '',
      }),
      new Date('2026-05-27T12:00:00Z'),
    );

    expect(guidance.stageLabel).toBe('지원 완료');
    expect(guidance.tasks.map((task) => task.id)).toEqual([
      'resume-linked',
      'contact-hint',
      'follow-up-window',
    ]);
    expect(guidance.tasks.find((task) => task.id === 'resume-linked')?.complete).toBe(false);
  });

  it('marks follow-up as due when an active application has been stale for a week', () => {
    const guidance = buildApplicationStageGuidance(
      baseApplication({
        status: 'screening',
        updatedAt: '2026-05-10T09:00:00Z',
      }),
      new Date('2026-05-27T12:00:00Z'),
    );

    const followUp = guidance.tasks.find((task) => task.id === 'follow-up-window');
    expect(followUp?.complete).toBe(false);
    expect(followUp?.tone).toBe('warning');
  });

  it('prioritizes interview prep and thank-you note for interview stages', () => {
    const guidance = buildApplicationStageGuidance(
      baseApplication({
        status: 'interview',
        interviewDate: '2026-05-27',
        notes: '면접 예상 질문과 프로젝트 설명 준비',
      }),
      new Date('2026-05-27T12:00:00Z'),
    );

    expect(guidance.stageLabel).toBe('면접 단계');
    expect(guidance.tasks.map((task) => task.id)).toEqual([
      'interview-plan',
      'thank-you-note',
      'decision-follow-up',
    ]);
  });

  it('returns a closure checklist for terminal rejected applications', () => {
    const guidance = buildApplicationStageGuidance(
      baseApplication({
        status: 'rejected',
      }),
      new Date('2026-05-27T12:00:00Z'),
    );

    expect(guidance.stageLabel).toBe('전형 종료');
    expect(guidance.tasks.some((task) => task.id === 'learning-note')).toBe(true);
  });
});
