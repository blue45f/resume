"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
Object.defineProperty(exports, "AuthController", {
    enumerable: true,
    get: function() {
        return AuthController;
    }
});
const _common = require("@nestjs/common");
const _swagger = require("@nestjs/swagger");
const _throttler = require("@nestjs/throttler");
const _express = require("express");
const _authservice = require("./auth.service");
const _authguard = require("./auth.guard");
const _authdto = require("./dto/auth.dto");
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
let AuthController = class AuthController {
    getProviders() {
        return this.authService.getAvailableProviders();
    }
    // ---- Google ----
    googleLogin(res) {
        const state = this.authService.generateOAuthState();
        res.redirect(this.authService.getGoogleAuthUrl(state));
    }
    async googleCallback(code, state, res) {
        try {
            if (!code || !this.authService.validateOAuthState(state)) {
                throw new Error('Invalid OAuth state or missing code');
            }
            // Check if this is a link request (state contains userId)
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
                path: '/'
            });
            res.redirect(`${this.authService.getFrontendUrl()}/auth/callback?token=${token}`);
        } catch  {
            res.redirect(`${this.authService.getFrontendUrl()}/login?error=google_failed`);
        }
    }
    // ---- GitHub ----
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
                path: '/'
            });
            res.redirect(`${this.authService.getFrontendUrl()}/auth/callback?token=${token}`);
        } catch  {
            res.redirect(`${this.authService.getFrontendUrl()}/login?error=github_failed`);
        }
    }
    // ---- Kakao ----
    kakaoLogin(res) {
        const state = this.authService.generateOAuthState();
        res.redirect(this.authService.getKakaoAuthUrl(state));
    }
    async kakaoCallback(code, state, res) {
        try {
            // Kakao는 state 미전달 가능 → state 없으면 스킵
            if (!code) throw new Error('Missing authorization code');
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
                path: '/'
            });
            res.redirect(`${this.authService.getFrontendUrl()}/auth/callback?token=${token}`);
        } catch  {
            res.redirect(`${this.authService.getFrontendUrl()}/login?error=kakao_failed`);
        }
    }
    // ---- 이메일 회원가입/로그인 ----
    async register(dto, res) {
        try {
            const token = await this.authService.register(dto.email, dto.password, dto.name, dto.userType, dto.companyName, dto.companyTitle);
            res.cookie('token', token, {
                httpOnly: true,
                secure: process.env.NODE_ENV === 'production',
                sameSite: 'lax',
                maxAge: 7 * 24 * 60 * 60 * 1000,
                path: '/'
            });
            res.json({
                token
            });
        } catch (e) {
            res.status(401).json({
                message: e.message || '회원가입에 실패했습니다'
            });
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
                path: '/'
            });
            res.json({
                token
            });
        } catch (e) {
            res.status(401).json({
                message: e.message || '로그인에 실패했습니다'
            });
        }
    }
    // ---- 로그아웃 ----
    logout(res) {
        res.clearCookie('token', {
            path: '/'
        });
        res.json({
            success: true
        });
    }
    // ---- 비밀번호 변경 ----
    async changePassword(dto, req, res) {
        try {
            if (!req.user?.id) {
                res.status(401).json({
                    message: '로그인이 필요합니다'
                });
                return;
            }
            await this.authService.changePassword(req.user.id, dto.currentPassword, dto.newPassword);
            res.json({
                success: true,
                message: '비밀번호가 변경되었습니다'
            });
        } catch (e) {
            res.status(401).json({
                message: e.message || '비밀번호 변경에 실패했습니다'
            });
        }
    }
    // ---- 계정 삭제 ----
    async deleteAccount(req, res) {
        try {
            if (!req.user?.id) {
                res.status(401).json({
                    message: '로그인이 필요합니다'
                });
                return;
            }
            await this.authService.deleteAccount(req.user.id);
            res.clearCookie('token', {
                path: '/'
            });
            res.json({
                success: true,
                message: '계정이 삭제되었습니다'
            });
        } catch (e) {
            res.status(400).json({
                message: e.message || '계정 삭제에 실패했습니다'
            });
        }
    }
    // ---- 소셜 계정 연동 ----
    getLinkedAccounts(req) {
        if (!req.user?.id) return null;
        return this.authService.getLinkedAccounts(req.user.id);
    }
    linkSocial(provider, req, res) {
        if (!req.user?.id) {
            res.redirect(`${this.authService.getFrontendUrl()}/login`);
            return;
        }
        const state = this.authService.generateOAuthState() + '.' + req.user.id;
        switch(provider){
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
                res.status(400).json({
                    message: '지원하지 않는 프로바이더입니다'
                });
        }
    }
    // ---- 공개 포트폴리오 (username 조회) ----
    getUserPortfolio(username) {
        return this.authService.getPublicPortfolio(username);
    }
    // ---- 내 정보 ----
    getProfile(req) {
        if (!req.user) return null;
        return this.authService.getProfile(req.user.id);
    }
    async updateProfile(body, req, res) {
        try {
            if (!req.user?.id) {
                res.status(401).json({
                    message: '로그인이 필요합니다'
                });
                return;
            }
            const updated = await this.authService.updateProfile(req.user.id, body);
            res.json(updated);
        } catch (e) {
            res.status(400).json({
                message: e.message || '프로필 수정에 실패했습니다'
            });
        }
    }
    // ---- 관리자 기능 ----
    async getAllUsers(req, search) {
        if (req.user?.role !== 'admin' && req.user?.role !== 'superadmin') return [];
        return this.authService.getAllUsers(search);
    }
    async setUserRole(userId, role, req, res) {
        try {
            const result = await this.authService.setUserRole(req.user?.id, userId, role);
            res.json(result);
        } catch (e) {
            res.status(403).json({
                message: e.message || '권한이 없습니다'
            });
        }
    }
    constructor(authService){
        this.authService = authService;
    }
};
_ts_decorate([
    (0, _common.Get)('providers'),
    (0, _authguard.Public)(),
    (0, _swagger.ApiOperation)({
        summary: '사용 가능한 소셜 로그인 프로바이더'
    }),
    _ts_metadata("design:type", Function),
    _ts_metadata("design:paramtypes", []),
    _ts_metadata("design:returntype", void 0)
], AuthController.prototype, "getProviders", null);
_ts_decorate([
    (0, _common.Get)('google'),
    (0, _authguard.Public)(),
    (0, _swagger.ApiOperation)({
        summary: 'Google 로그인 리다이렉트'
    }),
    _ts_param(0, (0, _common.Res)()),
    _ts_metadata("design:type", Function),
    _ts_metadata("design:paramtypes", [
        typeof _express.Response === "undefined" ? Object : _express.Response
    ]),
    _ts_metadata("design:returntype", void 0)
], AuthController.prototype, "googleLogin", null);
_ts_decorate([
    (0, _common.Get)('google/callback'),
    (0, _authguard.Public)(),
    _ts_param(0, (0, _common.Query)('code')),
    _ts_param(1, (0, _common.Query)('state')),
    _ts_param(2, (0, _common.Res)()),
    _ts_metadata("design:type", Function),
    _ts_metadata("design:paramtypes", [
        String,
        String,
        typeof _express.Response === "undefined" ? Object : _express.Response
    ]),
    _ts_metadata("design:returntype", Promise)
], AuthController.prototype, "googleCallback", null);
_ts_decorate([
    (0, _common.Get)('github'),
    (0, _authguard.Public)(),
    (0, _swagger.ApiOperation)({
        summary: 'GitHub 로그인 리다이렉트'
    }),
    _ts_param(0, (0, _common.Res)()),
    _ts_metadata("design:type", Function),
    _ts_metadata("design:paramtypes", [
        typeof _express.Response === "undefined" ? Object : _express.Response
    ]),
    _ts_metadata("design:returntype", void 0)
], AuthController.prototype, "githubLogin", null);
_ts_decorate([
    (0, _common.Get)('github/callback'),
    (0, _authguard.Public)(),
    _ts_param(0, (0, _common.Query)('code')),
    _ts_param(1, (0, _common.Query)('state')),
    _ts_param(2, (0, _common.Res)()),
    _ts_metadata("design:type", Function),
    _ts_metadata("design:paramtypes", [
        String,
        String,
        typeof _express.Response === "undefined" ? Object : _express.Response
    ]),
    _ts_metadata("design:returntype", Promise)
], AuthController.prototype, "githubCallback", null);
_ts_decorate([
    (0, _common.Get)('kakao'),
    (0, _authguard.Public)(),
    (0, _swagger.ApiOperation)({
        summary: 'Kakao 로그인 리다이렉트'
    }),
    _ts_param(0, (0, _common.Res)()),
    _ts_metadata("design:type", Function),
    _ts_metadata("design:paramtypes", [
        typeof _express.Response === "undefined" ? Object : _express.Response
    ]),
    _ts_metadata("design:returntype", void 0)
], AuthController.prototype, "kakaoLogin", null);
_ts_decorate([
    (0, _common.Get)('kakao/callback'),
    (0, _authguard.Public)(),
    _ts_param(0, (0, _common.Query)('code')),
    _ts_param(1, (0, _common.Query)('state')),
    _ts_param(2, (0, _common.Res)()),
    _ts_metadata("design:type", Function),
    _ts_metadata("design:paramtypes", [
        String,
        String,
        typeof _express.Response === "undefined" ? Object : _express.Response
    ]),
    _ts_metadata("design:returntype", Promise)
], AuthController.prototype, "kakaoCallback", null);
_ts_decorate([
    (0, _common.Post)('register'),
    (0, _authguard.Public)(),
    (0, _throttler.Throttle)({
        short: {
            limit: 3,
            ttl: 60000
        }
    }),
    (0, _swagger.ApiOperation)({
        summary: '이메일 회원가입'
    }),
    (0, _swagger.ApiResponse)({
        status: 200,
        description: '회원가입 성공, JWT 토큰 반환'
    }),
    (0, _swagger.ApiResponse)({
        status: 401,
        description: '중복 이메일 또는 유효성 검증 실패'
    }),
    _ts_param(0, (0, _common.Body)()),
    _ts_param(1, (0, _common.Res)()),
    _ts_metadata("design:type", Function),
    _ts_metadata("design:paramtypes", [
        typeof _authdto.RegisterDto === "undefined" ? Object : _authdto.RegisterDto,
        typeof _express.Response === "undefined" ? Object : _express.Response
    ]),
    _ts_metadata("design:returntype", Promise)
], AuthController.prototype, "register", null);
_ts_decorate([
    (0, _common.Post)('login'),
    (0, _authguard.Public)(),
    (0, _throttler.Throttle)({
        short: {
            limit: 5,
            ttl: 60000
        }
    }),
    (0, _swagger.ApiOperation)({
        summary: '이메일 로그인'
    }),
    (0, _swagger.ApiResponse)({
        status: 200,
        description: '로그인 성공, JWT 토큰 반환'
    }),
    (0, _swagger.ApiResponse)({
        status: 401,
        description: '이메일 또는 비밀번호 불일치'
    }),
    _ts_param(0, (0, _common.Body)()),
    _ts_param(1, (0, _common.Res)()),
    _ts_metadata("design:type", Function),
    _ts_metadata("design:paramtypes", [
        typeof _authdto.LoginDto === "undefined" ? Object : _authdto.LoginDto,
        typeof _express.Response === "undefined" ? Object : _express.Response
    ]),
    _ts_metadata("design:returntype", Promise)
], AuthController.prototype, "login", null);
_ts_decorate([
    (0, _common.Post)('logout'),
    (0, _authguard.Public)(),
    (0, _swagger.ApiOperation)({
        summary: '로그아웃 (쿠키 삭제)'
    }),
    _ts_param(0, (0, _common.Res)()),
    _ts_metadata("design:type", Function),
    _ts_metadata("design:paramtypes", [
        typeof _express.Response === "undefined" ? Object : _express.Response
    ]),
    _ts_metadata("design:returntype", void 0)
], AuthController.prototype, "logout", null);
_ts_decorate([
    (0, _common.Post)('change-password'),
    (0, _swagger.ApiOperation)({
        summary: '비밀번호 변경'
    }),
    (0, _swagger.ApiResponse)({
        status: 200,
        description: '비밀번호 변경 성공'
    }),
    (0, _swagger.ApiResponse)({
        status: 401,
        description: '현재 비밀번호 불일치 또는 인증 필요'
    }),
    _ts_param(0, (0, _common.Body)()),
    _ts_param(1, (0, _common.Req)()),
    _ts_param(2, (0, _common.Res)()),
    _ts_metadata("design:type", Function),
    _ts_metadata("design:paramtypes", [
        typeof _authdto.ChangePasswordDto === "undefined" ? Object : _authdto.ChangePasswordDto,
        Object,
        typeof _express.Response === "undefined" ? Object : _express.Response
    ]),
    _ts_metadata("design:returntype", Promise)
], AuthController.prototype, "changePassword", null);
_ts_decorate([
    (0, _common.Delete)('account'),
    (0, _swagger.ApiOperation)({
        summary: '계정 삭제 (모든 데이터 영구 삭제)'
    }),
    (0, _swagger.ApiResponse)({
        status: 200,
        description: '계정 삭제 완료'
    }),
    (0, _swagger.ApiResponse)({
        status: 401,
        description: '인증 필요'
    }),
    _ts_param(0, (0, _common.Req)()),
    _ts_param(1, (0, _common.Res)()),
    _ts_metadata("design:type", Function),
    _ts_metadata("design:paramtypes", [
        Object,
        typeof _express.Response === "undefined" ? Object : _express.Response
    ]),
    _ts_metadata("design:returntype", Promise)
], AuthController.prototype, "deleteAccount", null);
_ts_decorate([
    (0, _common.Get)('linked-accounts'),
    (0, _swagger.ApiOperation)({
        summary: '연결된 소셜 계정 정보'
    }),
    _ts_param(0, (0, _common.Req)()),
    _ts_metadata("design:type", Function),
    _ts_metadata("design:paramtypes", [
        Object
    ]),
    _ts_metadata("design:returntype", void 0)
], AuthController.prototype, "getLinkedAccounts", null);
_ts_decorate([
    (0, _common.Get)('link/:provider'),
    (0, _swagger.ApiOperation)({
        summary: '소셜 계정 연동 시작'
    }),
    _ts_param(0, (0, _common.Param)('provider')),
    _ts_param(1, (0, _common.Req)()),
    _ts_param(2, (0, _common.Res)()),
    _ts_metadata("design:type", Function),
    _ts_metadata("design:paramtypes", [
        String,
        Object,
        typeof _express.Response === "undefined" ? Object : _express.Response
    ]),
    _ts_metadata("design:returntype", void 0)
], AuthController.prototype, "linkSocial", null);
_ts_decorate([
    (0, _common.Get)('u/:username'),
    (0, _authguard.Public)(),
    (0, _swagger.ApiOperation)({
        summary: '공개 포트폴리오 페이지용 사용자 프로필 조회 (username)'
    }),
    _ts_param(0, (0, _common.Param)('username')),
    _ts_metadata("design:type", Function),
    _ts_metadata("design:paramtypes", [
        String
    ]),
    _ts_metadata("design:returntype", void 0)
], AuthController.prototype, "getUserPortfolio", null);
_ts_decorate([
    (0, _common.Get)('me'),
    (0, _swagger.ApiOperation)({
        summary: '내 정보 조회'
    }),
    (0, _swagger.ApiResponse)({
        status: 200,
        description: '프로필 정보 반환 (passwordHash 미포함)'
    }),
    (0, _swagger.ApiResponse)({
        status: 401,
        description: '인증 필요'
    }),
    _ts_param(0, (0, _common.Req)()),
    _ts_metadata("design:type", Function),
    _ts_metadata("design:paramtypes", [
        Object
    ]),
    _ts_metadata("design:returntype", void 0)
], AuthController.prototype, "getProfile", null);
_ts_decorate([
    (0, _common.Patch)('profile'),
    (0, _swagger.ApiOperation)({
        summary: '프로필 수정 (userType, name 등)'
    }),
    (0, _swagger.ApiResponse)({
        status: 200,
        description: '수정된 프로필 반환'
    }),
    (0, _swagger.ApiResponse)({
        status: 400,
        description: '유효하지 않은 사용자 유형 등'
    }),
    (0, _swagger.ApiResponse)({
        status: 401,
        description: '인증 필요'
    }),
    _ts_param(0, (0, _common.Body)()),
    _ts_param(1, (0, _common.Req)()),
    _ts_param(2, (0, _common.Res)()),
    _ts_metadata("design:type", Function),
    _ts_metadata("design:paramtypes", [
        typeof _authdto.UpdateProfileDto === "undefined" ? Object : _authdto.UpdateProfileDto,
        Object,
        typeof _express.Response === "undefined" ? Object : _express.Response
    ]),
    _ts_metadata("design:returntype", Promise)
], AuthController.prototype, "updateProfile", null);
_ts_decorate([
    (0, _common.Get)('admin/users'),
    (0, _swagger.ApiOperation)({
        summary: '전체 사용자 목록 (관리자)'
    }),
    _ts_param(0, (0, _common.Req)()),
    _ts_param(1, (0, _common.Query)('search')),
    _ts_metadata("design:type", Function),
    _ts_metadata("design:paramtypes", [
        Object,
        String
    ]),
    _ts_metadata("design:returntype", Promise)
], AuthController.prototype, "getAllUsers", null);
_ts_decorate([
    (0, _common.Post)('admin/users/:userId/role'),
    (0, _swagger.ApiOperation)({
        summary: '사용자 역할 변경 (관리자)'
    }),
    _ts_param(0, (0, _common.Param)('userId')),
    _ts_param(1, (0, _common.Body)('role')),
    _ts_param(2, (0, _common.Req)()),
    _ts_param(3, (0, _common.Res)()),
    _ts_metadata("design:type", Function),
    _ts_metadata("design:paramtypes", [
        String,
        String,
        Object,
        typeof _express.Response === "undefined" ? Object : _express.Response
    ]),
    _ts_metadata("design:returntype", Promise)
], AuthController.prototype, "setUserRole", null);
AuthController = _ts_decorate([
    (0, _swagger.ApiTags)('auth'),
    (0, _common.Controller)('auth'),
    _ts_metadata("design:type", Function),
    _ts_metadata("design:paramtypes", [
        typeof _authservice.AuthService === "undefined" ? Object : _authservice.AuthService
    ])
], AuthController);
