"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
const _testing = require("@nestjs/testing");
const _tagsservice = require("./tags.service");
const _prismaservice = require("../prisma/prisma.service");
const _common = require("@nestjs/common");
const mockPrisma = {
    tag: {
        findMany: jest.fn(),
        findUnique: jest.fn(),
        create: jest.fn(),
        delete: jest.fn()
    },
    tagsOnResumes: {
        create: jest.fn(),
        delete: jest.fn()
    }
};
describe('TagsService', ()=>{
    let service;
    beforeEach(async ()=>{
        const module = await _testing.Test.createTestingModule({
            providers: [
                _tagsservice.TagsService,
                {
                    provide: _prismaservice.PrismaService,
                    useValue: mockPrisma
                }
            ]
        }).compile();
        service = module.get(_tagsservice.TagsService);
        jest.clearAllMocks();
    });
    // ──────────────────────────────────────────────────
    // findAll
    // ──────────────────────────────────────────────────
    describe('findAll', ()=>{
        it('태그 목록 + resumeCount 반환', async ()=>{
            mockPrisma.tag.findMany.mockResolvedValue([
                {
                    id: 't1',
                    name: '개발',
                    color: '#3b82f6',
                    _count: {
                        resumes: 5
                    }
                },
                {
                    id: 't2',
                    name: '디자인',
                    color: '#ef4444',
                    _count: {
                        resumes: 0
                    }
                }
            ]);
            const result = await service.findAll();
            expect(result).toHaveLength(2);
            expect(result[0]).toEqual({
                id: 't1',
                name: '개발',
                color: '#3b82f6',
                resumeCount: 5
            });
            expect(result[1]).toEqual({
                id: 't2',
                name: '디자인',
                color: '#ef4444',
                resumeCount: 0
            });
        });
        it('빈 목록 반환', async ()=>{
            mockPrisma.tag.findMany.mockResolvedValue([]);
            const result = await service.findAll();
            expect(result).toEqual([]);
        });
        it('이름순 정렬 + _count include', async ()=>{
            mockPrisma.tag.findMany.mockResolvedValue([]);
            await service.findAll();
            expect(mockPrisma.tag.findMany).toHaveBeenCalledWith({
                include: {
                    _count: {
                        select: {
                            resumes: true
                        }
                    }
                },
                orderBy: {
                    name: 'asc'
                }
            });
        });
        it('_count.resumes를 resumeCount로 변환', async ()=>{
            mockPrisma.tag.findMany.mockResolvedValue([
                {
                    id: 't1',
                    name: 'React',
                    color: null,
                    _count: {
                        resumes: 42
                    }
                }
            ]);
            const result = await service.findAll();
            expect(result[0].resumeCount).toBe(42);
            // _count 프로퍼티는 변환 후 없어야 함
            expect(result[0]._count).toBeUndefined();
        });
    });
    // ──────────────────────────────────────────────────
    // create
    // ──────────────────────────────────────────────────
    describe('create', ()=>{
        it('새 태그 생성', async ()=>{
            mockPrisma.tag.findUnique.mockResolvedValue(null);
            mockPrisma.tag.create.mockResolvedValue({
                id: 't1',
                name: 'FE',
                color: '#000'
            });
            const result = await service.create({
                name: 'FE'
            });
            expect(result.name).toBe('FE');
        });
        it('중복 이름 → ConflictException', async ()=>{
            mockPrisma.tag.findUnique.mockResolvedValue({
                id: 't1',
                name: '개발'
            });
            await expect(service.create({
                name: '개발'
            })).rejects.toThrow(_common.ConflictException);
            await expect(service.create({
                name: '개발'
            })).rejects.toThrow('이미 존재하는 태그입니다');
            expect(mockPrisma.tag.create).not.toHaveBeenCalled();
        });
        it('color 포함 생성', async ()=>{
            mockPrisma.tag.findUnique.mockResolvedValue(null);
            mockPrisma.tag.create.mockResolvedValue({
                id: 't2',
                name: 'BE',
                color: '#10b981'
            });
            const result = await service.create({
                name: 'BE',
                color: '#10b981'
            });
            expect(result.color).toBe('#10b981');
        });
        it('userId 포함 생성', async ()=>{
            mockPrisma.tag.findUnique.mockResolvedValue(null);
            mockPrisma.tag.create.mockResolvedValue({
                id: 't3',
                name: '커스텀',
                color: null
            });
            await service.create({
                name: '커스텀'
            }, 'user-1');
            expect(mockPrisma.tag.create).toHaveBeenCalledWith({
                data: {
                    name: '커스텀',
                    userId: 'user-1'
                }
            });
        });
        it('userId 없으면 null로 저장', async ()=>{
            mockPrisma.tag.findUnique.mockResolvedValue(null);
            mockPrisma.tag.create.mockResolvedValue({
                id: 't4',
                name: '공용'
            });
            await service.create({
                name: '공용'
            });
            expect(mockPrisma.tag.create).toHaveBeenCalledWith({
                data: {
                    name: '공용',
                    userId: null
                }
            });
        });
        it('name으로 unique 체크', async ()=>{
            mockPrisma.tag.findUnique.mockResolvedValue(null);
            mockPrisma.tag.create.mockResolvedValue({
                id: 't5',
                name: 'DevOps'
            });
            await service.create({
                name: 'DevOps'
            });
            expect(mockPrisma.tag.findUnique).toHaveBeenCalledWith({
                where: {
                    name: 'DevOps'
                }
            });
        });
    });
    // ──────────────────────────────────────────────────
    // remove
    // ──────────────────────────────────────────────────
    describe('remove', ()=>{
        it('태그 삭제 성공 (userId 없는 공용 태그)', async ()=>{
            mockPrisma.tag.findUnique.mockResolvedValue({
                id: 't1',
                userId: null
            });
            mockPrisma.tag.delete.mockResolvedValue({});
            const result = await service.remove('t1');
            expect(result).toEqual({
                success: true
            });
            expect(mockPrisma.tag.delete).toHaveBeenCalledWith({
                where: {
                    id: 't1'
                }
            });
        });
        it('없는 태그 → NotFoundException', async ()=>{
            mockPrisma.tag.findUnique.mockResolvedValue(null);
            await expect(service.remove('fake')).rejects.toThrow(_common.NotFoundException);
            await expect(service.remove('fake')).rejects.toThrow('태그를 찾을 수 없습니다');
        });
        it('본인이 만든 태그 삭제 성공', async ()=>{
            mockPrisma.tag.findUnique.mockResolvedValue({
                id: 't1',
                userId: 'user-1'
            });
            mockPrisma.tag.delete.mockResolvedValue({});
            const result = await service.remove('t1', 'user-1');
            expect(result).toEqual({
                success: true
            });
        });
        it('다른 사용자의 태그 삭제 → ForbiddenException', async ()=>{
            mockPrisma.tag.findUnique.mockResolvedValue({
                id: 't1',
                userId: 'user-1'
            });
            await expect(service.remove('t1', 'user-2')).rejects.toThrow(_common.ForbiddenException);
            await expect(service.remove('t1', 'user-2')).rejects.toThrow('이 태그를 삭제할 권한이 없습니다');
            expect(mockPrisma.tag.delete).not.toHaveBeenCalled();
        });
        it('admin은 다른 사용자의 태그 삭제 가능', async ()=>{
            mockPrisma.tag.findUnique.mockResolvedValue({
                id: 't1',
                userId: 'user-1'
            });
            mockPrisma.tag.delete.mockResolvedValue({});
            const result = await service.remove('t1', 'user-2', 'admin');
            expect(result).toEqual({
                success: true
            });
        });
        it('superadmin도 다른 사용자의 태그 삭제 가능', async ()=>{
            mockPrisma.tag.findUnique.mockResolvedValue({
                id: 't1',
                userId: 'user-1'
            });
            mockPrisma.tag.delete.mockResolvedValue({});
            const result = await service.remove('t1', 'user-2', 'superadmin');
            expect(result).toEqual({
                success: true
            });
        });
        it('userId 없는 공용 태그는 일반 사용자도 삭제 가능', async ()=>{
            mockPrisma.tag.findUnique.mockResolvedValue({
                id: 't1',
                userId: null
            });
            mockPrisma.tag.delete.mockResolvedValue({});
            const result = await service.remove('t1', 'user-1', 'user');
            expect(result).toEqual({
                success: true
            });
        });
    });
    // ──────────────────────────────────────────────────
    // addTagToResume
    // ──────────────────────────────────────────────────
    describe('addTagToResume', ()=>{
        it('이력서에 태그 추가', async ()=>{
            mockPrisma.tagsOnResumes.create.mockResolvedValue({});
            const result = await service.addTagToResume('r1', 't1');
            expect(result).toEqual({
                success: true
            });
            expect(mockPrisma.tagsOnResumes.create).toHaveBeenCalledWith({
                data: {
                    resumeId: 'r1',
                    tagId: 't1'
                }
            });
        });
    });
    // ──────────────────────────────────────────────────
    // removeTagFromResume
    // ──────────────────────────────────────────────────
    describe('removeTagFromResume', ()=>{
        it('이력서에서 태그 제거', async ()=>{
            mockPrisma.tagsOnResumes.delete.mockResolvedValue({});
            const result = await service.removeTagFromResume('r1', 't1');
            expect(result).toEqual({
                success: true
            });
            expect(mockPrisma.tagsOnResumes.delete).toHaveBeenCalledWith({
                where: {
                    resumeId_tagId: {
                        resumeId: 'r1',
                        tagId: 't1'
                    }
                }
            });
        });
    });
});
