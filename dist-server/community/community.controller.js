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
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.CommunityController = void 0;
const common_1 = require("@nestjs/common");
const platform_express_1 = require("@nestjs/platform-express");
const swagger_1 = require("@nestjs/swagger");
const throttler_1 = require("@nestjs/throttler");
const auth_guard_1 = require("../auth/auth.guard");
const community_service_1 = require("./community.service");
const cloudinary_1 = require("cloudinary");
const config_1 = require("@nestjs/config");
const MAX_ATTACH_SIZE = 20 * 1024 * 1024;
const ALLOWED_ATTACH_TYPES = [
    'image/jpeg', 'image/png', 'image/gif', 'image/webp',
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'text/plain',
];
let CommunityController = class CommunityController {
    service;
    config;
    useCloudinary;
    constructor(service, config) {
        this.service = service;
        this.config = config;
        const cloudName = this.config.get('CLOUDINARY_CLOUD_NAME');
        const apiKey = this.config.get('CLOUDINARY_API_KEY');
        const apiSecret = this.config.get('CLOUDINARY_API_SECRET');
        this.useCloudinary = !!(cloudName && apiKey && apiSecret);
        if (this.useCloudinary) {
            cloudinary_1.v2.config({ cloud_name: cloudName, api_key: apiKey, api_secret: apiSecret, secure: true });
        }
    }
    getPosts(category, search, page = '1', limit = '20', showHidden, sort = 'recent', req) {
        const isAdmin = req?.user?.role === 'admin' || req?.user?.role === 'superadmin';
        const includeHidden = isAdmin && showHidden === 'true';
        return this.service.getPosts(category, search, parseInt(page), parseInt(limit), includeHidden, sort);
    }
    getPost(id, req) {
        return this.service.getPost(id, req.user?.id);
    }
    create(body, req) {
        if (!req.user?.id)
            return { error: '로그인이 필요합니다' };
        return this.service.createPost(req.user.id, body);
    }
    update(id, body, req) {
        if (!req.user?.id)
            return { error: '로그인이 필요합니다' };
        return this.service.updatePost(id, req.user.id, req.user.role || 'user', body);
    }
    delete(id, req) {
        if (!req.user?.id)
            return { error: '로그인이 필요합니다' };
        return this.service.deletePost(id, req.user.id, req.user.role || 'user');
    }
    toggleLike(id, req) {
        if (!req.user?.id)
            return { error: '로그인이 필요합니다' };
        return this.service.toggleLike(id, req.user.id);
    }
    getComments(id) {
        return this.service.getComments(id);
    }
    addComment(id, body, req) {
        return this.service.addComment(id, req.user?.id, body.content, body.authorName, body.parentId);
    }
    deleteComment(id, commentId, req) {
        if (!req.user?.id)
            return { error: '로그인이 필요합니다' };
        return this.service.deleteComment(commentId, req.user.id, req.user.role || 'user');
    }
    async uploadAttachment(file, req) {
        if (!req.user?.id)
            throw new common_1.BadRequestException('로그인이 필요합니다');
        if (!file)
            throw new common_1.BadRequestException('파일이 없습니다');
        if (!ALLOWED_ATTACH_TYPES.includes(file.mimetype)) {
            throw new common_1.BadRequestException('허용되지 않는 파일 형식입니다');
        }
        if (this.useCloudinary) {
            const result = await new Promise((resolve, reject) => {
                const stream = cloudinary_1.v2.uploader.upload_stream({ folder: 'community_attachments', resource_type: 'auto' }, (err, result) => { if (err)
                    reject(err);
                else
                    resolve(result); });
                stream.end(file.buffer);
            });
            return {
                url: result.secure_url,
                name: file.originalname,
                size: file.size,
                type: file.mimetype,
            };
        }
        const b64 = file.buffer.toString('base64');
        return {
            url: `data:${file.mimetype};base64,${b64}`,
            name: file.originalname,
            size: file.size,
            type: file.mimetype,
        };
    }
};
exports.CommunityController = CommunityController;
__decorate([
    (0, common_1.Get)(),
    (0, auth_guard_1.Public)(),
    (0, swagger_1.ApiOperation)({ summary: '커뮤니티 게시글 목록' }),
    __param(0, (0, common_1.Query)('category')),
    __param(1, (0, common_1.Query)('search')),
    __param(2, (0, common_1.Query)('page')),
    __param(3, (0, common_1.Query)('limit')),
    __param(4, (0, common_1.Query)('showHidden')),
    __param(5, (0, common_1.Query)('sort')),
    __param(6, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, Object, Object, String, Object, Object]),
    __metadata("design:returntype", void 0)
], CommunityController.prototype, "getPosts", null);
__decorate([
    (0, common_1.Get)(':id'),
    (0, auth_guard_1.Public)(),
    (0, swagger_1.ApiOperation)({ summary: '게시글 상세' }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], CommunityController.prototype, "getPost", null);
__decorate([
    (0, common_1.Post)(),
    (0, throttler_1.Throttle)({ short: { limit: 5, ttl: 60000 } }),
    (0, swagger_1.ApiOperation)({ summary: '게시글 작성' }),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", void 0)
], CommunityController.prototype, "create", null);
__decorate([
    (0, common_1.Patch)(':id'),
    (0, swagger_1.ApiOperation)({ summary: '게시글 수정' }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object, Object]),
    __metadata("design:returntype", void 0)
], CommunityController.prototype, "update", null);
__decorate([
    (0, common_1.Delete)(':id'),
    (0, swagger_1.ApiOperation)({ summary: '게시글 삭제' }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], CommunityController.prototype, "delete", null);
__decorate([
    (0, common_1.Post)(':id/like'),
    (0, throttler_1.Throttle)({ short: { limit: 20, ttl: 60000 } }),
    (0, swagger_1.ApiOperation)({ summary: '좋아요 토글' }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], CommunityController.prototype, "toggleLike", null);
__decorate([
    (0, common_1.Get)(':id/comments'),
    (0, auth_guard_1.Public)(),
    (0, swagger_1.ApiOperation)({ summary: '댓글 목록' }),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], CommunityController.prototype, "getComments", null);
__decorate([
    (0, common_1.Post)(':id/comments'),
    (0, throttler_1.Throttle)({ short: { limit: 10, ttl: 60000 } }),
    (0, swagger_1.ApiOperation)({ summary: '댓글 작성' }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object, Object]),
    __metadata("design:returntype", void 0)
], CommunityController.prototype, "addComment", null);
__decorate([
    (0, common_1.Delete)(':id/comments/:commentId'),
    (0, swagger_1.ApiOperation)({ summary: '댓글 삭제' }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Param)('commentId')),
    __param(2, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, Object]),
    __metadata("design:returntype", void 0)
], CommunityController.prototype, "deleteComment", null);
__decorate([
    (0, common_1.Post)('upload'),
    (0, throttler_1.Throttle)({ short: { limit: 10, ttl: 60000 } }),
    (0, swagger_1.ApiOperation)({ summary: '커뮤니티 첨부파일 업로드' }),
    (0, common_1.UseInterceptors)((0, platform_express_1.FileInterceptor)('file', { limits: { fileSize: MAX_ATTACH_SIZE } })),
    __param(0, (0, common_1.UploadedFile)()),
    __param(1, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], CommunityController.prototype, "uploadAttachment", null);
exports.CommunityController = CommunityController = __decorate([
    (0, swagger_1.ApiTags)('community'),
    (0, common_1.Controller)('community'),
    __metadata("design:paramtypes", [community_service_1.CommunityService,
        config_1.ConfigService])
], CommunityController);
