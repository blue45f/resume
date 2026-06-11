import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { StudyGroupsController } from './study-groups.controller';
import { StudyGroupsService } from './study-groups.service';

const mockService = {
  findAll: jest.fn(),
  findOne: jest.fn(),
  create: jest.fn(),
  join: jest.fn(),
  leave: jest.fn(),
  remove: jest.fn(),
  listQuestions: jest.fn(),
  addQuestion: jest.fn(),
  assertPostAccess: jest.fn(),
};

// Cloudinary 미설정 환경 시뮬레이션 → 업로드는 data: URL 폴백 경로
const mockConfig = { get: jest.fn().mockReturnValue(undefined) };

const reqWith = (user?: { id?: string; role?: string }): any => ({ user });

describe('StudyGroupsController', () => {
  let controller: StudyGroupsController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [StudyGroupsController],
      providers: [
        { provide: StudyGroupsService, useValue: mockService },
        { provide: ConfigService, useValue: mockConfig },
      ],
    }).compile();
    controller = module.get(StudyGroupsController);
    jest.clearAllMocks();
  });

  describe('findAll', () => {
    it('mine 미지정 시 false + 기본 페이지네이션', () => {
      controller.findAll(reqWith());
      expect(mockService.findAll).toHaveBeenCalledWith({
        q: undefined,
        companyName: undefined,
        jobPostId: undefined,
        jobKey: undefined,
        companyTier: undefined,
        cafeCategory: undefined,
        experienceLevel: undefined,
        mine: false,
        sort: undefined,
        openOnly: false,
        minMembers: undefined,
        userId: undefined,
        page: 1,
        limit: 20,
      });
    });

    it('mine="true" 문자열 → boolean true + userId 전달', () => {
      controller.findAll(
        reqWith({ id: 'u1' }),
        undefined,
        undefined,
        undefined,
        undefined,
        undefined,
        undefined,
        undefined,
        'true',
      );
      expect(mockService.findAll).toHaveBeenCalledWith(
        expect.objectContaining({ mine: true, userId: 'u1' }),
      );
    });

    it('mine="1" 도 true 로 해석', () => {
      controller.findAll(
        reqWith(),
        undefined,
        undefined,
        undefined,
        undefined,
        undefined,
        undefined,
        undefined,
        '1',
      );
      expect(mockService.findAll).toHaveBeenCalledWith(expect.objectContaining({ mine: true }));
    });

    it('tier/cafe/experienceLevel 필터 전달', () => {
      controller.findAll(
        reqWith(),
        '검색',
        'N사',
        undefined,
        undefined,
        'large',
        'interview',
        'mid',
      );
      expect(mockService.findAll).toHaveBeenCalledWith(
        expect.objectContaining({
          q: '검색',
          companyName: 'N사',
          companyTier: 'large',
          cafeCategory: 'interview',
          experienceLevel: 'mid',
        }),
      );
    });
  });

  it('create: 비로그인 Unauthorized / 로그인 userId + body', () => {
    expect(() => controller.create({ name: 'g' } as any, reqWith())).toThrow(UnauthorizedException);
    controller.create({ name: 'g' } as any, reqWith({ id: 'u1' }));
    expect(mockService.create).toHaveBeenCalledWith('u1', { name: 'g' });
  });

  it('findOne: userId 전달 (비로그인도 공개는 허용, private은 서비스에서 거부)', () => {
    controller.findOne('g1', reqWith({ id: 'u1' }));
    expect(mockService.findOne).toHaveBeenCalledWith('g1', 'u1');
  });

  it('join: 비로그인 Unauthorized / 로그인 위임', () => {
    expect(() => controller.join('g1', reqWith())).toThrow(UnauthorizedException);
    controller.join('g1', reqWith({ id: 'u1' }));
    expect(mockService.join).toHaveBeenCalledWith('g1', 'u1');
  });

  it('leave: 비로그인 Unauthorized', () => {
    expect(() => controller.leave('g1', reqWith())).toThrow(UnauthorizedException);
    controller.leave('g1', reqWith({ id: 'u1' }));
    expect(mockService.leave).toHaveBeenCalledWith('g1', 'u1');
  });

  it('remove: userId + role 전달', () => {
    expect(() => controller.remove('g1', reqWith())).toThrow(UnauthorizedException);
    controller.remove('g1', reqWith({ id: 'u1', role: 'admin' }));
    expect(mockService.remove).toHaveBeenCalledWith('g1', 'u1', 'admin');
  });

  it('addQuestion: 비로그인 Unauthorized', () => {
    expect(() => controller.addQuestion('g1', { question: 'Q' } as any, reqWith())).toThrow(
      UnauthorizedException,
    );
    controller.addQuestion('g1', { question: 'Q' } as any, reqWith({ id: 'u1' }));
    expect(mockService.addQuestion).toHaveBeenCalledWith('g1', 'u1', { question: 'Q' });
  });

  describe('uploadPostAttachment (이미지/PDF, 2MB 캡)', () => {
    const makeFile = (over: Partial<Express.Multer.File> = {}): Express.Multer.File =>
      ({
        originalname: 'doc.pdf',
        mimetype: 'application/pdf',
        size: 1024,
        buffer: Buffer.from('PDF'),
        ...over,
      }) as Express.Multer.File;

    it('비로그인 → Unauthorized', async () => {
      await expect(controller.uploadPostAttachment('g1', makeFile(), reqWith())).rejects.toThrow(
        UnauthorizedException,
      );
    });

    it('파일 없음 → BadRequest', async () => {
      await expect(
        controller.uploadPostAttachment('g1', undefined as any, reqWith({ id: 'u1' })),
      ).rejects.toThrow(BadRequestException);
    });

    it('허용 외 mimetype (zip) → BadRequest', async () => {
      await expect(
        controller.uploadPostAttachment(
          'g1',
          makeFile({ mimetype: 'application/zip' }),
          reqWith({ id: 'u1' }),
        ),
      ).rejects.toThrow(BadRequestException);
    });

    it('2MB 초과 → BadRequest', async () => {
      await expect(
        controller.uploadPostAttachment(
          'g1',
          makeFile({ size: 2 * 1024 * 1024 + 1 }),
          reqWith({ id: 'u1' }),
        ),
      ).rejects.toThrow(BadRequestException);
    });

    it('정상 업로드 (Cloudinary 미설정) → data: URL 폴백 + 그룹 접근 검증', async () => {
      mockService.assertPostAccess.mockResolvedValueOnce({ id: 'g1' });
      const res = await controller.uploadPostAttachment('g1', makeFile(), reqWith({ id: 'u1' }));
      expect(mockService.assertPostAccess).toHaveBeenCalledWith('g1', 'u1');
      expect(res.url.startsWith('data:application/pdf;base64,')).toBe(true);
      expect(res).toMatchObject({ name: 'doc.pdf', size: 1024, type: 'application/pdf' });
    });

    it('접근 거부 시 업로드 중단 (assertPostAccess 예외 전파)', async () => {
      mockService.assertPostAccess.mockRejectedValueOnce(new Error('forbidden'));
      await expect(
        controller.uploadPostAttachment('g1', makeFile(), reqWith({ id: 'u1' })),
      ).rejects.toThrow('forbidden');
    });
  });
});
