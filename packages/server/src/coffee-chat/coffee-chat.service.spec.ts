import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException, ForbiddenException, NotFoundException } from '@nestjs/common';
import { CoffeeChatService } from './coffee-chat.service';
import { PrismaService } from '../prisma/prisma.service';
import { NotificationsService } from '../notifications/notifications.service';

describe('CoffeeChatService', () => {
  let service: CoffeeChatService;
  let mockPrisma: any;
  let mockNotif: any;

  beforeEach(async () => {
    mockPrisma = {
      user: { findUnique: jest.fn() },
      coffeeChat: {
        create: jest.fn(),
        findFirst: jest.fn(),
        findUnique: jest.fn(),
        findMany: jest.fn(),
        update: jest.fn(),
        updateMany: jest.fn().mockResolvedValue({ count: 0 }),
        count: jest.fn().mockResolvedValue(0),
      },
      webrtcSignal: {
        create: jest.fn(),
        findMany: jest.fn(),
        deleteMany: jest.fn().mockResolvedValue({ count: 0 }),
      },
    };
    mockNotif = { create: jest.fn().mockResolvedValue({}) };
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CoffeeChatService,
        { provide: PrismaService, useValue: mockPrisma },
        { provide: NotificationsService, useValue: mockNotif },
      ],
    }).compile();
    service = module.get(CoffeeChatService);
  });

  describe('create', () => {
    it('비로그인 → ForbiddenException', async () => {
      await expect(service.create('', { hostId: 'h1' })).rejects.toThrow(ForbiddenException);
    });

    it('본인에게 신청 → BadRequest', async () => {
      await expect(service.create('u1', { hostId: 'u1' })).rejects.toThrow(BadRequestException);
    });

    it('host 없음 → NotFound', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(null);
      await expect(service.create('u1', { hostId: 'ghost' })).rejects.toThrow(NotFoundException);
    });

    it('동일 host 에 pending 중복 → BadRequest', async () => {
      mockPrisma.user.findUnique.mockResolvedValue({ id: 'h1', name: 'host' });
      mockPrisma.coffeeChat.findFirst.mockResolvedValue({ id: 'existing' });
      await expect(service.create('u1', { hostId: 'h1' })).rejects.toThrow(BadRequestException);
    });

    it('정상 흐름 — durationMin clamp + 알림 호출', async () => {
      mockPrisma.user.findUnique
        .mockResolvedValueOnce({ id: 'h1', name: 'host' }) // host lookup
        .mockResolvedValueOnce({ name: '신청자' }); // requester lookup for notif
      mockPrisma.coffeeChat.findFirst.mockResolvedValue(null);
      mockPrisma.coffeeChat.create.mockResolvedValue({
        id: 'cc1',
        hostId: 'h1',
        requesterId: 'u1',
        status: 'pending',
      });

      const result = await service.create('u1', {
        hostId: 'h1',
        message: 'msg',
        durationMin: 200, // clamp to 120
        modality: 'unknown', // → video default
      });

      expect(mockPrisma.coffeeChat.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            hostId: 'h1',
            requesterId: 'u1',
            durationMin: 120,
            modality: 'video',
          }),
        }),
      );
      expect(mockNotif.create).toHaveBeenCalledWith(
        'h1',
        'coffee_chat_request',
        expect.stringContaining('커피챗'),
        '/coffee-chats/cc1',
      );
      expect(result).toMatchObject({ id: 'cc1' });
    });
  });

  describe('respond', () => {
    it('호스트 아닌 사용자가 응답 → Forbidden', async () => {
      mockPrisma.coffeeChat.findUnique.mockResolvedValue({
        id: 'cc1',
        hostId: 'h1',
        requesterId: 'u1',
        status: 'pending',
      });
      await expect(service.respond('cc1', 'someone', 'accepted')).rejects.toThrow(
        ForbiddenException,
      );
    });

    it('이미 처리된 상태 → BadRequest', async () => {
      mockPrisma.coffeeChat.findUnique.mockResolvedValue({
        id: 'cc1',
        hostId: 'h1',
        requesterId: 'u1',
        status: 'accepted',
      });
      await expect(service.respond('cc1', 'h1', 'accepted')).rejects.toThrow(BadRequestException);
    });

    it('수락 → roomId 발급 + 알림 호출', async () => {
      mockPrisma.coffeeChat.findUnique.mockResolvedValue({
        id: 'cc1',
        hostId: 'h1',
        requesterId: 'u1',
        status: 'pending',
      });
      mockPrisma.coffeeChat.update.mockResolvedValue({
        id: 'cc1',
        status: 'accepted',
        roomId: 'room-uuid',
      });

      await service.respond('cc1', 'h1', 'accepted', '환영');

      expect(mockPrisma.coffeeChat.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 'cc1' },
          data: expect.objectContaining({
            status: 'accepted',
            roomId: expect.any(String),
            hostNote: '환영',
          }),
        }),
      );
      expect(mockNotif.create).toHaveBeenCalledWith(
        'u1',
        'coffee_chat_response',
        expect.stringContaining('수락'),
        '/coffee-chats/cc1',
      );
    });

    it('거절 → roomId 발급 안 함', async () => {
      mockPrisma.coffeeChat.findUnique.mockResolvedValue({
        id: 'cc1',
        hostId: 'h1',
        requesterId: 'u1',
        status: 'pending',
      });
      mockPrisma.coffeeChat.update.mockResolvedValue({ id: 'cc1', status: 'rejected' });

      await service.respond('cc1', 'h1', 'rejected');

      const callArgs = mockPrisma.coffeeChat.update.mock.calls[0][0];
      expect(callArgs.data.roomId).toBeUndefined();
    });
  });

  describe('cancel', () => {
    it('신청자 외 취소 시도 → Forbidden', async () => {
      mockPrisma.coffeeChat.findUnique.mockResolvedValue({
        id: 'cc1',
        requesterId: 'u1',
        status: 'pending',
      });
      await expect(service.cancel('cc1', 'other')).rejects.toThrow(ForbiddenException);
    });

    it('완료된 chat 취소 시도 → BadRequest', async () => {
      mockPrisma.coffeeChat.findUnique.mockResolvedValue({
        id: 'cc1',
        requesterId: 'u1',
        status: 'completed',
      });
      await expect(service.cancel('cc1', 'u1')).rejects.toThrow(BadRequestException);
    });
  });

  describe('WebRTC signaling', () => {
    it('비참여자가 signal 전송 → Forbidden', async () => {
      mockPrisma.coffeeChat.findFirst.mockResolvedValue({
        roomId: 'r1',
        hostId: 'h1',
        requesterId: 'u1',
        status: 'accepted',
      });
      await expect(
        service.sendSignal('intruder', {
          roomId: 'r1',
          toUserId: 'u1',
          type: 'offer',
          payload: {},
        }),
      ).rejects.toThrow(ForbiddenException);
    });

    it('toUserId 가 peer 아님 → Forbidden', async () => {
      mockPrisma.coffeeChat.findFirst.mockResolvedValue({
        roomId: 'r1',
        hostId: 'h1',
        requesterId: 'u1',
        status: 'accepted',
      });
      await expect(
        service.sendSignal('h1', { roomId: 'r1', toUserId: 'wrong', type: 'offer', payload: {} }),
      ).rejects.toThrow(ForbiddenException);
    });

    it('잘못된 type → BadRequest', async () => {
      await expect(
        service.sendSignal('u1', { roomId: 'r1', toUserId: 'u2', type: 'bogus', payload: {} }),
      ).rejects.toThrow(BadRequestException);
    });

    it('정상 offer 전송', async () => {
      mockPrisma.coffeeChat.findFirst.mockResolvedValue({
        roomId: 'r1',
        hostId: 'h1',
        requesterId: 'u1',
        status: 'accepted',
      });
      mockPrisma.webrtcSignal.create.mockResolvedValue({ id: 's1' });
      await service.sendSignal('h1', {
        roomId: 'r1',
        toUserId: 'u1',
        type: 'offer',
        payload: { sdp: '...' },
      });
      expect(mockPrisma.webrtcSignal.create).toHaveBeenCalled();
    });

    it('drainSignals — 읽으면 즉시 삭제', async () => {
      mockPrisma.webrtcSignal.findMany.mockResolvedValue([
        {
          id: 's1',
          type: 'offer',
          fromUserId: 'h1',
          payload: '{"sdp":"x"}',
          createdAt: new Date(),
        },
      ]);
      const result = await service.drainSignals('u1', 'r1');
      expect(result).toHaveLength(1);
      expect(result[0].payload).toEqual({ sdp: 'x' });
      expect(mockPrisma.webrtcSignal.deleteMany).toHaveBeenCalledWith({
        where: { id: { in: ['s1'] } },
      });
    });
  });

  describe('cleanupStaleSignals', () => {
    it('30초 이상 된 signal 삭제', async () => {
      await service.cleanupStaleSignals();
      expect(mockPrisma.webrtcSignal.deleteMany).toHaveBeenCalledWith({
        where: { createdAt: { lt: expect.any(Date) } },
      });
    });
  });

  describe('sendReminders (cron)', () => {
    beforeEach(() => {
      mockPrisma.notification = { findMany: jest.fn().mockResolvedValue([]) };
    });

    it('해당 시간대 chats 가 없으면 알림 X', async () => {
      mockPrisma.coffeeChat.findMany.mockResolvedValue([]);
      await service.sendReminders();
      expect(mockNotif.create).not.toHaveBeenCalled();
    });

    it('24h 윈도우에서 chat 발견 → 양쪽 알림', async () => {
      mockPrisma.coffeeChat.findMany
        .mockResolvedValueOnce([
          {
            id: 'cc1',
            hostId: 'h1',
            requesterId: 'u1',
            modality: 'video',
            host: { name: '코치' },
            requester: { name: '구직자' },
          },
        ])
        .mockResolvedValueOnce([]); // 1h 윈도우는 비어있음

      await service.sendReminders();

      expect(mockNotif.create).toHaveBeenCalledTimes(2); // host + requester
      expect(mockNotif.create).toHaveBeenCalledWith(
        'h1',
        'coffee_chat_reminder',
        expect.stringContaining('내일'),
        '/coffee-chats/cc1/room?reminder=24h',
      );
      expect(mockNotif.create).toHaveBeenCalledWith(
        'u1',
        'coffee_chat_reminder',
        expect.stringContaining('내일'),
        '/coffee-chats/cc1/room?reminder=24h',
      );
    });

    it('1h 윈도우 → "1시간 후" 메시지', async () => {
      mockPrisma.coffeeChat.findMany
        .mockResolvedValueOnce([]) // 24h
        .mockResolvedValueOnce([
          {
            id: 'cc2',
            hostId: 'h1',
            requesterId: 'u1',
            modality: 'voice',
            host: { name: 'A' },
            requester: { name: 'B' },
          },
        ]);

      await service.sendReminders();

      expect(mockNotif.create).toHaveBeenCalledWith(
        'h1',
        'coffee_chat_reminder',
        expect.stringContaining('1시간 후'),
        '/coffee-chats/cc2/room?reminder=1h',
      );
    });

    it('이미 같은 reminder 받은 사용자는 skip (중복 방지)', async () => {
      mockPrisma.coffeeChat.findMany
        .mockResolvedValueOnce([
          {
            id: 'cc1',
            hostId: 'h1',
            requesterId: 'u1',
            modality: 'video',
            host: { name: 'A' },
            requester: { name: 'B' },
          },
        ])
        .mockResolvedValueOnce([]);
      // host 가 이미 받은 상태
      (mockPrisma.notification as any).findMany.mockResolvedValue([
        { userId: 'h1', link: '/coffee-chats/cc1/room?reminder=24h' },
      ]);

      await service.sendReminders();

      // requester 한 명만 알림 받음
      expect(mockNotif.create).toHaveBeenCalledTimes(1);
      expect(mockNotif.create).toHaveBeenCalledWith(
        'u1',
        'coffee_chat_reminder',
        expect.any(String),
        '/coffee-chats/cc1/room?reminder=24h',
      );
    });

    it('Prisma 에러 → throw 안 함 (cron 안정성)', async () => {
      mockPrisma.coffeeChat.findMany.mockRejectedValueOnce(new Error('DB fail'));
      await expect(service.sendReminders()).resolves.toBeUndefined();
    });
  });

  describe('listTopics', () => {
    it('7개 preset topic 반환 (resume_review/mock_interview/.../general)', () => {
      const r = service.listTopics();
      expect(r.length).toBeGreaterThanOrEqual(5);
      const keys = r.map((t) => t.key);
      expect(keys).toContain('resume_review');
      expect(keys).toContain('mock_interview');
      expect(keys).toContain('general');
    });
  });

  describe('expireStalePending (cron)', () => {
    it('7일 무응답 pending → expired + requester 알림', async () => {
      mockPrisma.coffeeChat.findMany.mockResolvedValueOnce([
        { id: 'c1', hostId: 'h1', requesterId: 'r1' },
        { id: 'c2', hostId: 'h2', requesterId: 'r2' },
      ]);
      mockNotif.create.mockClear();
      await service.expireStalePending();
      expect(mockPrisma.coffeeChat.updateMany).toHaveBeenCalledWith({
        where: { id: { in: ['c1', 'c2'] } },
        data: { status: 'expired' },
      });
      expect(mockNotif.create).toHaveBeenCalledTimes(2);
    });

    it('stale 없으면 update / notify 호출 X', async () => {
      mockPrisma.coffeeChat.findMany.mockResolvedValueOnce([]);
      mockNotif.create.mockClear();
      mockPrisma.coffeeChat.updateMany.mockClear();
      await service.expireStalePending();
      expect(mockPrisma.coffeeChat.updateMany).not.toHaveBeenCalled();
      expect(mockNotif.create).not.toHaveBeenCalled();
    });
  });

  describe('Rate-limit (30일 3회)', () => {
    it('30일 내 3회 도달 시 BadRequest', async () => {
      mockPrisma.user.findUnique.mockResolvedValue({ id: 'h1', name: 'H' });
      mockPrisma.coffeeChat.findFirst.mockResolvedValue(null);
      mockPrisma.coffeeChat.count.mockResolvedValueOnce(3);
      await expect(service.create('me', { hostId: 'h1', message: 'x' })).rejects.toThrow(
        /30일.*3회/,
      );
    });

    it('count < 3 이면 정상 생성', async () => {
      mockPrisma.user.findUnique.mockResolvedValue({ id: 'h1', name: 'H' });
      mockPrisma.coffeeChat.findFirst.mockResolvedValue(null);
      mockPrisma.coffeeChat.count.mockResolvedValueOnce(2);
      mockPrisma.coffeeChat.create.mockResolvedValue({ id: 'new' });
      const r = await service.create('me', { hostId: 'h1', message: 'x' });
      expect(r.id).toBe('new');
    });
  });

  describe('leaveFeedback', () => {
    it('host 가 hostFeedback 만 update', async () => {
      mockPrisma.coffeeChat.findUnique.mockResolvedValueOnce({
        hostId: 'h1',
        requesterId: 'r1',
        status: 'completed',
      });
      mockPrisma.coffeeChat.update.mockResolvedValueOnce({ id: 'c1' });
      await service.leaveFeedback('c1', 'h1', '잘 만났어요');
      expect(mockPrisma.coffeeChat.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ hostFeedback: '잘 만났어요' }),
        }),
      );
    });

    it('참여자 외 → Forbidden', async () => {
      mockPrisma.coffeeChat.findUnique.mockResolvedValueOnce({
        hostId: 'h1',
        requesterId: 'r1',
        status: 'completed',
      });
      await expect(service.leaveFeedback('c1', 'other', 'x')).rejects.toThrow();
    });

    it('pending 상태에선 BadRequest', async () => {
      mockPrisma.coffeeChat.findUnique.mockResolvedValueOnce({
        hostId: 'h1',
        requesterId: 'r1',
        status: 'pending',
      });
      await expect(service.leaveFeedback('c1', 'h1', 'x')).rejects.toThrow();
    });
  });

  describe('getHostStats', () => {
    it('총/응답/완료/no-show/응답률 집계', async () => {
      mockPrisma.coffeeChat.findMany.mockResolvedValueOnce([
        // 5 pending — 미응답
        ...Array.from({ length: 5 }, () => ({
          status: 'pending',
          createdAt: new Date(),
          updatedAt: new Date(),
          hostJoined: false,
        })),
        // 3 accepted (응답함, 1 no-show)
        ...Array.from({ length: 3 }, (_, i) => ({
          status: 'accepted',
          createdAt: new Date(Date.now() - 5 * 3600 * 1000),
          updatedAt: new Date(),
          hostJoined: i > 0, // 첫 1개 no-show
        })),
        // 2 completed
        ...Array.from({ length: 2 }, () => ({
          status: 'completed',
          createdAt: new Date(),
          updatedAt: new Date(),
          hostJoined: true,
        })),
      ]);
      const r = await service.getHostStats('h1');
      expect(r.total).toBe(10);
      expect(r.responded).toBe(3); // accepted only (completed 는 포함 X)
      expect(r.completed).toBe(2);
      expect(r.noShow).toBe(1);
      expect(r.responseRate).toBe(30);
    });
  });

  describe('generateIcs', () => {
    const baseChat = {
      id: 'c1',
      hostId: 'h1',
      requesterId: 'r1',
      status: 'accepted',
      scheduledAt: new Date('2026-05-01T10:00:00Z'),
      durationMin: 30,
      topic: 'mock_interview',
      modality: 'video',
      message: 'test',
      host: { name: '코치', email: 'coach@test.com' },
      requester: { name: '구직자', email: 'seeker@test.com' },
    };

    it('accepted → ICS 문자열 반환 (BEGIN:VCALENDAR + UID + DTSTART)', async () => {
      mockPrisma.coffeeChat.findUnique.mockResolvedValueOnce(baseChat);
      const ics = await service.generateIcs('c1', 'h1');
      expect(ics).toContain('BEGIN:VCALENDAR');
      expect(ics).toContain('UID:coffee-chat-c1@');
      expect(ics).toContain('DTSTART:20260501T100000Z');
      expect(ics).toContain('SUMMARY');
      expect(ics).toContain('VALARM'); // 15분 전 알람
    });

    it('pending 상태 → BadRequest', async () => {
      mockPrisma.coffeeChat.findUnique.mockResolvedValueOnce({ ...baseChat, status: 'pending' });
      await expect(service.generateIcs('c1', 'h1')).rejects.toThrow();
    });

    it('참여자 외 → Forbidden', async () => {
      mockPrisma.coffeeChat.findUnique.mockResolvedValueOnce(baseChat);
      await expect(service.generateIcs('c1', 'stranger')).rejects.toThrow();
    });
  });
});
