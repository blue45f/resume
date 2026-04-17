"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
const _testing = require("@nestjs/testing");
const _forbiddenwordsservice = require("./forbidden-words.service");
const _prismaservice = require("../prisma/prisma.service");
const _common = require("@nestjs/common");
const mockPrisma = {
    forbiddenWord: {
        findMany: jest.fn(),
        findUnique: jest.fn(),
        create: jest.fn(),
        createMany: jest.fn(),
        update: jest.fn(),
        delete: jest.fn(),
        deleteMany: jest.fn(),
        count: jest.fn(),
        groupBy: jest.fn()
    }
};
describe('ForbiddenWordsService', ()=>{
    let service;
    beforeEach(async ()=>{
        const module = await _testing.Test.createTestingModule({
            providers: [
                _forbiddenwordsservice.ForbiddenWordsService,
                {
                    provide: _prismaservice.PrismaService,
                    useValue: mockPrisma
                }
            ]
        }).compile();
        service = module.get(_forbiddenwordsservice.ForbiddenWordsService);
        jest.clearAllMocks();
    });
    describe('checkContent', ()=>{
        it('빈 텍스트는 통과', async ()=>{
            const result = await service.checkContent('');
            expect(result.blocked).toBe(false);
        });
        it('금칙어 포함 시 차단', async ()=>{
            mockPrisma.forbiddenWord.findMany.mockResolvedValue([
                {
                    word: '욕설',
                    category: 'profanity',
                    severity: 'block'
                }
            ]);
            service.invalidateCache();
            const result = await service.checkContent('이것은 욕설입니다');
            expect(result.blocked).toBe(true);
            expect(result.matched).toContain('욕설');
        });
        it('경고 금칙어는 차단하지 않음', async ()=>{
            mockPrisma.forbiddenWord.findMany.mockResolvedValue([
                {
                    word: '주의',
                    category: 'general',
                    severity: 'warn'
                }
            ]);
            service.invalidateCache();
            const result = await service.checkContent('주의해주세요');
            expect(result.blocked).toBe(false);
            expect(result.warnings).toContain('주의');
        });
    });
    describe('validateOrThrow', ()=>{
        it('차단 금칙어 포함 시 BadRequestException', async ()=>{
            mockPrisma.forbiddenWord.findMany.mockResolvedValue([
                {
                    word: '차단어',
                    category: 'general',
                    severity: 'block'
                }
            ]);
            service.invalidateCache();
            await expect(service.validateOrThrow('차단어 포함')).rejects.toThrow(_common.BadRequestException);
        });
    });
    describe('create', ()=>{
        it('새 금칙어 생성', async ()=>{
            mockPrisma.forbiddenWord.findUnique.mockResolvedValue(null);
            mockPrisma.forbiddenWord.create.mockResolvedValue({
                id: '1',
                word: 'test',
                category: 'general',
                severity: 'block'
            });
            const result = await service.create('test', 'general', 'block');
            expect(result.word).toBe('test');
        });
        it('중복 금칙어 → BadRequestException', async ()=>{
            mockPrisma.forbiddenWord.findUnique.mockResolvedValue({
                id: '1',
                word: 'test'
            });
            await expect(service.create('test', 'general', 'block')).rejects.toThrow(_common.BadRequestException);
        });
    });
    describe('getStats', ()=>{
        it('통계 반환', async ()=>{
            mockPrisma.forbiddenWord.count.mockResolvedValueOnce(10).mockResolvedValueOnce(8).mockResolvedValueOnce(6).mockResolvedValueOnce(2);
            const result = await service.getStats();
            expect(result).toEqual({
                total: 10,
                active: 8,
                blocked: 6,
                warned: 2
            });
        });
    });
});
