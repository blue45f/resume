import { Test, TestingModule } from '@nestjs/testing';
import { AiCoachingNudgeService } from './ai-coaching-nudge.service';
import { PrismaService } from '../prisma/prisma.service';
import { NotificationsService } from '../notifications/notifications.service';

describe('AiCoachingNudgeService', () => {
  let service: AiCoachingNudgeService;
  let mockPrisma: {
    notification: { findMany: jest.Mock };
    user: { findMany: jest.Mock };
  };
  let mockNotif: { create: jest.Mock };

  beforeEach(async () => {
    mockPrisma = {
      notification: { findMany: jest.fn().mockResolvedValue([]) },
      user: { findMany: jest.fn().mockResolvedValue([]) },
    };
    mockNotif = { create: jest.fn().mockResolvedValue({}) };
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AiCoachingNudgeService,
        { provide: PrismaService, useValue: mockPrisma },
        { provide: NotificationsService, useValue: mockNotif },
      ],
    }).compile();
    service = module.get(AiCoachingNudgeService);
  });

  describe('pickNudge 휴리스틱', () => {
    const baseResume = {
      title: '내 이력서',
      updatedAt: new Date(),
      experiences: [{ id: 'e1' }, { id: 'e2' }],
      skills: [{ id: 's1', items: 'React, TypeScript, Node, Python, Go' }],
      personalInfo: {
        summary: '안녕하세요. 프론트엔드 개발자 홍길동입니다. 5년차 React 전문가입니다.',
      },
    };

    it('자기소개 비어있음 → personalInfo 우선 (1순위)', () => {
      const r = { ...baseResume, personalInfo: { summary: '' } };
      const n = service.pickNudge(r);
      expect(n?.section).toBe('personalInfo');
      expect(n?.message).toContain('자기소개');
    });

    it('자기소개 < 30자 → personalInfo', () => {
      const r = { ...baseResume, personalInfo: { summary: '짧은 소개' } };
      const n = service.pickNudge(r);
      expect(n?.section).toBe('personalInfo');
    });

    it('경력 0건 → experiences (2순위)', () => {
      const r = { ...baseResume, experiences: [] };
      const n = service.pickNudge(r);
      expect(n?.section).toBe('experiences');
      expect(n?.message).toContain('경력 항목이 없어요');
    });

    it('기술 스택 < 5개 → skills (3순위)', () => {
      const r = { ...baseResume, skills: [{ id: 's1', items: 'React, TypeScript' }] };
      const n = service.pickNudge(r);
      expect(n?.section).toBe('skills');
      expect(n?.message).toContain('2개');
    });

    it('60일 이상 미수정 → experiences 갱신 권장 (4순위)', () => {
      const old = new Date(Date.now() - 70 * 24 * 60 * 60 * 1000);
      const r = { ...baseResume, updatedAt: old };
      const n = service.pickNudge(r);
      expect(n?.message).toContain('업데이트되지 않았어요');
    });

    it('경력 1건만 → 다양화 권장 (5순위)', () => {
      const r = { ...baseResume, experiences: [{ id: 'e1' }] };
      const n = service.pickNudge(r);
      expect(n?.section).toBe('experiences');
      expect(n?.message).toContain('1건만');
    });

    it('완벽한 이력서 → null (알림 안 보냄)', () => {
      const n = service.pickNudge(baseResume);
      expect(n).toBeNull();
    });
  });

  describe('sendWeeklyNudges', () => {
    it('최근 7일 nudged 사용자는 skip', async () => {
      mockPrisma.notification.findMany.mockResolvedValue([{ userId: 'recent-user' }]);
      mockPrisma.user.findMany.mockResolvedValue([
        {
          id: 'recent-user',
          resumes: [
            {
              id: 'r1',
              title: 't',
              updatedAt: new Date(),
              experiences: [],
              skills: [],
              personalInfo: { summary: '' },
            },
          ],
        },
      ]);
      await service.sendWeeklyNudges();
      expect(mockNotif.create).not.toHaveBeenCalled();
    });

    it('자기소개 비어있는 사용자 → 알림 발송', async () => {
      mockPrisma.user.findMany.mockResolvedValue([
        {
          id: 'u1',
          resumes: [
            {
              id: 'r1',
              title: '내 이력서',
              updatedAt: new Date(),
              experiences: [{ id: 'e1' }, { id: 'e2' }],
              skills: [{ id: 's1', items: 'React,TS,Node,Python,Go' }],
              personalInfo: { summary: '' },
            },
          ],
        },
      ]);
      await service.sendWeeklyNudges();
      expect(mockNotif.create).toHaveBeenCalledWith(
        'u1',
        'coaching_nudge',
        expect.stringContaining('자기소개'),
        '/edit/r1#personalInfo',
      );
    });

    it('이력서 없는 사용자 skip', async () => {
      mockPrisma.user.findMany.mockResolvedValue([{ id: 'u1', resumes: [] }]);
      await service.sendWeeklyNudges();
      expect(mockNotif.create).not.toHaveBeenCalled();
    });

    it('Prisma 에러 → throw 안 함 (cron 안정성)', async () => {
      mockPrisma.notification.findMany.mockRejectedValueOnce(new Error('DB fail'));
      await expect(service.sendWeeklyNudges()).resolves.toBeUndefined();
    });
  });
});
