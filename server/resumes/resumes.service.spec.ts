import { Test, TestingModule } from '@nestjs/testing';
import { ResumesService } from './resumes.service';
import { PrismaService } from '../prisma/prisma.service';
import { NotFoundException, ForbiddenException, BadRequestException } from '@nestjs/common';

const mockResume = {
  id: 'resume-1',
  title: '테스트 이력서',
  slug: 'test-resume',
  visibility: 'private',
  viewCount: 0,
  userId: 'user-1',
  createdAt: new Date(),
  updatedAt: new Date(),
  personalInfo: {
    name: '홍길동', email: 'test@test.com', phone: '010-1234-5678',
    address: '', website: '', github: '', summary: '요약', photo: '',
    birthYear: '', links: '[]', military: '',
  },
  experiences: [],
  educations: [],
  skills: [],
  projects: [],
  certifications: [],
  languages: [],
  awards: [],
  activities: [],
  tags: [],
};

const mockPrisma: Record<string, any> = {
  resume: {
    findMany: jest.fn(),
    findUnique: jest.fn(),
    findFirst: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
    count: jest.fn(),
  },
  user: {
    findFirst: jest.fn(),
  },
  personalInfo: { upsert: jest.fn() },
  bookmark: {
    count: jest.fn().mockResolvedValue(0),
    create: jest.fn(),
    deleteMany: jest.fn(),
    findMany: jest.fn(),
    findFirst: jest.fn(),
  },
  attachment: { findMany: jest.fn().mockResolvedValue([]) },
  experience: { deleteMany: jest.fn(), createMany: jest.fn() },
  education: { deleteMany: jest.fn(), createMany: jest.fn() },
  skill: { deleteMany: jest.fn(), createMany: jest.fn() },
  project: { deleteMany: jest.fn(), createMany: jest.fn() },
  certification: { deleteMany: jest.fn(), createMany: jest.fn() },
  language: { deleteMany: jest.fn(), createMany: jest.fn() },
  award: { deleteMany: jest.fn(), createMany: jest.fn() },
  activity: { deleteMany: jest.fn(), createMany: jest.fn() },
  resumeVersion: {
    findFirst: jest.fn(),
    create: jest.fn(),
  },
  follow: { count: jest.fn().mockResolvedValue(0) },
  $transaction: jest.fn((fn: any) => fn(mockPrisma)),
};

