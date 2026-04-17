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
exports.StudyGroupsController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const auth_guard_1 = require("../auth/auth.guard");
const study_groups_service_1 = require("./study-groups.service");
let StudyGroupsController = class StudyGroupsController {
    service;
    constructor(service) {
        this.service = service;
    }
    findAll(req, q, companyName, jobPostId, jobKey, mine, page, limit) {
        return this.service.findAll({
            q,
            companyName,
            jobPostId,
            jobKey,
            mine: mine === 'true' || mine === '1',
            userId: req.user?.id,
            page: page ? parseInt(page, 10) : 1,
            limit: limit ? parseInt(limit, 10) : 20,
        });
    }
    create(body, req) {
        if (!req.user?.id)
            throw new common_1.UnauthorizedException('로그인이 필요합니다');
        return this.service.create(req.user.id, body);
    }
    findOne(id, req) {
        return this.service.findOne(id, req.user?.id);
    }
    join(id, req) {
        if (!req.user?.id)
            throw new common_1.UnauthorizedException('로그인이 필요합니다');
        return this.service.join(id, req.user.id);
    }
    leave(id, req) {
        if (!req.user?.id)
            throw new common_1.UnauthorizedException('로그인이 필요합니다');
        return this.service.leave(id, req.user.id);
    }
    remove(id, req) {
        if (!req.user?.id)
            throw new common_1.UnauthorizedException('로그인이 필요합니다');
        return this.service.remove(id, req.user.id, req.user?.role);
    }
    listQuestions(id, req) {
        return this.service.listQuestions(id, req.user?.id);
    }
    addQuestion(id, body, req) {
        if (!req.user?.id)
            throw new common_1.UnauthorizedException('로그인이 필요합니다');
        return this.service.addQuestion(id, req.user.id, body);
    }
};
exports.StudyGroupsController = StudyGroupsController;
__decorate([
    (0, common_1.Get)(),
    (0, auth_guard_1.Public)(),
    (0, swagger_1.ApiOperation)({ summary: '스터디 그룹 목록' }),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Query)('q')),
    __param(2, (0, common_1.Query)('companyName')),
    __param(3, (0, common_1.Query)('jobPostId')),
    __param(4, (0, common_1.Query)('jobKey')),
    __param(5, (0, common_1.Query)('mine')),
    __param(6, (0, common_1.Query)('page')),
    __param(7, (0, common_1.Query)('limit')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, String, String, String, String, String, String]),
    __metadata("design:returntype", void 0)
], StudyGroupsController.prototype, "findAll", null);
__decorate([
    (0, common_1.Post)(),
    (0, swagger_1.ApiOperation)({ summary: '스터디 그룹 생성' }),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", void 0)
], StudyGroupsController.prototype, "create", null);
__decorate([
    (0, common_1.Get)(':id'),
    (0, auth_guard_1.Public)(),
    (0, swagger_1.ApiOperation)({ summary: '스터디 그룹 상세' }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], StudyGroupsController.prototype, "findOne", null);
__decorate([
    (0, common_1.Post)(':id/join'),
    (0, swagger_1.ApiOperation)({ summary: '스터디 그룹 가입' }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], StudyGroupsController.prototype, "join", null);
__decorate([
    (0, common_1.Delete)(':id/leave'),
    (0, swagger_1.ApiOperation)({ summary: '스터디 그룹 탈퇴' }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], StudyGroupsController.prototype, "leave", null);
__decorate([
    (0, common_1.Delete)(':id'),
    (0, swagger_1.ApiOperation)({ summary: '스터디 그룹 삭제' }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], StudyGroupsController.prototype, "remove", null);
__decorate([
    (0, common_1.Get)(':id/questions'),
    (0, auth_guard_1.Public)(),
    (0, swagger_1.ApiOperation)({ summary: '스터디 그룹 질문 목록' }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], StudyGroupsController.prototype, "listQuestions", null);
__decorate([
    (0, common_1.Post)(':id/questions'),
    (0, swagger_1.ApiOperation)({ summary: '스터디 그룹 질문 추가' }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object, Object]),
    __metadata("design:returntype", void 0)
], StudyGroupsController.prototype, "addQuestion", null);
exports.StudyGroupsController = StudyGroupsController = __decorate([
    (0, swagger_1.ApiTags)('study-groups'),
    (0, common_1.Controller)('study-groups'),
    __metadata("design:paramtypes", [study_groups_service_1.StudyGroupsService])
], StudyGroupsController);
