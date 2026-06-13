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
import { ForbiddenWordsService } from '../forbidden-words/forbidden-words.service';

const mockConfig = {
  isFeatureEnabled: jest.fn().mockResolvedValue(true),
  assertFeatureEnabled: jest.fn().mockResolvedValue(undefined),
};

const mockForbiddenWords = {
  validateOrThrow: jest.fn().mockResolvedValue({ blocked: false, matched: [], warnings: [] }),
};

const mockPrisma = {
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
    count: jest.fn(),
  },
  studyGroupQuestionAnswerVote: {
    findUnique: jest.fn(),
    findMany: jest.fn(),
    create: jest.fn(),
    delete: jest.fn(),
  },
  studyGroupPost: {
    findUnique: jest.fn(),
    findMany: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
    count: jest.fn(),
  },
  studyGroupPostComment: {
    findUnique: jest.fn(),
    findMany: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
    count: jest.fn(),
  },
  studyGroupPostLike: {
    findUnique: jest.fn(),
    create: jest.fn(),
    delete: jest.fn(),
  },
  $transaction: jest.fn(),
};

mockPrisma.$transaction.mockImplementation(async (arg: unknown): Promise<unknown> => {
  // 두 가지 호출 형태 지원: $transaction(fn) 또는 $transaction([promise, ...])
  if (typeof arg === 'function') return (arg as (tx: typeof mockPrisma) => unknown)(mockPrisma);
  return Promise.all(arg as Array<Promise<unknown>>);
});

