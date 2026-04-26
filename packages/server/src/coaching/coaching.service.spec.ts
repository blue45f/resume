import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException, NotFoundException, ForbiddenException } from '@nestjs/common';
import { CoachingService } from './coaching.service';
import { PrismaService } from '../prisma/prisma.service';
import { NotificationsService } from '../notifications/notifications.service';

const mockNotifications = { create: jest.fn().mockResolvedValue({}) };

// Mock CoachProfile / CoachingSession / Resume accessors.
// Prisma delegates are exposed via `coachProfile`, `coachingSession`, `resume` keys on PrismaService.
const mockPrisma: any = {
  user: { update: jest.fn() },
  resume: { findUnique: jest.fn() },
  coachProfile: {
    findUnique: jest.fn(),
    findMany: jest.fn(),
    upsert: jest.fn(),
  },
  coachingSession: {
    create: jest.fn(),
    findUnique: jest.fn(),
    findMany: jest.fn(),
    update: jest.fn(),
  },
};

describe('CoachingService', () => {
  let service: CoachingService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CoachingService,
        { provide: PrismaService, useValue: mockPrisma },
        { provide: NotificationsService, useValue: mockNotifications },
      ],
    }).compile();
    service = module.get(CoachingService);
    jest.clearAllMocks();
  });

  describe('createSession', () => {
    const clientId = 'client-1';
    const activeCoach = {
      id: 'coach-1',
      userId: 'other-user',
      hourlyRate: 60000,
      isActive: true,
    };

    beforeEach(() => {
      mockPrisma.coachProfile.findUnique.mockResolvedValue(activeCoach);
      mockPrisma.coachingSession.create.mockImplementation(({ data }: any) => ({
        id: 's-1',
        ...data,
      }));
    });

    it('coachId 누락 시 BadRequest', async () => {
      await expect(
        service.createSession(clientId, { coachId: '', scheduledAt: '2026-05-01T10:00:00Z' }),
      ).rejects.toThrow(BadRequestException);
    });

    it('scheduledAt 누락 시 BadRequest', async () => {
      await expect(
        service.createSession(clientId, { coachId: 'coach-1', scheduledAt: '' }),
      ).rejects.toThrow(BadRequestException);
    });

    it('존재하지 않는 코치 → NotFound', async () => {
      mockPrisma.coachProfile.findUnique.mockResolvedValueOnce(null);
      await expect(
        service.createSession(clientId, {
          coachId: 'missing',
          scheduledAt: '2026-05-01T10:00:00Z',
        }),
      ).rejects.toThrow(NotFoundException);
    });

    it('비활성 코치 → BadRequest', async () => {
      mockPrisma.coachProfile.findUnique.mockResolvedValueOnce({ ...activeCoach, isActive: false });
      await expect(
        service.createSession(clientId, {
          coachId: 'coach-1',
          scheduledAt: '2026-05-01T10:00:00Z',
        }),
      ).rejects.toThrow(BadRequestException);
    });

    it('본인 예약 차단 → BadRequest', async () => {
      mockPrisma.coachProfile.findUnique.mockResolvedValueOnce({
        ...activeCoach,
        userId: clientId,
      });
      await expect(
        service.createSession(clientId, {
          coachId: 'coach-1',
          scheduledAt: '2026-05-01T10:00:00Z',
        }),
      ).rejects.toThrow(BadRequestException);
    });

    it('수수료 15% 계산 (60분 60,000원 기준)', async () => {
      await service.createSession(clientId, {
        coachId: 'coach-1',
        scheduledAt: '2026-05-01T10:00:00Z',
        duration: 60,
      });
      expect(mockPrisma.coachingSession.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            totalPrice: 60000,
            commission: 9000,
            coachEarn: 51000,
            status: 'requested',
          }),
        }),
      );
    });

    it('duration 최소 15분 보정', async () => {
      await service.createSession(clientId, {
        coachId: 'coach-1',
        scheduledAt: '2026-05-01T10:00:00Z',
        duration: 5,
      });
      expect(mockPrisma.coachingSession.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ duration: 15 }),
        }),
      );
    });

    it('존재하지 않는 resumeId → BadRequest', async () => {
      mockPrisma.resume.findUnique.mockResolvedValueOnce(null);
      await expect(
        service.createSession(clientId, {
          coachId: 'coach-1',
          scheduledAt: '2026-05-01T10:00:00Z',
          resumeId: 'missing',
        }),
      ).rejects.toThrow(BadRequestException);
    });

    it('타인 소유 resumeId 차단 (IDOR 방지)', async () => {
      mockPrisma.resume.findUnique.mockResolvedValueOnce({
        id: 'r-1',
        userId: 'someone-else',
      });
      await expect(
        service.createSession(clientId, {
          coachId: 'coach-1',
          scheduledAt: '2026-05-01T10:00:00Z',
          resumeId: 'r-1',
        }),
      ).rejects.toThrow(/본인 이력서만/);
    });

    it('본인 resumeId는 저장됨', async () => {
      mockPrisma.resume.findUnique.mockResolvedValueOnce({
        id: 'r-1',
        userId: clientId,
      });
      await service.createSession(clientId, {
        coachId: 'coach-1',
        scheduledAt: '2026-05-01T10:00:00Z',
        resumeId: 'r-1',
      });
      expect(mockPrisma.coachingSession.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ resumeId: 'r-1' }),
        }),
      );
    });

    it('resumeId 미전달 시 null 저장', async () => {
      await service.createSession(clientId, {
        coachId: 'coach-1',
        scheduledAt: '2026-05-01T10:00:00Z',
      });
      expect(mockPrisma.coachingSession.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ resumeId: null }),
        }),
      );
      expect(mockPrisma.resume.findUnique).not.toHaveBeenCalled();
    });
  });

  describe('updateStatus', () => {
    it('유효하지 않은 상태값 거부', async () => {
      await expect(service.updateStatus('s1', 'u1', { status: 'invalid' as any })).rejects.toThrow(
        BadRequestException,
      );
    });

    it('권한 없는 유저는 상태 변경 차단', async () => {
      mockPrisma.coachingSession.findUnique.mockResolvedValueOnce({
        id: 's1',
        clientId: 'client-x',
        coach: { userId: 'coach-x' },
      });
      await expect(service.updateStatus('s1', 'outsider', { status: 'confirmed' })).rejects.toThrow(
        ForbiddenException,
      );
    });

    it('completed 전이 시 클라이언트에게 리뷰 요청 알림 발송', async () => {
      mockPrisma.coachingSession.findUnique.mockResolvedValueOnce({
        id: 's1',
        coachId: 'cp1',
        clientId: 'client-1',
        status: 'confirmed',
        rating: null,
        coach: { userId: 'coach-user' },
      });
      mockPrisma.coachingSession.update.mockResolvedValue({ id: 's1', status: 'completed' });
      (mockPrisma.coachProfile as any).update = jest.fn().mockResolvedValue({});
      mockNotifications.create.mockClear();
      await service.updateStatus('s1', 'coach-user', { status: 'completed' });
      expect(mockNotifications.create).toHaveBeenCalledWith(
        'client-1',
        'coaching_review_request',
        expect.stringContaining('리뷰'),
        expect.stringContaining('/coaching/sessions?focus=s1'),
      );
    });

    it('이미 평점이 있는 세션은 알림 skip (refunded → completed edge case)', async () => {
      mockPrisma.coachingSession.findUnique.mockResolvedValueOnce({
        id: 's2',
        coachId: 'cp1',
        clientId: 'client-1',
        status: 'cancelled',
        rating: 5,
        coach: { userId: 'coach-user' },
      });
      mockPrisma.coachingSession.update.mockResolvedValue({ id: 's2', status: 'refunded' });
      (mockPrisma.coachProfile as any).update = jest.fn().mockResolvedValue({});
      mockNotifications.create.mockClear();
      await service.updateStatus('s2', 'coach-user', { status: 'refunded' });
      expect(mockNotifications.create).not.toHaveBeenCalled();
    });
  });

  describe('upsertCoachProfile', () => {
    it('specialty 공백은 BadRequest', async () => {
      await expect(service.upsertCoachProfile('u1', { specialty: '   ' })).rejects.toThrow(
        BadRequestException,
      );
    });

    it('유효한 입력은 userType을 coach 로 승격', async () => {
      mockPrisma.coachProfile.upsert.mockResolvedValue({ id: 'cp1' });
      await service.upsertCoachProfile('u1', { specialty: 'frontend' });
      expect(mockPrisma.user.update).toHaveBeenCalledWith({
        where: { id: 'u1' },
        data: { userType: 'coach' },
      });
    });
  });
});
