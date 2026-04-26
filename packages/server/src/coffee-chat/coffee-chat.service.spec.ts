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
});
