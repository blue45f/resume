import { Test, TestingModule } from '@nestjs/testing';
import { SocialService } from './social.service';
import { PrismaService } from '../prisma/prisma.service';
import { NotificationsService } from '../notifications/notifications.service';
import { ForbiddenException } from '@nestjs/common';

const mockNotifications = { create: jest.fn() };

const mockPrisma = {
  follow: { create: jest.fn(), deleteMany: jest.fn(), findMany: jest.fn(), findFirst: jest.fn() },
  scoutMessage: { create: jest.fn(), findMany: jest.fn(), updateMany: jest.fn() },
  directMessage: { create: jest.fn(), findMany: jest.fn(), count: jest.fn(), updateMany: jest.fn(), findFirst: jest.fn() },
  user: { findUnique: jest.fn() },
};

describe('SocialService', () => {
  let service: SocialService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SocialService,
        { provide: PrismaService, useValue: mockPrisma },
        { provide: NotificationsService, useValue: mockNotifications },
      ],
    }).compile();
    service = module.get(SocialService);
    jest.clearAllMocks();
  });

  // ──────────────────────────────────────────────────
  // follow
  // ──────────────────────────────────────────────────
  describe('follow', () => {
    it('팔로우 성공', async () => {
      mockPrisma.follow.create.mockResolvedValue({});
      const result = await service.follow('user-1', 'user-2');
      expect(result).toEqual({ followed: true });
      expect(mockPrisma.follow.create).toHaveBeenCalledWith({
        data: { followerId: 'user-1', followingId: 'user-2' },
      });
    });

    it('자신을 팔로우 → ForbiddenException', async () => {
      await expect(service.follow('user-1', 'user-1')).rejects.toThrow(ForbiddenException);
      await expect(service.follow('user-1', 'user-1')).rejects.toThrow('자신을 팔로우할 수 없습니다');
      expect(mockPrisma.follow.create).not.toHaveBeenCalled();
    });

    it('중복 팔로우 시 unique constraint 에러를 무시하고 followed: true 반환', async () => {
      mockPrisma.follow.create.mockRejectedValue(new Error('Unique constraint violation'));
      const result = await service.follow('user-1', 'user-2');
      expect(result).toEqual({ followed: true });
    });
  });

  // ──────────────────────────────────────────────────
  // unfollow
  // ──────────────────────────────────────────────────
  describe('unfollow', () => {
    it('언팔로우 성공', async () => {
      mockPrisma.follow.deleteMany.mockResolvedValue({ count: 1 });
      const result = await service.unfollow('user-1', 'user-2');
      expect(result).toEqual({ followed: false });
      expect(mockPrisma.follow.deleteMany).toHaveBeenCalledWith({
        where: { followerId: 'user-1', followingId: 'user-2' },
      });
    });

    it('팔로우하지 않은 상태에서 언팔로우 → 에러 없이 followed: false', async () => {
      mockPrisma.follow.deleteMany.mockResolvedValue({ count: 0 });
      const result = await service.unfollow('user-1', 'user-2');
      expect(result).toEqual({ followed: false });
    });
  });

  // ──────────────────────────────────────────────────
  // getFollowers
  // ──────────────────────────────────────────────────
  describe('getFollowers', () => {
    it('팔로워 목록 반환 (follower 정보 + followedAt)', async () => {
      const now = new Date();
      mockPrisma.follow.findMany.mockResolvedValue([
        { follower: { id: 'f1', name: '홍길동', email: 'a@t.com', avatar: '' }, createdAt: now },
        { follower: { id: 'f2', name: '김철수', email: 'b@t.com', avatar: '' }, createdAt: now },
      ]);
      const result = await service.getFollowers('user-1');
      expect(result).toHaveLength(2);
      expect(result[0]).toEqual({ id: 'f1', name: '홍길동', email: 'a@t.com', avatar: '', followedAt: now });
      expect(result[1].id).toBe('f2');
    });

    it('팔로워가 없으면 빈 배열', async () => {
      mockPrisma.follow.findMany.mockResolvedValue([]);
      const result = await service.getFollowers('user-1');
      expect(result).toEqual([]);
    });

    it('followingId로 쿼리', async () => {
      mockPrisma.follow.findMany.mockResolvedValue([]);
      await service.getFollowers('user-1');
      expect(mockPrisma.follow.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ where: { followingId: 'user-1' } }),
      );
    });
  });

  // ──────────────────────────────────────────────────
  // getFollowing
  // ──────────────────────────────────────────────────
  describe('getFollowing', () => {
    it('팔로잉 목록 반환 (following 정보 + followedAt)', async () => {
      const now = new Date();
      mockPrisma.follow.findMany.mockResolvedValue([
        { following: { id: 'u2', name: '이영희', email: 'c@t.com', avatar: '' }, createdAt: now },
      ]);
      const result = await service.getFollowing('user-1');
      expect(result).toHaveLength(1);
      expect(result[0]).toEqual({ id: 'u2', name: '이영희', email: 'c@t.com', avatar: '', followedAt: now });
    });

    it('팔로잉이 없으면 빈 배열', async () => {
      mockPrisma.follow.findMany.mockResolvedValue([]);
      const result = await service.getFollowing('user-1');
      expect(result).toEqual([]);
    });

    it('followerId로 쿼리', async () => {
      mockPrisma.follow.findMany.mockResolvedValue([]);
      await service.getFollowing('user-1');
      expect(mockPrisma.follow.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ where: { followerId: 'user-1' } }),
      );
    });
  });

  // ──────────────────────────────────────────────────
  // isFollowing
  // ──────────────────────────────────────────────────
  describe('isFollowing', () => {
    it('팔로우 중이면 true', async () => {
      mockPrisma.follow.findFirst.mockResolvedValue({ id: 'f1' });
      const result = await service.isFollowing('user-1', 'user-2');
      expect(result).toBe(true);
    });

    it('팔로우하지 않으면 false', async () => {
      mockPrisma.follow.findFirst.mockResolvedValue(null);
      const result = await service.isFollowing('user-1', 'user-2');
      expect(result).toBe(false);
    });
  });

  // ──────────────────────────────────────────────────
  // sendScout
  // ──────────────────────────────────────────────────
  describe('sendScout', () => {
    const scoutData = {
      receiverId: 'user-2',
      resumeId: 'resume-1',
      company: '네이버',
      position: 'FE 개발자',
      message: '스카우트 제안입니다',
    };

    it('리크루터가 스카우트 전송 성공', async () => {
      mockPrisma.user.findUnique.mockResolvedValue({ name: '김리크루터', userType: 'recruiter' });
      mockPrisma.scoutMessage.create.mockResolvedValue({ id: 'sc-1', ...scoutData, senderId: 'user-1' });

      const result = await service.sendScout('user-1', scoutData);
      expect(result.id).toBe('sc-1');
      expect(mockPrisma.scoutMessage.create).toHaveBeenCalledWith({
        data: { senderId: 'user-1', ...scoutData },
      });
    });

    it('기업 회원이 스카우트 전송 성공', async () => {
      mockPrisma.user.findUnique.mockResolvedValue({ name: '기업담당자', userType: 'company' });
      mockPrisma.scoutMessage.create.mockResolvedValue({ id: 'sc-2', ...scoutData, senderId: 'user-1' });

      const result = await service.sendScout('user-1', scoutData);
      expect(result.id).toBe('sc-2');
    });

    it('개인 회원이 스카우트 → ForbiddenException', async () => {
      mockPrisma.user.findUnique.mockResolvedValue({ name: '개인유저', userType: 'personal' });

      await expect(service.sendScout('user-1', scoutData)).rejects.toThrow(ForbiddenException);
      await expect(service.sendScout('user-1', scoutData)).rejects.toThrow(
        '스카우트 전송은 리크루터 또는 기업 회원만 가능합니다',
      );
      expect(mockPrisma.scoutMessage.create).not.toHaveBeenCalled();
    });

    it('2000자 초과 메시지 → ForbiddenException', async () => {
      const longMessage = 'x'.repeat(2001);
      await expect(
        service.sendScout('user-1', { ...scoutData, message: longMessage }),
      ).rejects.toThrow('스카우트 메시지는 2000자 이내로 입력해주세요');
    });

    it('스카우트 전송 시 알림 생성', async () => {
      mockPrisma.user.findUnique.mockResolvedValue({ name: '김리크루터', userType: 'recruiter' });
      mockPrisma.scoutMessage.create.mockResolvedValue({ id: 'sc-1' });

      await service.sendScout('user-1', scoutData);
      expect(mockNotifications.create).toHaveBeenCalledWith(
        'user-2',
        'scout',
        '김리크루터님이 스카우트 제안을 보냈습니다',
        '/scouts',
      );
    });

    it('알림 생성 실패해도 스카우트는 정상 반환', async () => {
      mockPrisma.user.findUnique.mockResolvedValue({ name: '리크루터', userType: 'recruiter' });
      mockPrisma.scoutMessage.create.mockResolvedValue({ id: 'sc-1' });
      mockNotifications.create.mockRejectedValue(new Error('notification failed'));

      const result = await service.sendScout('user-1', scoutData);
      expect(result.id).toBe('sc-1');
    });
  });

  // ──────────────────────────────────────────────────
  // getReceivedScouts
  // ──────────────────────────────────────────────────
  describe('getReceivedScouts', () => {
    it('수신한 스카우트 목록 반환', async () => {
      mockPrisma.scoutMessage.findMany.mockResolvedValue([
        { id: 'sc-1', company: '네이버', sender: { id: 's1', name: '김리크루터', email: 'r@t.com' } },
      ]);
      const result = await service.getReceivedScouts('user-1');
      expect(result).toHaveLength(1);
      expect(result[0].company).toBe('네이버');
    });

    it('receiverId로 필터링하고 createdAt 내림차순 정렬', async () => {
      mockPrisma.scoutMessage.findMany.mockResolvedValue([]);
      await service.getReceivedScouts('user-1');
      expect(mockPrisma.scoutMessage.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { receiverId: 'user-1' },
          orderBy: { createdAt: 'desc' },
        }),
      );
    });
  });

  // ──────────────────────────────────────────────────
  // markScoutRead
  // ──────────────────────────────────────────────────
  describe('markScoutRead', () => {
    it('스카우트 읽음 처리 성공', async () => {
      mockPrisma.scoutMessage.updateMany.mockResolvedValue({ count: 1 });
      const result = await service.markScoutRead('sc-1', 'user-1');
      expect(result).toEqual({ success: true });
      expect(mockPrisma.scoutMessage.updateMany).toHaveBeenCalledWith({
        where: { id: 'sc-1', receiverId: 'user-1' },
        data: { read: true },
      });
    });
  });

  // ──────────────────────────────────────────────────
  // sendMessage (Direct Messages)
  // ──────────────────────────────────────────────────
  describe('sendMessage', () => {
    it('메시지 전송 성공', async () => {
      mockPrisma.directMessage.create.mockResolvedValue({ id: 'dm-1', content: '안녕하세요', senderId: 'user-1', receiverId: 'user-2' });
      mockPrisma.user.findUnique.mockResolvedValue({ name: '홍길동' });

      const result = await service.sendMessage('user-1', 'user-2', '안녕하세요');
      expect(result.id).toBe('dm-1');
      expect(result.content).toBe('안녕하세요');
    });

    it('자신에게 메시지 → ForbiddenException', async () => {
      await expect(service.sendMessage('user-1', 'user-1', '테스트')).rejects.toThrow(ForbiddenException);
      await expect(service.sendMessage('user-1', 'user-1', '테스트')).rejects.toThrow('자신에게 메시지를 보낼 수 없습니다');
    });

    it('빈 메시지 → ForbiddenException', async () => {
      await expect(service.sendMessage('user-1', 'user-2', '')).rejects.toThrow(ForbiddenException);
      await expect(service.sendMessage('user-1', 'user-2', '')).rejects.toThrow('메시지를 입력해주세요');
    });

    it('공백만 있는 메시지 → ForbiddenException', async () => {
      await expect(service.sendMessage('user-1', 'user-2', '   ')).rejects.toThrow(ForbiddenException);
    });

    it('1000자 초과 메시지 → ForbiddenException', async () => {
      const longContent = 'x'.repeat(1001);
      await expect(service.sendMessage('user-1', 'user-2', longContent)).rejects.toThrow(
        '메시지는 1000자 이내로 입력해주세요',
      );
    });

    it('메시지 전송 시 content 앞뒤 공백 제거', async () => {
      mockPrisma.directMessage.create.mockResolvedValue({ id: 'dm-1', content: '안녕' });
      mockPrisma.user.findUnique.mockResolvedValue({ name: '홍길동' });

      await service.sendMessage('user-1', 'user-2', '  안녕  ');
      expect(mockPrisma.directMessage.create).toHaveBeenCalledWith({
        data: { senderId: 'user-1', receiverId: 'user-2', content: '안녕' },
      });
    });

    it('메시지 전송 시 알림 생성', async () => {
      mockPrisma.directMessage.create.mockResolvedValue({ id: 'dm-1', content: '안녕' });
      mockPrisma.user.findUnique.mockResolvedValue({ name: '김철수' });

      await service.sendMessage('user-1', 'user-2', '안녕');
      expect(mockNotifications.create).toHaveBeenCalledWith(
        'user-2',
        'message',
        '김철수님이 쪽지를 보냈습니다',
        '/messages',
      );
    });

    it('알림 생성 실패해도 메시지는 정상 반환', async () => {
      mockPrisma.directMessage.create.mockResolvedValue({ id: 'dm-1', content: '안녕' });
      mockPrisma.user.findUnique.mockResolvedValue({ name: '홍길동' });
      mockNotifications.create.mockRejectedValue(new Error('fail'));

      const result = await service.sendMessage('user-1', 'user-2', '안녕');
      expect(result.id).toBe('dm-1');
    });
  });

  // ──────────────────────────────────────────────────
  // getMessages
  // ──────────────────────────────────────────────────
  describe('getMessages', () => {
    it('상대방과의 메시지 목록 반환 + 읽지 않은 메시지 읽음 처리', async () => {
      const messages = [
        { id: 'dm-1', content: '안녕', senderId: 'user-1', receiverId: 'user-2' },
        { id: 'dm-2', content: '반가워', senderId: 'user-2', receiverId: 'user-1' },
      ];
      mockPrisma.directMessage.updateMany.mockResolvedValue({ count: 1 });
      mockPrisma.directMessage.findMany.mockResolvedValue(messages);

      const result = await service.getMessages('user-1', 'user-2');
      expect(result).toHaveLength(2);
      // 상대방이 보낸 읽지 않은 메시지를 읽음 처리
      expect(mockPrisma.directMessage.updateMany).toHaveBeenCalledWith({
        where: { senderId: 'user-2', receiverId: 'user-1', read: false },
        data: { read: true },
      });
    });

    it('최대 100개 메시지 반환 (take: 100)', async () => {
      mockPrisma.directMessage.updateMany.mockResolvedValue({ count: 0 });
      mockPrisma.directMessage.findMany.mockResolvedValue([]);

      await service.getMessages('user-1', 'user-2');
      expect(mockPrisma.directMessage.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ take: 100, orderBy: { createdAt: 'asc' } }),
      );
    });
  });

  // ──────────────────────────────────────────────────
  // getConversations
  // ──────────────────────────────────────────────────
  describe('getConversations', () => {
    it('대화 목록을 최신순으로 반환', async () => {
      const oldDate = new Date('2026-01-01');
      const newDate = new Date('2026-04-01');

      mockPrisma.directMessage.findMany
        .mockResolvedValueOnce([{ receiverId: 'user-2' }]) // sent
        .mockResolvedValueOnce([{ senderId: 'user-3' }]); // received

      mockPrisma.directMessage.findFirst
        .mockResolvedValueOnce({ content: '오래된 메시지', createdAt: oldDate, senderId: 'user-1' }) // user-2 대화
        .mockResolvedValueOnce({ content: '최근 메시지', createdAt: newDate, senderId: 'user-3' }); // user-3 대화

      mockPrisma.directMessage.count
        .mockResolvedValueOnce(0) // user-2 unread
        .mockResolvedValueOnce(2); // user-3 unread

      mockPrisma.user.findUnique
        .mockResolvedValueOnce({ id: 'user-2', name: '김철수', email: 'b@t.com', avatar: '' })
        .mockResolvedValueOnce({ id: 'user-3', name: '이영희', email: 'c@t.com', avatar: '' });

      const result = await service.getConversations('user-1');
      expect(result).toHaveLength(2);
      // 최신 대화가 먼저
      expect(result[0].partner.id).toBe('user-3');
      expect(result[0].unreadCount).toBe(2);
      expect(result[1].partner.id).toBe('user-2');
      expect(result[1].lastMessage.isMine).toBe(true);
    });

    it('대화가 없으면 빈 배열', async () => {
      mockPrisma.directMessage.findMany
        .mockResolvedValueOnce([])
        .mockResolvedValueOnce([]);

      const result = await service.getConversations('user-1');
      expect(result).toEqual([]);
    });
  });

  // ──────────────────────────────────────────────────
  // getUnreadMessageCount
  // ──────────────────────────────────────────────────
  describe('getUnreadMessageCount', () => {
    it('읽지 않은 메시지 수 반환', async () => {
      mockPrisma.directMessage.count.mockResolvedValue(5);
      const count = await service.getUnreadMessageCount('user-1');
      expect(count).toBe(5);
      expect(mockPrisma.directMessage.count).toHaveBeenCalledWith({
        where: { receiverId: 'user-1', read: false },
      });
    });

    it('읽지 않은 메시지가 없으면 0', async () => {
      mockPrisma.directMessage.count.mockResolvedValue(0);
      const count = await service.getUnreadMessageCount('user-1');
      expect(count).toBe(0);
    });
  });

  // ──────────────────────────────────────────────────
  // mutual follow detection
  // ──────────────────────────────────────────────────
  describe('mutual follow detection', () => {
    it('양방향 팔로우 시 서로 isFollowing=true', async () => {
      // user-1 → user-2
      mockPrisma.follow.findFirst.mockResolvedValue({ id: 'f1' });
      expect(await service.isFollowing('user-1', 'user-2')).toBe(true);

      // user-2 → user-1
      mockPrisma.follow.findFirst.mockResolvedValue({ id: 'f2' });
      expect(await service.isFollowing('user-2', 'user-1')).toBe(true);
    });

    it('단방향 팔로우 시 한쪽만 true', async () => {
      // user-1 → user-2 존재
      mockPrisma.follow.findFirst.mockResolvedValueOnce({ id: 'f1' });
      expect(await service.isFollowing('user-1', 'user-2')).toBe(true);

      // user-2 → user-1 없음
      mockPrisma.follow.findFirst.mockResolvedValueOnce(null);
      expect(await service.isFollowing('user-2', 'user-1')).toBe(false);
    });
  });

  // ──────────────────────────────────────────────────
  // scout message edge cases
  // ──────────────────────────────────────────────────
  describe('scout message edge cases', () => {
    it('스카우트 메시지 정확히 2000자 허용', async () => {
      const exactMessage = 'x'.repeat(2000);
      mockPrisma.user.findUnique.mockResolvedValue({ name: '리크루터', userType: 'recruiter' });
      mockPrisma.scoutMessage.create.mockResolvedValue({ id: 'sc-1' });

      const result = await service.sendScout('user-1', {
        receiverId: 'user-2',
        company: '네이버',
        position: '개발자',
        message: exactMessage,
      });
      expect(result.id).toBe('sc-1');
    });

    it('스카우트 수신 목록은 최신순 정렬 (createdAt desc)', async () => {
      mockPrisma.scoutMessage.findMany.mockResolvedValue([]);
      await service.getReceivedScouts('user-1');
      expect(mockPrisma.scoutMessage.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          orderBy: { createdAt: 'desc' },
        }),
      );
    });

    it('sender가 null인 경우 이름을 "누군가"로 표시', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(null);
      mockPrisma.scoutMessage.create.mockResolvedValue({ id: 'sc-1' });

      // userType check: null user doesn't have personal type, so no ForbiddenException
      // but sendScout checks sender?.userType === 'personal', null?.userType is undefined, not 'personal'
      await service.sendScout('user-1', {
        receiverId: 'user-2',
        company: '카카오',
        position: '개발자',
        message: '스카우트 제안',
      });
      expect(mockNotifications.create).toHaveBeenCalledWith(
        'user-2',
        'scout',
        '누군가님이 스카우트 제안을 보냈습니다',
        '/scouts',
      );
    });
  });

  // ──────────────────────────────────────────────────
  // direct message ordering
  // ──────────────────────────────────────────────────
  describe('direct message ordering', () => {
    it('getMessages는 createdAt 오름차순으로 반환 (시간순 대화)', async () => {
      mockPrisma.directMessage.updateMany.mockResolvedValue({ count: 0 });
      mockPrisma.directMessage.findMany.mockResolvedValue([]);

      await service.getMessages('user-1', 'user-2');
      expect(mockPrisma.directMessage.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          orderBy: { createdAt: 'asc' },
          take: 100,
        }),
      );
    });

    it('getMessages는 양방향 메시지를 모두 포함', async () => {
      mockPrisma.directMessage.updateMany.mockResolvedValue({ count: 0 });
      mockPrisma.directMessage.findMany.mockResolvedValue([]);

      await service.getMessages('user-1', 'user-2');
      expect(mockPrisma.directMessage.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: {
            OR: [
              { senderId: 'user-1', receiverId: 'user-2' },
              { senderId: 'user-2', receiverId: 'user-1' },
            ],
          },
        }),
      );
    });

    it('getConversations는 파트너가 없는 대화를 제외', async () => {
      mockPrisma.directMessage.findMany
        .mockResolvedValueOnce([{ receiverId: 'user-deleted' }]) // sent
        .mockResolvedValueOnce([]); // received

      mockPrisma.directMessage.findFirst.mockResolvedValue({
        content: '메시지', createdAt: new Date(), senderId: 'user-1',
      });
      mockPrisma.directMessage.count.mockResolvedValue(0);
      mockPrisma.user.findUnique.mockResolvedValue(null); // deleted user

      const result = await service.getConversations('user-1');
      expect(result).toEqual([]);
    });

    it('getConversations는 lastMessage가 없는 대화를 제외', async () => {
      mockPrisma.directMessage.findMany
        .mockResolvedValueOnce([{ receiverId: 'user-2' }])
        .mockResolvedValueOnce([]);

      mockPrisma.directMessage.findFirst.mockResolvedValue(null); // no last message
      mockPrisma.directMessage.count.mockResolvedValue(0);
      mockPrisma.user.findUnique.mockResolvedValue({ id: 'user-2', name: '김철수', email: 'b@t.com', avatar: '' });

      const result = await service.getConversations('user-1');
      expect(result).toEqual([]);
    });
  });

  // ──────────────────────────────────────────────────
  // message reactions (validation edge cases)
  // ──────────────────────────────────────────────────
  describe('message content validation', () => {
    it('메시지 내용이 정확히 1000자면 허용', async () => {
      const exactContent = 'x'.repeat(1000);
      mockPrisma.directMessage.create.mockResolvedValue({ id: 'dm-1', content: exactContent });
      mockPrisma.user.findUnique.mockResolvedValue({ name: '홍길동' });

      const result = await service.sendMessage('user-1', 'user-2', exactContent);
      expect(result.id).toBe('dm-1');
    });

    it('메시지 내용이 정확히 1자면 허용', async () => {
      mockPrisma.directMessage.create.mockResolvedValue({ id: 'dm-1', content: '안' });
      mockPrisma.user.findUnique.mockResolvedValue({ name: '홍길동' });

      const result = await service.sendMessage('user-1', 'user-2', '안');
      expect(result.id).toBe('dm-1');
    });

    it('sender 이름이 null일 때 "누군가"로 알림 생성', async () => {
      mockPrisma.directMessage.create.mockResolvedValue({ id: 'dm-1', content: '안녕' });
      mockPrisma.user.findUnique.mockResolvedValue(null);

      await service.sendMessage('user-1', 'user-2', '안녕');
      expect(mockNotifications.create).toHaveBeenCalledWith(
        'user-2',
        'message',
        '누군가님이 쪽지를 보냈습니다',
        '/messages',
      );
    });
  });
});
