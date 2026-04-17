"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
Object.defineProperty(exports, "CommunityController", {
    enumerable: true,
    get: function() {
        return CommunityController;
    }
});
const _common = require("@nestjs/common");
const _platformexpress = require("@nestjs/platform-express");
const _swagger = require("@nestjs/swagger");
const _throttler = require("@nestjs/throttler");
const _authguard = require("../auth/auth.guard");
const _communityservice = require("./community.service");
const _cloudinary = require("cloudinary");
const _config = require("@nestjs/config");
function _ts_decorate(decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for(var i = decorators.length - 1; i >= 0; i--)if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
}
function _ts_metadata(k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
}
function _ts_param(paramIndex, decorator) {
    return function(target, key) {
        decorator(target, key, paramIndex);
    };
}
const MAX_ATTACH_SIZE = 20 * 1024 * 1024; // 20MB
const ALLOWED_ATTACH_TYPES = [
    'image/jpeg',
    'image/png',
    'image/gif',
    'image/webp',
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'text/plain'
];
let CommunityController = class CommunityController {
    getPosts(category, search, page = '1', limit = '20', showHidden, sort = 'recent', req) {
        const isAdmin = req?.user?.role === 'admin' || req?.user?.role === 'superadmin';
        const includeHidden = isAdmin && showHidden === 'true';
        return this.service.getPosts(category, search, parseInt(page), parseInt(limit), includeHidden, sort);
    }
    getPost(id, req) {
        return this.service.getPost(id, req.user?.id);
    }
    create(body, req) {
        if (!req.user?.id) return {
            error: '로그인이 필요합니다'
        };
        return this.service.createPost(req.user.id, body);
    }
    update(id, body, req) {
        if (!req.user?.id) return {
            error: '로그인이 필요합니다'
        };
        return this.service.updatePost(id, req.user.id, req.user.role || 'user', body);
    }
    delete(id, req) {
        if (!req.user?.id) return {
            error: '로그인이 필요합니다'
        };
        return this.service.deletePost(id, req.user.id, req.user.role || 'user');
    }
    toggleLike(id, req) {
        if (!req.user?.id) return {
            error: '로그인이 필요합니다'
        };
        return this.service.toggleLike(id, req.user.id);
    }
    getComments(id) {
        return this.service.getComments(id);
    }
    addComment(id, body, req) {
        return this.service.addComment(id, req.user?.id, body.content, body.authorName, body.parentId);
    }
    deleteComment(id, commentId, req) {
        if (!req.user?.id) return {
            error: '로그인이 필요합니다'
        };
        return this.service.deleteComment(commentId, req.user.id, req.user.role || 'user');
    }
    /** 파일 첨부 업로드 */ async uploadAttachment(file, req) {
        if (!req.user?.id) throw new _common.BadRequestException('로그인이 필요합니다');
        if (!file) throw new _common.BadRequestException('파일이 없습니다');
        if (!ALLOWED_ATTACH_TYPES.includes(file.mimetype)) {
            throw new _common.BadRequestException('허용되지 않는 파일 형식입니다');
        }
        if (this.useCloudinary) {
            const result = await new Promise((resolve, reject)=>{
                const stream = _cloudinary.v2.uploader.upload_stream({
                    folder: 'community_attachments',
                    resource_type: 'auto'
                }, (err, result)=>{
                    if (err) reject(err);
                    else resolve(result);
                });
                stream.end(file.buffer);
            });
            return {
                url: result.secure_url,
                name: file.originalname,
                size: file.size,
                type: file.mimetype
            };
        }
        // Cloudinary 없을 때: base64 data URL 반환 (개발용)
        const b64 = file.buffer.toString('base64');
        return {
            url: `data:${file.mimetype};base64,${b64}`,
            name: file.originalname,
            size: file.size,
            type: file.mimetype
        };
    }
    constructor(service, config){
        this.service = service;
        this.config = config;
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
_ts_decorate([
    (0, _common.Get)(),
    (0, _authguard.Public)(),
    (0, _swagger.ApiOperation)({
        summary: '커뮤니티 게시글 목록'
    }),
    _ts_param(0, (0, _common.Query)('category')),
    _ts_param(1, (0, _common.Query)('search')),
    _ts_param(2, (0, _common.Query)('page')),
    _ts_param(3, (0, _common.Query)('limit')),
    _ts_param(4, (0, _common.Query)('showHidden')),
    _ts_param(5, (0, _common.Query)('sort')),
    _ts_param(6, (0, _common.Req)()),
    _ts_metadata("design:type", Function),
    _ts_metadata("design:paramtypes", [
        String,
        String,
        void 0,
        void 0,
        String,
        void 0,
        Object
    ]),
    _ts_metadata("design:returntype", void 0)
], CommunityController.prototype, "getPosts", null);
_ts_decorate([
    (0, _common.Get)(':id'),
    (0, _authguard.Public)(),
    (0, _swagger.ApiOperation)({
        summary: '게시글 상세'
    }),
    _ts_param(0, (0, _common.Param)('id')),
    _ts_param(1, (0, _common.Req)()),
    _ts_metadata("design:type", Function),
    _ts_metadata("design:paramtypes", [
        String,
        Object
    ]),
    _ts_metadata("design:returntype", void 0)
], CommunityController.prototype, "getPost", null);
_ts_decorate([
    (0, _common.Post)(),
    (0, _throttler.Throttle)({
        short: {
            limit: 5,
            ttl: 60000
        }
    }),
    (0, _swagger.ApiOperation)({
        summary: '게시글 작성'
    }),
    _ts_param(0, (0, _common.Body)()),
    _ts_param(1, (0, _common.Req)()),
    _ts_metadata("design:type", Function),
    _ts_metadata("design:paramtypes", [
        Object,
        Object
    ]),
    _ts_metadata("design:returntype", void 0)
], CommunityController.prototype, "create", null);
_ts_decorate([
    (0, _common.Patch)(':id'),
    (0, _swagger.ApiOperation)({
        summary: '게시글 수정'
    }),
    _ts_param(0, (0, _common.Param)('id')),
    _ts_param(1, (0, _common.Body)()),
    _ts_param(2, (0, _common.Req)()),
    _ts_metadata("design:type", Function),
    _ts_metadata("design:paramtypes", [
        String,
        Object,
        Object
    ]),
    _ts_metadata("design:returntype", void 0)
], CommunityController.prototype, "update", null);
_ts_decorate([
    (0, _common.Delete)(':id'),
    (0, _swagger.ApiOperation)({
        summary: '게시글 삭제'
    }),
    _ts_param(0, (0, _common.Param)('id')),
    _ts_param(1, (0, _common.Req)()),
    _ts_metadata("design:type", Function),
    _ts_metadata("design:paramtypes", [
        String,
        Object
    ]),
    _ts_metadata("design:returntype", void 0)
], CommunityController.prototype, "delete", null);
_ts_decorate([
    (0, _common.Post)(':id/like'),
    (0, _throttler.Throttle)({
        short: {
            limit: 20,
            ttl: 60000
        }
    }),
    (0, _swagger.ApiOperation)({
        summary: '좋아요 토글'
    }),
    _ts_param(0, (0, _common.Param)('id')),
    _ts_param(1, (0, _common.Req)()),
    _ts_metadata("design:type", Function),
    _ts_metadata("design:paramtypes", [
        String,
        Object
    ]),
    _ts_metadata("design:returntype", void 0)
], CommunityController.prototype, "toggleLike", null);
_ts_decorate([
    (0, _common.Get)(':id/comments'),
    (0, _authguard.Public)(),
    (0, _swagger.ApiOperation)({
        summary: '댓글 목록'
    }),
    _ts_param(0, (0, _common.Param)('id')),
    _ts_metadata("design:type", Function),
    _ts_metadata("design:paramtypes", [
        String
    ]),
    _ts_metadata("design:returntype", void 0)
], CommunityController.prototype, "getComments", null);
_ts_decorate([
    (0, _common.Post)(':id/comments'),
    (0, _throttler.Throttle)({
        short: {
            limit: 10,
            ttl: 60000
        }
    }),
    (0, _swagger.ApiOperation)({
        summary: '댓글 작성'
    }),
    _ts_param(0, (0, _common.Param)('id')),
    _ts_param(1, (0, _common.Body)()),
    _ts_param(2, (0, _common.Req)()),
    _ts_metadata("design:type", Function),
    _ts_metadata("design:paramtypes", [
        String,
        Object,
        Object
    ]),
    _ts_metadata("design:returntype", void 0)
], CommunityController.prototype, "addComment", null);
_ts_decorate([
    (0, _common.Delete)(':id/comments/:commentId'),
    (0, _swagger.ApiOperation)({
        summary: '댓글 삭제'
    }),
    _ts_param(0, (0, _common.Param)('id')),
    _ts_param(1, (0, _common.Param)('commentId')),
    _ts_param(2, (0, _common.Req)()),
    _ts_metadata("design:type", Function),
    _ts_metadata("design:paramtypes", [
        String,
        String,
        Object
    ]),
    _ts_metadata("design:returntype", void 0)
], CommunityController.prototype, "deleteComment", null);
_ts_decorate([
    (0, _common.Post)('upload'),
    (0, _throttler.Throttle)({
        short: {
            limit: 10,
            ttl: 60000
        }
    }),
    (0, _swagger.ApiOperation)({
        summary: '커뮤니티 첨부파일 업로드'
    }),
    (0, _common.UseInterceptors)((0, _platformexpress.FileInterceptor)('file', {
        limits: {
            fileSize: MAX_ATTACH_SIZE
        }
    })),
    _ts_param(0, (0, _common.UploadedFile)()),
    _ts_param(1, (0, _common.Req)()),
    _ts_metadata("design:type", Function),
    _ts_metadata("design:paramtypes", [
        typeof Express === "undefined" || typeof Express.Multer === "undefined" || typeof Express.Multer.File === "undefined" ? Object : Express.Multer.File,
        Object
    ]),
    _ts_metadata("design:returntype", Promise)
], CommunityController.prototype, "uploadAttachment", null);
CommunityController = _ts_decorate([
    (0, _swagger.ApiTags)('community'),
    (0, _common.Controller)('community'),
    _ts_metadata("design:type", Function),
    _ts_metadata("design:paramtypes", [
        typeof _communityservice.CommunityService === "undefined" ? Object : _communityservice.CommunityService,
        typeof _config.ConfigService === "undefined" ? Object : _config.ConfigService
    ])
], CommunityController);
