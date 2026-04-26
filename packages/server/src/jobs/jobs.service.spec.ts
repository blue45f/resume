import { Test, TestingModule } from '@nestjs/testing';
import { JobsService } from './jobs.service';
import { PrismaService } from '../prisma/prisma.service';
import { SystemConfigService } from '../system-config/system-config.service';
import { NotificationsService } from '../notifications/notifications.service';
import {
  NotFoundException,
  ForbiddenException,
  BadRequestException,
  ConflictException,
} from '@nestjs/common';

const mockNotifications = { create: jest.fn().mockResolvedValue({}) };

const mockJob = {
  id: 'j1',
  userId: 'u1',
  company: '네이버',
  position: 'FE 개발자',
  location: '판교',
  salary: '5000만원~7000만원',
  description: '프론트엔드 개발',
  requirements: 'React 3년 이상',
  benefits: '스톡옵션',
  type: 'fulltime',
  skills: 'React,TypeScript',
  status: 'active',
  createdAt: new Date(),
  updatedAt: new Date(),
};

const mockPrisma: any = {
  jobPost: {
    findMany: jest.fn(),
    findUnique: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
  },
  user: { findUnique: jest.fn() },
  resume: { findUnique: jest.fn(), findMany: jest.fn() },
  jobPostApplication: {
    create: jest.fn(),
    findUnique: jest.fn(),
    findMany: jest.fn(),
    update: jest.fn(),
  },
};

