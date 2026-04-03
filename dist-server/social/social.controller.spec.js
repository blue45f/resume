"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const testing_1 = require("@nestjs/testing");
const social_controller_1 = require("./social.controller");
const social_service_1 = require("./social.service");
const mockSocialService = {
    follow: jest.fn(),
    unfollow: jest.fn(),
    getFollowers: jest.fn(),
    getFollowing: jest.fn(),
    sendScout: jest.fn(),
    getReceivedScouts: jest.fn(),
    markScoutRead: jest.fn(),
    sendMessage: jest.fn(),
    getMessages: jest.fn(),
    getConversations: jest.fn(),
    getUnreadMessageCount: jest.fn(),
};
describe('SocialController', () => {
    let controller;
    beforeEach(async () => {
        const module = await testing_1.Test.createTestingModule({
            controllers: [social_controller_1.SocialController],
            providers: [{ provide: social_service_1.SocialService, useValue: mockSocialService }],
        }).compile();
        controller = module.get(social_controller_1.SocialController);
        jest.clearAllMocks();
    });
    describe('follow (POST /social/follow/:userId)', () => {
        it('로그인 사용자 → 팔로우 성공', async () => {
            mockSocialService.follow.mockResolvedValue({ followed: true });
            const result = await controller.follow('target-user', { user: { id: 'u1' } });
            expect(result).toEqual({ followed: true });
            expect(mockSocialService.follow).toHaveBeenCalledWith('u1', 'target-user');
        });
        it('비로그인 → 에러 메시지 반환', () => {
            const result = controller.follow('target-user', { user: null });
            expect(result).toEqual({ error: '로그인 필요' });
            expect(mockSocialService.follow).not.toHaveBeenCalled();
        });
        it('user.id 없음 → 에러 메시지 반환', () => {
            const result = controller.follow('target-user', { user: {} });
            expect(result).toEqual({ error: '로그인 필요' });
        });
    });
    describe('unfollow (DELETE /social/follow/:userId)', () => {
        it('로그인 사용자 → 언팔로우 성공', async () => {
            mockSocialService.unfollow.mockResolvedValue({ followed: false });
            const result = await controller.unfollow('target-user', { user: { id: 'u1' } });
            expect(result).toEqual({ followed: false });
            expect(mockSocialService.unfollow).toHaveBeenCalledWith('u1', 'target-user');
        });
        it('비로그인 → 에러 메시지 반환', () => {
            const result = controller.unfollow('target-user', { user: null });
            expect(result).toEqual({ error: '로그인 필요' });
            expect(mockSocialService.unfollow).not.toHaveBeenCalled();
        });
    });
    describe('getFollowers (GET /social/followers)', () => {
        it('로그인 사용자 → 팔로워 목록 반환', async () => {
            const followers = [
                { id: 'u2', name: '김철수', followedAt: new Date() },
            ];
            mockSocialService.getFollowers.mockResolvedValue(followers);
            const result = await controller.getFollowers({ user: { id: 'u1' } });
            expect(result).toEqual(followers);
            expect(mockSocialService.getFollowers).toHaveBeenCalledWith('u1');
        });
        it('비로그인 → 빈 배열 반환', () => {
            const result = controller.getFollowers({ user: null });
            expect(result).toEqual([]);
            expect(mockSocialService.getFollowers).not.toHaveBeenCalled();
        });
    });
    describe('getFollowing (GET /social/following)', () => {
        it('로그인 사용자 → 팔로잉 목록 반환', async () => {
            const following = [{ id: 'u3', name: '박영희' }];
            mockSocialService.getFollowing.mockResolvedValue(following);
            const result = await controller.getFollowing({ user: { id: 'u1' } });
            expect(result).toEqual(following);
            expect(mockSocialService.getFollowing).toHaveBeenCalledWith('u1');
        });
        it('비로그인 → 빈 배열 반환', () => {
            const result = controller.getFollowing({ user: null });
            expect(result).toEqual([]);
        });
    });
    describe('sendScout (POST /social/scout)', () => {
        const scoutBody = {
            receiverId: 'u2',
            resumeId: 'r1',
            company: '테크컴퍼니',
            position: '시니어 개발자',
            message: '귀하의 이력서를 인상깊게 보았습니다.',
        };
        it('로그인 사용자 → 스카우트 전송 성공', async () => {
            const scout = { id: 's1', senderId: 'u1', ...scoutBody };
            mockSocialService.sendScout.mockResolvedValue(scout);
            const result = await controller.sendScout(scoutBody, { user: { id: 'u1' } });
            expect(result).toEqual(scout);
            expect(mockSocialService.sendScout).toHaveBeenCalledWith('u1', scoutBody);
        });
        it('비로그인 → 에러 메시지 반환', () => {
            const result = controller.sendScout(scoutBody, { user: null });
            expect(result).toEqual({ error: '로그인 필요' });
            expect(mockSocialService.sendScout).not.toHaveBeenCalled();
        });
        it('resumeId 없이도 스카우트 전송 가능', async () => {
            const bodyNoResume = { ...scoutBody, resumeId: undefined };
            mockSocialService.sendScout.mockResolvedValue({ id: 's2' });
            const result = await controller.sendScout(bodyNoResume, { user: { id: 'u1' } });
            expect(result).toEqual({ id: 's2' });
        });
    });
    describe('getScouts (GET /social/scouts)', () => {
        it('로그인 사용자 → 받은 스카우트 목록 반환', async () => {
            const scouts = [
                { id: 's1', senderId: 'u2', company: '테크사', sender: { name: '리크루터' } },
            ];
            mockSocialService.getReceivedScouts.mockResolvedValue(scouts);
            const result = await controller.getScouts({ user: { id: 'u1' } });
            expect(result).toEqual(scouts);
            expect(mockSocialService.getReceivedScouts).toHaveBeenCalledWith('u1');
        });
        it('비로그인 → 빈 배열 반환', () => {
            const result = controller.getScouts({ user: null });
            expect(result).toEqual([]);
        });
    });
    describe('markRead (POST /social/scouts/:id/read)', () => {
        it('로그인 사용자 → 읽음 처리 성공', async () => {
            mockSocialService.markScoutRead.mockResolvedValue({ success: true });
            const result = await controller.markRead('s1', { user: { id: 'u1' } });
            expect(result).toEqual({ success: true });
            expect(mockSocialService.markScoutRead).toHaveBeenCalledWith('s1', 'u1');
        });
        it('비로그인 → { success: false }', () => {
            const result = controller.markRead('s1', { user: null });
            expect(result).toEqual({ success: false });
        });
    });
    describe('sendMessage (POST /social/messages/:receiverId)', () => {
        it('로그인 사용자 → 쪽지 전송 성공', async () => {
            const message = { id: 'm1', senderId: 'u1', receiverId: 'u2', content: '안녕하세요' };
            mockSocialService.sendMessage.mockResolvedValue(message);
            const result = await controller.sendMessage('u2', '안녕하세요', { user: { id: 'u1' } });
            expect(result).toEqual(message);
            expect(mockSocialService.sendMessage).toHaveBeenCalledWith('u1', 'u2', '안녕하세요');
        });
        it('비로그인 → 에러 메시지 반환', () => {
            const result = controller.sendMessage('u2', '내용', { user: null });
            expect(result).toEqual({ error: '로그인 필요' });
            expect(mockSocialService.sendMessage).not.toHaveBeenCalled();
        });
        it('user.id 없음 → 에러 메시지 반환', () => {
            const result = controller.sendMessage('u2', '내용', { user: {} });
            expect(result).toEqual({ error: '로그인 필요' });
        });
    });
    describe('getMessages (GET /social/messages/:partnerId)', () => {
        it('로그인 사용자 → 대화 내용 반환', async () => {
            const messages = [
                { id: 'm1', senderId: 'u1', receiverId: 'u2', content: '안녕하세요' },
                { id: 'm2', senderId: 'u2', receiverId: 'u1', content: '반갑습니다' },
            ];
            mockSocialService.getMessages.mockResolvedValue(messages);
            const result = await controller.getMessages('u2', { user: { id: 'u1' } });
            expect(result).toEqual(messages);
            expect(mockSocialService.getMessages).toHaveBeenCalledWith('u1', 'u2');
        });
        it('비로그인 → 빈 배열 반환', () => {
            const result = controller.getMessages('u2', { user: null });
            expect(result).toEqual([]);
            expect(mockSocialService.getMessages).not.toHaveBeenCalled();
        });
    });
    describe('getConversations (GET /social/messages)', () => {
        it('로그인 사용자 → 대화 목록 반환', async () => {
            const conversations = [
                { partnerId: 'u2', partnerName: '김철수', lastMessage: '반갑습니다' },
            ];
            mockSocialService.getConversations.mockResolvedValue(conversations);
            const result = await controller.getConversations({ user: { id: 'u1' } });
            expect(result).toEqual(conversations);
            expect(mockSocialService.getConversations).toHaveBeenCalledWith('u1');
        });
        it('비로그인 → 빈 배열 반환', () => {
            const result = controller.getConversations({ user: null });
            expect(result).toEqual([]);
        });
    });
    describe('getUnreadCount (GET /social/messages/unread/count)', () => {
        it('로그인 사용자 → 읽지 않은 쪽지 수 반환', async () => {
            mockSocialService.getUnreadMessageCount.mockResolvedValue(5);
            const result = await controller.getUnreadCount({ user: { id: 'u1' } });
            expect(result).toEqual({ count: 5 });
            expect(mockSocialService.getUnreadMessageCount).toHaveBeenCalledWith('u1');
        });
        it('비로그인 → { count: 0 }', async () => {
            const result = await controller.getUnreadCount({ user: null });
            expect(result).toEqual({ count: 0 });
            expect(mockSocialService.getUnreadMessageCount).not.toHaveBeenCalled();
        });
        it('읽지 않은 메시지 없음 → { count: 0 }', async () => {
            mockSocialService.getUnreadMessageCount.mockResolvedValue(0);
            const result = await controller.getUnreadCount({ user: { id: 'u1' } });
            expect(result).toEqual({ count: 0 });
        });
    });
});
