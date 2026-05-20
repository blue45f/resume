import { Test, TestingModule } from '@nestjs/testing';
import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { StudyGroupsService } from './study-groups.service';
import { PrismaService } from '../prisma/prisma.service';
import { SystemConfigService } from '../system-config/system-config.service';

const mockConfig = {
  isFeatureEnabled: jest.fn().mockResolvedValue(true),
  assertFeatureEnabled: jest.fn().mockResolvedValue(undefined),
};

const mockPrisma: any = {
  studyGroup: {
    findMany: jest.fn(),
    findUnique: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
    count: jest.fn(),
  },
  studyGroupMember: {
    findUnique: jest.fn(),
    create: jest.fn(),
    delete: jest.fn(),
  },
  studyGroupQuestion: {
    create: jest.fn(),
    findMany: jest.fn(),
    findUnique: jest.fn(),
    update: jest.fn(),
  },
  studyGroupQuestionVote: {
    findUnique: jest.fn(),
    create: jest.fn(),
    delete: jest.fn(),
  },
  studyGroupQuestionAnswer: {
    findUnique: jest.fn(),
    findMany: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
  },
  studyGroupQuestionAnswerVote: {
    findUnique: jest.fn(),
    findMany: jest.fn(),
    create: jest.fn(),
    delete: jest.fn(),
  },
  studyGroupPost: {
    findUnique: jest.fn(),
    update: jest.fn(),
  },
  studyGroupPostLike: {
    findUnique: jest.fn(),
    create: jest.fn(),
    delete: jest.fn(),
  },
  $transaction: jest.fn(async (arg: any) => {
    // 두 가지 호출 형태 지원: $transaction(fn) 또는 $transaction([promise, ...])
    if (typeof arg === 'function') return arg(mockPrisma);
    return Promise.all(arg);
  }),
};