describe('JobsService', () => {
  let service: JobsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        JobsService,
        { provide: PrismaService, useValue: mockPrisma },
        {
          provide: SystemConfigService,
          useValue: {
            checkPermission: jest.fn().mockResolvedValue(true),
            getPermissions: jest.fn().mockResolvedValue({}),
          },
        },
        { provide: NotificationsService, useValue: mockNotifications },
      ],
    }).compile();
    service = module.get(JobsService);
    jest.clearAllMocks();
  });

  // ──────────────────────────────────────────────────
  // findAll
  // ──────────────────────────────────────────────────
  describe('findAll', () => {
    it('기본 status=active로 채용 공고 목록 반환', async () => {
      mockPrisma.jobPost.findMany.mockResolvedValue([mockJob]);
      const result = await service.findAll();
      expect(result).toHaveLength(1);
      expect(mockPrisma.jobPost.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { status: 'active' },
          orderBy: { createdAt: 'desc' },
          take: 50,
        }),
      );
    });

    it('검색어로 필터링 (position, company, skills, location)', async () => {
      mockPrisma.jobPost.findMany.mockResolvedValue([]);
      await service.findAll('active', 'React');
      expect(mockPrisma.jobPost.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            status: 'active',
            OR: [
              { position: { contains: 'React', mode: 'insensitive' } },
              { company: { contains: 'React', mode: 'insensitive' } },
              { skills: { contains: 'React', mode: 'insensitive' } },
              { location: { contains: 'React', mode: 'insensitive' } },
            ],
          }),
        }),
      );
    });

    it('검색어 없이 status만으로 필터링', async () => {
      mockPrisma.jobPost.findMany.mockResolvedValue([]);
      await service.findAll('closed');
      expect(mockPrisma.jobPost.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { status: 'closed' },
        }),
      );
    });

    it('결과가 없으면 빈 배열', async () => {
      mockPrisma.jobPost.findMany.mockResolvedValue([]);
      const result = await service.findAll();
      expect(result).toEqual([]);
    });

    it('user 정보를 include', async () => {
      mockPrisma.jobPost.findMany.mockResolvedValue([]);
      await service.findAll();
      expect(mockPrisma.jobPost.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          include: { user: { select: { id: true, name: true, companyName: true, avatar: true } } },
        }),
      );
    });
  });

  // ──────────────────────────────────────────────────
  // findOne
  // ──────────────────────────────────────────────────
  describe('findOne', () => {
    it('채용 공고 상세 조회', async () => {
      mockPrisma.jobPost.findUnique.mockResolvedValue({
        ...mockJob,
        user: { id: 'u1', name: '리크루터', companyName: '네이버', avatar: '', email: 'r@t.com' },
      });
      const result = await service.findOne('j1');
      expect(result.id).toBe('j1');
      expect(result.position).toBe('FE 개발자');
      expect(result.user.name).toBe('리크루터');
    });

    it('존재하지 않는 공고 → NotFoundException', async () => {
      mockPrisma.jobPost.findUnique.mockResolvedValue(null);
      await expect(service.findOne('fake')).rejects.toThrow(NotFoundException);
      await expect(service.findOne('fake')).rejects.toThrow('채용 공고를 찾을 수 없습니다');
    });

    it('user email도 포함하여 조회', async () => {
      mockPrisma.jobPost.findUnique.mockResolvedValue({ ...mockJob, user: {} });
      await service.findOne('j1');
      expect(mockPrisma.jobPost.findUnique).toHaveBeenCalledWith(
        expect.objectContaining({
          include: { user: { select: expect.objectContaining({ email: true }) } },
        }),
      );
    });
  });

  // ──────────────────────────────────────────────────
  // findByUser
  // ──────────────────────────────────────────────────
  describe('findByUser', () => {
    it('사용자의 공고 목록 반환', async () => {
      mockPrisma.jobPost.findMany.mockResolvedValue([mockJob]);
      const result = await service.findByUser('u1');
      expect(result).toHaveLength(1);
      expect(mockPrisma.jobPost.findMany).toHaveBeenCalledWith({
        where: { userId: 'u1' },
        orderBy: { createdAt: 'desc' },
      });
    });

    it('공고가 없으면 빈 배열', async () => {
      mockPrisma.jobPost.findMany.mockResolvedValue([]);
      const result = await service.findByUser('u1');
      expect(result).toEqual([]);
    });
  });

  // ──────────────────────────────────────────────────
  // create
  // ──────────────────────────────────────────────────
  describe('create', () => {
    it('리크루터가 공고 생성 성공', async () => {
      mockPrisma.user.findUnique.mockResolvedValue({
        id: 'u1',
        userType: 'recruiter',
        companyName: '네이버',
      });
      mockPrisma.jobPost.create.mockResolvedValue({ id: 'j2', position: 'BE 개발자' });

      const result = await service.create('u1', { position: 'BE 개발자', company: '네이버' });
      expect(result.id).toBe('j2');
    });

    it('기업 회원이 공고 생성 성공', async () => {
      mockPrisma.user.findUnique.mockResolvedValue({
        id: 'u1',
        userType: 'company',
        companyName: '카카오',
      });
      mockPrisma.jobPost.create.mockResolvedValue({ id: 'j3', position: 'PM' });

      const result = await service.create('u1', { position: 'PM' });
      expect(result.id).toBe('j3');
    });

    it('개인 회원이 공고 생성 → ForbiddenException', async () => {
      mockPrisma.user.findUnique.mockResolvedValue({ id: 'u1', userType: 'personal' });
      await expect(service.create('u1', { position: 'FE' })).rejects.toThrow(ForbiddenException);
      await expect(service.create('u1', { position: 'FE' })).rejects.toThrow(
        '채용 공고는 리크루터 또는 기업 회원만 등록할 수 있습니다',
      );
      expect(mockPrisma.jobPost.create).not.toHaveBeenCalled();
    });

    it('존재하지 않는 사용자 → ForbiddenException', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(null);
      await expect(service.create('fake', { position: 'FE' })).rejects.toThrow(ForbiddenException);
    });

    it('company 미입력 시 user.companyName 사용', async () => {
      mockPrisma.user.findUnique.mockResolvedValue({
        id: 'u1',
        userType: 'recruiter',
        companyName: '라인',
      });
      mockPrisma.jobPost.create.mockResolvedValue({ id: 'j4' });

      await service.create('u1', { position: 'SWE' });
      expect(mockPrisma.jobPost.create).toHaveBeenCalledWith({
        data: expect.objectContaining({ company: '라인' }),
      });
    });

    it('필드 미입력 시 기본값 적용', async () => {
      mockPrisma.user.findUnique.mockResolvedValue({
        id: 'u1',
        userType: 'recruiter',
        companyName: '',
      });
      mockPrisma.jobPost.create.mockResolvedValue({ id: 'j5' });

      await service.create('u1', {});
      expect(mockPrisma.jobPost.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          userId: 'u1',
          position: '',
          location: '',
          salary: '',
          description: '',
          requirements: '',
          benefits: '',
          type: 'fulltime',
          skills: '',
          status: 'active',
        }),
      });
    });

    it('type과 status 커스텀 값', async () => {
      mockPrisma.user.findUnique.mockResolvedValue({
        id: 'u1',
        userType: 'company',
        companyName: '쿠팡',
      });
      mockPrisma.jobPost.create.mockResolvedValue({ id: 'j6' });

      await service.create('u1', { position: '인턴', type: 'intern', status: 'draft' });
      expect(mockPrisma.jobPost.create).toHaveBeenCalledWith({
        data: expect.objectContaining({ type: 'intern', status: 'draft' }),
      });
    });
  });

  // ──────────────────────────────────────────────────
  // update
  // ──────────────────────────────────────────────────
  describe('update', () => {
    it('소유자가 공고 수정 성공', async () => {
      mockPrisma.jobPost.findUnique.mockResolvedValue(mockJob);
      mockPrisma.jobPost.update.mockResolvedValue({ ...mockJob, position: '시니어 FE' });

      const result = await service.update('j1', 'u1', { position: '시니어 FE' });
      expect(result.position).toBe('시니어 FE');
      expect(mockPrisma.jobPost.update).toHaveBeenCalledWith({
        where: { id: 'j1' },
        data: { position: '시니어 FE' },
      });
    });

    it('다른 사용자가 수정 → ForbiddenException', async () => {
      mockPrisma.jobPost.findUnique.mockResolvedValue(mockJob);
      await expect(service.update('j1', 'u2', { position: 'hack' })).rejects.toThrow(
        ForbiddenException,
      );
      expect(mockPrisma.jobPost.update).not.toHaveBeenCalled();
    });

    it('없는 공고 수정 → NotFoundException', async () => {
      mockPrisma.jobPost.findUnique.mockResolvedValue(null);
      await expect(service.update('fake', 'u1', {})).rejects.toThrow(NotFoundException);
    });
  });

  // ──────────────────────────────────────────────────
  // remove
  // ──────────────────────────────────────────────────
  describe('remove', () => {
    it('소유자가 공고 삭제 성공', async () => {
      mockPrisma.jobPost.findUnique.mockResolvedValue(mockJob);
      mockPrisma.jobPost.delete.mockResolvedValue({});
      const result = await service.remove('j1', 'u1');
      expect(result).toEqual({ success: true });
      expect(mockPrisma.jobPost.delete).toHaveBeenCalledWith({ where: { id: 'j1' } });
    });

    it('다른 사용자가 삭제 → ForbiddenException', async () => {
      mockPrisma.jobPost.findUnique.mockResolvedValue(mockJob);
      await expect(service.remove('j1', 'u2')).rejects.toThrow(ForbiddenException);
      expect(mockPrisma.jobPost.delete).not.toHaveBeenCalled();
    });

    it('admin이 타인 공고 삭제 가능', async () => {
      mockPrisma.jobPost.findUnique.mockResolvedValue(mockJob);
      mockPrisma.jobPost.delete.mockResolvedValue({});
      const result = await service.remove('j1', 'u2', 'admin');
      expect(result).toEqual({ success: true });
    });

    it('superadmin이 타인 공고 삭제 가능', async () => {
      mockPrisma.jobPost.findUnique.mockResolvedValue(mockJob);
      mockPrisma.jobPost.delete.mockResolvedValue({});
      const result = await service.remove('j1', 'u2', 'superadmin');
      expect(result).toEqual({ success: true });
    });

    it('없는 공고 삭제 → NotFoundException', async () => {
      mockPrisma.jobPost.findUnique.mockResolvedValue(null);
      await expect(service.remove('fake', 'u1')).rejects.toThrow(NotFoundException);
    });

    it('일반 사용자(role=user)가 타인 공고 삭제 → ForbiddenException', async () => {
      mockPrisma.jobPost.findUnique.mockResolvedValue(mockJob);
      await expect(service.remove('j1', 'u2', 'user')).rejects.toThrow(ForbiddenException);
    });
  });

  describe('getJobStats', () => {
    it('통계 반환 (기업별, 지역별, 유형별)', async () => {
      mockPrisma.jobPost.findMany.mockResolvedValue([
        {
          company: '네이버',
          position: 'FE',
          location: '서울 분당',
          type: 'full_time',
          skills: 'React,TypeScript',
          salary: '5000',
          createdAt: new Date(),
        },
        {
          company: '네이버',
          position: 'BE',
          location: '서울 분당',
          type: 'full_time',
          skills: 'Java,Spring',
          salary: '6000',
          createdAt: new Date(),
        },
        {
          company: '카카오',
          position: 'FE',
          location: '서울 판교',
          type: 'contract',
          skills: 'React,Vue',
          salary: '4500',
          createdAt: new Date(),
        },
      ]);
      const result = await service.getJobStats();
      expect(result.total).toBe(3);
      expect(result.byCompany[0].name).toBe('네이버');
      expect(result.byCompany[0].count).toBe(2);
      expect(result.byLocation.length).toBeGreaterThan(0);
      expect(result.byType.length).toBeGreaterThan(0);
      expect(result.bySkill.length).toBeGreaterThan(0);
    });

    it('빈 결과', async () => {
      mockPrisma.jobPost.findMany.mockResolvedValue([]);
      const result = await service.getJobStats();
      expect(result.total).toBe(0);
      expect(result.byCompany).toEqual([]);
    });
  });

  describe('applyToJob', () => {
    const activeJob = { ...mockJob, status: 'active', userId: 'recruiter-1' };

    it('마감된 공고 → BadRequest', async () => {
      mockPrisma.jobPost.findUnique.mockResolvedValue({ ...activeJob, status: 'closed' });
      await expect(service.applyToJob('j1', 'applicant-1', {})).rejects.toThrow(
        BadRequestException,
      );
    });

    it('본인 공고 지원 → BadRequest', async () => {
      mockPrisma.jobPost.findUnique.mockResolvedValue({ ...activeJob, userId: 'applicant-1' });
      await expect(service.applyToJob('j1', 'applicant-1', {})).rejects.toThrow(
        BadRequestException,
      );
    });

    it('타인 이력서 첨부 → ForbiddenException', async () => {
      mockPrisma.jobPost.findUnique.mockResolvedValue(activeJob);
      mockPrisma.resume.findUnique.mockResolvedValue({ id: 'r1', userId: 'someone-else' });
      await expect(service.applyToJob('j1', 'applicant-1', { resumeId: 'r1' })).rejects.toThrow(
        ForbiddenException,
      );
    });

    it('정상 지원 → 회사에 알림 발송', async () => {
      mockPrisma.jobPost.findUnique.mockResolvedValue(activeJob);
      mockPrisma.user.findUnique.mockResolvedValue({ id: 'applicant-1', name: '홍길동' });
      mockPrisma.jobPostApplication.create.mockResolvedValue({ id: 'app-1' });
      mockNotifications.create.mockClear();
      await service.applyToJob('j1', 'applicant-1', { coverLetter: '저는...' });
      expect(mockNotifications.create).toHaveBeenCalledWith(
        'recruiter-1',
        'job_application_received',
        expect.stringContaining('홍길동'),
        expect.stringContaining('/recruiter'),
      );
    });

    it('동일 공고 중복 지원 → ConflictException', async () => {
      mockPrisma.jobPost.findUnique.mockResolvedValue(activeJob);
      mockPrisma.jobPostApplication.create.mockRejectedValue({ code: 'P2002' });
      await expect(service.applyToJob('j1', 'applicant-1', {})).rejects.toThrow(ConflictException);
    });
  });

  describe('updatePipelineStage', () => {
    it('유효하지 않은 stage → BadRequest', async () => {
      await expect(service.updatePipelineStage('app-1', 'r-1', 'bogus')).rejects.toThrow(
        BadRequestException,
      );
    });

    it('타인 공고의 application → Forbidden', async () => {
      mockPrisma.jobPostApplication.findUnique.mockResolvedValue({
        id: 'app-1',
        applicantId: 'a1',
        stage: 'interested',
        job: { userId: 'other-recruiter' },
      });
      await expect(
        service.updatePipelineStage('app-1', 'recruiter-1', 'interview'),
      ).rejects.toThrow(ForbiddenException);
    });

    it('stage 변경 + 지원자에게 알림 (interested 제외)', async () => {
      mockPrisma.jobPostApplication.findUnique.mockResolvedValue({
        id: 'app-1',
        applicantId: 'a1',
        stage: 'interested',
        job: { userId: 'recruiter-1', position: 'FE' },
      });
      mockPrisma.jobPostApplication.update.mockResolvedValue({ id: 'app-1', stage: 'interview' });
      mockNotifications.create.mockClear();
      await service.updatePipelineStage('app-1', 'recruiter-1', 'interview');
      expect(mockNotifications.create).toHaveBeenCalledWith(
        'a1',
        'job_application_stage',
        expect.stringContaining('면접'),
        '/applications',
      );
    });

    it('동일 stage 로 변경 → no-op (알림 X)', async () => {
      mockPrisma.jobPostApplication.findUnique.mockResolvedValue({
        id: 'app-1',
        applicantId: 'a1',
        stage: 'contacted',
        job: { userId: 'recruiter-1', position: 'FE' },
      });
      mockNotifications.create.mockClear();
      const r = await service.updatePipelineStage('app-1', 'recruiter-1', 'contacted');
      expect(r.stage).toBe('contacted');
      expect(mockNotifications.create).not.toHaveBeenCalled();
    });
  });

  describe('withdrawMyApplication', () => {
    it('타인 application 철회 → Forbidden', async () => {
      mockPrisma.jobPostApplication.findUnique.mockResolvedValue({
        id: 'app-1',
        applicantId: 'other-user',
        stage: 'interested',
        job: { userId: 'r1', position: 'FE' },
      });
      await expect(service.withdrawMyApplication('app-1', 'me', 'reason')).rejects.toThrow(
        ForbiddenException,
      );
    });

    it('이미 hired 상태 → BadRequest', async () => {
      mockPrisma.jobPostApplication.findUnique.mockResolvedValue({
        id: 'app-1',
        applicantId: 'me',
        stage: 'hired',
        job: { userId: 'r1', position: 'FE' },
      });
      await expect(service.withdrawMyApplication('app-1', 'me')).rejects.toThrow(
        BadRequestException,
      );
    });

    it('정상 철회 + 회사에 알림 + recruiterNote 에 reason prepend', async () => {
      mockPrisma.jobPostApplication.findUnique.mockResolvedValue({
        id: 'app-1',
        applicantId: 'me',
        stage: 'interview',
        recruiterNote: '기존 노트',
        job: { userId: 'r1', position: 'FE' },
      });
      mockPrisma.jobPostApplication.update.mockResolvedValue({ id: 'app-1', stage: 'withdrawn' });
      mockNotifications.create.mockClear();
      await service.withdrawMyApplication('app-1', 'me', '연봉 협의 안 됨');
      expect(mockPrisma.jobPostApplication.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            stage: 'withdrawn',
            recruiterNote: expect.stringContaining('연봉 협의 안 됨'),
          }),
        }),
      );
      expect(mockNotifications.create).toHaveBeenCalledWith(
        'r1',
        'job_application_stage',
        expect.stringContaining('철회'),
        expect.any(String),
      );
    });
  });

  describe('getPipelineStats', () => {
    it('공고 없으면 zero stats', async () => {
      mockPrisma.jobPost.findMany.mockResolvedValueOnce([]);
      const r = await service.getPipelineStats('r1');
      expect(r.total).toBe(0);
      expect(r.avgResponseHours).toBeNull();
    });

    it('funnel 전환율 + 평균 응답 시간 계산', async () => {
      mockPrisma.jobPost.findMany.mockResolvedValueOnce([{ id: 'j1' }]);
      const now = Date.now();
      mockPrisma.jobPostApplication.findMany.mockResolvedValueOnce([
        // 5 interested (응답 X)
        ...Array.from({ length: 5 }, (_, i) => ({
          stage: 'interested',
          createdAt: new Date(now - 10 * 3600 * 1000),
          updatedAt: new Date(now - 10 * 3600 * 1000),
        })),
        // 3 contacted (응답 평균 5시간)
        ...Array.from({ length: 3 }, () => ({
          stage: 'contacted',
          createdAt: new Date(now - 10 * 3600 * 1000),
          updatedAt: new Date(now - 5 * 3600 * 1000),
        })),
        // 2 interview, 1 hired
        { stage: 'interview', createdAt: new Date(now), updatedAt: new Date(now) },
        { stage: 'interview', createdAt: new Date(now), updatedAt: new Date(now) },
        { stage: 'hired', createdAt: new Date(now), updatedAt: new Date(now) },
      ]);
      const r = await service.getPipelineStats('r1');
      expect(r.total).toBe(11);
      expect(r.byStage.interested).toBe(5);
      expect(r.byStage.contacted).toBe(3);
      expect(r.byStage.hired).toBe(1);
      // contactRate = (contacted+interview+hired+rejected) / total = 6/11 = 55%
      expect(r.conversionRates.contactRate).toBe(55);
      // interviewRate = (interview+hired) / contactedReached = 3/6 = 50%
      expect(r.conversionRates.interviewRate).toBe(50);
      // hireRate = hired / interview reached = 1/3 = 33%
      expect(r.conversionRates.hireRate).toBe(33);
      expect(r.avgResponseHours).toBeGreaterThan(0);
    });
  });

  describe('listRecommendedCandidates', () => {
    it('활성 공고 없으면 빈 배열', async () => {
      mockPrisma.jobPost.findMany.mockResolvedValueOnce([]);
      const r = await service.listRecommendedCandidates('r1');
      expect(r).toEqual([]);
    });

    it('skill 매칭 점수 기준 정렬', async () => {
      mockPrisma.jobPost.findMany.mockResolvedValueOnce([
        { id: 'j1', position: 'FE', skills: 'react,typescript,node' },
      ]);
      mockPrisma.resume.findMany.mockResolvedValueOnce([
        {
          id: 'r1',
          title: '풀스택',
          user: { id: 'u1', name: 'A', avatar: '' },
          personalInfo: { name: 'A' },
          skills: [{ items: 'react,typescript,node' }], // 3/3 매칭
        },
        {
          id: 'r2',
          title: 'BE',
          user: { id: 'u2', name: 'B', avatar: '' },
          personalInfo: { name: 'B' },
          skills: [{ items: 'react' }], // 1/3 매칭
        },
        {
          id: 'r3',
          title: 'Designer',
          user: { id: 'u3', name: 'C', avatar: '' },
          personalInfo: { name: 'C' },
          skills: [{ items: 'figma,sketch' }], // 0 매칭 → 제외
        },
      ]);
      const r = await service.listRecommendedCandidates('r1');
      expect(r).toHaveLength(2);
      expect(r[0].matchScore).toBeGreaterThan(r[1].matchScore);
      expect(r[0].userId).toBe('u1');
    });
  });
});
