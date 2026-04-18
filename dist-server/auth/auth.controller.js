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
const throttler_1 = require("@nestjs/throttler");
const auth_service_1 = require("./auth.service");
const auth_guard_1 = require("./auth.guard");
const auth_dto_1 = require("./dto/auth.dto");
let AuthController = class AuthController {
    authService;
    constructor(authService) {
        this.authService = authService;
    }
    getProviders() {
        return this.authService.getAvailableProviders();
    }
    googleLogin(res) {
        const state = this.authService.generateOAuthState();
        res.redirect(this.authService.getGoogleAuthUrl(state));
    }
    async googleCallback(code, state, res) {
        try {
            if (!code || !this.authService.validateOAuthState(state)) {
                throw new Error('Invalid OAuth state or missing code');
            }
            const linkUserId = this.authService.extractLinkUserId(state);
            if (linkUserId) {
                const profile = await this.authService.getGoogleProfile(code);
                await this.authService.linkSocialAccount(linkUserId, 'google', profile.providerId, profile.avatar);
                res.redirect(`${this.authService.getFrontendUrl()}/settings?linked=google`);
                return;
            }
            const token = await this.authService.handleGoogleCallback(code);
            res.cookie('token', token, {
                httpOnly: true,
                secure: process.env.NODE_ENV === 'production',
                sameSite: 'lax',
                maxAge: 7 * 24 * 60 * 60 * 1000,
                path: '/',
            });
            res.redirect(`${this.authService.getFrontendUrl()}/auth/callback?token=${token}`);
        }
        catch {
            res.redirect(`${this.authService.getFrontendUrl()}/login?error=google_failed`);
        }
    }
    githubLogin(res) {
        const state = this.authService.generateOAuthState();
        res.redirect(this.authService.getGithubAuthUrl(state));
    }
    async githubCallback(code, state, res) {
        try {
            if (!code || !this.authService.validateOAuthState(state)) {
                throw new Error('Invalid OAuth state or missing code');
            }
            const linkUserId = this.authService.extractLinkUserId(state);
            if (linkUserId) {
                const profile = await this.authService.getGithubProfile(code);
                await this.authService.linkSocialAccount(linkUserId, 'github', profile.providerId, profile.avatar);
                res.redirect(`${this.authService.getFrontendUrl()}/settings?linked=github`);
                return;
            }
            const token = await this.authService.handleGithubCallback(code);
            res.cookie('token', token, {
                httpOnly: true,
                secure: process.env.NODE_ENV === 'production',
                sameSite: 'lax',
                maxAge: 7 * 24 * 60 * 60 * 1000,
                path: '/',
            });
            res.redirect(`${this.authService.getFrontendUrl()}/auth/callback?token=${token}`);
        }
        catch {
            res.redirect(`${this.authService.getFrontendUrl()}/login?error=github_failed`);
        }
    }
    kakaoLogin(res) {
        const state = this.authService.generateOAuthState();
        res.redirect(this.authService.getKakaoAuthUrl(state));
    }
    async kakaoCallback(code, state, res) {
        try {
            if (!code)
                throw new Error('Missing authorization code');
            if (state && !this.authService.validateOAuthState(state)) {
                throw new Error('Invalid OAuth state');
            }
            if (state) {
                const linkUserId = this.authService.extractLinkUserId(state);
                if (linkUserId) {
                    const profile = await this.authService.getKakaoProfile(code);
                    await this.authService.linkSocialAccount(linkUserId, 'kakao', profile.providerId, profile.avatar);
                    res.redirect(`${this.authService.getFrontendUrl()}/settings?linked=kakao`);
                    return;
                }
            }
            const token = await this.authService.handleKakaoCallback(code);
            res.cookie('token', token, {
                httpOnly: true,
                secure: process.env.NODE_ENV === 'production',
                sameSite: 'lax',
                maxAge: 7 * 24 * 60 * 60 * 1000,
                path: '/',
            });
            res.redirect(`${this.authService.getFrontendUrl()}/auth/callback?token=${token}`);
        }
        catch {
            res.redirect(`${this.authService.getFrontendUrl()}/login?error=kakao_failed`);
        }
    }
    async register(dto, res) {
        try {
            const token = await this.authService.register(dto.email, dto.password, dto.name, dto.userType, dto.companyName, dto.companyTitle, dto.marketingOptIn, dto.llmOptIn);
            res.cookie('token', token, {
                httpOnly: true,
                secure: process.env.NODE_ENV === 'production',
                sameSite: 'lax',
                maxAge: 7 * 24 * 60 * 60 * 1000,
                path: '/',
            });
            res.json({ token });
        }
        catch (e) {
            res.status(401).json({ message: e.message || '회원가입에 실패했습니다' });
        }
    }
    async login(dto, res) {
        try {
            const token = await this.authService.login(dto.email, dto.password);
            res.cookie('token', token, {
                httpOnly: true,
                secure: process.env.NODE_ENV === 'production',
                sameSite: 'lax',
                maxAge: 7 * 24 * 60 * 60 * 1000,
                path: '/',
            });
            res.json({ token });
        }
        catch (e) {
            res.status(401).json({ message: e.message || '로그인에 실패했습니다' });
        }
    }
    logout(res) {
        res.clearCookie('token', { path: '/' });
        res.json({ success: true });
    }
    async changePassword(dto, req, res) {
        try {
            if (!req.user?.id) {
                res.status(401).json({ message: '로그인이 필요합니다' });
                return;
            }
            await this.authService.changePassword(req.user.id, dto.currentPassword, dto.newPassword);
            res.json({ success: true, message: '비밀번호가 변경되었습니다' });
        }
        catch (e) {
            res.status(401).json({ message: e.message || '비밀번호 변경에 실패했습니다' });
        }
    }
    async deleteAccount(req, res) {
        try {
            if (!req.user?.id) {
                res.status(401).json({ message: '로그인이 필요합니다' });
                return;
            }
            await this.authService.deleteAccount(req.user.id);
            res.clearCookie('token', { path: '/' });
            res.json({ success: true, message: '계정이 삭제되었습니다' });
        }
        catch (e) {
            res.status(400).json({ message: e.message || '계정 삭제에 실패했습니다' });
        }
    }
    getLinkedAccounts(req) {
        if (!req.user?.id)
            return null;
        return this.authService.getLinkedAccounts(req.user.id);
    }
    linkSocial(provider, req, res) {
        if (!req.user?.id) {
            res.redirect(`${this.authService.getFrontendUrl()}/login`);
            return;
        }
        const state = this.authService.generateOAuthState() + '.' + req.user.id;
        switch (provider) {
            case 'google':
                res.redirect(this.authService.getGoogleAuthUrl(state));
                break;
            case 'github':
                res.redirect(this.authService.getGithubAuthUrl(state));
                break;
            case 'kakao':
                res.redirect(this.authService.getKakaoAuthUrl(state));
                break;
            default:
                res.status(400).json({ message: '지원하지 않는 프로바이더입니다' });
        }
    }
    getUserPortfolio(username) {
        return this.authService.getPublicPortfolio(username);
    }
    getProfile(req) {
        if (!req.user)
            return null;
        return this.authService.getProfile(req.user.id);
    }
    async updateProfile(body, req, res) {
        try {
            if (!req.user?.id) {
                res.status(401).json({ message: '로그인이 필요합니다' });
                return;
            }
            const updated = await this.authService.updateProfile(req.user.id, body);
            res.json(updated);
        }
        catch (e) {
            res.status(400).json({ message: e.message || '프로필 수정에 실패했습니다' });
        }
    }
    async getAllUsers(req, search) {
        if (req.user?.role !== 'admin' && req.user?.role !== 'superadmin')
            return [];
        return this.authService.getAllUsers(search);
    }
    async setUserRole(userId, role, req, res) {
        try {
            const result = await this.authService.setUserRole(req.user?.id, userId, role);
            res.json(result);
        }
        catch (e) {
            res.status(403).json({ message: e.message || '권한이 없습니다' });
        }
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
    __param(1, (0, common_1.Query)('state')),
    __param(2, (0, common_1.Res)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, Object]),
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
    __param(1, (0, common_1.Query)('state')),
    __param(2, (0, common_1.Res)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, Object]),
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
    __param(1, (0, common_1.Query)('state')),
    __param(2, (0, common_1.Res)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, Object]),
    __metadata("design:returntype", Promise)
], AuthController.prototype, "kakaoCallback", null);
__decorate([
    (0, common_1.Post)('register'),
    (0, auth_guard_1.Public)(),
    (0, throttler_1.Throttle)({ short: { limit: 3, ttl: 60000 } }),
    (0, swagger_1.ApiOperation)({ summary: '이메일 회원가입' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: '회원가입 성공, JWT 토큰 반환' }),
    (0, swagger_1.ApiResponse)({ status: 401, description: '중복 이메일 또는 유효성 검증 실패' }),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, common_1.Res)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [auth_dto_1.RegisterDto, Object]),
    __metadata("design:returntype", Promise)
], AuthController.prototype, "register", null);
__decorate([
    (0, common_1.Post)('login'),
    (0, auth_guard_1.Public)(),
    (0, throttler_1.Throttle)({ short: { limit: 5, ttl: 60000 } }),
    (0, swagger_1.ApiOperation)({ summary: '이메일 로그인' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: '로그인 성공, JWT 토큰 반환' }),
    (0, swagger_1.ApiResponse)({ status: 401, description: '이메일 또는 비밀번호 불일치' }),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, common_1.Res)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [auth_dto_1.LoginDto, Object]),
    __metadata("design:returntype", Promise)
], AuthController.prototype, "login", null);
__decorate([
    (0, common_1.Post)('logout'),
    (0, auth_guard_1.Public)(),
    (0, swagger_1.ApiOperation)({ summary: '로그아웃 (쿠키 삭제)' }),
    __param(0, (0, common_1.Res)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], AuthController.prototype, "logout", null);
__decorate([
    (0, common_1.Post)('change-password'),
    (0, swagger_1.ApiOperation)({ summary: '비밀번호 변경' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: '비밀번호 변경 성공' }),
    (0, swagger_1.ApiResponse)({ status: 401, description: '현재 비밀번호 불일치 또는 인증 필요' }),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, common_1.Req)()),
    __param(2, (0, common_1.Res)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [auth_dto_1.ChangePasswordDto, Object, Object]),
    __metadata("design:returntype", Promise)
], AuthController.prototype, "changePassword", null);
__decorate([
    (0, common_1.Delete)('account'),
    (0, swagger_1.ApiOperation)({ summary: '계정 삭제 (모든 데이터 영구 삭제)' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: '계정 삭제 완료' }),
    (0, swagger_1.ApiResponse)({ status: 401, description: '인증 필요' }),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Res)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], AuthController.prototype, "deleteAccount", null);
