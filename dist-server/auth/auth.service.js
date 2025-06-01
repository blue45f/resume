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
exports.AuthService = void 0;
const common_1 = require("@nestjs/common");
const jwt_1 = require("@nestjs/jwt");
const config_1 = require("@nestjs/config");
const prisma_service_1 = require("../prisma/prisma.service");
let AuthService = class AuthService {
    prisma;
    jwt;
    config;
    frontendUrl;
    constructor(prisma, jwt, config) {
        this.prisma = prisma;
        this.jwt = jwt;
        this.config = config;
        this.frontendUrl = this.config.get('FRONTEND_URL') || 'http://localhost:5173';
    }
    getGoogleAuthUrl() {
        const clientId = this.config.get('GOOGLE_CLIENT_ID');
        const redirectUri = this.getCallbackUrl('google');
        return `https://accounts.google.com/o/oauth2/v2/auth?client_id=${clientId}&redirect_uri=${encodeURIComponent(redirectUri)}&response_type=code&scope=email+profile&prompt=select_account`;
    }
    getGithubAuthUrl() {
        const clientId = this.config.get('GITHUB_CLIENT_ID');
        const redirectUri = this.getCallbackUrl('github');
        return `https://github.com/login/oauth/authorize?client_id=${clientId}&redirect_uri=${encodeURIComponent(redirectUri)}&scope=user:email`;
    }
    getKakaoAuthUrl() {
        const clientId = this.config.get('KAKAO_CLIENT_ID');
        const redirectUri = this.getCallbackUrl('kakao');
        return `https://kauth.kakao.com/oauth/authorize?client_id=${clientId}&redirect_uri=${encodeURIComponent(redirectUri)}&response_type=code`;
    }
    async handleGoogleCallback(code) {
        const clientId = this.config.get('GOOGLE_CLIENT_ID');
        const clientSecret = this.config.get('GOOGLE_CLIENT_SECRET');
        const redirectUri = this.getCallbackUrl('google');
        const tokenRes = await fetch('https://oauth2.googleapis.com/token', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ code, client_id: clientId, client_secret: clientSecret, redirect_uri: redirectUri, grant_type: 'authorization_code' }),
        });
        const tokenData = await tokenRes.json();
        if (!tokenData.access_token)
            throw new common_1.UnauthorizedException('Google 인증 실패');
        const profileRes = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
            headers: { Authorization: `Bearer ${tokenData.access_token}` },
        });
        const profile = await profileRes.json();
        return this.findOrCreateUser({
            provider: 'google',
            providerId: profile.id,
            email: profile.email || '',
            name: profile.name || '',
            avatar: profile.picture || '',
        });
    }
    async handleGithubCallback(code) {
        const clientId = this.config.get('GITHUB_CLIENT_ID');
        const clientSecret = this.config.get('GITHUB_CLIENT_SECRET');
        const tokenRes = await fetch('https://github.com/login/oauth/access_token', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
            body: JSON.stringify({ client_id: clientId, client_secret: clientSecret, code }),
        });
        const tokenData = await tokenRes.json();
        if (!tokenData.access_token)
            throw new common_1.UnauthorizedException('GitHub 인증 실패');
        const profileRes = await fetch('https://api.github.com/user', {
            headers: { Authorization: `Bearer ${tokenData.access_token}` },
        });
        const profile = await profileRes.json();
        let email = profile.email || '';
        if (!email) {
            const emailsRes = await fetch('https://api.github.com/user/emails', {
                headers: { Authorization: `Bearer ${tokenData.access_token}` },
            });
            const emails = await emailsRes.json();
            const primary = emails.find((e) => e.primary);
            email = primary?.email || emails[0]?.email || '';
        }
        return this.findOrCreateUser({
            provider: 'github',
            providerId: String(profile.id),
            email,
            name: profile.name || profile.login || '',
            avatar: profile.avatar_url || '',
        });
    }
    async handleKakaoCallback(code) {
        const clientId = this.config.get('KAKAO_CLIENT_ID');
        const redirectUri = this.getCallbackUrl('kakao');
        const tokenRes = await fetch('https://kauth.kakao.com/oauth/token', {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body: `grant_type=authorization_code&client_id=${clientId}&redirect_uri=${encodeURIComponent(redirectUri)}&code=${code}`,
        });
        const tokenData = await tokenRes.json();
        if (!tokenData.access_token)
            throw new common_1.UnauthorizedException('Kakao 인증 실패');
        const profileRes = await fetch('https://kapi.kakao.com/v2/user/me', {
            headers: { Authorization: `Bearer ${tokenData.access_token}` },
        });
        const profile = await profileRes.json();
        const kakaoAccount = profile.kakao_account || {};
        return this.findOrCreateUser({
            provider: 'kakao',
            providerId: String(profile.id),
            email: kakaoAccount.email || '',
            name: kakaoAccount.profile?.nickname || '',
            avatar: kakaoAccount.profile?.thumbnail_image_url || '',
        });
    }
    async getProfile(userId) {
        const user = await this.prisma.user.findUnique({ where: { id: userId } });
        if (!user)
            throw new common_1.UnauthorizedException();
        return { id: user.id, email: user.email, name: user.name, avatar: user.avatar, provider: user.provider };
    }
    getAvailableProviders() {
        const providers = [];
        if (this.config.get('GOOGLE_CLIENT_ID'))
            providers.push('google');
        if (this.config.get('GITHUB_CLIENT_ID'))
            providers.push('github');
        if (this.config.get('KAKAO_CLIENT_ID'))
            providers.push('kakao');
        return providers;
    }
    async findOrCreateUser(profile) {
        let user = await this.prisma.user.findFirst({
            where: { provider: profile.provider, providerId: profile.providerId },
        });
        if (!user) {
            if (profile.email) {
                user = await this.prisma.user.findUnique({ where: { email: profile.email } });
                if (user) {
                    user = await this.prisma.user.update({
                        where: { id: user.id },
                        data: { provider: profile.provider, providerId: profile.providerId, avatar: profile.avatar || user.avatar },
                    });
                }
            }
            if (!user) {
                user = await this.prisma.user.create({
                    data: {
                        email: profile.email || `${profile.provider}_${profile.providerId}@noemail`,
                        name: profile.name,
                        avatar: profile.avatar,
                        provider: profile.provider,
                        providerId: profile.providerId,
                    },
                });
            }
        }
        return this.jwt.sign({ sub: user.id });
    }
    getCallbackUrl(provider) {
        const apiUrl = this.config.get('API_URL') || `http://localhost:${this.config.get('PORT') || 3001}`;
        return `${apiUrl}/api/auth/${provider}/callback`;
    }
    getFrontendUrl() {
        return this.frontendUrl;
    }
};
exports.AuthService = AuthService;
exports.AuthService = AuthService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        jwt_1.JwtService,
        config_1.ConfigService])
], AuthService);
