import { describe, expect, it } from 'vitest';
import {
  buildApplicationPacketSnapshot,
  getApplicationPacketSnapshotFileName,
} from './applicationPacketSnapshot';
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

describe('buildApplicationPacketSnapshot', () => {
  it('creates a markdown packet with readiness, research, guidance, and communication sections', () => {
    const snapshot = buildApplicationPacketSnapshot(
      baseApplication({
        url: 'https://www.linkedin.com/jobs/view/123',
        resumeId: 'resume-1',
        notes:
          'Recruiter: jane@company.com. 회사 제품, 최근 뉴스, 조직 문화, 면접 질문, 성과 사례를 정리했습니다.',
        deadline: '2026-05-31',
        priority: 'high',
      }),
      new Date('2026-05-27T12:00:00Z'),
    );

    expect(snapshot).toContain('# 토스 · Frontend Engineer');
    expect(snapshot).toContain('## 지원 준비도');
    expect(snapshot).toContain('## 회사 리서치');
    expect(snapshot).toContain('## 단계 가이드');
    expect(snapshot).toContain('## 커뮤니케이션 템플릿');
    expect(snapshot).toContain('지원 후속');
  });

  it('limits long notes to keep the packet concise', () => {
    const snapshot = buildApplicationPacketSnapshot(
      baseApplication({
        notes: '긴 메모 '.repeat(120),
      }),
      new Date('2026-05-27T12:00:00Z'),
    );

    expect(snapshot).toContain('...');
    expect(snapshot.length).toBeLessThan(2200);
  });
});

describe('getApplicationPacketSnapshotFileName', () => {
  it('returns a safe markdown filename using company and position', () => {
    expect(
      getApplicationPacketSnapshotFileName(
        baseApplication({
          company: 'ACME/Corp',
          position: 'Frontend:Lead',
        }),
      ),
    ).toBe('ACME-Corp-Frontend-Lead-packet.md');
  });
});
