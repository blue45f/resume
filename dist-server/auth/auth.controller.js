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
exports.AuthController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const auth_service_1 = require("./auth.service");
const auth_guard_1 = require("./auth.guard");
let AuthController = class AuthController {
    authService;
    constructor(authService) {
        this.authService = authService;
    }
    getProviders() {
        return this.authService.getAvailableProviders();
    }
    googleLogin(res) {
        res.redirect(this.authService.getGoogleAuthUrl());
    }
    async googleCallback(code, res) {
        try {
            const token = await this.authService.handleGoogleCallback(code);
            res.redirect(`${this.authService.getFrontendUrl()}/auth/callback?token=${token}`);
        }
        catch {
            res.redirect(`${this.authService.getFrontendUrl()}/login?error=google_failed`);
        }
    }
    githubLogin(res) {
        res.redirect(this.authService.getGithubAuthUrl());
    }
    async githubCallback(code, res) {
        try {
            const token = await this.authService.handleGithubCallback(code);
            res.redirect(`${this.authService.getFrontendUrl()}/auth/callback?token=${token}`);
        }
        catch {
            res.redirect(`${this.authService.getFrontendUrl()}/login?error=github_failed`);
        }
    }
    kakaoLogin(res) {
        res.redirect(this.authService.getKakaoAuthUrl());
    }
    async kakaoCallback(code, res) {
        try {
            const token = await this.authService.handleKakaoCallback(code);
            res.redirect(`${this.authService.getFrontendUrl()}/auth/callback?token=${token}`);
        }
        catch {
            res.redirect(`${this.authService.getFrontendUrl()}/login?error=kakao_failed`);
        }
    }
    getProfile(req) {
        if (!req.user)
            return null;
        return this.authService.getProfile(req.user.id);
    }
};
exports.AuthController = AuthController;
__decorate([
    (0, common_1.Get)('providers'),
    (0, auth_guard_1.Public)(),
    (0, swagger_1.ApiOperation)({ summary: '사용 가능한 소셜 로그인 프로바이더' }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], AuthController.prototype, "getProviders", null);
__decorate([
    (0, common_1.Get)('google'),
    (0, auth_guard_1.Public)(),
    (0, swagger_1.ApiOperation)({ summary: 'Google 로그인 리다이렉트' }),
    __param(0, (0, common_1.Res)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], AuthController.prototype, "googleLogin", null);
__decorate([
    (0, common_1.Get)('google/callback'),
    (0, auth_guard_1.Public)(),
    __param(0, (0, common_1.Query)('code')),
    __param(1, (0, common_1.Res)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], AuthController.prototype, "googleCallback", null);
__decorate([
    (0, common_1.Get)('github'),
    (0, auth_guard_1.Public)(),
    (0, swagger_1.ApiOperation)({ summary: 'GitHub 로그인 리다이렉트' }),
    __param(0, (0, common_1.Res)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], AuthController.prototype, "githubLogin", null);
__decorate([
    (0, common_1.Get)('github/callback'),
    (0, auth_guard_1.Public)(),
    __param(0, (0, common_1.Query)('code')),
    __param(1, (0, common_1.Res)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], AuthController.prototype, "githubCallback", null);
__decorate([
    (0, common_1.Get)('kakao'),
    (0, auth_guard_1.Public)(),
    (0, swagger_1.ApiOperation)({ summary: 'Kakao 로그인 리다이렉트' }),
    __param(0, (0, common_1.Res)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], AuthController.prototype, "kakaoLogin", null);
__decorate([
    (0, common_1.Get)('kakao/callback'),
    (0, auth_guard_1.Public)(),
    __param(0, (0, common_1.Query)('code')),
    __param(1, (0, common_1.Res)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], AuthController.prototype, "kakaoCallback", null);
__decorate([
    (0, common_1.Get)('me'),
    (0, swagger_1.ApiOperation)({ summary: '내 정보 조회' }),
    __param(0, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], AuthController.prototype, "getProfile", null);
exports.AuthController = AuthController = __decorate([
    (0, swagger_1.ApiTags)('auth'),
    (0, common_1.Controller)('auth'),
    __metadata("design:paramtypes", [auth_service_1.AuthService])
], AuthController);