__decorate([
    (0, common_1.Get)('linked-accounts'),
    (0, swagger_1.ApiOperation)({ summary: '연결된 소셜 계정 정보' }),
    __param(0, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], AuthController.prototype, "getLinkedAccounts", null);
__decorate([
    (0, common_1.Get)('link/:provider'),
    (0, swagger_1.ApiOperation)({ summary: '소셜 계정 연동 시작' }),
    __param(0, (0, common_1.Param)('provider')),
    __param(1, (0, common_1.Req)()),
    __param(2, (0, common_1.Res)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object, Object]),
    __metadata("design:returntype", void 0)
], AuthController.prototype, "linkSocial", null);
__decorate([
    (0, common_1.Get)('u/:username'),
    (0, auth_guard_1.Public)(),
    (0, swagger_1.ApiOperation)({ summary: '공개 포트폴리오 페이지용 사용자 프로필 조회 (username)' }),
    __param(0, (0, common_1.Param)('username')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], AuthController.prototype, "getUserPortfolio", null);
__decorate([
    (0, common_1.Get)('me'),
    (0, swagger_1.ApiOperation)({ summary: '내 정보 조회' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: '프로필 정보 반환 (passwordHash 미포함)' }),
    (0, swagger_1.ApiResponse)({ status: 401, description: '인증 필요' }),
    __param(0, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], AuthController.prototype, "getProfile", null);
__decorate([
    (0, common_1.Patch)('profile'),
    (0, swagger_1.ApiOperation)({ summary: '프로필 수정 (userType, name 등)' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: '수정된 프로필 반환' }),
    (0, swagger_1.ApiResponse)({ status: 400, description: '유효하지 않은 사용자 유형 등' }),
    (0, swagger_1.ApiResponse)({ status: 401, description: '인증 필요' }),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, common_1.Req)()),
    __param(2, (0, common_1.Res)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [auth_dto_1.UpdateProfileDto, Object, Object]),
    __metadata("design:returntype", Promise)
], AuthController.prototype, "updateProfile", null);
__decorate([
    (0, common_1.Get)('admin/users'),
    (0, swagger_1.ApiOperation)({ summary: '전체 사용자 목록 (관리자)' }),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Query)('search')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", Promise)
], AuthController.prototype, "getAllUsers", null);
__decorate([
    (0, common_1.Post)('admin/users/:userId/role'),
    (0, swagger_1.ApiOperation)({ summary: '사용자 역할 변경 (관리자)' }),
    __param(0, (0, common_1.Param)('userId')),
    __param(1, (0, common_1.Body)('role')),
    __param(2, (0, common_1.Req)()),
    __param(3, (0, common_1.Res)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, Object, Object]),
    __metadata("design:returntype", Promise)
], AuthController.prototype, "setUserRole", null);
exports.AuthController = AuthController = __decorate([
    (0, swagger_1.ApiTags)('auth'),
    (0, common_1.Controller)('auth'),
    __metadata("design:paramtypes", [auth_service_1.AuthService])
], AuthController);