describe('ResumesService', () => {
  let service: ResumesService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ResumesService,
        { provide: PrismaService, useValue: mockPrisma },
      ],
    }).compile();
    service = module.get(ResumesService);
    jest.clearAllMocks();
    // Re-set default for bookmark.count after clearAllMocks
    mockPrisma.bookmark.count.mockResolvedValue(0);
    mockPrisma.attachment.findMany.mockResolvedValue([]);
  });

  // ──────────────────────────────────────────────────
  // findPublic
  // ──────────────────────────────────────────────────
  describe('findPublic', () => {
    it('기본 페이지네이션 (page=1, limit=20)', async () => {
      mockPrisma.resume.findMany.mockResolvedValue([{ ...mockResume, visibility: 'public' }]);
      mockPrisma.resume.count.mockResolvedValue(1);

      const result = await service.findPublic();
      expect(result.page).toBe(1);
      expect(result.limit).toBe(20);
      expect(result.total).toBe(1);
      expect(result.totalPages).toBe(1);
      expect(result.data).toHaveLength(1);
      expect(mockPrisma.resume.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { visibility: 'public' },
          skip: 0,
          take: 20,
        }),
      );
    });

    it('커스텀 페이지네이션 (page=2, limit=5)', async () => {
      mockPrisma.resume.findMany.mockResolvedValue([]);
      mockPrisma.resume.count.mockResolvedValue(8);

      const result = await service.findPublic(2, 5);
      expect(result.page).toBe(2);
      expect(result.limit).toBe(5);
      expect(result.totalPages).toBe(2); // ceil(8/5) = 2
      expect(mockPrisma.resume.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ skip: 5, take: 5 }),
      );
    });

    it('결과가 0건이면 빈 배열과 totalPages=0', async () => {
      mockPrisma.resume.findMany.mockResolvedValue([]);
      mockPrisma.resume.count.mockResolvedValue(0);

      const result = await service.findPublic();
      expect(result.data).toEqual([]);
      expect(result.total).toBe(0);
      expect(result.totalPages).toBe(0);
    });
  });

  // ──────────────────────────────────────────────────
  // searchPublic
  // ──────────────────────────────────────────────────
  describe('searchPublic', () => {
    it('검색어 + 태그 필터로 공개 이력서 검색', async () => {
      mockPrisma.resume.findMany.mockResolvedValue([]);
      mockPrisma.resume.count.mockResolvedValue(0);

      const result = await service.searchPublic({ query: '개발자', tag: 'FE', page: 1, limit: 20 });
      expect(result.data).toEqual([]);
      expect(result.total).toBe(0);
      expect(result.page).toBe(1);
    });

    it('sort=views 일 때 viewCount 내림차순 정렬', async () => {
      mockPrisma.resume.findMany.mockResolvedValue([]);
      mockPrisma.resume.count.mockResolvedValue(0);

      await service.searchPublic({ query: 'test', sort: 'views', page: 1, limit: 10 });
      expect(mockPrisma.resume.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ orderBy: { viewCount: 'desc' } }),
      );
    });

    it('sort 미지정 시 updatedAt 내림차순 정렬', async () => {
      mockPrisma.resume.findMany.mockResolvedValue([]);
      mockPrisma.resume.count.mockResolvedValue(0);

      await service.searchPublic({ page: 1, limit: 10 });
      expect(mockPrisma.resume.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ orderBy: { updatedAt: 'desc' } }),
      );
    });

    it('검색어 없이 태그만으로 필터링', async () => {
      mockPrisma.resume.findMany.mockResolvedValue([]);
      mockPrisma.resume.count.mockResolvedValue(0);

      await service.searchPublic({ tag: 'Backend', page: 1, limit: 10 });
      expect(mockPrisma.resume.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            visibility: 'public',
            tags: { some: { tag: { name: 'Backend' } } },
          }),
        }),
      );
    });

    it('페이지네이션 계산이 올바른지 확인', async () => {
      mockPrisma.resume.findMany.mockResolvedValue([]);
      mockPrisma.resume.count.mockResolvedValue(25);

      const result = await service.searchPublic({ page: 3, limit: 10 });
      expect(result.totalPages).toBe(3); // ceil(25/10)
      expect(mockPrisma.resume.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ skip: 20, take: 10 }),
      );
    });
  });

  // ──────────────────────────────────────────────────
  // create
  // ──────────────────────────────────────────────────
  describe('create', () => {
    it('유효한 데이터로 이력서 생성', async () => {
      const createdResume = {
        ...mockResume,
        id: 'new-resume',
        title: '새 이력서',
        slug: '새-이력서',
      };
      mockPrisma.resume.create.mockResolvedValue(createdResume);

      const result = await service.create({ title: '새 이력서' }, 'user-1');
      expect(result.id).toBe('new-resume');
      expect(result.title).toBe('새 이력서');
      expect(mockPrisma.resume.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            title: '새 이력서',
            userId: 'user-1',
          }),
        }),
      );
    });

    it('title 없으면 빈 문자열로 생성', async () => {
      mockPrisma.resume.create.mockResolvedValue({
        ...mockResume,
        title: '',
        slug: 'untitled',
      });

      const result = await service.create({}, 'user-1');
      expect(mockPrisma.resume.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ title: '', slug: 'untitled' }),
        }),
      );
      expect(result.title).toBe('');
    });

    it('userId 없이 (비로그인) 생성 가능', async () => {
      mockPrisma.resume.create.mockResolvedValue({
        ...mockResume,
        userId: null,
      });

      await service.create({ title: '비로그인 이력서' });
      expect(mockPrisma.resume.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ userId: null }),
        }),
      );
    });

    it('personalInfo와 experiences 포함 생성', async () => {
      mockPrisma.resume.create.mockResolvedValue({
        ...mockResume,
        personalInfo: { name: '김철수', email: 'kim@test.com', phone: '', summary: '', photo: '' },
        experiences: [{ company: '회사A', position: '개발자' }],
      });

      await service.create({
        title: '풀 이력서',
        personalInfo: { name: '김철수', email: 'kim@test.com' },
        experiences: [{ company: '회사A', position: '개발자' }],
      }, 'user-1');

      expect(mockPrisma.resume.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            personalInfo: expect.objectContaining({
              create: expect.objectContaining({ name: '김철수' }),
            }),
            experiences: expect.objectContaining({
              create: expect.arrayContaining([
                expect.objectContaining({ company: '회사A', position: '개발자' }),
              ]),
            }),
          }),
        }),
      );
    });
  });

  // ──────────────────────────────────────────────────
  // findOne
  // ──────────────────────────────────────────────────
  describe('findOne', () => {
    it('존재하지 않는 이력서 → NotFoundException', async () => {
      mockPrisma.resume.findUnique.mockResolvedValue(null);
      await expect(service.findOne('fake-id')).rejects.toThrow(NotFoundException);
    });

    it('비공개 이력서 - 소유자가 아닌 사용자 → ForbiddenException', async () => {
      mockPrisma.resume.findUnique.mockResolvedValue(mockResume);
      await expect(service.findOne('resume-1', 'other-user')).rejects.toThrow(ForbiddenException);
    });

    it('비공개 이력서 - 소유자 접근 → 성공 (조회수 미증가)', async () => {
      mockPrisma.resume.findUnique.mockResolvedValue(mockResume);
      mockPrisma.resume.update.mockResolvedValue(mockResume);

      const result = await service.findOne('resume-1', 'user-1');
      expect(result.id).toBe('resume-1');
      expect(result.title).toBe('테스트 이력서');
      // 소유자 조회 시 update(viewCount) 호출되지 않아야 함
      expect(mockPrisma.resume.update).not.toHaveBeenCalled();
    });

    it('공개 이력서 - 비소유자 접근 시 조회수 증가', async () => {
      const publicResume = { ...mockResume, visibility: 'public' };
      mockPrisma.resume.findUnique.mockResolvedValue(publicResume);
      mockPrisma.resume.update.mockResolvedValue(publicResume);

      const result = await service.findOne('resume-1', 'other-user');
      expect(result.id).toBe('resume-1');
      expect(mockPrisma.resume.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: { viewCount: { increment: 1 } },
        }),
      );
    });

    it('userId 미전달 시 조회수 증가', async () => {
      const publicResume = { ...mockResume, visibility: 'public', userId: null };
      mockPrisma.resume.findUnique.mockResolvedValue(publicResume);
      mockPrisma.resume.update.mockResolvedValue(publicResume);

      await service.findOne('resume-1');
      expect(mockPrisma.resume.update).toHaveBeenCalled();
    });

    it('소유자 없는 이력서 - 누구나 접근 가능', async () => {
      mockPrisma.resume.findUnique.mockResolvedValue({ ...mockResume, userId: null });
      const result = await service.findOne('resume-1', 'any-user');
      expect(result.id).toBe('resume-1');
    });

    it('반환값에 bookmarkCount 포함', async () => {
      mockPrisma.resume.findUnique.mockResolvedValue({ ...mockResume, visibility: 'public' });
      mockPrisma.resume.update.mockResolvedValue(mockResume);
      mockPrisma.bookmark.count.mockResolvedValue(5);

      const result = await service.findOne('resume-1', 'other-user');
      expect(result.bookmarkCount).toBe(5);
    });
  });

  // ──────────────────────────────────────────────────
  // setVisibility
  // ──────────────────────────────────────────────────
  describe('setVisibility', () => {
    it('유효한 값 public → 성공', async () => {
      mockPrisma.resume.findUnique.mockResolvedValue(mockResume);
      mockPrisma.resume.update.mockResolvedValue({ ...mockResume, visibility: 'public' });

      const result = await service.setVisibility('resume-1', 'public', 'user-1');
      expect(result).toEqual({ id: 'resume-1', visibility: 'public' });
    });

    it('유효한 값 private → 성공', async () => {
      mockPrisma.resume.findUnique.mockResolvedValue(mockResume);
      mockPrisma.resume.update.mockResolvedValue({ ...mockResume, visibility: 'private' });

      const result = await service.setVisibility('resume-1', 'private', 'user-1');
      expect(result).toEqual({ id: 'resume-1', visibility: 'private' });
    });

    it('유효한 값 link-only → 성공', async () => {
      mockPrisma.resume.findUnique.mockResolvedValue(mockResume);
      mockPrisma.resume.update.mockResolvedValue({ ...mockResume, visibility: 'link-only' });

      const result = await service.setVisibility('resume-1', 'link-only', 'user-1');
      expect(result).toEqual({ id: 'resume-1', visibility: 'link-only' });
    });

    it('잘못된 visibility 값 → BadRequestException', async () => {
      await expect(service.setVisibility('resume-1', 'invalid', 'user-1'))
        .rejects.toThrow(BadRequestException);
    });

    it('빈 문자열 visibility → BadRequestException', async () => {
      await expect(service.setVisibility('resume-1', '', 'user-1'))
        .rejects.toThrow(BadRequestException);
    });

    it('다른 사용자가 공개 설정 변경 → ForbiddenException', async () => {
      mockPrisma.resume.findUnique.mockResolvedValue(mockResume);
      await expect(service.setVisibility('resume-1', 'public', 'other-user'))
        .rejects.toThrow(ForbiddenException);
    });

    it('admin 역할은 다른 사용자 이력서 공개 설정 변경 가능', async () => {
      mockPrisma.resume.findUnique.mockResolvedValue(mockResume);
      mockPrisma.resume.update.mockResolvedValue({ ...mockResume, visibility: 'public' });

      const result = await service.setVisibility('resume-1', 'public', 'admin-user', 'admin');
      expect(result).toEqual({ id: 'resume-1', visibility: 'public' });
    });
  });

  // ──────────────────────────────────────────────────
  // update - 소유권 검증
  // ──────────────────────────────────────────────────
  describe('update - 소유권 검증', () => {
    it('다른 사용자의 이력서 수정 → ForbiddenException', async () => {
      mockPrisma.resume.findUnique.mockResolvedValue(mockResume);
      await expect(service.update('resume-1', { title: 'hack' }, 'other-user'))
        .rejects.toThrow(ForbiddenException);
    });

    it('존재하지 않는 이력서 수정 → NotFoundException', async () => {
      mockPrisma.resume.findUnique.mockResolvedValue(null);
      await expect(service.update('fake', { title: 'x' }, 'user-1'))
        .rejects.toThrow(NotFoundException);
    });
  });

  // ──────────────────────────────────────────────────
  // remove - 소유권 검증
  // ──────────────────────────────────────────────────
  describe('remove - 소유권 검증', () => {
    it('다른 사용자의 이력서 삭제 → ForbiddenException', async () => {
      mockPrisma.resume.findUnique.mockResolvedValue(mockResume);
      await expect(service.remove('resume-1', 'other-user'))
        .rejects.toThrow(ForbiddenException);
    });

    it('소유자의 이력서 삭제 → 성공', async () => {
      mockPrisma.resume.findUnique.mockResolvedValue(mockResume);
      mockPrisma.resume.delete.mockResolvedValue(mockResume);
      const result = await service.remove('resume-1', 'user-1');
      expect(result).toEqual({ success: true });
    });
  });

  // ──────────────────────────────────────────────────
  // findAll
  // ──────────────────────────────────────────────────
  describe('findAll', () => {
    it('userId로 필터링된 목록 반환', async () => {
      mockPrisma.resume.findMany.mockResolvedValue([mockResume]);
      mockPrisma.resume.count.mockResolvedValue(1);
      const result = await service.findAll('user-1');
      expect(mockPrisma.resume.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ where: { userId: 'user-1' } }),
      );
      expect(result.data).toHaveLength(1);
      expect(result.total).toBe(1);
      expect(result.page).toBe(1);
    });

    it('userId 없으면 전체 목록', async () => {
      mockPrisma.resume.findMany.mockResolvedValue([]);
      mockPrisma.resume.count.mockResolvedValue(0);
      await service.findAll();
      expect(mockPrisma.resume.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ where: {} }),
      );
    });
  });

  // ──────────────────────────────────────────────────
  // findByShortCode
  // ──────────────────────────────────────────────────
  describe('findByShortCode', () => {
    const publicResume = {
      ...mockResume,
      id: 'abcd1234-full-uuid',
      visibility: 'public',
      experiences: [],
      educations: [],
      skills: [],
      projects: [],
      certifications: [],
      languages: [],
      awards: [],
      activities: [],
      tags: [],
    };

    it('숏코드로 공개 이력서 조회 성공', async () => {
      mockPrisma.resume.findFirst.mockResolvedValue(publicResume);
      mockPrisma.resume.update.mockResolvedValue(publicResume);

      const result = await service.findByShortCode('abcd1234');
      expect(result).not.toBeNull();
      expect(result!.id).toBe('abcd1234-full-uuid');
      expect(mockPrisma.resume.findFirst).toHaveBeenCalledWith(
        expect.objectContaining({
          where: {
            id: { startsWith: 'abcd1234' },
            visibility: { not: 'private' },
          },
        }),
      );
    });

    it('link-only 이력서도 숏코드로 조회 가능', async () => {
      const linkOnlyResume = { ...publicResume, visibility: 'link-only' };
      mockPrisma.resume.findFirst.mockResolvedValue(linkOnlyResume);
      mockPrisma.resume.update.mockResolvedValue(linkOnlyResume);

      const result = await service.findByShortCode('abcd1234');
      expect(result).not.toBeNull();
    });

    it('비공개 이력서는 숏코드로 조회 불가 (not: private 필터)', async () => {
      mockPrisma.resume.findFirst.mockResolvedValue(null);

      const result = await service.findByShortCode('private1');
      expect(result).toBeNull();
    });

    it('존재하지 않는 숏코드 → null 반환', async () => {
      mockPrisma.resume.findFirst.mockResolvedValue(null);

      const result = await service.findByShortCode('nonexist');
      expect(result).toBeNull();
    });

    it('조회 시 viewCount 증가 호출', async () => {
      mockPrisma.resume.findFirst.mockResolvedValue(publicResume);
      mockPrisma.resume.update.mockResolvedValue(publicResume);

      await service.findByShortCode('abcd1234');
      expect(mockPrisma.resume.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 'abcd1234-full-uuid' },
          data: { viewCount: { increment: 1 } },
        }),
      );
    });
  });

  // ──────────────────────────────────────────────────
  // transferOwnership
  // ──────────────────────────────────────────────────
  describe('transferOwnership', () => {
    it('소유권 이전 성공', async () => {
      mockPrisma.resume.findUnique.mockResolvedValue(mockResume);
      mockPrisma.user.findFirst.mockResolvedValue({ id: 'user-2', name: '김철수' });
      (mockPrisma.user as any).findUnique = jest.fn().mockResolvedValue({ id: 'user-2', name: '김철수' });
      mockPrisma.resume.update.mockResolvedValue({ ...mockResume, userId: 'user-2' });

      const result = await service.transferOwnership('resume-1', 'user-2');
      expect(result.success).toBe(true);
      expect(result.message).toContain('김철수');
      expect(mockPrisma.resume.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 'resume-1' },
          data: { userId: 'user-2' },
        }),
      );
    });

    it('존재하지 않는 이력서 → NotFoundException', async () => {
      mockPrisma.resume.findUnique.mockResolvedValue(null);

      await expect(service.transferOwnership('fake-id', 'user-2'))
        .rejects.toThrow(NotFoundException);
    });

    it('존재하지 않는 대상 사용자 → NotFoundException', async () => {
      mockPrisma.resume.findUnique.mockResolvedValue(mockResume);
      (mockPrisma.user as any).findUnique = jest.fn().mockResolvedValue(null);

      await expect(service.transferOwnership('resume-1', 'fake-user'))
        .rejects.toThrow(NotFoundException);
      await expect(service.transferOwnership('resume-1', 'fake-user'))
        .rejects.toThrow('대상 사용자를 찾을 수 없습니다');
    });
  });

  // ──────────────────────────────────────────────────
  // remove - visibility cascade on delete
  // ──────────────────────────────────────────────────
  describe('remove - cascade behavior', () => {
    it('소유자 삭제 시 Prisma cascade로 관련 데이터 삭제', async () => {
      mockPrisma.resume.findUnique.mockResolvedValue(mockResume);
      mockPrisma.attachment.findMany.mockResolvedValue([]);
      mockPrisma.resume.delete.mockResolvedValue(mockResume);

      const result = await service.remove('resume-1', 'user-1');
      expect(result).toEqual({ success: true });
      expect(mockPrisma.resume.delete).toHaveBeenCalledWith({ where: { id: 'resume-1' } });
    });

    it('admin 권한으로 다른 사용자 이력서 삭제 가능', async () => {
      mockPrisma.resume.findUnique.mockResolvedValue(mockResume);
      mockPrisma.attachment.findMany.mockResolvedValue([]);
      mockPrisma.resume.delete.mockResolvedValue(mockResume);

      const result = await service.remove('resume-1', 'admin-user', 'admin');
      expect(result).toEqual({ success: true });
    });

    it('superadmin 권한으로도 삭제 가능', async () => {
      mockPrisma.resume.findUnique.mockResolvedValue(mockResume);
      mockPrisma.attachment.findMany.mockResolvedValue([]);
      mockPrisma.resume.delete.mockResolvedValue(mockResume);

      const result = await service.remove('resume-1', 'superadmin-user', 'superadmin');
      expect(result).toEqual({ success: true });
    });

    it('비소유자 + 일반 권한으로 삭제 → ForbiddenException', async () => {
      mockPrisma.resume.findUnique.mockResolvedValue(mockResume);
      await expect(service.remove('resume-1', 'other-user', 'user'))
        .rejects.toThrow(ForbiddenException);
    });

    it('Cloudinary 첨부파일이 있는 이력서 삭제', async () => {
      mockPrisma.resume.findUnique.mockResolvedValue(mockResume);
      mockPrisma.attachment.findMany.mockResolvedValue([
        { filename: 'http://res.cloudinary.com/demo/upload/v123/resumes/file.pdf' },
      ]);
      mockPrisma.resume.delete.mockResolvedValue(mockResume);

      // cloudinary import will fail in test env, but remove() catches it
      const result = await service.remove('resume-1', 'user-1');
      expect(result).toEqual({ success: true });
      expect(mockPrisma.resume.delete).toHaveBeenCalledWith({ where: { id: 'resume-1' } });
    });
  });

  // ──────────────────────────────────────────────────
  // findBySlug
  // ──────────────────────────────────────────────────
  describe('findBySlug', () => {
    it('username + slug로 공개 이력서 조회', async () => {
      const publicResume = {
        ...mockResume,
        visibility: 'public',
        experiences: [],
        educations: [],
        skills: [],
        projects: [],
        certifications: [],
        languages: [],
        awards: [],
        activities: [],
        tags: [],
      };
      mockPrisma.user.findFirst.mockResolvedValue({ id: 'user-1' });
      mockPrisma.resume.findFirst.mockResolvedValue(publicResume);
      mockPrisma.resume.update.mockResolvedValue(publicResume);

      const result = await service.findBySlug('hong', 'test-resume');
      expect(result.id).toBe('resume-1');
    });

    it('사용자 없음 → NotFoundException', async () => {
      mockPrisma.user.findFirst.mockResolvedValue(null);
      await expect(service.findBySlug('unknown', 'test'))
        .rejects.toThrow(NotFoundException);
    });

    it('비공개 이력서 → NotFoundException', async () => {
      mockPrisma.user.findFirst.mockResolvedValue({ id: 'user-1' });
      mockPrisma.resume.findFirst.mockResolvedValue({ ...mockResume, visibility: 'private' });

      await expect(service.findBySlug('hong', 'private-slug'))
        .rejects.toThrow(NotFoundException);
    });
  });

  // ──────────────────────────────────────────────────
  // bookmarks
  // ──────────────────────────────────────────────────
  describe('bookmarks', () => {
    it('북마크 추가', async () => {
      mockPrisma.bookmark.create = jest.fn().mockResolvedValue({ id: 'b1' });
      const result = await service.addBookmark('resume-1', 'user-1');
      expect(result.bookmarked).toBe(true);
    });

    it('북마크 해제', async () => {
      mockPrisma.bookmark.deleteMany = jest.fn().mockResolvedValue({ count: 1 });
      const result = await service.removeBookmark('resume-1', 'user-1');
      expect(result.bookmarked).toBe(false);
    });

    it('북마크 목록', async () => {
      mockPrisma.bookmark.findMany = jest.fn().mockResolvedValue([
        { id: 'b1', resume: { id: 'r1', title: '테스트', personalInfo: { name: '홍길동' } }, createdAt: new Date() },
      ]);
      const result = await service.getBookmarks('user-1');
      expect(result).toHaveLength(1);
      expect(result[0].title).toBe('테스트');
    });
  });
});