describe('StudyGroupsService', () => {
  let service: StudyGroupsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        StudyGroupsService,
        { provide: PrismaService, useValue: mockPrisma },
        { provide: SystemConfigService, useValue: mockConfig },
        { provide: ForbiddenWordsService, useValue: mockForbiddenWords },
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

    it('question/sampleAnswer 금칙어 검증 후 저장', async () => {
      mockPrisma.studyGroup.findUnique.mockResolvedValueOnce({
        id: 'g1',
        isPrivate: false,
        ownerId: 'owner',
      });
      mockPrisma.studyGroupMember.findUnique.mockResolvedValueOnce({ id: 'm1' });
      mockPrisma.studyGroupQuestion.create.mockResolvedValueOnce({ id: 'q1' });
      await service.addQuestion('g1', 'u1', {
        question: '면접 질문입니다',
        sampleAnswer: '샘플 답변입니다',
      });
      expect(mockForbiddenWords.validateOrThrow).toHaveBeenCalledWith(
        '면접 질문입니다',
        '샘플 답변입니다',
      );
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
  // normalizeAttachments — JSON shape + URL whitelist (P2-9)
  // ─────────────────────────────────────────────
  describe('normalizeAttachments (P2-9)', () => {
    // private 메서드 접근 — 동작 검증을 위해 캐스팅.
    const normalize = (raw: unknown) =>
      (
        service as unknown as { normalizeAttachments: (raw: unknown) => unknown[] }
      ).normalizeAttachments(raw);

    it('null/undefined/string 입력 → []', () => {
      expect(normalize(null)).toEqual([]);
      expect(normalize(undefined)).toEqual([]);
      expect(normalize('attack')).toEqual([]);
    });

    it('javascript: / data: / http: URL 차단', () => {
      const out = normalize([
        { url: 'javascript:alert(1)', name: 'a', size: 1, type: 'x' },
        { url: 'data:text/html,<script>x</script>', name: 'b', size: 1, type: 'x' },
        { url: 'http://res.cloudinary.com/x.png', name: 'c', size: 1, type: 'x' }, // http 거절
      ]);
      expect(out).toEqual([]);
    });

    it('https + 허용 host (cloudinary) → 통과', () => {
      const out = normalize([
        {
          url: 'https://res.cloudinary.com/demo/image/upload/sample.jpg',
          name: 'sample.jpg',
          size: 12345,
          type: 'image/jpeg',
        },
      ]);
      expect(out).toEqual([
        {
          url: 'https://res.cloudinary.com/demo/image/upload/sample.jpg',
          name: 'sample.jpg',
          size: 12345,
          type: 'image/jpeg',
        },
      ]);
    });

    it('허용되지 않은 host (evil.com) → 거절', () => {
      const out = normalize([{ url: 'https://evil.com/x.png', name: 'x', size: 1, type: 'x' }]);
      expect(out).toEqual([]);
    });

    it('size 가 50MB 초과 → 거절', () => {
      const out = normalize([
        {
          url: 'https://res.cloudinary.com/x.png',
          name: 'huge',
          size: 100 * 1024 * 1024,
          type: 'x',
        },
      ]);
      expect(out).toEqual([]);
    });

    it('10개 초과 → 첫 10개만 유지', () => {
      const many = Array.from({ length: 20 }, (_, i) => ({
        url: `https://res.cloudinary.com/${i}.png`,
        name: String(i),
        size: 1,
        type: 'image/png',
      }));
      const out = normalize(many);
      expect(out).toHaveLength(10);
    });

    it('name 200자 초과 → slice, type 100자 초과 → slice', () => {
      const out = normalize([
        {
          url: 'https://res.cloudinary.com/x.png',
          name: 'a'.repeat(500),
          size: 1,
          type: 'b'.repeat(500),
        },
      ]) as Array<{ name: string; type: string }>;
      expect(out[0].name).toHaveLength(200);
      expect(out[0].type).toHaveLength(100);
    });

    it('subdomain (sub.res.cloudinary.com) 도 허용', () => {
      const out = normalize([
        {
          url: 'https://sub.res.cloudinary.com/x.png',
          name: 'x',
          size: 1,
          type: 'image/png',
        },
      ]);
      expect(out).toHaveLength(1);
    });

    it('업로드 폴백 data: URL — 허용 prefix(이미지/PDF base64)는 통과', () => {
      const out = normalize([
        { url: 'data:image/png;base64,iVBORw0KGgo=', name: 'img.png', size: 10, type: 'image/png' },
        {
          url: 'data:application/pdf;base64,JVBERi0=',
          name: 'doc.pdf',
          size: 10,
          type: 'application/pdf',
        },
      ]);
      expect(out).toHaveLength(2);
    });

    it('data:image/svg+xml 등 비허용 mimetype 의 data: URL 은 차단', () => {
      const out = normalize([
        { url: 'data:image/svg+xml;base64,PHN2Zz4=', name: 'x.svg', size: 10, type: 'image/svg' },
        { url: 'data:text/html;base64,PGh0bWw+', name: 'x.html', size: 10, type: 'text/html' },
      ]);
      expect(out).toEqual([]);
    });

    it('data: URL 길이 상한(2.9M) 초과 → 차단', () => {
      const huge = `data:image/png;base64,${'A'.repeat(2_900_001)}`;
      const out = normalize([{ url: huge, name: 'huge.png', size: 1, type: 'image/png' }]);
      expect(out).toEqual([]);
    });
  });

  // ─────────────────────────────────────────────
  // normalizeTags — Intl.Segmenter grapheme truncate (P3-5)
  // ─────────────────────────────────────────────
  describe('normalizeTags (P3-5)', () => {
    const normalizeTags = (raw: unknown) =>
      (service as unknown as { normalizeTags: (raw: unknown) => string[] }).normalizeTags(raw);

    it('non-array → []', () => {
      expect(normalizeTags(null)).toEqual([]);
      expect(normalizeTags('react')).toEqual([]);
    });

    it('중복 제거 + lowercase + trim', () => {
      const out = normalizeTags(['React', ' react ', 'REACT', 'cs']);
      expect(out).toEqual(['react', 'cs']);
    });

    it('10개 초과 → 10개로 절단', () => {
      const out = normalizeTags(Array.from({ length: 20 }, (_, i) => `tag${i}`));
      expect(out).toHaveLength(10);
    });

    it('짧은 한글 태그는 그대로 보존', () => {
      const out = normalizeTags(['프론트엔드', '백엔드']);
      expect(out).toEqual(['프론트엔드', '백엔드']);
    });

    it('30 grapheme 초과 시 grapheme 경계에서 잘림 — 자모 깨짐 없음', () => {
      // 35자 한국어 태그 → 30 grapheme 이내로 절단되어야 함
      const longKo = '서버사이드렌더링과커뮤니티주도성장그리고기여형오픈소스생태계'; // 31자
      const out = normalizeTags([longKo]);
      // 결과는 길이가 30 이하 (grapheme 단위로 잘렸기 때문에 byte-cut 깨짐 없음)
      expect(out[0].length).toBeLessThanOrEqual(30);
      // 잘린 결과가 입력의 접두사여야 함
      expect(longKo.startsWith(out[0])).toBe(true);
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

    it('top-level 본인 삭제 (답글 없음) → hard delete + answerCount 감소', async () => {
      mockPrisma.studyGroupQuestionAnswer.findUnique.mockResolvedValueOnce({
        id: 'a1',
        userId: 'u1',
        parentId: null,
        body: '평범한 답변',
        question: { id: 'q1', groupId: 'g1' },
      });
      mockPrisma.studyGroup.findUnique.mockResolvedValueOnce({ ownerId: 'owner' });
      mockPrisma.studyGroupQuestionAnswer.count.mockResolvedValueOnce(0);
      mockPrisma.studyGroupQuestionAnswer.delete.mockResolvedValueOnce({});
      mockPrisma.studyGroupQuestion.update.mockResolvedValueOnce({});
      const res = await service.deleteAnswer('a1', 'u1');
      expect(res).toEqual({ success: true, tombstoned: false });
      expect(mockPrisma.studyGroupQuestionAnswer.delete).toHaveBeenCalledWith({
        where: { id: 'a1' },
      });
      expect(mockPrisma.studyGroupQuestion.update).toHaveBeenCalledWith(
        expect.objectContaining({ data: { answerCount: { decrement: 1 } } }),
      );
    });

    it('답글 삭제 → answerCount 미감소', async () => {
      mockPrisma.studyGroupQuestionAnswer.findUnique
        .mockResolvedValueOnce({
          id: 'a2',
          userId: 'u1',
          parentId: 'a1',
          body: '답글',
          question: { id: 'q1', groupId: 'g1' },
        })
        // 삭제 후 부모 tombstone 정리 검사 — 부모는 정상 답변
        .mockResolvedValueOnce({ id: 'a1', body: '부모 답변', _count: { replies: 1 } });
      mockPrisma.studyGroup.findUnique.mockResolvedValueOnce({ ownerId: 'owner' });
      mockPrisma.studyGroupQuestionAnswer.count.mockResolvedValueOnce(0);
      mockPrisma.studyGroupQuestionAnswer.delete.mockResolvedValueOnce({});
      await service.deleteAnswer('a2', 'u1');
      expect(mockPrisma.studyGroupQuestion.update).not.toHaveBeenCalled();
    });

    it('답글 달린 top-level 삭제 → tombstone (body="") + answerCount 차감, hard delete 없음', async () => {
      mockPrisma.studyGroupQuestionAnswer.findUnique.mockResolvedValueOnce({
        id: 'a1',
        userId: 'u1',
        parentId: null,
        body: '답글이 달린 답변',
        question: { id: 'q1', groupId: 'g1' },
      });
      mockPrisma.studyGroup.findUnique.mockResolvedValueOnce({ ownerId: 'owner' });
      mockPrisma.studyGroupQuestionAnswer.count.mockResolvedValueOnce(2);
      const res = await service.deleteAnswer('a1', 'u1');
      expect(res).toEqual({ success: true, tombstoned: true });
      expect(mockPrisma.studyGroupQuestionAnswer.update).toHaveBeenCalledWith({
        where: { id: 'a1' },
        data: { body: '' },
      });
      expect(mockPrisma.studyGroupQuestionAnswer.delete).not.toHaveBeenCalled();
      expect(mockPrisma.studyGroupQuestion.update).toHaveBeenCalledWith(
        expect.objectContaining({ data: { answerCount: { decrement: 1 } } }),
      );
    });

    it('이미 tombstone 인 답변 재삭제 → 멱등 (answerCount 이중 차감 없음)', async () => {
      mockPrisma.studyGroupQuestionAnswer.findUnique.mockResolvedValueOnce({
        id: 'a1',
        userId: 'u1',
        parentId: null,
        body: '',
        question: { id: 'q1', groupId: 'g1' },
      });
      mockPrisma.studyGroup.findUnique.mockResolvedValueOnce({ ownerId: 'owner' });
      const res = await service.deleteAnswer('a1', 'u1');
      expect(res).toEqual({ success: true, tombstoned: true });
      expect(mockPrisma.studyGroupQuestionAnswer.update).not.toHaveBeenCalled();
      expect(mockPrisma.studyGroupQuestion.update).not.toHaveBeenCalled();
    });

    it('마지막 답글 삭제 시 빈 tombstone 부모도 정리', async () => {
      mockPrisma.studyGroupQuestionAnswer.findUnique
        .mockResolvedValueOnce({
          id: 'a2',
          userId: 'u1',
          parentId: 'a1',
          body: '마지막 답글',
          question: { id: 'q1', groupId: 'g1' },
        })
        .mockResolvedValueOnce({ id: 'a1', body: '', _count: { replies: 0 } });
      mockPrisma.studyGroup.findUnique.mockResolvedValueOnce({ ownerId: 'owner' });
      mockPrisma.studyGroupQuestionAnswer.count.mockResolvedValueOnce(0);
      await service.deleteAnswer('a2', 'u1');
      expect(mockPrisma.studyGroupQuestionAnswer.delete).toHaveBeenCalledWith({
        where: { id: 'a2' },
      });
      expect(mockPrisma.studyGroupQuestionAnswer.delete).toHaveBeenCalledWith({
        where: { id: 'a1' },
      });
    });
  });

  describe('tombstone 상호작용 가드', () => {
    it('삭제된(tombstone) 답변에 답글 작성 → BadRequest', async () => {
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
      mockPrisma.studyGroupQuestionAnswer.findUnique.mockResolvedValueOnce({
        id: 'p1',
        questionId: 'q1',
        parentId: null,
        body: '',
      });
      await expect(
        service.createAnswer('q1', 'u1', { body: '답글입니다', parentId: 'p1' }),
      ).rejects.toThrow(BadRequestException);
    });

    it('삭제된(tombstone) 답변 추천 → BadRequest', async () => {
      mockPrisma.studyGroupQuestionAnswer.findUnique.mockResolvedValueOnce({
        id: 'a1',
        userId: 'author',
        body: '',
        question: { groupId: 'g1' },
      });
      mockPrisma.studyGroup.findUnique.mockResolvedValueOnce({
        id: 'g1',
        isPrivate: false,
        ownerId: 'owner',
      });
      await expect(service.upvoteAnswer('a1', 'u2')).rejects.toThrow(BadRequestException);
    });

    it('삭제된(tombstone) 댓글에 답글 작성 → BadRequest', async () => {
      mockPrisma.studyGroupPost.findUnique.mockResolvedValueOnce({ id: 'p1', groupId: 'g1' });
      mockPrisma.studyGroup.findUnique.mockResolvedValueOnce({
        id: 'g1',
        isPrivate: false,
        ownerId: 'owner',
      });
      mockPrisma.studyGroupPostComment.findUnique.mockResolvedValueOnce({
        id: 'c0',
        postId: 'p1',
        parentId: null,
        content: '',
      });
      await expect(
        service.createComment('p1', 'u1', { content: '답글', parentId: 'c0' }),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('deleteComment (tombstone 정책)', () => {
    const seedComment = (content: string) => {
      mockPrisma.studyGroupPostComment.findUnique.mockResolvedValueOnce({
        id: 'c1',
        postId: 'p1',
        userId: 'u1',
        content,
        post: { id: 'p1', groupId: 'g1' },
      });
      mockPrisma.studyGroup.findUnique.mockResolvedValueOnce({ ownerId: 'owner' });
    };

    it('답글 달린 댓글 → content="" tombstone + commentCount 차감', async () => {
      seedComment('지워질 댓글');
      mockPrisma.studyGroupPostComment.count.mockResolvedValueOnce(1);
      const res = await service.deleteComment('c1', 'u1');
      expect(res).toEqual({ success: true, tombstoned: true });
      expect(mockPrisma.studyGroupPostComment.update).toHaveBeenCalledWith({
        where: { id: 'c1' },
        data: { content: '' },
      });
      expect(mockPrisma.studyGroupPostComment.delete).not.toHaveBeenCalled();
      expect(mockPrisma.studyGroupPost.update).toHaveBeenCalledWith({
        where: { id: 'p1' },
        data: { commentCount: { decrement: 1 } },
      });
    });

    it('답글 없는 댓글 → hard delete', async () => {
      seedComment('흔적 없이 삭제');
      mockPrisma.studyGroupPostComment.count.mockResolvedValueOnce(0);
      mockPrisma.studyGroupPostComment.findUnique.mockResolvedValueOnce({ parentId: null });
      const res = await service.deleteComment('c1', 'u1');
      expect(res).toEqual({ success: true, tombstoned: false });
      expect(mockPrisma.studyGroupPostComment.delete).toHaveBeenCalledWith({
        where: { id: 'c1' },
      });
    });

    it('이미 tombstone → 멱등 (commentCount 이중 차감 없음)', async () => {
      seedComment('');
      const res = await service.deleteComment('c1', 'u1');
      expect(res).toEqual({ success: true, tombstoned: true });
      expect(mockPrisma.studyGroupPost.update).not.toHaveBeenCalled();
    });

    it('권한 없는 유저 → Forbidden', async () => {
      seedComment('남의 댓글');
      await expect(service.deleteComment('c1', 'intruder')).rejects.toThrow(ForbiddenException);
    });
  });

  // ─────────────────────────────────────────────
  // 관리자 모더레이션 (게시글/댓글/답변/첨부)
  // ─────────────────────────────────────────────
  describe('admin moderation', () => {
    it('adminListPosts: q 검색 → title/content OR + 페이지네이션 shape', async () => {
      mockPrisma.studyGroupPost.findMany.mockResolvedValueOnce([{ id: 'p1' }]);
      mockPrisma.studyGroupPost.count.mockResolvedValueOnce(41);
      const res = await service.adminListPosts({ q: '면접', page: 2, limit: 20 });
      const args = mockPrisma.studyGroupPost.findMany.mock.calls[0][0];
      expect(args.where.OR).toHaveLength(2);
      expect(args.skip).toBe(20);
      expect(res).toEqual({ items: [{ id: 'p1' }], total: 41, page: 2, limit: 20, totalPages: 3 });
    });

    it('adminDeletePost: 없는 게시글 → NotFound, 있으면 delete', async () => {
      mockPrisma.studyGroupPost.findUnique.mockResolvedValueOnce(null);
      await expect(service.adminDeletePost('missing')).rejects.toThrow(NotFoundException);

      mockPrisma.studyGroupPost.findUnique.mockResolvedValueOnce({ id: 'p1' });
      await expect(service.adminDeletePost('p1')).resolves.toEqual({ success: true });
      expect(mockPrisma.studyGroupPost.delete).toHaveBeenCalledWith({ where: { id: 'p1' } });
    });

    it('adminRemovePostAttachment: url 미지정 → BadRequest', async () => {
      await expect(service.adminRemovePostAttachment('p1', '')).rejects.toThrow(
        BadRequestException,
      );
    });

    it('adminRemovePostAttachment: 일치 url 만 제거하고 나머지 보존', async () => {
      const keep = { url: 'https://res.cloudinary.com/a.png', name: 'a', size: 1, type: 'x' };
      const drop = { url: 'https://res.cloudinary.com/b.pdf', name: 'b', size: 2, type: 'y' };
      mockPrisma.studyGroupPost.findUnique.mockResolvedValueOnce({
        id: 'p1',
        attachments: [keep, drop],
      });
      mockPrisma.studyGroupPost.update.mockResolvedValueOnce({ id: 'p1', attachments: [keep] });
      await service.adminRemovePostAttachment('p1', drop.url);
      expect(mockPrisma.studyGroupPost.update).toHaveBeenCalledWith(
        expect.objectContaining({ where: { id: 'p1' }, data: { attachments: [keep] } }),
      );
    });

    it('adminRemovePostAttachment: 일치 항목 없으면 NotFound', async () => {
      mockPrisma.studyGroupPost.findUnique.mockResolvedValueOnce({
        id: 'p1',
        attachments: [{ url: 'https://res.cloudinary.com/a.png' }],
      });
      await expect(
        service.adminRemovePostAttachment('p1', 'https://res.cloudinary.com/zzz.png'),
      ).rejects.toThrow(NotFoundException);
    });

    it('adminDeleteComment: 권한 검증 없이 tombstone 코어 재사용', async () => {
      mockPrisma.studyGroupPostComment.findUnique.mockResolvedValueOnce({
        id: 'c1',
        postId: 'p1',
        content: '신고된 댓글',
      });
      mockPrisma.studyGroupPostComment.count.mockResolvedValueOnce(3);
      const res = await service.adminDeleteComment('c1');
      expect(res).toEqual({ success: true, tombstoned: true });
    });

    it('adminDeleteAnswer: 없는 답변 → NotFound', async () => {
      mockPrisma.studyGroupQuestionAnswer.findUnique.mockResolvedValueOnce(null);
      await expect(service.adminDeleteAnswer('missing')).rejects.toThrow(NotFoundException);
    });

    it('adminListPostComments: 없는 게시글 → NotFound', async () => {
      mockPrisma.studyGroupPost.findUnique.mockResolvedValueOnce(null);
      await expect(service.adminListPostComments('missing')).rejects.toThrow(NotFoundException);
    });

    it('adminListPostComments: 작성순 정렬로 전체(tombstone 포함) 반환', async () => {
      mockPrisma.studyGroupPost.findUnique.mockResolvedValueOnce({ id: 'p1' });
      mockPrisma.studyGroupPostComment.findMany.mockResolvedValueOnce([
        { id: 'c1', content: '' },
        { id: 'c2', content: '답글' },
      ]);
      const res = await service.adminListPostComments('p1');
      expect(res).toHaveLength(2);
      const args = mockPrisma.studyGroupPostComment.findMany.mock.calls[0][0];
      expect(args.orderBy).toEqual([{ createdAt: 'asc' }]);
    });

    it('adminListAnswers: q → body contains, groupId → question.groupId 필터', async () => {
      mockPrisma.studyGroupQuestionAnswer.findMany.mockResolvedValueOnce([]);
      mockPrisma.studyGroupQuestionAnswer.count.mockResolvedValueOnce(0);
      await service.adminListAnswers({ q: '검색어', groupId: 'g1', page: 1, limit: 20 });
      const args = mockPrisma.studyGroupQuestionAnswer.findMany.mock.calls[0][0];
      expect(args.where.body).toEqual({ contains: '검색어', mode: 'insensitive' });
      expect(args.where.question).toEqual({ groupId: 'g1' });
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
