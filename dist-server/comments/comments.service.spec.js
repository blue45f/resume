"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
const _testing = require("@nestjs/testing");
const _commentsservice = require("./comments.service");
const _prismaservice = require("../prisma/prisma.service");
const _notificationsservice = require("../notifications/notifications.service");
const _forbiddenwordsservice = require("../forbidden-words/forbidden-words.service");
const _common = require("@nestjs/common");
const mockPrisma = {
    resume: {
        findUnique: jest.fn()
    },
    comment: {
        findMany: jest.fn(),
        create: jest.fn(),
        findUnique: jest.fn(),
        delete: jest.fn()
    },
    user: {
        findUnique: jest.fn()
    }
};
const mockNotifications = {
    create: jest.fn()
};
const mockForbiddenWords = {
    validateOrThrow: jest.fn().mockResolvedValue({
        blocked: false,
        matched: [],
        warnings: []
    }),
    checkContent: jest.fn().mockResolvedValue({
        blocked: false,
        matched: [],
        warnings: []
    })
};
describe('CommentsService', ()=>{
    let service;
    beforeEach(async ()=>{
        const module = await _testing.Test.createTestingModule({
            providers: [
                _commentsservice.CommentsService,
                {
                    provide: _prismaservice.PrismaService,
                    useValue: mockPrisma
                },
                {
                    provide: _notificationsservice.NotificationsService,
                    useValue: mockNotifications
                },
                {
                    provide: _forbiddenwordsservice.ForbiddenWordsService,
                    useValue: mockForbiddenWords
                }
            ]
        }).compile();
        service = module.get(_commentsservice.CommentsService);
        jest.clearAllMocks();
    });
    describe('findByResume', ()=>{
        it('공개 이력서의 댓글 목록 반환', async ()=>{
            mockPrisma.resume.findUnique.mockResolvedValue({
                id: 'r1',
                visibility: 'public'
            });
            mockPrisma.comment.findMany.mockResolvedValue([
                {
                    id: 'c1',
                    content: '좋아요'
                }
            ]);
            const result = await service.findByResume('r1');
            expect(result).toHaveLength(1);
        });
        it('비공개 이력서 → NotFoundException', async ()=>{
            mockPrisma.resume.findUnique.mockResolvedValue({
                id: 'r1',
                visibility: 'private'
            });
            await expect(service.findByResume('r1')).rejects.toThrow(_common.NotFoundException);
        });
    });
    describe('create', ()=>{
        it('공개 이력서에 댓글 생성', async ()=>{
            mockPrisma.resume.findUnique.mockResolvedValue({
                id: 'r1',
                visibility: 'public'
            });
            mockPrisma.user.findUnique.mockResolvedValue({
                id: 'u1',
                name: '홍길동',
                email: ''
            });
            mockPrisma.comment.create.mockResolvedValue({
                id: 'c1',
                content: '좋은 이력서입니다'
            });
            const result = await service.create('r1', '좋은 이력서입니다', 'u1');
            expect(result.id).toBe('c1');
        });
        it('5자 미만 → ForbiddenException', async ()=>{
            mockPrisma.resume.findUnique.mockResolvedValue({
                id: 'r1',
                visibility: 'public'
            });
            await expect(service.create('r1', '짧음')).rejects.toThrow(_common.ForbiddenException);
        });
        it('500자 초과 → ForbiddenException', async ()=>{
            mockPrisma.resume.findUnique.mockResolvedValue({
                id: 'r1',
                visibility: 'public'
            });
            await expect(service.create('r1', 'a'.repeat(501))).rejects.toThrow(_common.ForbiddenException);
        });
    });
    describe('remove', ()=>{
        it('작성자가 삭제', async ()=>{
            mockPrisma.comment.findUnique.mockResolvedValue({
                id: 'c1',
                userId: 'u1'
            });
            mockPrisma.comment.delete.mockResolvedValue({});
            const result = await service.remove('c1', 'u1');
            expect(result).toEqual({
                success: true
            });
        });
        it('다른 사용자 → ForbiddenException', async ()=>{
            mockPrisma.comment.findUnique.mockResolvedValue({
                id: 'c1',
                userId: 'u1'
            });
            await expect(service.remove('c1', 'u2')).rejects.toThrow(_common.ForbiddenException);
        });
    });
});
