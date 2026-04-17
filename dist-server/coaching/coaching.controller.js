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
exports.CoachingController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const coaching_service_1 = require("./coaching.service");
let CoachingController = class CoachingController {
    service;
    constructor(service) {
        this.service = service;
    }
    listCoaches(specialty, minRate, maxRate) {
        return this.service.listCoaches({
            specialty,
            minRate: minRate ? Number(minRate) : undefined,
            maxRate: maxRate ? Number(maxRate) : undefined,
        });
    }
    getCoach(id) {
        return this.service.getCoach(id);
    }
    upsertCoachProfile(body, req) {
        if (!req.user?.id)
            throw new common_1.UnauthorizedException('로그인이 필요합니다');
        return this.service.upsertCoachProfile(req.user.id, body);
    }
    createSession(body, req) {
        if (!req.user?.id)
            throw new common_1.UnauthorizedException('로그인이 필요합니다');
        return this.service.createSession(req.user.id, body);
    }
    mySessions(req) {
        if (!req.user?.id)
            throw new common_1.UnauthorizedException('로그인이 필요합니다');
        return this.service.mySessions(req.user.id);
    }
    updateStatus(id, body, req) {
        if (!req.user?.id)
            throw new common_1.UnauthorizedException('로그인이 필요합니다');
        return this.service.updateStatus(id, req.user.id, body);
    }
    reviewSession(id, body, req) {
        if (!req.user?.id)
            throw new common_1.UnauthorizedException('로그인이 필요합니다');
        return this.service.reviewSession(id, req.user.id, body);
    }
};
exports.CoachingController = CoachingController;
__decorate([
    (0, common_1.Get)('coaches'),
    (0, swagger_1.ApiOperation)({ summary: '코치 목록' }),
    __param(0, (0, common_1.Query)('specialty')),
    __param(1, (0, common_1.Query)('minRate')),
    __param(2, (0, common_1.Query)('maxRate')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, String]),
    __metadata("design:returntype", void 0)
], CoachingController.prototype, "listCoaches", null);
__decorate([
    (0, common_1.Get)('coaches/:id'),
    (0, swagger_1.ApiOperation)({ summary: '코치 상세' }),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], CoachingController.prototype, "getCoach", null);
__decorate([
    (0, common_1.Post)('coach-profile'),
    (0, swagger_1.ApiOperation)({ summary: '코치 프로필 생성/수정' }),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", void 0)
], CoachingController.prototype, "upsertCoachProfile", null);
__decorate([
    (0, common_1.Post)('sessions'),
    (0, swagger_1.ApiOperation)({ summary: '코칭 세션 예약' }),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", void 0)
], CoachingController.prototype, "createSession", null);
__decorate([
    (0, common_1.Get)('sessions/my'),
    (0, swagger_1.ApiOperation)({ summary: '내 세션 목록 (클라이언트/코치 양쪽)' }),
    __param(0, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], CoachingController.prototype, "mySessions", null);
__decorate([
    (0, common_1.Patch)('sessions/:id/status'),
    (0, swagger_1.ApiOperation)({ summary: '세션 상태 변경' }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object, Object]),
    __metadata("design:returntype", void 0)
], CoachingController.prototype, "updateStatus", null);
__decorate([
    (0, common_1.Post)('sessions/:id/review'),
    (0, swagger_1.ApiOperation)({ summary: '세션 리뷰 및 평점 등록' }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object, Object]),
    __metadata("design:returntype", void 0)
], CoachingController.prototype, "reviewSession", null);
exports.CoachingController = CoachingController = __decorate([
    (0, swagger_1.ApiTags)('coaching'),
    (0, common_1.Controller)('coaching'),
    __metadata("design:paramtypes", [coaching_service_1.CoachingService])
], CoachingController);
