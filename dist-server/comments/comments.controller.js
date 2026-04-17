"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
Object.defineProperty(exports, "CommentsController", {
    enumerable: true,
    get: function() {
        return CommentsController;
    }
});
const _common = require("@nestjs/common");
const _swagger = require("@nestjs/swagger");
const _throttler = require("@nestjs/throttler");
const _authguard = require("../auth/auth.guard");
const _commentsservice = require("./comments.service");
const _commentdto = require("./dto/comment.dto");
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
let CommentsController = class CommentsController {
    findAll(resumeId) {
        return this.service.findByResume(resumeId);
    }
    create(resumeId, dto, req) {
        return this.service.create(resumeId, dto.content, req.user?.id, dto.authorName, dto.parentId);
    }
    remove(commentId, req) {
        return this.service.remove(commentId, req.user?.id, req.user?.role);
    }
    constructor(service){
        this.service = service;
    }
};
_ts_decorate([
    (0, _common.Get)(),
    (0, _authguard.Public)(),
    (0, _swagger.ApiOperation)({
        summary: '이력서 의견 목록'
    }),
    _ts_param(0, (0, _common.Param)('resumeId')),
    _ts_metadata("design:type", Function),
    _ts_metadata("design:paramtypes", [
        String
    ]),
    _ts_metadata("design:returntype", void 0)
], CommentsController.prototype, "findAll", null);
_ts_decorate([
    (0, _common.Post)(),
    (0, _throttler.Throttle)({
        short: {
            limit: 5,
            ttl: 60000
        }
    }),
    (0, _swagger.ApiOperation)({
        summary: '의견 작성'
    }),
    _ts_param(0, (0, _common.Param)('resumeId')),
    _ts_param(1, (0, _common.Body)()),
    _ts_param(2, (0, _common.Req)()),
    _ts_metadata("design:type", Function),
    _ts_metadata("design:paramtypes", [
        String,
        typeof _commentdto.CreateCommentDto === "undefined" ? Object : _commentdto.CreateCommentDto,
        Object
    ]),
    _ts_metadata("design:returntype", void 0)
], CommentsController.prototype, "create", null);
_ts_decorate([
    (0, _common.Delete)(':commentId'),
    (0, _swagger.ApiOperation)({
        summary: '의견 삭제'
    }),
    _ts_param(0, (0, _common.Param)('commentId')),
    _ts_param(1, (0, _common.Req)()),
    _ts_metadata("design:type", Function),
    _ts_metadata("design:paramtypes", [
        String,
        Object
    ]),
    _ts_metadata("design:returntype", void 0)
], CommentsController.prototype, "remove", null);
CommentsController = _ts_decorate([
    (0, _swagger.ApiTags)('comments'),
    (0, _common.Controller)('resumes/:resumeId/comments'),
    _ts_metadata("design:type", Function),
    _ts_metadata("design:paramtypes", [
        typeof _commentsservice.CommentsService === "undefined" ? Object : _commentsservice.CommentsService
    ])
], CommentsController);