describe('StudyGroupsService', () => {
  let service: StudyGroupsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        StudyGroupsService,
        { provide: PrismaService, useValue: mockPrisma },
        { provide: SystemConfigService, useValue: mockConfig },
      ],
    }).compile();
    service = module.get(StudyGroupsService);
    jest.clearAllMocks();
  });

  describe('findOne', () => {
    it('존재하지 않으면 NotFound', async () => {
      mockPrisma.studyGroup.findUnique.mockResolvedValueOnce(null);
      await expect(service.findOne('g1')).rejects.toThrow(NotFoundException);
    });

    it('비공개 그룹 + 비로그인 → Forbidden', async () => {
      mockPrisma.studyGroup.findUnique.mockResolvedValueOnce({
        id: 'g1',
        isPrivate: true,
        ownerId: 'owner',
        members: [],
      });
      await expect(service.findOne('g1')).rejects.toThrow(ForbiddenException);
    });

    it('비공개 그룹 + 멤버 아님 → Forbidden', async () => {
      mockPrisma.studyGroup.findUnique.mockResolvedValueOnce({
        id: 'g1',
        isPrivate: true,
        ownerId: 'owner',
        members: [{ userId: 'someone' }],
      });
      await expect(service.findOne('g1', 'outsider')).rejects.toThrow(ForbiddenException);
    });

    it('비공개 그룹 + 멤버면 통과', async () => {
      const group = {
        id: 'g1',
        isPrivate: true,
        ownerId: 'owner',
        members: [{ userId: 'u1' }],
      };
      mockPrisma.studyGroup.findUnique.mockResolvedValueOnce(group);
      await expect(service.findOne('g1', 'u1')).resolves.toBe(group);
    });

    it('비공개 그룹 + 소유자면 통과', async () => {
      const group = { id: 'g1', isPrivate: true, ownerId: 'owner', members: [] };
      mockPrisma.studyGroup.findUnique.mockResolvedValueOnce(group);
      await expect(service.findOne('g1', 'owner')).resolves.toBe(group);
    });
  });

  describe('create', () => {
    beforeEach(() => {
      mockPrisma.studyGroup.create.mockResolvedValue({ id: 'g1' });
      mockPrisma.studyGroupMember.create.mockResolvedValue({});
    });

    it('이름 공백 → BadRequest', async () => {
      await expect(service.create('u1', { name: '   ' })).rejects.toThrow(BadRequestException);
    });

    it('maxMembers 하한 2 clamp (1 → 2)', async () => {
      await service.create('u1', { name: 'FE 스터디', maxMembers: 1 });
      expect(mockPrisma.studyGroup.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ maxMembers: 2 }),
        }),
      );
    });

    it('maxMembers 미지정 시 기본값 20', async () => {
      await service.create('u1', { name: 'FE 스터디' });
      expect(mockPrisma.studyGroup.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ maxMembers: 20 }),
        }),
      );
    });

    it('maxMembers 상한 200 clamp', async () => {
      await service.create('u1', { name: 'BE 스터디', maxMembers: 9999 });
      expect(mockPrisma.studyGroup.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ maxMembers: 200 }),
        }),
      );
    });

    it('생성 시 생성자는 owner 멤버로 자동 가입', async () => {
      await service.create('u1', { name: '공기업 면접' });
      expect(mockPrisma.studyGroupMember.create).toHaveBeenCalledWith({
        data: { groupId: 'g1', userId: 'u1', role: 'owner' },
      });
    });
  });

  describe('join', () => {
    it('존재하지 않으면 NotFound', async () => {
      mockPrisma.studyGroup.findUnique.mockResolvedValueOnce(null);
      await expect(service.join('g1', 'u1')).rejects.toThrow(NotFoundException);
    });

    it('이미 가입했으면 Conflict', async () => {
      mockPrisma.studyGroup.findUnique.mockResolvedValueOnce({
        id: 'g1',
        maxMembers: 10,
        memberCount: 3,
      });
      mockPrisma.studyGroupMember.findUnique.mockResolvedValueOnce({ id: 'm1' });
      await expect(service.join('g1', 'u1')).rejects.toThrow(ConflictException);
    });

    it('정원 초과 → Forbidden', async () => {
      mockPrisma.studyGroup.findUnique.mockResolvedValueOnce({
        id: 'g1',
        maxMembers: 3,
        memberCount: 3,
      });
      mockPrisma.studyGroupMember.findUnique.mockResolvedValueOnce(null);
      await expect(service.join('g1', 'u1')).rejects.toThrow(ForbiddenException);
    });

    it('정상 가입 시 memberCount 증가', async () => {
      mockPrisma.studyGroup.findUnique.mockResolvedValueOnce({
        id: 'g1',
        maxMembers: 10,
        memberCount: 3,
      });
      mockPrisma.studyGroupMember.findUnique.mockResolvedValueOnce(null);
      mockPrisma.studyGroupMember.create.mockResolvedValueOnce({ id: 'm1' });
      await service.join('g1', 'u1');
      expect(mockPrisma.studyGroup.update).toHaveBeenCalledWith({
        where: { id: 'g1' },
        data: { memberCount: { increment: 1 } },
      });
    });
  });

  describe('leave', () => {
    it('소유자 탈퇴 시 Forbidden (삭제 유도)', async () => {
      mockPrisma.studyGroup.findUnique.mockResolvedValueOnce({
        id: 'g1',
        ownerId: 'u1',
        memberCount: 5,
      });
      await expect(service.leave('g1', 'u1')).rejects.toThrow(ForbiddenException);
    });

    it('멤버 아닌 유저 탈퇴 시 NotFound', async () => {
      mockPrisma.studyGroup.findUnique.mockResolvedValueOnce({
        id: 'g1',
        ownerId: 'owner',
        memberCount: 5,
      });
      mockPrisma.studyGroupMember.findUnique.mockResolvedValueOnce(null);
      await expect(service.leave('g1', 'u1')).rejects.toThrow(NotFoundException);
    });

    it('정상 탈퇴 시 memberCount 감소', async () => {
      mockPrisma.studyGroup.findUnique.mockResolvedValueOnce({
        id: 'g1',
        ownerId: 'owner',
        memberCount: 5,
      });
      mockPrisma.studyGroupMember.findUnique.mockResolvedValueOnce({ id: 'm1' });
      mockPrisma.studyGroupMember.delete.mockResolvedValueOnce({});
      await service.leave('g1', 'u1');
      expect(mockPrisma.studyGroup.update).toHaveBeenCalledWith({
        where: { id: 'g1' },
        data: { memberCount: { decrement: 1 } },
      });
    });
  });

  describe('remove', () => {
    it('소유자가 아니면 Forbidden', async () => {
      mockPrisma.studyGroup.findUnique.mockResolvedValueOnce({ id: 'g1', ownerId: 'owner' });
      await expect(service.remove('g1', 'outsider')).rejects.toThrow(ForbiddenException);
    });

    it('admin 역할은 타인 그룹 삭제 가능', async () => {
      mockPrisma.studyGroup.findUnique.mockResolvedValueOnce({ id: 'g1', ownerId: 'owner' });
      mockPrisma.studyGroup.delete.mockResolvedValueOnce({});
      await expect(service.remove('g1', 'admin-u', 'admin')).resolves.toEqual({ success: true });
    });
  });

  describe('addQuestion', () => {
    it('질문 공백 → BadRequest', async () => {
      await expect(service.addQuestion('g1', 'u1', { question: '   ' })).rejects.toThrow(
        BadRequestException,
      );
    });

    it('멤버 아닌 유저 → Forbidden', async () => {
      mockPrisma.studyGroup.findUnique.mockResolvedValueOnce({
        id: 'g1',
        isPrivate: false,
        ownerId: 'owner',
      });
      mockPrisma.studyGroupMember.findUnique.mockResolvedValueOnce(null);
      await expect(
        service.addQuestion('g1', 'outsider', { question: '왜 이 회사인가요?' }),
      ).rejects.toThrow(ForbiddenException);
    });

    it('멤버면 추가 가능', async () => {
      mockPrisma.studyGroup.findUnique.mockResolvedValueOnce({
        id: 'g1',
        isPrivate: false,
        ownerId: 'owner',
      });
      mockPrisma.studyGroupMember.findUnique.mockResolvedValueOnce({ id: 'm1' });
      mockPrisma.studyGroupQuestion.create.mockResolvedValueOnce({ id: 'q1' });
      await service.addQuestion('g1', 'u1', { question: '왜 이 회사인가요?' });
      expect(mockPrisma.studyGroupQuestion.create).toHaveBeenCalled();
    });
  });

  describe('adminForceClose', () => {
    it('비공개 + maxMembers 현재 인원으로 동결', async () => {
      mockPrisma.studyGroup.findUnique.mockResolvedValueOnce({
        id: 'g1',
        memberCount: 7,
        isPrivate: false,
      });
      await service.adminForceClose('g1');
      expect(mockPrisma.studyGroup.update).toHaveBeenCalledWith({
        where: { id: 'g1' },
        data: { isPrivate: true, maxMembers: 7 },
      });
    });
  });

  // ─────────────────────────────────────────────
  // 추가 — addQuestion 길이 검증 (P1-3)
  // ─────────────────────────────────────────────
  describe('addQuestion validation', () => {
    it('1자 question → BadRequest', async () => {
      await expect(service.addQuestion('g1', 'u1', { question: 'A' })).rejects.toThrow(
        BadRequestException,
      );
    });

    it('1001자 question → BadRequest', async () => {
      await expect(service.addQuestion('g1', 'u1', { question: 'A'.repeat(1001) })).rejects.toThrow(
        BadRequestException,
      );
    });

    it('sampleAnswer 5001자는 5000으로 잘림', async () => {
      mockPrisma.studyGroup.findUnique.mockResolvedValueOnce({
        id: 'g1',
        isPrivate: false,
        ownerId: 'owner',
      });
      mockPrisma.studyGroupMember.findUnique.mockResolvedValueOnce({ id: 'm1' });
      mockPrisma.studyGroupQuestion.create.mockResolvedValueOnce({ id: 'q1' });
      await service.addQuestion('g1', 'u1', {
        question: '왜 이 회사인가요?',
        sampleAnswer: 'X'.repeat(5001),
      });
      const callArgs = mockPrisma.studyGroupQuestion.create.mock.calls[0][0];
      expect(callArgs.data.sampleAnswer.length).toBe(5000);
    });

    it('difficulty 화이트리스트에 없으면 intermediate 기본값', async () => {
      mockPrisma.studyGroup.findUnique.mockResolvedValueOnce({
        id: 'g1',
        isPrivate: false,
        ownerId: 'owner',
      });
      mockPrisma.studyGroupMember.findUnique.mockResolvedValueOnce({ id: 'm1' });
      mockPrisma.studyGroupQuestion.create.mockResolvedValueOnce({ id: 'q1' });
      await service.addQuestion('g1', 'u1', {
        question: '왜 이 회사인가요?',
        difficulty: 'expert',
      });
      const callArgs = mockPrisma.studyGroupQuestion.create.mock.calls[0][0];
      expect(callArgs.data.difficulty).toBe('intermediate');
    });
  });

  // ─────────────────────────────────────────────
  // upvoteQuestion — 중복 추천 방지 (P1-2)
  // ─────────────────────────────────────────────
  describe('upvoteQuestion', () => {
    it('비로그인 → Forbidden', async () => {
      await expect(service.upvoteQuestion('q1', '')).rejects.toThrow(ForbiddenException);
    });

    it('본인 문제 → BadRequest', async () => {
      mockPrisma.studyGroupQuestion.findUnique.mockResolvedValueOnce({
        id: 'q1',
        groupId: 'g1',
        userId: 'u1',
      });
      mockPrisma.studyGroup.findUnique.mockResolvedValueOnce({
        id: 'g1',
        isPrivate: false,
        ownerId: 'owner',
      });
      await expect(service.upvoteQuestion('q1', 'u1')).rejects.toThrow(BadRequestException);
    });

    it('첫 호출 → upvote 생성 + upvotes 증가', async () => {
      mockPrisma.studyGroupQuestion.findUnique.mockResolvedValueOnce({
        id: 'q1',
        groupId: 'g1',
        userId: 'author',
      });
      mockPrisma.studyGroup.findUnique.mockResolvedValueOnce({
        id: 'g1',
        isPrivate: false,
        ownerId: 'owner',
      });
      mockPrisma.studyGroupQuestionVote.findUnique.mockResolvedValueOnce(null);
      mockPrisma.studyGroupQuestionVote.create.mockResolvedValueOnce({ id: 'v1' });
      mockPrisma.studyGroupQuestion.update.mockResolvedValueOnce({ id: 'q1', upvotes: 1 });
      const result = await service.upvoteQuestion('q1', 'u2');
      expect(result.upvoted).toBe(true);
      expect(result.upvotes).toBe(1);
    });

    it('두번째 호출 → 토글 off (delete + decrement)', async () => {
      mockPrisma.studyGroupQuestion.findUnique.mockResolvedValueOnce({
        id: 'q1',
        groupId: 'g1',
        userId: 'author',
      });
      mockPrisma.studyGroup.findUnique.mockResolvedValueOnce({
        id: 'g1',
        isPrivate: false,
        ownerId: 'owner',
      });
      mockPrisma.studyGroupQuestionVote.findUnique.mockResolvedValueOnce({ id: 'v1' });
      mockPrisma.studyGroupQuestionVote.delete.mockResolvedValueOnce({});
      mockPrisma.studyGroupQuestion.update.mockResolvedValueOnce({ id: 'q1', upvotes: 0 });
      const result = await service.upvoteQuestion('q1', 'u2');
      expect(result.upvoted).toBe(false);
    });
  });

  // ─────────────────────────────────────────────
  // likePost — 좋아요 idempotent 토글 (P1-1)
  // ─────────────────────────────────────────────
  describe('likePost', () => {
    const setupPostAndGroup = () => {
      mockPrisma.studyGroupPost.findUnique.mockResolvedValueOnce({
        id: 'p1',
        groupId: 'g1',
      });
      mockPrisma.studyGroup.findUnique.mockResolvedValueOnce({
        id: 'g1',
        isPrivate: false,
        ownerId: 'owner',
      });
    };

    it('비로그인 → Forbidden', async () => {
      await expect(service.likePost('p1', '')).rejects.toThrow(ForbiddenException);
    });

    it('게시글 없음 → NotFound', async () => {
      mockPrisma.studyGroupPost.findUnique.mockResolvedValueOnce(null);
      await expect(service.likePost('p1', 'u1')).rejects.toThrow(NotFoundException);
    });

    it('첫 호출 → like 생성 + likeCount 증가, liked=true', async () => {
      setupPostAndGroup();
      mockPrisma.studyGroupPostLike.findUnique.mockResolvedValueOnce(null);
      mockPrisma.studyGroupPostLike.create.mockResolvedValueOnce({ id: 'l1' });
      mockPrisma.studyGroupPost.update.mockResolvedValueOnce({ id: 'p1', likeCount: 1 });
      const result = await service.likePost('p1', 'u1');
      expect(result).toEqual({ id: 'p1', likeCount: 1, liked: true });
      expect(mockPrisma.studyGroupPostLike.create).toHaveBeenCalledWith({
        data: { postId: 'p1', userId: 'u1' },
      });
    });

    it('두번째 호출 → 토글 off (delete + decrement), liked=false', async () => {
      setupPostAndGroup();
      mockPrisma.studyGroupPostLike.findUnique.mockResolvedValueOnce({ id: 'l1' });
      mockPrisma.studyGroupPostLike.delete.mockResolvedValueOnce({});
      mockPrisma.studyGroupPost.update.mockResolvedValueOnce({ id: 'p1', likeCount: 0 });
      const result = await service.likePost('p1', 'u1');
      expect(result).toEqual({ id: 'p1', likeCount: 0, liked: false });
      expect(mockPrisma.studyGroupPostLike.delete).toHaveBeenCalledWith({ where: { id: 'l1' } });
    });

    it('연속 N회 호출도 likeCount 가 0/1 사이 토글 — 무한 증가 차단', async () => {
      // 1st: off → on
      setupPostAndGroup();
      mockPrisma.studyGroupPostLike.findUnique.mockResolvedValueOnce(null);
      mockPrisma.studyGroupPostLike.create.mockResolvedValueOnce({ id: 'l1' });
      mockPrisma.studyGroupPost.update.mockResolvedValueOnce({ id: 'p1', likeCount: 1 });
      expect((await service.likePost('p1', 'u1')).liked).toBe(true);

      // 2nd: on → off
      setupPostAndGroup();
      mockPrisma.studyGroupPostLike.findUnique.mockResolvedValueOnce({ id: 'l1' });
      mockPrisma.studyGroupPostLike.delete.mockResolvedValueOnce({});
      mockPrisma.studyGroupPost.update.mockResolvedValueOnce({ id: 'p1', likeCount: 0 });
      expect((await service.likePost('p1', 'u1')).liked).toBe(false);

      // 3rd: off → on
      setupPostAndGroup();
      mockPrisma.studyGroupPostLike.findUnique.mockResolvedValueOnce(null);
      mockPrisma.studyGroupPostLike.create.mockResolvedValueOnce({ id: 'l2' });
      mockPrisma.studyGroupPost.update.mockResolvedValueOnce({ id: 'p1', likeCount: 1 });
      const third = await service.likePost('p1', 'u1');
      expect(third.likeCount).toBe(1);
    });
  });

  // ─────────────────────────────────────────────
  // 문제 답변 (StudyGroupQuestionAnswer) — 신규
  // ─────────────────────────────────────────────
  describe('createAnswer', () => {
    beforeEach(() => {
      mockPrisma.studyGroupQuestion.findUnique.mockResolvedValue({
        id: 'q1',
        groupId: 'g1',
        userId: 'author',
        question: '왜?',
      });
      mockPrisma.studyGroup.findUnique.mockResolvedValue({
        id: 'g1',
        isPrivate: false,
        ownerId: 'owner',
      });
    });

    it('1자 body → BadRequest', async () => {
      await expect(service.createAnswer('q1', 'u1', { body: 'A' })).rejects.toThrow(
        BadRequestException,
      );
    });

    it('5001자 body → BadRequest', async () => {
      await expect(service.createAnswer('q1', 'u1', { body: 'A'.repeat(5001) })).rejects.toThrow(
        BadRequestException,
      );
    });

    it('parentId 가 다른 question 의 답변이면 BadRequest', async () => {
      mockPrisma.studyGroupQuestionAnswer.findUnique.mockResolvedValueOnce({
        id: 'p1',
        questionId: 'q-other',
        parentId: null,
      });
      await expect(
        service.createAnswer('q1', 'u1', { body: '괜찮은 답변이에요', parentId: 'p1' }),
      ).rejects.toThrow(BadRequestException);
    });

    it('대대댓글 차단 (parent.parentId 가 이미 있음 → BadRequest)', async () => {
      mockPrisma.studyGroupQuestionAnswer.findUnique.mockResolvedValueOnce({
        id: 'p1',
        questionId: 'q1',
        parentId: 'pp1', // 이미 답글임
      });
      await expect(
        service.createAnswer('q1', 'u1', { body: '대대댓글', parentId: 'p1' }),
      ).rejects.toThrow(BadRequestException);
    });

    it('정상 답변 작성 — answerCount 증가', async () => {
      mockPrisma.studyGroupQuestionAnswer.create.mockResolvedValueOnce({ id: 'a1' });
      mockPrisma.studyGroupQuestion.update.mockResolvedValueOnce({ id: 'q1' });
      const res = await service.createAnswer('q1', 'u1', {
        body: '좋은 답변입니다',
      });
      expect(res).toEqual({ id: 'a1' });
      // top-level 이라서 answerCount 증가 호출됨
      expect(mockPrisma.studyGroupQuestion.update).toHaveBeenCalledWith(
        expect.objectContaining({ data: { answerCount: { increment: 1 } } }),
      );
    });

    it('답글 작성 — answerCount 미증가', async () => {
      mockPrisma.studyGroupQuestionAnswer.findUnique.mockResolvedValueOnce({
        id: 'p1',
        questionId: 'q1',
        parentId: null,
      });
      mockPrisma.studyGroupQuestionAnswer.create.mockResolvedValueOnce({ id: 'a2' });
      await service.createAnswer('q1', 'u1', { body: '답글이에요', parentId: 'p1' });
      // 답글은 answerCount 갱신 호출되지 않아야 함
      expect(mockPrisma.studyGroupQuestion.update).not.toHaveBeenCalled();
    });
  });

  describe('upvoteAnswer', () => {
    it('비로그인 → Forbidden', async () => {
      await expect(service.upvoteAnswer('a1', '')).rejects.toThrow(ForbiddenException);
    });

    it('본인 답변 추천 시도 → BadRequest', async () => {
      mockPrisma.studyGroupQuestionAnswer.findUnique.mockResolvedValueOnce({
        id: 'a1',
        userId: 'u1',
        question: { groupId: 'g1' },
      });
      mockPrisma.studyGroup.findUnique.mockResolvedValueOnce({
        id: 'g1',
        isPrivate: false,
        ownerId: 'owner',
      });
      await expect(service.upvoteAnswer('a1', 'u1')).rejects.toThrow(BadRequestException);
    });

    it('첫 추천 → upvoted=true', async () => {
      mockPrisma.studyGroupQuestionAnswer.findUnique.mockResolvedValueOnce({
        id: 'a1',
        userId: 'author',
        question: { groupId: 'g1' },
      });
      mockPrisma.studyGroup.findUnique.mockResolvedValueOnce({
        id: 'g1',
        isPrivate: false,
        ownerId: 'owner',
      });
      mockPrisma.studyGroupQuestionAnswerVote.findUnique.mockResolvedValueOnce(null);
      mockPrisma.studyGroupQuestionAnswerVote.create.mockResolvedValueOnce({ id: 'v1' });
      mockPrisma.studyGroupQuestionAnswer.update.mockResolvedValueOnce({ id: 'a1', upvotes: 1 });
      const res = await service.upvoteAnswer('a1', 'u2');
      expect(res.upvoted).toBe(true);
      expect(res.upvotes).toBe(1);
    });

    it('두번째 추천 → 토글 off', async () => {
      mockPrisma.studyGroupQuestionAnswer.findUnique.mockResolvedValueOnce({
        id: 'a1',
        userId: 'author',
        question: { groupId: 'g1' },
      });
      mockPrisma.studyGroup.findUnique.mockResolvedValueOnce({
        id: 'g1',
        isPrivate: false,
        ownerId: 'owner',
      });
      mockPrisma.studyGroupQuestionAnswerVote.findUnique.mockResolvedValueOnce({ id: 'v1' });
      mockPrisma.studyGroupQuestionAnswerVote.delete.mockResolvedValueOnce({});
      mockPrisma.studyGroupQuestionAnswer.update.mockResolvedValueOnce({ id: 'a1', upvotes: 0 });
      const res = await service.upvoteAnswer('a1', 'u2');
      expect(res.upvoted).toBe(false);
    });
  });

  describe('updateAnswer', () => {
    it('본인 아니면 Forbidden', async () => {
      mockPrisma.studyGroupQuestionAnswer.findUnique.mockResolvedValueOnce({
        id: 'a1',
        userId: 'other',
      });
      await expect(service.updateAnswer('a1', 'u1', { body: '수정된 답변' })).rejects.toThrow(
        ForbiddenException,
      );
    });

    it('1자 body → BadRequest', async () => {
      mockPrisma.studyGroupQuestionAnswer.findUnique.mockResolvedValueOnce({
        id: 'a1',
        userId: 'u1',
      });
      await expect(service.updateAnswer('a1', 'u1', { body: 'A' })).rejects.toThrow(
        BadRequestException,
      );
    });

    it('본인 수정 정상', async () => {
      mockPrisma.studyGroupQuestionAnswer.findUnique.mockResolvedValueOnce({
        id: 'a1',
        userId: 'u1',
      });
      mockPrisma.studyGroupQuestionAnswer.update.mockResolvedValueOnce({ id: 'a1' });
      await service.updateAnswer('a1', 'u1', { body: '수정된 답변입니다' });
      expect(mockPrisma.studyGroupQuestionAnswer.update).toHaveBeenCalled();
    });
  });

  describe('deleteAnswer', () => {
    it('본인 아니고 owner 아니면 Forbidden', async () => {
      mockPrisma.studyGroupQuestionAnswer.findUnique.mockResolvedValueOnce({
        id: 'a1',
        userId: 'other',
        parentId: null,
        question: { id: 'q1', groupId: 'g1' },
      });
      mockPrisma.studyGroup.findUnique.mockResolvedValueOnce({ ownerId: 'owner' });
      await expect(service.deleteAnswer('a1', 'u1')).rejects.toThrow(ForbiddenException);
    });

    it('top-level 본인 삭제 → answerCount 감소', async () => {
      mockPrisma.studyGroupQuestionAnswer.findUnique.mockResolvedValueOnce({
        id: 'a1',
        userId: 'u1',
        parentId: null,
        question: { id: 'q1', groupId: 'g1' },
      });
      mockPrisma.studyGroup.findUnique.mockResolvedValueOnce({ ownerId: 'owner' });
      mockPrisma.studyGroupQuestionAnswer.delete.mockResolvedValueOnce({});
      mockPrisma.studyGroupQuestion.update.mockResolvedValueOnce({});
      const res = await service.deleteAnswer('a1', 'u1');
      expect(res.success).toBe(true);
      expect(mockPrisma.studyGroupQuestion.update).toHaveBeenCalledWith(
        expect.objectContaining({ data: { answerCount: { decrement: 1 } } }),
      );
    });

    it('답글 삭제 → answerCount 미감소', async () => {
      mockPrisma.studyGroupQuestionAnswer.findUnique.mockResolvedValueOnce({
        id: 'a2',
        userId: 'u1',
        parentId: 'a1',
        question: { id: 'q1', groupId: 'g1' },
      });
      mockPrisma.studyGroup.findUnique.mockResolvedValueOnce({ ownerId: 'owner' });
      mockPrisma.studyGroupQuestionAnswer.delete.mockResolvedValueOnce({});
      await service.deleteAnswer('a2', 'u1');
      expect(mockPrisma.studyGroupQuestion.update).not.toHaveBeenCalled();
    });
  });

  describe('listAnswers', () => {
    it('정렬 sort=upvotes 가 기본', async () => {
      mockPrisma.studyGroupQuestion.findUnique.mockResolvedValueOnce({
        id: 'q1',
        groupId: 'g1',
      });
      mockPrisma.studyGroup.findUnique.mockResolvedValueOnce({
        id: 'g1',
        isPrivate: false,
        ownerId: 'owner',
      });
      mockPrisma.studyGroupQuestionAnswer.findMany.mockResolvedValueOnce([]);
      await service.listAnswers('q1');
      const args = mockPrisma.studyGroupQuestionAnswer.findMany.mock.calls[0][0];
      expect(args.orderBy[0].upvotes).toBe('desc');
    });

    it('로그인 사용자에게 upvoted 표시', async () => {
      mockPrisma.studyGroupQuestion.findUnique.mockResolvedValueOnce({
        id: 'q1',
        groupId: 'g1',
      });
      mockPrisma.studyGroup.findUnique.mockResolvedValueOnce({
        id: 'g1',
        isPrivate: false,
        ownerId: 'owner',
      });
      mockPrisma.studyGroupQuestionAnswer.findMany.mockResolvedValueOnce([
        { id: 'a1', body: 'x', upvotes: 3 },
        { id: 'a2', body: 'y', upvotes: 1 },
      ]);
      mockPrisma.studyGroupQuestionAnswerVote.findMany.mockResolvedValueOnce([{ answerId: 'a1' }]);
      const res = await service.listAnswers('q1', 'u1');
      expect(res[0].upvoted).toBe(true);
      expect(res[1].upvoted).toBe(false);
    });
  });
});
