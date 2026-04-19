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
  },
  $transaction: jest.fn(async (fn: any) => {
    // Call the function with the same prisma mock as a tx client.
    return fn(mockPrisma);
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
});
