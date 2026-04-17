"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
const _testing = require("@nestjs/testing");
const _versionsservice = require("./versions.service");
const _prismaservice = require("../prisma/prisma.service");
const _common = require("@nestjs/common");
const mockPrisma = {
    resumeVersion: {
        findMany: jest.fn(),
        findFirst: jest.fn()
    },
    resume: {
        update: jest.fn(),
        findUnique: jest.fn()
    },
    personalInfo: {
        upsert: jest.fn()
    },
    experience: {
        deleteMany: jest.fn(),
        createMany: jest.fn()
    },
    education: {
        deleteMany: jest.fn(),
        createMany: jest.fn()
    },
    skill: {
        deleteMany: jest.fn(),
        createMany: jest.fn()
    },
    project: {
        deleteMany: jest.fn(),
        createMany: jest.fn()
    },
    $transaction: jest.fn((fn)=>fn(mockPrisma))
};
// assertOwnership 기본 통과용 헬퍼 (소유자 없음 = 누구나 접근 가능)
function mockOwnershipPass(userId = null) {
    mockPrisma.resume.findUnique.mockResolvedValue({
        userId
    });
}
const mockSnapshot = JSON.stringify({
    title: '테스트 이력서',
    personalInfo: {
        name: '홍길동',
        email: 'test@test.com',
        phone: '',
        address: '',
        website: '',
        summary: ''
    },
    experiences: [
        {
            company: 'A사',
            position: '개발자',
            startDate: '2020-01-01',
            endDate: '',
            current: true,
            description: '개발'
        }
    ],
    educations: [],
    skills: [
        {
            category: 'FE',
            items: 'React'
        }
    ],
    projects: []
});
describe('VersionsService', ()=>{
    let service;
    beforeEach(async ()=>{
        const module = await _testing.Test.createTestingModule({
            providers: [
                _versionsservice.VersionsService,
                {
                    provide: _prismaservice.PrismaService,
                    useValue: mockPrisma
                }
            ]
        }).compile();
        service = module.get(_versionsservice.VersionsService);
        jest.clearAllMocks();
    });
    describe('findAll', ()=>{
        it('버전 목록 반환 (versionNumber DESC)', async ()=>{
            mockOwnershipPass();
            mockPrisma.resumeVersion.findMany.mockResolvedValue([
                {
                    id: 'v2',
                    versionNumber: 2,
                    description: '',
                    createdAt: new Date('2024-01-02')
                },
                {
                    id: 'v1',
                    versionNumber: 1,
                    description: '',
                    createdAt: new Date('2024-01-01')
                }
            ]);
            const result = await service.findAll('r1');
            expect(result).toHaveLength(2);
            expect(result[0].versionNumber).toBe(2);
            expect(typeof result[0].createdAt).toBe('string'); // ISO string
        });
        it('빈 버전 목록', async ()=>{
            mockOwnershipPass();
            mockPrisma.resumeVersion.findMany.mockResolvedValue([]);
            const result = await service.findAll('r1');
            expect(result).toEqual([]);
        });
        it('다른 사용자의 이력서 버전 조회 → ForbiddenException', async ()=>{
            mockPrisma.resume.findUnique.mockResolvedValue({
                userId: 'owner-1'
            });
            await expect(service.findAll('r1', 'other-user')).rejects.toThrow(_common.ForbiddenException);
        });
        it('존재하지 않는 이력서 → NotFoundException', async ()=>{
            mockPrisma.resume.findUnique.mockResolvedValue(null);
            await expect(service.findAll('missing')).rejects.toThrow(_common.NotFoundException);
        });
    });
    describe('findOne', ()=>{
        it('버전 상세 조회 (snapshot 파싱)', async ()=>{
            mockOwnershipPass();
            mockPrisma.resumeVersion.findFirst.mockResolvedValue({
                id: 'v1',
                resumeId: 'r1',
                versionNumber: 1,
                description: '',
                snapshot: mockSnapshot,
                createdAt: new Date()
            });
            const result = await service.findOne('r1', 'v1');
            expect(result.snapshot.title).toBe('테스트 이력서');
        });
        it('없는 버전 → NotFoundException', async ()=>{
            mockOwnershipPass();
            mockPrisma.resumeVersion.findFirst.mockResolvedValue(null);
            await expect(service.findOne('r1', 'fake')).rejects.toThrow(_common.NotFoundException);
        });
    });
    describe('restore', ()=>{
        it('없는 버전 복원 → NotFoundException', async ()=>{
            mockPrisma.resumeVersion.findFirst.mockResolvedValue(null);
            await expect(service.restore('r1', 'fake')).rejects.toThrow(_common.NotFoundException);
        });
        it('다른 사용자의 버전 복원 → ForbiddenException', async ()=>{
            mockPrisma.resumeVersion.findFirst.mockResolvedValue({
                id: 'v1',
                resumeId: 'r1',
                versionNumber: 1,
                snapshot: mockSnapshot,
                resume: {
                    userId: 'user-1'
                }
            });
            await expect(service.restore('r1', 'v1', 'other-user')).rejects.toThrow(_common.ForbiddenException);
        });
        it('소유자 없는 이력서 버전은 누구나 복원 가능', async ()=>{
            mockPrisma.resumeVersion.findFirst.mockResolvedValue({
                id: 'v1',
                resumeId: 'r1',
                versionNumber: 1,
                snapshot: mockSnapshot,
                resume: {
                    userId: null
                }
            });
            const result = await service.restore('r1', 'v1', 'any-user');
            expect(result).toEqual({
                success: true,
                restoredVersion: 1
            });
        });
        it('손상된 snapshot JSON → BadRequestException', async ()=>{
            mockPrisma.resumeVersion.findFirst.mockResolvedValue({
                id: 'v1',
                resumeId: 'r1',
                versionNumber: 1,
                snapshot: '{invalid json',
                resume: {
                    userId: null
                }
            });
            await expect(service.restore('r1', 'v1')).rejects.toThrow(_common.BadRequestException);
        });
        it('소유자의 정상 복원', async ()=>{
            mockPrisma.resumeVersion.findFirst.mockResolvedValue({
                id: 'v1',
                resumeId: 'r1',
                versionNumber: 3,
                snapshot: mockSnapshot,
                resume: {
                    userId: 'user-1'
                }
            });
            const result = await service.restore('r1', 'v1', 'user-1');
            expect(result).toEqual({
                success: true,
                restoredVersion: 3
            });
            expect(mockPrisma.$transaction).toHaveBeenCalled();
        });
        it('복원 시 resume title 업데이트', async ()=>{
            mockPrisma.resumeVersion.findFirst.mockResolvedValue({
                id: 'v1',
                resumeId: 'r1',
                versionNumber: 1,
                snapshot: mockSnapshot,
                resume: {
                    userId: null
                }
            });
            await service.restore('r1', 'v1');
            expect(mockPrisma.resume.update).toHaveBeenCalledWith({
                where: {
                    id: 'r1'
                },
                data: {
                    title: '테스트 이력서'
                }
            });
        });
        it('복원 시 personalInfo upsert 호출', async ()=>{
            mockPrisma.resumeVersion.findFirst.mockResolvedValue({
                id: 'v1',
                resumeId: 'r1',
                versionNumber: 1,
                snapshot: mockSnapshot,
                resume: {
                    userId: null
                }
            });
            await service.restore('r1', 'v1');
            expect(mockPrisma.personalInfo.upsert).toHaveBeenCalled();
            const upsertCall = mockPrisma.personalInfo.upsert.mock.calls[0][0];
            expect(upsertCall.where).toEqual({
                resumeId: 'r1'
            });
            expect(upsertCall.update.name).toBe('홍길동');
        });
        it('복원 시 기존 experiences/skills 삭제 후 재생성', async ()=>{
            mockPrisma.resumeVersion.findFirst.mockResolvedValue({
                id: 'v1',
                resumeId: 'r1',
                versionNumber: 1,
                snapshot: mockSnapshot,
                resume: {
                    userId: null
                }
            });
            await service.restore('r1', 'v1');
            expect(mockPrisma.experience.deleteMany).toHaveBeenCalledWith({
                where: {
                    resumeId: 'r1'
                }
            });
            expect(mockPrisma.experience.createMany).toHaveBeenCalled();
            expect(mockPrisma.skill.deleteMany).toHaveBeenCalledWith({
                where: {
                    resumeId: 'r1'
                }
            });
            expect(mockPrisma.skill.createMany).toHaveBeenCalled();
        });
        it('빈 컬렉션은 deleteMany만 호출하고 createMany 호출하지 않음', async ()=>{
            const emptySnapshot = JSON.stringify({
                title: '빈 이력서',
                personalInfo: {
                    name: '테스트'
                },
                experiences: [],
                educations: [],
                skills: [],
                projects: []
            });
            mockPrisma.resumeVersion.findFirst.mockResolvedValue({
                id: 'v1',
                resumeId: 'r1',
                versionNumber: 1,
                snapshot: emptySnapshot,
                resume: {
                    userId: null
                }
            });
            await service.restore('r1', 'v1');
            expect(mockPrisma.experience.deleteMany).toHaveBeenCalled();
            expect(mockPrisma.experience.createMany).not.toHaveBeenCalled();
            expect(mockPrisma.education.deleteMany).toHaveBeenCalled();
            expect(mockPrisma.education.createMany).not.toHaveBeenCalled();
        });
        it('personalInfo의 links 배열은 JSON 문자열로 변환', async ()=>{
            const snapshotWithLinks = JSON.stringify({
                title: '링크 이력서',
                personalInfo: {
                    name: '테스트',
                    links: [
                        {
                            label: 'GitHub',
                            url: 'https://github.com'
                        }
                    ]
                },
                experiences: [],
                educations: [],
                skills: [],
                projects: []
            });
            mockPrisma.resumeVersion.findFirst.mockResolvedValue({
                id: 'v1',
                resumeId: 'r1',
                versionNumber: 1,
                snapshot: snapshotWithLinks,
                resume: {
                    userId: null
                }
            });
            await service.restore('r1', 'v1');
            const upsertCall = mockPrisma.personalInfo.upsert.mock.calls[0][0];
            expect(typeof upsertCall.update.links).toBe('string');
            expect(JSON.parse(upsertCall.update.links)).toEqual([
                {
                    label: 'GitHub',
                    url: 'https://github.com'
                }
            ]);
        });
    });
    describe('findAll 정렬', ()=>{
        it('versionNumber 내림차순 정렬 호출', async ()=>{
            mockOwnershipPass();
            mockPrisma.resumeVersion.findMany.mockResolvedValue([]);
            await service.findAll('r1');
            expect(mockPrisma.resumeVersion.findMany).toHaveBeenCalledWith(expect.objectContaining({
                orderBy: {
                    versionNumber: 'desc'
                }
            }));
        });
        it('createdAt을 ISO 문자열로 변환', async ()=>{
            mockOwnershipPass();
            const date = new Date('2024-06-15T10:30:00Z');
            mockPrisma.resumeVersion.findMany.mockResolvedValue([
                {
                    id: 'v1',
                    versionNumber: 1,
                    description: '첫 버전',
                    createdAt: date
                }
            ]);
            const result = await service.findAll('r1');
            expect(result[0].createdAt).toBe(date.toISOString());
        });
    });
});
