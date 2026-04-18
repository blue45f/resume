import { Test, TestingModule } from '@nestjs/testing';
import { JobInterviewQuestionsAdminController } from './job-interview-questions-admin.controller';
import { JobInterviewQuestionsService } from './job-interview-questions.service';

const mockService = {
  adminList: jest.fn(),
  adminApprove: jest.fn(),
  adminReject: jest.fn(),
  adminSetUpvotes: jest.fn(),
  adminDelete: jest.fn(),
};

describe('JobInterviewQuestionsAdminController', () => {
  let controller: JobInterviewQuestionsAdminController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [JobInterviewQuestionsAdminController],
      providers: [{ provide: JobInterviewQuestionsService, useValue: mockService }],
    }).compile();
    controller = module.get(JobInterviewQuestionsAdminController);
    jest.clearAllMocks();
  });

  describe('list', () => {
    it('기본값 page=1, limit=20', () => {
      controller.list();
      expect(mockService.adminList).toHaveBeenCalledWith({
        status: undefined,
        q: undefined,
        page: 1,
        limit: 20,
      });
    });

    it('상태 + 검색 + 페이지네이션 전달', () => {
      controller.list('pending', 'FE', '2', '50');
      expect(mockService.adminList).toHaveBeenCalledWith({
        status: 'pending',
        q: 'FE',
        page: 2,
        limit: 50,
      });
    });
  });

  it('approve → service.adminApprove(id)', () => {
    controller.approve('q1');
    expect(mockService.adminApprove).toHaveBeenCalledWith('q1');
  });

  it('reject → service.adminReject(id)', () => {
    controller.reject('q1');
    expect(mockService.adminReject).toHaveBeenCalledWith('q1');
  });

  it('setUpvotes: body.upvotes 전달', () => {
    controller.setUpvotes('q1', { upvotes: 42 });
    expect(mockService.adminSetUpvotes).toHaveBeenCalledWith('q1', 42);
  });

  it('remove → service.adminDelete(id)', () => {
    controller.remove('q1');
    expect(mockService.adminDelete).toHaveBeenCalledWith('q1');
  });
});
