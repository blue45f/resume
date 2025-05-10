"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AttachmentsService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
const crypto_1 = require("crypto");
const promises_1 = require("fs/promises");
const path_1 = require("path");
const fs_1 = require("fs");
const UPLOAD_DIR = (0, path_1.join)(process.cwd(), 'uploads');
const MAX_FILE_SIZE = 10 * 1024 * 1024;
const ALLOWED_TYPES = [
    'application/pdf',
    'image/jpeg', 'image/png', 'image/gif', 'image/webp',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'application/vnd.ms-powerpoint',
    'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    'text/plain',
];
let AttachmentsService = class AttachmentsService {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    async upload(resumeId, file, category, description) {
        const resume = await this.prisma.resume.findUnique({ where: { id: resumeId } });
        if (!resume)
            throw new common_1.NotFoundException('이력서를 찾을 수 없습니다');
        if (file.size > MAX_FILE_SIZE) {
            throw new Error('파일 크기는 10MB 이하여야 합니다');
        }
        if (!ALLOWED_TYPES.includes(file.mimetype)) {
            throw new Error('허용되지 않는 파일 형식입니다');
        }
        if (!(0, fs_1.existsSync)(UPLOAD_DIR)) {
            await (0, promises_1.mkdir)(UPLOAD_DIR, { recursive: true });
        }
        const ext = file.originalname.split('.').pop() || '';
        const filename = `${(0, crypto_1.randomUUID)()}.${ext}`;
        await (0, promises_1.writeFile)((0, path_1.join)(UPLOAD_DIR, filename), file.buffer);
        const attachment = await this.prisma.attachment.create({
            data: {
                resumeId,
                filename,
                originalName: file.originalname,
                mimeType: file.mimetype,
                size: file.size,
                category: category || 'document',
                description: description || '',
            },
        });
        return this.format(attachment);
    }
    async findAll(resumeId) {
        const attachments = await this.prisma.attachment.findMany({
            where: { resumeId },
            orderBy: { createdAt: 'desc' },
        });
        return attachments.map(a => this.format(a));
    }
    async getFilePath(id) {
        const attachment = await this.prisma.attachment.findUnique({ where: { id } });
        if (!attachment)
            throw new common_1.NotFoundException('파일을 찾을 수 없습니다');
        return {
            path: (0, path_1.join)(UPLOAD_DIR, attachment.filename),
            originalName: attachment.originalName,
            mimeType: attachment.mimeType,
        };
    }
    async remove(id) {
        const attachment = await this.prisma.attachment.findUnique({ where: { id } });
        if (!attachment)
            throw new common_1.NotFoundException('파일을 찾을 수 없습니다');
        const filePath = (0, path_1.join)(UPLOAD_DIR, attachment.filename);
        try {
            await (0, promises_1.unlink)(filePath);
        }
        catch { }
        await this.prisma.attachment.delete({ where: { id } });
        return { success: true };
    }
    format(a) {
        return {
            id: a.id,
            resumeId: a.resumeId,
            originalName: a.originalName,
            mimeType: a.mimeType,
            size: a.size,
            category: a.category,
            description: a.description,
            downloadUrl: `/api/attachments/${a.id}/download`,
            createdAt: a.createdAt.toISOString(),
        };
    }
};
exports.AttachmentsService = AttachmentsService;
exports.AttachmentsService = AttachmentsService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], AttachmentsService);
