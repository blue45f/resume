"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
const _testing = require("@nestjs/testing");
const _jobsservice = require("./jobs.service");
const _prismaservice = require("../prisma/prisma.service");
const _systemconfigservice = require("../system-config/system-config.service");
const _common = require("@nestjs/common");
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
    updatedAt: new Date()
};
const mockPrisma = {
    jobPost: {
        findMany: jest.fn(),
        findUnique: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
        delete: jest.fn()
    },
    user: {
        findUnique: jest.fn()
    }
};
describe('JobsService', ()=>{
    let service;
    beforeEach(async ()=>{
        const module = await _testing.Test.createTestingModule({
            providers: [
                _jobsservice.JobsService,
                {
                    provide: _prismaservice.PrismaService,
                    useValue: mockPrisma
                },
                {
                    provide: _systemconfigservice.SystemConfigService,
                    useValue: {
                        checkPermission: jest.fn().mockResolvedValue(true),
                        getPermissions: jest.fn().mockResolvedValue({})
                    }
                }
            ]
        }).compile();
        service = module.get(_jobsservice.JobsService);
        jest.clearAllMocks();
    });
    // ──────────────────────────────────────────────────
    // findAll
    // ──────────────────────────────────────────────────
    describe('findAll', ()=>{
        it('기본 status=active로 채용 공고 목록 반환', async ()=>{
            mockPrisma.jobPost.findMany.mockResolvedValue([
                mockJob
            ]);
            const result = await service.findAll();
            expect(result).toHaveLength(1);
            expect(mockPrisma.jobPost.findMany).toHaveBeenCalledWith(expect.objectContaining({
                where: {
                    status: 'active'
                },
                orderBy: {
                    createdAt: 'desc'
                },
                take: 50
            }));
        });
        it('검색어로 필터링 (position, company, skills, location)', async ()=>{
            mockPrisma.jobPost.findMany.mockResolvedValue([]);
            await service.findAll('active', 'React');
            expect(mockPrisma.jobPost.findMany).toHaveBeenCalledWith(expect.objectContaining({
                where: expect.objectContaining({
                    status: 'active',
                    OR: [
                        {
                            position: {
                                contains: 'React',
                                mode: 'insensitive'
                            }
                        },
                        {
                            company: {
                                contains: 'React',
                                mode: 'insensitive'
                            }
                        },
                        {
                            skills: {
                                contains: 'React',
                                mode: 'insensitive'
                            }
                        },
                        {
                            location: {
                                contains: 'React',
                                mode: 'insensitive'
                            }
                        }
                    ]
                })
            }));
        });
        it('검색어 없이 status만으로 필터링', async ()=>{
            mockPrisma.jobPost.findMany.mockResolvedValue([]);
            await service.findAll('closed');
            expect(mockPrisma.jobPost.findMany).toHaveBeenCalledWith(expect.objectContaining({
                where: {
                    status: 'closed'
                }
            }));
        });
        it('결과가 없으면 빈 배열', async ()=>{
            mockPrisma.jobPost.findMany.mockResolvedValue([]);
            const result = await service.findAll();
            expect(result).toEqual([]);
        });
        it('user 정보를 include', async ()=>{
            mockPrisma.jobPost.findMany.mockResolvedValue([]);
            await service.findAll();
            expect(mockPrisma.jobPost.findMany).toHaveBeenCalledWith(expect.objectContaining({
                include: {
                    user: {
                        select: {
                            id: true,
                            name: true,
                            companyName: true,
                            avatar: true
                        }
                    }
                }
            }));
        });
    });
    // ──────────────────────────────────────────────────
    // findOne
    // ──────────────────────────────────────────────────
    describe('findOne', ()=>{
        it('채용 공고 상세 조회', async ()=>{
            mockPrisma.jobPost.findUnique.mockResolvedValue({
                ...mockJob,
                user: {
                    id: 'u1',
                    name: '리크루터',
                    companyName: '네이버',
                    avatar: '',
                    email: 'r@t.com'
                }
            });
            const result = await service.findOne('j1');
            expect(result.id).toBe('j1');
            expect(result.position).toBe('FE 개발자');
            expect(result.user.name).toBe('리크루터');
        });
        it('존재하지 않는 공고 → NotFoundException', async ()=>{
            mockPrisma.jobPost.findUnique.mockResolvedValue(null);
            await expect(service.findOne('fake')).rejects.toThrow(_common.NotFoundException);
            await expect(service.findOne('fake')).rejects.toThrow('채용 공고를 찾을 수 없습니다');
        });
        it('user email도 포함하여 조회', async ()=>{
            mockPrisma.jobPost.findUnique.mockResolvedValue({
                ...mockJob,
                user: {}
            });
            await service.findOne('j1');
            expect(mockPrisma.jobPost.findUnique).toHaveBeenCalledWith(expect.objectContaining({
                include: {
                    user: {
                        select: expect.objectContaining({
                            email: true
                        })
                    }
                }
            }));
        });
    });
    // ──────────────────────────────────────────────────
    // findByUser
    // ──────────────────────────────────────────────────
    describe('findByUser', ()=>{
        it('사용자의 공고 목록 반환', async ()=>{
            mockPrisma.jobPost.findMany.mockResolvedValue([
                mockJob
            ]);
            const result = await service.findByUser('u1');
            expect(result).toHaveLength(1);
            expect(mockPrisma.jobPost.findMany).toHaveBeenCalledWith({
                where: {
                    userId: 'u1'
                },
                orderBy: {
                    createdAt: 'desc'
                }
            });
        });
        it('공고가 없으면 빈 배열', async ()=>{
            mockPrisma.jobPost.findMany.mockResolvedValue([]);
            const result = await service.findByUser('u1');
            expect(result).toEqual([]);
        });
    });
    // ──────────────────────────────────────────────────
    // create
    // ──────────────────────────────────────────────────
    describe('create', ()=>{
        it('리크루터가 공고 생성 성공', async ()=>{
            mockPrisma.user.findUnique.mockResolvedValue({
                id: 'u1',
                userType: 'recruiter',
                companyName: '네이버'
            });
            mockPrisma.jobPost.create.mockResolvedValue({
                id: 'j2',
                position: 'BE 개발자'
            });
            const result = await service.create('u1', {
                position: 'BE 개발자',
                company: '네이버'
            });
            expect(result.id).toBe('j2');
        });
        it('기업 회원이 공고 생성 성공', async ()=>{
            mockPrisma.user.findUnique.mockResolvedValue({
                id: 'u1',
                userType: 'company',
                companyName: '카카오'
            });
            mockPrisma.jobPost.create.mockResolvedValue({
                id: 'j3',
                position: 'PM'
            });
            const result = await service.create('u1', {
                position: 'PM'
            });
            expect(result.id).toBe('j3');
        });
        it('개인 회원이 공고 생성 → ForbiddenException', async ()=>{
            mockPrisma.user.findUnique.mockResolvedValue({
                id: 'u1',
                userType: 'personal'
            });
            await expect(service.create('u1', {
                position: 'FE'
            })).rejects.toThrow(_common.ForbiddenException);
            await expect(service.create('u1', {
                position: 'FE'
            })).rejects.toThrow('채용 공고는 리크루터 또는 기업 회원만 등록할 수 있습니다');
            expect(mockPrisma.jobPost.create).not.toHaveBeenCalled();
        });
        it('존재하지 않는 사용자 → ForbiddenException', async ()=>{
            mockPrisma.user.findUnique.mockResolvedValue(null);
            await expect(service.create('fake', {
                position: 'FE'
            })).rejects.toThrow(_common.ForbiddenException);
        });
        it('company 미입력 시 user.companyName 사용', async ()=>{
            mockPrisma.user.findUnique.mockResolvedValue({
                id: 'u1',
                userType: 'recruiter',
                companyName: '라인'
            });
            mockPrisma.jobPost.create.mockResolvedValue({
                id: 'j4'
            });
            await service.create('u1', {
                position: 'SWE'
            });
            expect(mockPrisma.jobPost.create).toHaveBeenCalledWith({
                data: expect.objectContaining({
                    company: '라인'
                })
            });
        });
        it('필드 미입력 시 기본값 적용', async ()=>{
            mockPrisma.user.findUnique.mockResolvedValue({
                id: 'u1',
                userType: 'recruiter',
                companyName: ''
            });
            mockPrisma.jobPost.create.mockResolvedValue({
                id: 'j5'
            });
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
                    status: 'active'
                })
            });
        });
        it('type과 status 커스텀 값', async ()=>{
            mockPrisma.user.findUnique.mockResolvedValue({
                id: 'u1',
                userType: 'company',
                companyName: '쿠팡'
            });
            mockPrisma.jobPost.create.mockResolvedValue({
                id: 'j6'
            });
            await service.create('u1', {
                position: '인턴',
                type: 'intern',
                status: 'draft'
            });
            expect(mockPrisma.jobPost.create).toHaveBeenCalledWith({
                data: expect.objectContaining({
                    type: 'intern',
                    status: 'draft'
                })
            });
        });
    });
    // ──────────────────────────────────────────────────
    // update
    // ──────────────────────────────────────────────────
    describe('update', ()=>{
        it('소유자가 공고 수정 성공', async ()=>{
            mockPrisma.jobPost.findUnique.mockResolvedValue(mockJob);
            mockPrisma.jobPost.update.mockResolvedValue({
                ...mockJob,
                position: '시니어 FE'
            });
            const result = await service.update('j1', 'u1', {
                position: '시니어 FE'
            });
            expect(result.position).toBe('시니어 FE');
            expect(mockPrisma.jobPost.update).toHaveBeenCalledWith({
                where: {
                    id: 'j1'
                },
                data: {
                    position: '시니어 FE'
                }
            });
        });
        it('다른 사용자가 수정 → ForbiddenException', async ()=>{
            mockPrisma.jobPost.findUnique.mockResolvedValue(mockJob);
            await expect(service.update('j1', 'u2', {
                position: 'hack'
            })).rejects.toThrow(_common.ForbiddenException);
            expect(mockPrisma.jobPost.update).not.toHaveBeenCalled();
        });
        it('없는 공고 수정 → NotFoundException', async ()=>{
            mockPrisma.jobPost.findUnique.mockResolvedValue(null);
            await expect(service.update('fake', 'u1', {})).rejects.toThrow(_common.NotFoundException);
        });
    });
    // ──────────────────────────────────────────────────
    // remove
    // ──────────────────────────────────────────────────
    describe('remove', ()=>{
        it('소유자가 공고 삭제 성공', async ()=>{
            mockPrisma.jobPost.findUnique.mockResolvedValue(mockJob);
            mockPrisma.jobPost.delete.mockResolvedValue({});
            const result = await service.remove('j1', 'u1');
            expect(result).toEqual({
                success: true
            });
            expect(mockPrisma.jobPost.delete).toHaveBeenCalledWith({
                where: {
                    id: 'j1'
                }
            });
        });
        it('다른 사용자가 삭제 → ForbiddenException', async ()=>{
            mockPrisma.jobPost.findUnique.mockResolvedValue(mockJob);
            await expect(service.remove('j1', 'u2')).rejects.toThrow(_common.ForbiddenException);
            expect(mockPrisma.jobPost.delete).not.toHaveBeenCalled();
        });
        it('admin이 타인 공고 삭제 가능', async ()=>{
            mockPrisma.jobPost.findUnique.mockResolvedValue(mockJob);
            mockPrisma.jobPost.delete.mockResolvedValue({});
            const result = await service.remove('j1', 'u2', 'admin');
            expect(result).toEqual({
                success: true
            });
        });
        it('superadmin이 타인 공고 삭제 가능', async ()=>{
            mockPrisma.jobPost.findUnique.mockResolvedValue(mockJob);
            mockPrisma.jobPost.delete.mockResolvedValue({});
            const result = await service.remove('j1', 'u2', 'superadmin');
            expect(result).toEqual({
                success: true
            });
        });
        it('없는 공고 삭제 → NotFoundException', async ()=>{
            mockPrisma.jobPost.findUnique.mockResolvedValue(null);
            await expect(service.remove('fake', 'u1')).rejects.toThrow(_common.NotFoundException);
        });
        it('일반 사용자(role=user)가 타인 공고 삭제 → ForbiddenException', async ()=>{
            mockPrisma.jobPost.findUnique.mockResolvedValue(mockJob);
            await expect(service.remove('j1', 'u2', 'user')).rejects.toThrow(_common.ForbiddenException);
        });
    });
    describe('getJobStats', ()=>{
        it('통계 반환 (기업별, 지역별, 유형별)', async ()=>{
            mockPrisma.jobPost.findMany.mockResolvedValue([
                {
                    company: '네이버',
                    position: 'FE',
                    location: '서울 분당',
                    type: 'full_time',
                    skills: 'React,TypeScript',
                    salary: '5000',
                    createdAt: new Date()
                },
                {
                    company: '네이버',
                    position: 'BE',
                    location: '서울 분당',
                    type: 'full_time',
                    skills: 'Java,Spring',
                    salary: '6000',
                    createdAt: new Date()
                },
                {
                    company: '카카오',
                    position: 'FE',
                    location: '서울 판교',
                    type: 'contract',
                    skills: 'React,Vue',
                    salary: '4500',
                    createdAt: new Date()
                }
            ]);
            const result = await service.getJobStats();
            expect(result.total).toBe(3);
            expect(result.byCompany[0].name).toBe('네이버');
            expect(result.byCompany[0].count).toBe(2);
            expect(result.byLocation.length).toBeGreaterThan(0);
            expect(result.byType.length).toBeGreaterThan(0);
            expect(result.bySkill.length).toBeGreaterThan(0);
        });
        it('빈 결과', async ()=>{
            mockPrisma.jobPost.findMany.mockResolvedValue([]);
            const result = await service.getJobStats();
            expect(result.total).toBe(0);
            expect(result.byCompany).toEqual([]);
        });
    });
});
