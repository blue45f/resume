import { describe, expect, it } from 'vitest';
import { buildApplicationCsv, getApplicationCsvFileName } from './applicationExport';
import type { JobApplication } from './api';

const baseApplication = (overrides: Partial<JobApplication>): JobApplication => ({
  id: overrides.id ?? 'app-1',
  company: overrides.company ?? '토스',
  position: overrides.position ?? 'Frontend Engineer',
  status: overrides.status ?? 'applied',
  createdAt: overrides.createdAt ?? '2026-05-20T09:00:00Z',
  updatedAt: overrides.updatedAt ?? '2026-05-21T09:00:00Z',
  ...overrides,
});

describe('buildApplicationCsv', () => {
  it('exports tracker rows with stable headers and application fields', () => {
    const csv = buildApplicationCsv([
      baseApplication({
        company: '카카오',
        position: 'Backend Engineer',
        priority: 'high',
        appliedDate: '2026-05-20',
        deadline: '2026-05-31',
        interviewDate: '2026-06-03',
        location: '성남',
        salary: '협의',
        url: 'https://jobs.example.com/1',
        notes: '리크루터 확인',
      }),
    ]);

    expect(csv.split('\n')[0]).toBe(
      'Company,Position,Status,Priority,Applied Date,Deadline,Interview Date,Location,Salary,URL,Notes,Created At,Updated At',
    );
    expect(csv).toContain('카카오,Backend Engineer,applied,high,2026-05-20,2026-05-31');
    expect(csv).toContain('리크루터 확인');
  });

  it('escapes commas, quotes, and newlines for spreadsheet-safe CSV', () => {
    const csv = buildApplicationCsv([
      baseApplication({
        company: 'ACME, Korea',
        position: 'Developer "Platform"',
        notes: '첫 줄\n둘째 줄',
      }),
    ]);

    expect(csv).toContain('"ACME, Korea"');
    expect(csv).toContain('"Developer ""Platform"""');
    expect(csv).toContain('"첫 줄\n둘째 줄"');
  });
});

describe('getApplicationCsvFileName', () => {
  it('uses current date and filtered/all scope in the filename', () => {
    expect(getApplicationCsvFileName(3, 10, new Date('2026-05-27T09:00:00Z'))).toBe(
      'applications-filtered-2026-05-27.csv',
    );
    expect(getApplicationCsvFileName(10, 10, new Date('2026-05-27T09:00:00Z'))).toBe(
      'applications-all-2026-05-27.csv',
    );
  });
});
