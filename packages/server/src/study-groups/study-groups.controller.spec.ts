import { Test, TestingModule } from '@nestjs/testing';
import { UnauthorizedException } from '@nestjs/common';
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
};

const reqWith = (user?: { id?: string; role?: string }): any => ({ user });

describe('StudyGroupsController', () => {
  let controller: StudyGroupsController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [StudyGroupsController],
      providers: [{ provide: StudyGroupsService, useValue: mockService }],
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
});
