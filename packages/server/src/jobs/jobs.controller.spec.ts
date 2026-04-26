import { Test, TestingModule } from '@nestjs/testing';
import { UnauthorizedException } from '@nestjs/common';
import { JobsController } from './jobs.controller';
import { JobsService } from './jobs.service';
import { JobUrlParserService } from './job-url-parser.service';

const mockService = {
  findAll: jest.fn(),
  findOne: jest.fn(),
  findMy: jest.fn(),
  findByUser: jest.fn(),
  create: jest.fn(),
  update: jest.fn(),
  remove: jest.fn(),
  getJobStats: jest.fn(),
  getExternalLinks: jest.fn(),
  createExternalLink: jest.fn(),
  updateExternalLink: jest.fn(),
  deleteExternalLink: jest.fn(),
  recordExternalLinkClick: jest.fn(),
  getCuratedJobs: jest.fn(),
  getCuratedJob: jest.fn(),
  createCuratedJob: jest.fn(),
  updateCuratedJob: jest.fn(),
  deleteCuratedJob: jest.fn(),
  recordCuratedJobClick: jest.fn(),
};

const reqWith = (user?: { id?: string; role?: string; userType?: string }): any => ({ user });

describe('JobsController', () => {
  let controller: JobsController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [JobsController],
      providers: [
        { provide: JobsService, useValue: mockService },
        { provide: JobUrlParserService, useValue: { parse: jest.fn() } },
      ],
    }).compile();
    controller = module.get(JobsController);
    jest.clearAllMocks();
  });

  describe('findAll', () => {
    it('status 기본값 "active"', () => {
      controller.findAll('검색어');
      expect(mockService.findAll).toHaveBeenCalledWith('active', '검색어');
    });

    it('status 직접 전달', () => {
      controller.findAll(undefined, 'closed');
      expect(mockService.findAll).toHaveBeenCalledWith('closed', undefined);
    });
  });

  it('findOne: id 전달 (공개)', () => {
    controller.findOne('j1');
    expect(mockService.findOne).toHaveBeenCalledWith('j1');
  });

  describe('findMy', () => {
    it('비로그인 → [] 빈 배열, service 호출 안 함', () => {
      expect(controller.findMy(reqWith())).toEqual([]);
      expect(mockService.findByUser).not.toHaveBeenCalled();
    });

    it('로그인 시 userId 위임', () => {
      controller.findMy(reqWith({ id: 'u1' }));
      expect(mockService.findByUser).toHaveBeenCalledWith('u1');
    });
  });

  it('getStats: 필터 쿼리 전달', () => {
    controller.getStats('서울', 'fulltime', 'React');
    expect(mockService.getJobStats).toHaveBeenCalledWith('서울', 'fulltime', 'React');
  });

  describe('external links', () => {
    it('getExternalLinks: 필터 객체 전달', () => {
      controller.getExternalLinks('직무', '대기업', '시니어', 'fulltime', '서울', 'IT', '키워드');
      expect(mockService.getExternalLinks).toHaveBeenCalledWith({
        category: '직무',
        companySize: '대기업',
        careerLevel: '시니어',
        jobType: 'fulltime',
        location: '서울',
        jobCategory: 'IT',
        q: '키워드',
      });
    });

    it('createExternalLink: 비로그인 → Unauthorized', () => {
      expect(() => controller.createExternalLink({}, reqWith())).toThrow(UnauthorizedException);
    });

    it('createExternalLink: 로그인 시 user meta 전달', () => {
      controller.createExternalLink(
        { url: 'https://x.com' },
        reqWith({ id: 'u1', role: 'admin', userType: 'recruiter' }),
      );
      expect(mockService.createExternalLink).toHaveBeenCalledWith(
        { url: 'https://x.com' },
        { id: 'u1', role: 'admin', userType: 'recruiter' },
      );
    });

    it('updateExternalLink: 비로그인 → Unauthorized', () => {
      expect(() => controller.updateExternalLink('e1', {}, reqWith())).toThrow(
        UnauthorizedException,
      );
    });

    it('deleteExternalLink: 비로그인 → Unauthorized', () => {
      expect(() => controller.deleteExternalLink('e1', reqWith())).toThrow(UnauthorizedException);
    });

    it('recordClick: 공개, id 위임', () => {
      controller.recordClick('e1');
      expect(mockService.recordExternalLinkClick).toHaveBeenCalledWith('e1');
    });
  });

  describe('curated jobs', () => {
    it('getCuratedJobs: 쿼리 파싱 + 기본값 page=1 limit=20', () => {
      controller.getCuratedJobs();
      expect(mockService.getCuratedJobs).toHaveBeenCalledWith(
        expect.objectContaining({ page: 1, limit: 20 }),
      );
    });

    it('getCuratedJob: id 전달', () => {
      controller.getCuratedJob('c1');
      expect(mockService.getCuratedJob).toHaveBeenCalledWith('c1');
    });

    it('createCuratedJob: user meta 4개 인자 분해 전달', () => {
      controller.createCuratedJob(
        { title: 'T' },
        reqWith({ id: 'u1', role: 'user', userType: 'personal' }),
      );
      expect(mockService.createCuratedJob).toHaveBeenCalledWith(
        { title: 'T' },
        'u1',
        'user',
        'personal',
      );
    });

    it('recordCuratedJobClick: 공개, id 위임', () => {
      controller.recordCuratedJobClick('c1');
      expect(mockService.recordCuratedJobClick).toHaveBeenCalledWith('c1');
    });
  });

  describe('job post CRUD', () => {
    it('create: 비로그인 → error 객체', () => {
      expect(controller.create({}, reqWith())).toEqual({ error: '로그인 필요' });
      expect(mockService.create).not.toHaveBeenCalled();
    });

    it('create: 로그인 시 userId + body 전달', () => {
      controller.create({ title: 'T' }, reqWith({ id: 'u1' }));
      expect(mockService.create).toHaveBeenCalledWith('u1', { title: 'T' });
    });

    it('update: userId 전달 (service 에서 권한 판정)', () => {
      controller.update('j1', { title: 'T' }, reqWith({ id: 'u1' }));
      expect(mockService.update).toHaveBeenCalledWith('j1', 'u1', { title: 'T' });
    });

    it('remove: userId + role 전달', () => {
      controller.remove('j1', reqWith({ id: 'u1', role: 'admin' }));
      expect(mockService.remove).toHaveBeenCalledWith('j1', 'u1', 'admin');
    });
  });
});
