"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
Object.defineProperty(exports, "AttachmentsService", {
    enumerable: true,
    get: function() {
        return AttachmentsService;
    }
});
const _common = require("@nestjs/common");
const _prismaservice = require("../prisma/prisma.service");
const _config = require("@nestjs/config");
const _crypto = require("crypto");
const _path = require("path");
const _cloudinary = require("cloudinary");
function _ts_decorate(decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for(var i = decorators.length - 1; i >= 0; i--)if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
}
function _ts_metadata(k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
}
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
const MAX_TOTAL_SIZE_PER_RESUME = 100 * 1024 * 1024; // 100MB
const MAX_FILES_PER_RESUME = 20;
const ALLOWED_TYPES = [
    'application/pdf',
    'image/jpeg',
    'image/png',
    'image/gif',
    'image/webp',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'application/vnd.ms-powerpoint',
    'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    'text/plain'
];
const ALLOWED_EXTENSIONS = [
    '.pdf',
    '.jpg',
    '.jpeg',
    '.png',
    '.gif',
    '.webp',
    '.doc',
    '.docx',
    '.xls',
    '.xlsx',
    '.ppt',
    '.pptx',
    '.txt'
];
let AttachmentsService = class AttachmentsService {
    async upload(resumeId, file, category, description) {
        const resume = await this.prisma.resume.findUnique({
            where: {
                id: resumeId
            },
            include: {
                attachments: {
                    select: {
                        size: true
                    }
                }
            }
        });
        if (!resume) throw new _common.NotFoundException('이력서를 찾을 수 없습니다');
        if (resume.attachments.length >= MAX_FILES_PER_RESUME) {
            throw new _common.BadRequestException(`이력서당 최대 ${MAX_FILES_PER_RESUME}개의 파일만 업로드할 수 있습니다`);
        }
        const totalSize = resume.attachments.reduce((sum, a)=>sum + a.size, 0);
        if (totalSize + file.size > MAX_TOTAL_SIZE_PER_RESUME) {
            throw new _common.BadRequestException('이력서의 총 파일 크기가 100MB를 초과할 수 없습니다');
        }
        if (file.size > MAX_FILE_SIZE) {
            throw new _common.BadRequestException('파일 크기는 10MB 이하여야 합니다');
        }
        if (!ALLOWED_TYPES.includes(file.mimetype)) {
            throw new _common.BadRequestException('허용되지 않는 파일 형식입니다');
        }
        const ext = (0, _path.extname)(file.originalname).toLowerCase();
        if (!ALLOWED_EXTENSIONS.includes(ext)) {
            throw new _common.BadRequestException('허용되지 않는 파일 확장자입니다');
        }
        // Multer는 파일명을 Latin1로 인코딩 → UTF-8로 복원
        const originalName = Buffer.from(file.originalname, 'latin1').toString('utf8');
        const filename = `${(0, _crypto.randomUUID)()}${ext}`;
        let data = null;
        let cloudinaryUrl = null;
        if (this.useCloudinary) {
            // Cloudinary에 업로드 (raw 타입으로 문서도 지원)
            const result = await new Promise((resolve, reject)=>{
                const stream = _cloudinary.v2.uploader.upload_stream({
                    resource_type: 'raw',
                    folder: `resume-attachments/${resumeId}`,
                    public_id: filename
                }, (error, result)=>{
                    if (error) reject(error);
                    else resolve(result);
                });
                stream.end(file.buffer);
            });
            cloudinaryUrl = result.secure_url;
        } else {
            // Cloudinary 미설정: DB base64 저장 (폴백)
            data = file.buffer.toString('base64');
        }
        const attachment = await this.prisma.attachment.create({
            data: {
                resumeId,
                filename: cloudinaryUrl || filename,
                originalName,
                mimeType: file.mimetype,
                size: file.size,
                data,
                category: category || 'document',
                description: description || ''
            }
        });
        return this.format(attachment);
    }
    async findAll(resumeId) {
        const attachments = await this.prisma.attachment.findMany({
            where: {
                resumeId
            },
            orderBy: {
                createdAt: 'desc'
            },
            select: {
                id: true,
                resumeId: true,
                filename: true,
                originalName: true,
                mimeType: true,
                size: true,
                category: true,
                description: true,
                createdAt: true
            }
        });
        return attachments.map((a)=>this.format(a));
    }
    async getFileData(id, userId) {
        const attachment = await this.prisma.attachment.findUnique({
            where: {
                id
            },
            include: {
                resume: {
                    select: {
                        userId: true,
                        visibility: true
                    }
                }
            }
        });
        if (!attachment) throw new _common.NotFoundException('파일을 찾을 수 없습니다');
        if (attachment.resume.visibility === 'private' && attachment.resume.userId && attachment.resume.userId !== userId) {
            throw new _common.NotFoundException('파일을 찾을 수 없습니다');
        }
        // Cloudinary URL인 경우 리다이렉트
        if (attachment.filename.startsWith('http')) {
            return {
                redirectUrl: attachment.filename,
                originalName: attachment.originalName,
                mimeType: attachment.mimeType
            };
        }
        // DB base64 데이터
        return {
            data: attachment.data ? Buffer.from(attachment.data, 'base64') : null,
            originalName: attachment.originalName,
            mimeType: attachment.mimeType
        };
    }
    async remove(id) {
        const attachment = await this.prisma.attachment.findUnique({
            where: {
                id
            }
        });
        if (!attachment) throw new _common.NotFoundException('파일을 찾을 수 없습니다');
        await this.deleteFromCloudinary(attachment.filename);
        await this.prisma.attachment.delete({
            where: {
                id
            }
        });
        return {
            success: true
        };
    }
    /** 이력서 삭제 시 모든 첨부파일을 Cloudinary에서도 삭제 */ async removeAllByResume(resumeId) {
        if (!this.useCloudinary) return;
        const attachments = await this.prisma.attachment.findMany({
            where: {
                resumeId
            },
            select: {
                filename: true
            }
        });
        for (const att of attachments){
            await this.deleteFromCloudinary(att.filename);
        }
    }
    async deleteFromCloudinary(filename) {
        if (!this.useCloudinary || !filename.startsWith('http')) return;
        try {
            const parts = filename.split('/upload/');
            if (parts[1]) {
                const publicId = parts[1].replace(/^v\d+\//, '').replace(/\.[^.]+$/, '');
                const result = await _cloudinary.v2.uploader.destroy(publicId, {
                    resource_type: 'raw'
                });
                if (result.result !== 'ok') {
                    // 확장자 포함해서 재시도
                    const publicIdWithExt = parts[1].replace(/^v\d+\//, '');
                    await _cloudinary.v2.uploader.destroy(publicIdWithExt, {
                        resource_type: 'raw'
                    });
                }
            }
        } catch  {}
    }
    format(a) {
        const isCloudinary = a.filename?.startsWith('http');
        return {
            id: a.id,
            resumeId: a.resumeId,
            originalName: a.originalName,
            mimeType: a.mimeType,
            size: a.size,
            category: a.category,
            description: a.description,
            downloadUrl: isCloudinary ? a.filename : `/api/attachments/${a.id}/download`,
            createdAt: a.createdAt?.toISOString?.() || a.createdAt
        };
    }
    constructor(prisma, config){
        this.prisma = prisma;
        this.config = config;
        // Cloudinary 설정 (환경변수가 있으면 사용)
        const cloudName = this.config.get('CLOUDINARY_CLOUD_NAME');
        const apiKey = this.config.get('CLOUDINARY_API_KEY');
        const apiSecret = this.config.get('CLOUDINARY_API_SECRET');
        this.useCloudinary = !!(cloudName && apiKey && apiSecret);
        if (this.useCloudinary) {
            _cloudinary.v2.config({
                cloud_name: cloudName,
                api_key: apiKey,
                api_secret: apiSecret,
                secure: true
            });
        }
    }
};
AttachmentsService = _ts_decorate([
    (0, _common.Injectable)(),
    _ts_metadata("design:type", Function),
    _ts_metadata("design:paramtypes", [
        typeof _prismaservice.PrismaService === "undefined" ? Object : _prismaservice.PrismaService,
        typeof _config.ConfigService === "undefined" ? Object : _config.ConfigService
    ])
], AttachmentsService);
