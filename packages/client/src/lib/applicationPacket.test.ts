import { describe, expect, it } from 'vitest';
import {
  buildFollowUpCalendarEvent,
  getFollowUpReminderDate,
  getFollowUpReminderFileName,
} from './applicationPacket';

describe('getFollowUpReminderDate', () => {
  it('schedules the first follow-up 7 days after the application date', () => {
    const date = getFollowUpReminderDate(
      {
        company: '토스',
        position: 'Frontend Engineer',
        status: 'applied',
        appliedDate: '2026-05-20',
        createdAt: '2026-05-19T09:00:00Z',
      },
      new Date('2026-05-21T12:00:00Z'),
    );

    expect(date.toISOString().slice(0, 10)).toBe('2026-05-27');
  });

  it('moves stale follow-ups to tomorrow instead of creating a past reminder', () => {
    const date = getFollowUpReminderDate(
      {
        company: '네이버',
        position: 'Product Manager',
        status: 'applied',
        appliedDate: '2026-05-01',
        createdAt: '2026-05-01T09:00:00Z',
      },
      new Date('2026-05-27T12:00:00Z'),
    );

    expect(date.toISOString().slice(0, 10)).toBe('2026-05-28');
  });

  it('pulls the reminder before an upcoming deadline when the 7-day follow-up would be too late', () => {
    const date = getFollowUpReminderDate(
      {
        company: '카카오',
        position: 'Backend Engineer',
        status: 'saved',
        appliedDate: '2026-05-20',
        createdAt: '2026-05-20T09:00:00Z',
        deadline: '2026-05-26',
      },
      new Date('2026-05-21T12:00:00Z'),
    );

    expect(date.toISOString().slice(0, 10)).toBe('2026-05-25');
  });
});

describe('buildFollowUpCalendarEvent', () => {
  it('builds an all-day calendar event with a one-day display alarm', () => {
    const event = buildFollowUpCalendarEvent(
      {
        company: '라인',
        position: 'Data Analyst',
        status: 'interview',
        appliedDate: '2026-05-20',
        createdAt: '2026-05-20T09:00:00Z',
        notes: '리크루터에게 포트폴리오 링크 전달 필요',
      },
      new Date('2026-05-21T12:00:00Z'),
    );

    expect(event.displayDate).toBe('2026.05.27');
    expect(event.ics).toContain('BEGIN:VCALENDAR');
    expect(event.ics).toContain('SUMMARY:라인 Data Analyst 후속 확인');
    expect(event.ics).toContain('DTSTART;VALUE=DATE:20260527');
    expect(event.ics).toContain('TRIGGER:-P1D');
    expect(event.ics).toContain('리크루터에게 포트폴리오 링크 전달 필요');
  });
});

describe('getFollowUpReminderFileName', () => {
  it('returns a filesystem-safe .ics filename', () => {
    expect(
      getFollowUpReminderFileName({
        company: 'ACME/Corp',
        position: 'Frontend:Lead',
        status: 'applied',
        createdAt: '2026-05-20T09:00:00Z',
      }),
    ).toBe('ACME-Corp-Frontend-Lead-follow-up.ics');
  });
});
