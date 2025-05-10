"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const testing_1 = require("@nestjs/testing");
const attachments_service_1 = require("./attachments.service");
const prisma_service_1 = require("../prisma/prisma.service");
const common_1 = require("@nestjs/common");
jest.mock('fs/promises', () => ({
    writeFile: jest.fn().mockResolvedValue(undefined),
    unlink: jest.fn().mockResolvedValue(undefined),
    mkdir: jest.fn().mockResolvedValue(undefined),
}));
jest.mock('fs', () => ({
    existsSync: jest.fn().mockReturnValue(true),
}));
const mockAttachment = {
    id: 'att-1',
    resumeId: 'resume-1',
    filename: 'abc-uuid.pdf',
    originalName: '이력서.pdf',
    mimeType: 'application/pdf',
    size: 1024,
    category: 'document',
    description: '첨부파일',
    createdAt: new Date('2024-01-01T00:00:00Z'),
};
const mockResume = {
    id: 'resume-1',
    userId: 'user-1',
    attachments: [],
};
const mockPrisma = {
    resume: {
        findUnique: jest.fn(),
    },
    attachment: {
        findMany: jest.fn(),
        findUnique: jest.fn(),
        create: jest.fn(),
        delete: jest.fn(),
    },
};
const createMockFile = (overrides = {}) => ({
    fieldname: 'file',
    originalname: '이력서.pdf',
    encoding: '7bit',
    mimetype: 'application/pdf',
    size: 1024,
    buffer: Buffer.from('test'),
    destination: '',
    filename: '',
    path: '',
    stream: null,
    ...overrides,
});
describe('AttachmentsService', () => {
    let service;
    beforeEach(async () => {
        const module = await testing_1.Test.createTestingModule({
            providers: [
                attachments_service_1.AttachmentsService,
                { provide: prisma_service_1.PrismaService, useValue: mockPrisma },
            ],
        }).compile();
        service = module.get(attachments_service_1.AttachmentsService);
        jest.clearAllMocks();
        const fs = require('fs');
        fs.existsSync.mockReturnValue(true);
    });
    describe('upload', () => {
        it('정상 파일 업로드 성공', async () => {
            mockPrisma.resume.findUnique.mockResolvedValue(mockResume);
            mockPrisma.attachment.create.mockResolvedValue(mockAttachment);
            const file = createMockFile();
            const result = await service.upload('resume-1', file, 'document', '첨부파일');
            expect(result.originalName).toBe('이력서.pdf');
            expect(result.downloadUrl).toBe('/api/attachments/att-1/download');
            expect(mockPrisma.attachment.create).toHaveBeenCalled();
        });
        it('파일 크기 초과 → BadRequestException', async () => {
            mockPrisma.resume.findUnique.mockResolvedValue(mockResume);
            const file = createMockFile({ size: 11 * 1024 * 1024 });
            await expect(service.upload('resume-1', file, 'document', ''))
                .rejects.toThrow(common_1.BadRequestException);
        });
        it('허용되지 않는 MIME 타입 → BadRequestException', async () => {
            mockPrisma.resume.findUnique.mockResolvedValue(mockResume);
            const file = createMockFile({
                mimetype: 'application/x-executable',
                originalname: 'malware.exe',
                size: 1024,
            });
            await expect(service.upload('resume-1', file, 'document', ''))
                .rejects.toThrow(common_1.BadRequestException);
        });
        it('허용되지 않는 확장자 → BadRequestException', async () => {
            mockPrisma.resume.findUnique.mockResolvedValue(mockResume);
            const file = createMockFile({
                mimetype: 'application/pdf',
                originalname: 'file.exe',
                size: 1024,
            });
            await expect(service.upload('resume-1', file, 'document', ''))
                .rejects.toThrow(common_1.BadRequestException);
        });
        it('존재하지 않는 이력서 → NotFoundException', async () => {
            mockPrisma.resume.findUnique.mockResolvedValue(null);
            const file = createMockFile();
            await expect(service.upload('fake', file, 'document', ''))
                .rejects.toThrow(common_1.NotFoundException);
        });
        it('이력서당 파일 개수 초과 → BadRequestException', async () => {
            const resumeWithMany = {
                ...mockResume,
                attachments: Array.from({ length: 20 }, (_, i) => ({ size: 100 })),
            };
            mockPrisma.resume.findUnique.mockResolvedValue(resumeWithMany);
            const file = createMockFile();
            await expect(service.upload('resume-1', file, 'document', ''))
                .rejects.toThrow(common_1.BadRequestException);
        });
        it('총 파일 크기 초과 → BadRequestException', async () => {
            const resumeWithLargeFiles = {
                ...mockResume,
                attachments: [{ size: 99 * 1024 * 1024 }],
            };
            mockPrisma.resume.findUnique.mockResolvedValue(resumeWithLargeFiles);
            const file = createMockFile({ size: 2 * 1024 * 1024 });
            await expect(service.upload('resume-1', file, 'document', ''))
                .rejects.toThrow(common_1.BadRequestException);
        });
    });
    describe('findAll', () => {
        it('이력서의 첨부파일 목록 반환', async () => {
            mockPrisma.attachment.findMany.mockResolvedValue([mockAttachment]);
            const result = await service.findAll('resume-1');
            expect(result).toHaveLength(1);
            expect(result[0].originalName).toBe('이력서.pdf');
            expect(result[0].downloadUrl).toContain('/api/attachments/');
        });
        it('첨부파일 없으면 빈 배열', async () => {
            mockPrisma.attachment.findMany.mockResolvedValue([]);
            const result = await service.findAll('resume-1');
            expect(result).toEqual([]);
        });
    });
    describe('getFilePath', () => {
        it('파일 경로 반환', async () => {
            mockPrisma.attachment.findUnique.mockResolvedValue({
                ...mockAttachment,
                resume: { userId: 'user-1', visibility: 'public' },
            });
            const result = await service.getFilePath('att-1', 'user-1');
            expect(result.originalName).toBe('이력서.pdf');
            expect(result.mimeType).toBe('application/pdf');
            expect(result.path).toContain('abc-uuid.pdf');
        });
        it('존재하지 않는 파일 → NotFoundException', async () => {
            mockPrisma.attachment.findUnique.mockResolvedValue(null);
            await expect(service.getFilePath('fake')).rejects.toThrow(common_1.NotFoundException);
        });
        it('비공개 이력서의 첨부파일 - 다른 사용자 → NotFoundException', async () => {
            mockPrisma.attachment.findUnique.mockResolvedValue({
                ...mockAttachment,
                resume: { userId: 'user-1', visibility: 'private' },
            });
            await expect(service.getFilePath('att-1', 'other-user')).rejects.toThrow(common_1.NotFoundException);
        });
    });
    describe('remove', () => {
        it('첨부파일 삭제 성공', async () => {
            mockPrisma.attachment.findUnique.mockResolvedValue(mockAttachment);
            mockPrisma.attachment.delete.mockResolvedValue(mockAttachment);
            const result = await service.remove('att-1');
            expect(result).toEqual({ success: true });
            expect(mockPrisma.attachment.delete).toHaveBeenCalledWith({ where: { id: 'att-1' } });
        });
        it('존재하지 않는 첨부파일 → NotFoundException', async () => {
            mockPrisma.attachment.findUnique.mockResolvedValue(null);
            await expect(service.remove('fake')).rejects.toThrow(common_1.NotFoundException);
        });
    });
});
