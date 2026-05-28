import { fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import CareerInsights from './CareerInsights';

vi.mock('recharts', () => ({
  ResponsiveContainer: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  RadialBarChart: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  RadialBar: () => null,
  BarChart: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  Bar: ({ children }: { children?: React.ReactNode }) => <div>{children}</div>,
  CartesianGrid: () => null,
  XAxis: () => null,
  YAxis: () => null,
  Tooltip: () => null,
  Cell: () => null,
}));

vi.mock('@/lib/auth', () => ({
  getUser: () => ({ id: 'user-1', name: '테스터' }),
}));

vi.mock('@/lib/api', () => ({
  fetchResumes: vi.fn(async () => [
    {
      id: 'resume-1',
      title: '백엔드 이력서',
      personalInfo: { name: '백엔드 개발자' },
      tags: [],
      skills: [{ id: 'skill-1', category: 'stack', items: 'react' }],
      createdAt: '2024-01-01T00:00:00.000Z',
      updatedAt: '2024-01-01T00:00:00.000Z',
    },
  ]),
}));

const jobs = [
  {
    id: 'job-1',
    company: 'A',
    position: 'Backend Developer',
    skills: 'python',
    salary: '5000',
    type: 'fulltime',
    createdAt: '2024-01-07T00:00:00.000Z',
  },
  {
    id: 'job-2',
    company: 'B',
    position: 'Backend Developer',
    skills: 'python',
    salary: '5000',
    type: 'fulltime',
    createdAt: '2024-01-06T00:00:00.000Z',
  },
  {
    id: 'job-3',
    company: 'C',
    position: 'Backend Developer',
    skills: 'python',
    salary: '5000',
    type: 'fulltime',
    createdAt: '2024-01-05T00:00:00.000Z',
  },
  {
    id: 'job-4',
    company: 'D',
    position: 'Backend Developer',
    skills: 'python',
    salary: '5000',
    type: 'fulltime',
    createdAt: '2023-12-01T00:00:00.000Z',
  },
];

describe('<CareerInsights />', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.stubGlobal(
      'fetch',
      vi.fn(async (input: RequestInfo | URL) => {
        const url = String(input);
        return {
          ok: true,
          json: async () => (url.includes('/api/jobs') ? jobs : []),
        } as Response;
      }),
    );
  });

  it('uses the injected reference time when classifying recent skill trends', async () => {
    render(
      <MemoryRouter>
        <CareerInsights now="2024-01-08T00:00:00.000Z" />
      </MemoryRouter>,
    );

    await screen.findByText(/AI 커리어 인사이트 대시보드/);

    fireEvent.click(screen.getByRole('button', { name: '수요 역량' }));

    await waitFor(() => {
      const python = screen.getByText('python');
      const row = python.closest('.flex.items-center.gap-2\\.5');
      expect(row).not.toBeNull();
      expect(within(row as HTMLElement).getByText('▲')).toBeInTheDocument();
    });
  });
});
