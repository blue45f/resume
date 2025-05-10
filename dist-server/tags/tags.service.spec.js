"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const testing_1 = require("@nestjs/testing");
const tags_service_1 = require("./tags.service");
const prisma_service_1 = require("../prisma/prisma.service");
const common_1 = require("@nestjs/common");
const mockPrisma = {
    tag: {
        findMany: jest.fn(),
        findUnique: jest.fn(),
        create: jest.fn(),
        delete: jest.fn(),
    },
    tagsOnResumes: {
        create: jest.fn(),
        delete: jest.fn(),
    },
};
describe('TagsService', () => {
    let service;
    beforeEach(async () => {
        const module = await testing_1.Test.createTestingModule({
            providers: [
                tags_service_1.TagsService,
                { provide: prisma_service_1.PrismaService, useValue: mockPrisma },
            ],
        }).compile();
        service = module.get(tags_service_1.TagsService);
        jest.clearAllMocks();
    });
    describe('findAll', () => {
        it('태그 목록 + resumeCount 반환', async () => {
            mockPrisma.tag.findMany.mockResolvedValue([
                { id: 't1', name: '개발', color: '#3b82f6', _count: { resumes: 5 } },
                { id: 't2', name: '디자인', color: '#ef4444', _count: { resumes: 0 } },
            ]);
            const result = await service.findAll();
            expect(result).toHaveLength(2);
            expect(result[0].resumeCount).toBe(5);
            expect(result[1].resumeCount).toBe(0);
        });
        it('빈 목록 반환', async () => {
            mockPrisma.tag.findMany.mockResolvedValue([]);
            const result = await service.findAll();
            expect(result).toEqual([]);
        });
    });
    describe('create', () => {
        it('새 태그 생성', async () => {
            mockPrisma.tag.findUnique.mockResolvedValue(null);
            mockPrisma.tag.create.mockResolvedValue({ id: 't1', name: 'FE', color: '#000' });
            const result = await service.create({ name: 'FE' });
            expect(result.name).toBe('FE');
        });
        it('중복 이름 → ConflictException', async () => {
            mockPrisma.tag.findUnique.mockResolvedValue({ id: 't1', name: '개발' });
            await expect(service.create({ name: '개발' })).rejects.toThrow(common_1.ConflictException);
        });
    });
    describe('remove', () => {
        it('태그 삭제 성공', async () => {
            mockPrisma.tag.findUnique.mockResolvedValue({ id: 't1' });
            mockPrisma.tag.delete.mockResolvedValue({});
            const result = await service.remove('t1');
            expect(result).toEqual({ success: true });
        });
        it('없는 태그 → NotFoundException', async () => {
            mockPrisma.tag.findUnique.mockResolvedValue(null);
            await expect(service.remove('fake')).rejects.toThrow(common_1.NotFoundException);
        });
    });
    describe('addTagToResume', () => {
        it('이력서에 태그 추가', async () => {
            mockPrisma.tagsOnResumes.create.mockResolvedValue({});
            const result = await service.addTagToResume('r1', 't1');
            expect(result).toEqual({ success: true });
            expect(mockPrisma.tagsOnResumes.create).toHaveBeenCalledWith({
                data: { resumeId: 'r1', tagId: 't1' },
            });
        });
    });
    describe('removeTagFromResume', () => {
        it('이력서에서 태그 제거', async () => {
            mockPrisma.tagsOnResumes.delete.mockResolvedValue({});
            const result = await service.removeTagFromResume('r1', 't1');
            expect(result).toEqual({ success: true });
        });
    });
});
