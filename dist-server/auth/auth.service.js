"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
Object.defineProperty(exports, "AuthService", {
    enumerable: true,
    get: function() {
        return AuthService;
    }
});
const _common = require("@nestjs/common");
const _jwt = require("@nestjs/jwt");
const _config = require("@nestjs/config");
const _prismaservice = require("../prisma/prisma.service");
const _crypto = require("crypto");
function _getRequireWildcardCache(nodeInterop) {
    if (typeof WeakMap !== "function") return null;
    var cacheBabelInterop = new WeakMap();
    var cacheNodeInterop = new WeakMap();
    return (_getRequireWildcardCache = function(nodeInterop) {
        return nodeInterop ? cacheNodeInterop : cacheBabelInterop;
    })(nodeInterop);
}
function _interop_require_wildcard(obj, nodeInterop) {
    if (!nodeInterop && obj && obj.__esModule) {
        return obj;
    }
    if (obj === null || typeof obj !== "object" && typeof obj !== "function") {
        return {
            default: obj
        };
    }
    var cache = _getRequireWildcardCache(nodeInterop);
    if (cache && cache.has(obj)) {
        return cache.get(obj);
    }
    var newObj = {
        __proto__: null
    };
    var hasPropertyDescriptor = Object.defineProperty && Object.getOwnPropertyDescriptor;
    for(var key in obj){
        if (key !== "default" && Object.prototype.hasOwnProperty.call(obj, key)) {
            var desc = hasPropertyDescriptor ? Object.getOwnPropertyDescriptor(obj, key) : null;
            if (desc && (desc.get || desc.set)) {
                Object.defineProperty(newObj, key, desc);
            } else {
                newObj[key] = obj[key];
            }
        }
    }
    newObj.default = obj;
    if (cache) {
        cache.set(obj, newObj);
    }
    return newObj;
}
function _ts_decorate(decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for(var i = decorators.length - 1; i >= 0; i--)if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
}
function _ts_metadata(k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
}
let AuthService = class AuthService {
    /**
   * HMAC 서명 기반 stateless OAuth state 생성
   * 형식: {timestamp}.{nonce}.{hmac}
   * 서버 재시작에도 검증 가능 (인메모리 저장 불필요)
   */ generateOAuthState() {
        const timestamp = Date.now().toString(36);
        const nonce = (0, _crypto.randomBytes)(8).toString('hex');
        const payload = `${timestamp}.${nonce}`;
        const hmac = (0, _crypto.createHmac)('sha256', this.stateSecret).update(payload).digest('hex').slice(0, 16);
        return `${payload}.${hmac}`;
    }
    validateOAuthState(state) {
        if (!state) return false;
        const parts = state.split('.');
        // 3 parts = normal login, 4 parts = linking mode (timestamp.nonce.hmac.userId)
        if (parts.length !== 3 && parts.length !== 4) return false;
        const [timestamp, nonce, hmac] = parts;
        const payload = `${timestamp}.${nonce}`;
        const expected = (0, _crypto.createHmac)('sha256', this.stateSecret).update(payload).digest('hex').slice(0, 16);
        // Timing-safe comparison to prevent timing attacks
        const hmacBuf = Buffer.from(hmac, 'utf8');
        const expectedBuf = Buffer.from(expected, 'utf8');
        if (hmacBuf.length !== expectedBuf.length || !(0, _crypto.timingSafeEqual)(hmacBuf, expectedBuf)) {
            this.logger.warn('OAuth state HMAC 불일치');
            return false;
        }
        // TTL 확인
        const createdAt = parseInt(timestamp, 36);
        if (Date.now() - createdAt > this.STATE_TTL_MS) {
            this.logger.warn('OAuth state 만료');
            return false;
        }
        return true;
    }
    /**
   * state에서 linking mode의 userId를 추출. 없으면 null.
   */ extractLinkUserId(state) {
        const parts = state.split('.');
        if (parts.length === 4) return parts[3];
        return null;
    }
    // ---- OAuth URL 생성 ----
    getGoogleAuthUrl(state) {
        const clientId = this.config.get('GOOGLE_CLIENT_ID');
        const redirectUri = this.getCallbackUrl('google');
        return `https://accounts.google.com/o/oauth2/v2/auth?client_id=${clientId}&redirect_uri=${encodeURIComponent(redirectUri)}&response_type=code&scope=email+profile&prompt=select_account&state=${state}`;
    }
    getGithubAuthUrl(state) {
        const clientId = this.config.get('GITHUB_CLIENT_ID');
        const redirectUri = this.getCallbackUrl('github');
        return `https://github.com/login/oauth/authorize?client_id=${clientId}&redirect_uri=${encodeURIComponent(redirectUri)}&scope=user:email&state=${state}`;
    }
    getKakaoAuthUrl(state) {
        const clientId = this.config.get('KAKAO_CLIENT_ID');
        const redirectUri = this.getCallbackUrl('kakao');
        return `https://kauth.kakao.com/oauth/authorize?client_id=${clientId}&redirect_uri=${encodeURIComponent(redirectUri)}&response_type=code&state=${state}`;
    }
    // ---- OAuth 콜백 처리 ----
    async handleGoogleCallback(code) {
        const clientId = this.config.get('GOOGLE_CLIENT_ID');
        const clientSecret = this.config.get('GOOGLE_CLIENT_SECRET');
        const redirectUri = this.getCallbackUrl('google');
        // 코드 → 토큰
        const tokenRes = await fetch('https://oauth2.googleapis.com/token', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                code,
                client_id: clientId,
                client_secret: clientSecret,
                redirect_uri: redirectUri,
                grant_type: 'authorization_code'
            })
        });
        const tokenData = await tokenRes.json();
        if (!tokenData.access_token) throw new _common.UnauthorizedException('Google 인증 실패');
        // 프로필 조회
        const profileRes = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
            headers: {
                Authorization: `Bearer ${tokenData.access_token}`
            }
        });
        const profile = await profileRes.json();
        return this.findOrCreateUser({
            provider: 'google',
            providerId: profile.id,
            email: profile.email || '',
            name: profile.name || '',
            avatar: profile.picture || ''
        });
    }
    async handleGithubCallback(code) {
        const clientId = this.config.get('GITHUB_CLIENT_ID');
        const clientSecret = this.config.get('GITHUB_CLIENT_SECRET');
        // 코드 → 토큰
        const tokenRes = await fetch('https://github.com/login/oauth/access_token', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                Accept: 'application/json'
            },
            body: JSON.stringify({
                client_id: clientId,
                client_secret: clientSecret,
                code
            })
        });
        const tokenData = await tokenRes.json();
        if (!tokenData.access_token) throw new _common.UnauthorizedException('GitHub 인증 실패');
        // 프로필 조회
        const profileRes = await fetch('https://api.github.com/user', {
            headers: {
                Authorization: `Bearer ${tokenData.access_token}`
            }
        });
        const profile = await profileRes.json();
        // 이메일 조회 (private일 수 있음)
        let email = profile.email || '';
        if (!email) {
            const emailsRes = await fetch('https://api.github.com/user/emails', {
                headers: {
                    Authorization: `Bearer ${tokenData.access_token}`
                }
            });
            const emails = await emailsRes.json();
            const primary = emails.find((e)=>e.primary);
            email = primary?.email || emails[0]?.email || '';
        }
        return this.findOrCreateUser({
            provider: 'github',
            providerId: String(profile.id),
            email,
            name: profile.name || profile.login || '',
            avatar: profile.avatar_url || ''
        });
    }
    async handleKakaoCallback(code) {
        const clientId = this.config.get('KAKAO_CLIENT_ID');
        const redirectUri = this.getCallbackUrl('kakao');
        // 코드 → 토큰
        const tokenRes = await fetch('https://kauth.kakao.com/oauth/token', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded'
            },
            body: `grant_type=authorization_code&client_id=${clientId}&redirect_uri=${encodeURIComponent(redirectUri)}&code=${code}`
        });
        const tokenData = await tokenRes.json();
        if (!tokenData.access_token) throw new _common.UnauthorizedException('Kakao 인증 실패');
        // 프로필 조회
        const profileRes = await fetch('https://kapi.kakao.com/v2/user/me', {
            headers: {
                Authorization: `Bearer ${tokenData.access_token}`
            }
        });
        const profile = await profileRes.json();
        const kakaoAccount = profile.kakao_account || {};
        return this.findOrCreateUser({
            provider: 'kakao',
            providerId: String(profile.id),
            email: kakaoAccount.email || '',
            name: kakaoAccount.profile?.nickname || '',
            avatar: kakaoAccount.profile?.thumbnail_image_url || ''
        });
    }
    // ---- 관리자 기능 ----
    async setUserRole(adminUserId, targetUserId, role) {
        const admin = await this.prisma.user.findUnique({
            where: {
                id: adminUserId
            }
        });
        if (!admin || admin.role !== 'superadmin') {
            throw new _common.UnauthorizedException('관리자만 역할을 변경할 수 있습니다');
        }
        if (![
            'user',
            'admin',
            'superadmin'
        ].includes(role)) {
            throw new _common.UnauthorizedException('유효하지 않은 역할입니다');
        }
        await this.prisma.user.update({
            where: {
                id: targetUserId
            },
            data: {
                role
            }
        });
        return {
            success: true,
            userId: targetUserId,
            role
        };
    }
    async getAllUsers(search) {
        const where = search ? {
            OR: [
                {
                    name: {
                        contains: search,
                        mode: 'insensitive'
                    }
                },
                {
                    email: {
                        contains: search,
                        mode: 'insensitive'
                    }
                }
            ]
        } : {};
        return this.prisma.user.findMany({
            where,
            select: {
                id: true,
                name: true,
                email: true,
                provider: true,
                role: true,
                plan: true,
                createdAt: true
            },
            orderBy: {
                createdAt: 'desc'
            }
        });
    }
    // ---- 내 정보 ----
    async getProfile(userId) {
        const user = await this.prisma.user.findUnique({
            where: {
                id: userId
            }
        });
        if (!user) throw new _common.UnauthorizedException();
        const [resumeCount, followerCount, followingCount] = await Promise.all([
            this.prisma.resume.count({
                where: {
                    userId
                }
            }),
            this.prisma.follow.count({
                where: {
                    followingId: userId
                }
            }),
            this.prisma.follow.count({
                where: {
                    followerId: userId
                }
            })
        ]);
        return {
            id: user.id,
            email: user.email,
            name: user.name,
            avatar: user.avatar,
            provider: user.provider,
            role: user.role || 'user',
            plan: user.plan || 'free',
            userType: user.userType || 'personal',
            companyName: user.companyName || '',
            companyTitle: user.companyTitle || '',
            isOpenToWork: user.isOpenToWork || false,
            openToWorkRoles: user.openToWorkRoles || '',
            username: user.username || '',
            resumeCount,
            followerCount,
            followingCount
        };
    }
    async getPublicPortfolio(username) {
        const user = await this.prisma.user.findFirst({
            where: {
                username: {
                    equals: username,
                    mode: 'insensitive'
                }
            }
        });
        if (!user) return null;
        const [publicResumes, followerCount, followingCount] = await Promise.all([
            this.prisma.resume.findMany({
                where: {
                    userId: user.id,
                    visibility: 'public'
                },
                include: {
                    personalInfo: {
                        select: {
                            name: true,
                            summary: true,
                            github: true,
                            website: true,
                            photo: true
                        }
                    },
                    skills: {
                        select: {
                            category: true,
                            items: true
                        }
                    },
                    experiences: {
                        select: {
                            company: true,
                            position: true,
                            startDate: true,
                            endDate: true,
                            current: true
                        }
                    },
                    tags: {
                        include: {
                            tag: true
                        }
                    }
                },
                orderBy: {
                    viewCount: 'desc'
                },
                take: 6
            }),
            this.prisma.follow.count({
                where: {
                    followingId: user.id
                }
            }),
            this.prisma.follow.count({
                where: {
                    followerId: user.id
                }
            })
        ]);
        const totalViews = publicResumes.reduce((s, r)=>s + (r.viewCount || 0), 0);
        const totalExp = publicResumes.reduce((s, r)=>s + r.experiences.length, 0);
        const allSkills = [];
        publicResumes.forEach((r)=>r.skills.forEach((sk)=>{
                sk.items.split(',').map((s)=>s.trim()).filter(Boolean).forEach((s)=>allSkills.push(s));
            }));
        const uniqueSkills = [
            ...new Set(allSkills)
        ].slice(0, 20);
        return {
            user: {
                id: user.id,
                username: user.username,
                name: user.name,
                avatar: user.avatar,
                isOpenToWork: user.isOpenToWork,
                openToWorkRoles: user.openToWorkRoles,
                companyName: user.companyName,
                companyTitle: user.companyTitle,
                userType: user.userType
            },
            stats: {
                publicResumeCount: publicResumes.length,
                followerCount,
                followingCount,
                totalViews,
                totalExperiences: totalExp
            },
            topSkills: uniqueSkills,
            resumes: publicResumes.map((r)=>({
                    id: r.id,
                    title: r.title,
                    viewCount: r.viewCount,
                    updatedAt: r.updatedAt,
                    name: r.personalInfo?.name || '',
                    summary: r.personalInfo?.summary || '',
                    github: r.personalInfo?.github || '',
                    website: r.personalInfo?.website || '',
                    photo: r.personalInfo?.photo || '',
                    experiences: r.experiences,
                    tags: r.tags.map((t)=>({
                            id: t.tag.id,
                            name: t.tag.name,
                            color: t.tag.color
                        })),
                    topSkills: (r.skills[0]?.items || '').split(',').map((s)=>s.trim()).filter(Boolean).slice(0, 5)
                }))
        };
    }
    getAvailableProviders() {
        const providers = [];
        if (this.config.get('GOOGLE_CLIENT_ID')) providers.push('google');
        if (this.config.get('GITHUB_CLIENT_ID')) providers.push('github');
        if (this.config.get('KAKAO_CLIENT_ID')) providers.push('kakao');
        return providers;
    }
    // ---- 소셜 계정 연동 ----
    async getGoogleProfile(code) {
        const clientId = this.config.get('GOOGLE_CLIENT_ID');
        const clientSecret = this.config.get('GOOGLE_CLIENT_SECRET');
        const redirectUri = this.getCallbackUrl('google');
        const tokenRes = await fetch('https://oauth2.googleapis.com/token', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                code,
                client_id: clientId,
                client_secret: clientSecret,
                redirect_uri: redirectUri,
                grant_type: 'authorization_code'
            })
        });
        const tokenData = await tokenRes.json();
        if (!tokenData.access_token) throw new _common.UnauthorizedException('Google 인증 실패');
        const profileRes = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
            headers: {
                Authorization: `Bearer ${tokenData.access_token}`
            }
        });
        const profile = await profileRes.json();
        return {
            provider: 'google',
            providerId: profile.id,
            email: profile.email || '',
            name: profile.name || '',
            avatar: profile.picture || ''
        };
    }
    async getGithubProfile(code) {
        const clientId = this.config.get('GITHUB_CLIENT_ID');
        const clientSecret = this.config.get('GITHUB_CLIENT_SECRET');
        const tokenRes = await fetch('https://github.com/login/oauth/access_token', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                Accept: 'application/json'
            },
            body: JSON.stringify({
                client_id: clientId,
                client_secret: clientSecret,
                code
            })
        });
        const tokenData = await tokenRes.json();
        if (!tokenData.access_token) throw new _common.UnauthorizedException('GitHub 인증 실패');
        const profileRes = await fetch('https://api.github.com/user', {
            headers: {
                Authorization: `Bearer ${tokenData.access_token}`
            }
        });
        const profile = await profileRes.json();
        let email = profile.email || '';
        if (!email) {
            const emailsRes = await fetch('https://api.github.com/user/emails', {
                headers: {
                    Authorization: `Bearer ${tokenData.access_token}`
                }
            });
            const emails = await emailsRes.json();
            const primary = emails.find((e)=>e.primary);
            email = primary?.email || emails[0]?.email || '';
        }
        return {
            provider: 'github',
            providerId: String(profile.id),
            email,
            name: profile.name || profile.login || '',
            avatar: profile.avatar_url || ''
        };
    }
    async getKakaoProfile(code) {
        const clientId = this.config.get('KAKAO_CLIENT_ID');
        const redirectUri = this.getCallbackUrl('kakao');
        const tokenRes = await fetch('https://kauth.kakao.com/oauth/token', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded'
            },
            body: `grant_type=authorization_code&client_id=${clientId}&redirect_uri=${encodeURIComponent(redirectUri)}&code=${code}`
        });
        const tokenData = await tokenRes.json();
        if (!tokenData.access_token) throw new _common.UnauthorizedException('Kakao 인증 실패');
        const profileRes = await fetch('https://kapi.kakao.com/v2/user/me', {
            headers: {
                Authorization: `Bearer ${tokenData.access_token}`
            }
        });
        const profile = await profileRes.json();
        const kakaoAccount = profile.kakao_account || {};
        return {
            provider: 'kakao',
            providerId: String(profile.id),
            email: kakaoAccount.email || '',
            name: kakaoAccount.profile?.nickname || '',
            avatar: kakaoAccount.profile?.thumbnail_image_url || ''
        };
    }
    async linkSocialAccount(userId, provider, providerId, avatar) {
        const user = await this.prisma.user.findUnique({
            where: {
                id: userId
            }
        });
        if (!user) throw new _common.UnauthorizedException('사용자를 찾을 수 없습니다');
        // Check if this social account is already linked to another user
        const existing = await this.prisma.user.findFirst({
            where: {
                provider,
                providerId,
                id: {
                    not: userId
                }
            }
        });
        if (existing) {
            throw new _common.UnauthorizedException('이 소셜 계정은 다른 사용자에게 연결되어 있습니다');
        }
        await this.prisma.user.update({
            where: {
                id: userId
            },
            data: {
                provider,
                providerId,
                avatar: avatar || user.avatar
            }
        });
    }
    async getLinkedAccounts(userId) {
        const user = await this.prisma.user.findUnique({
            where: {
                id: userId
            }
        });
        if (!user) throw new _common.UnauthorizedException();
        return {
            provider: user.provider,
            hasPassword: !!user.passwordHash
        };
    }
    // ---- 내부 ----
    async findOrCreateUser(profile) {
        let user = await this.prisma.user.findFirst({
            where: {
                provider: profile.provider,
                providerId: profile.providerId
            }
        });
        if (!user) {
            // 같은 이메일로 가입된 유저 확인
            if (profile.email) {
                user = await this.prisma.user.findUnique({
                    where: {
                        email: profile.email
                    }
                });
                if (user) {
                    // 기존 계정에 소셜 프로바이더 연결
                    user = await this.prisma.user.update({
                        where: {
                            id: user.id
                        },
                        data: {
                            provider: profile.provider,
                            providerId: profile.providerId,
                            avatar: profile.avatar || user.avatar
                        }
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
                        providerId: profile.providerId
                    }
                });
            }
        }
        return this.jwt.sign({
            sub: user.id,
            role: user.role || 'user'
        });
    }
    getCallbackUrl(provider) {
        const apiUrl = this.config.get('API_URL') || `http://localhost:${this.config.get('PORT') || 3001}`;
        return `${apiUrl}/api/auth/${provider}/callback`;
    }
    getFrontendUrl() {
        return this.frontendUrl;
    }
    async register(email, password, name, userType, companyName, companyTitle) {
        if (!email || !password || !name) {
            throw new _common.UnauthorizedException('이메일, 비밀번호, 이름은 필수입니다');
        }
        if (password.length < 8) {
            throw new _common.UnauthorizedException('비밀번호는 8자 이상이어야 합니다');
        }
        const validTypes = [
            'personal',
            'recruiter',
            'company'
        ];
        const type = validTypes.includes(userType || '') ? userType : 'personal';
        if (type === 'company' && !companyName) {
            throw new _common.UnauthorizedException('기업 계정은 회사명이 필수입니다');
        }
        const existing = await this.prisma.user.findUnique({
            where: {
                email
            }
        });
        if (existing) {
            throw new _common.UnauthorizedException('이미 가입된 이메일입니다');
        }
        const bcrypt = await Promise.resolve().then(()=>/*#__PURE__*/ _interop_require_wildcard(require("bcryptjs")));
        const passwordHash = await bcrypt.hash(password, 12);
        const user = await this.prisma.user.create({
            data: {
                email,
                name,
                passwordHash,
                provider: 'local',
                providerId: email,
                userType: type || 'personal',
                companyName: companyName || null,
                companyTitle: companyTitle || null
            }
        });
        return this.jwt.sign({
            sub: user.id,
            role: user.role || 'user'
        });
    }
    async changePassword(userId, currentPassword, newPassword) {
        if (!newPassword || newPassword.length < 8) {
            throw new _common.UnauthorizedException('새 비밀번호는 8자 이상이어야 합니다');
        }
        const user = await this.prisma.user.findUnique({
            where: {
                id: userId
            }
        });
        if (!user) throw new _common.UnauthorizedException('사용자를 찾을 수 없습니다');
        if (user.passwordHash) {
            const bcrypt = await Promise.resolve().then(()=>/*#__PURE__*/ _interop_require_wildcard(require("bcryptjs")));
            const valid = await bcrypt.compare(currentPassword, user.passwordHash);
            if (!valid) throw new _common.UnauthorizedException('현재 비밀번호가 올바르지 않습니다');
        }
        const bcrypt = await Promise.resolve().then(()=>/*#__PURE__*/ _interop_require_wildcard(require("bcryptjs")));
        const passwordHash = await bcrypt.hash(newPassword, 12);
        await this.prisma.user.update({
            where: {
                id: userId
            },
            data: {
                passwordHash
            }
        });
    }
    async updateProfile(userId, data) {
        const user = await this.prisma.user.findUnique({
            where: {
                id: userId
            }
        });
        if (!user) throw new _common.UnauthorizedException('사용자를 찾을 수 없습니다');
        const updateData = {};
        if (data.userType) {
            const validTypes = [
                'personal',
                'recruiter',
                'company'
            ];
            if (!validTypes.includes(data.userType)) {
                throw new _common.UnauthorizedException('유효하지 않은 사용자 유형입니다');
            }
            updateData.userType = data.userType;
        }
        if (data.name !== undefined) updateData.name = data.name;
        if (data.companyName !== undefined) updateData.companyName = data.companyName;
        if (data.companyTitle !== undefined) updateData.companyTitle = data.companyTitle;
        if (data.isOpenToWork !== undefined) updateData.isOpenToWork = data.isOpenToWork;
        if (data.openToWorkRoles !== undefined) updateData.openToWorkRoles = data.openToWorkRoles;
        if (data.username !== undefined) {
            // Validate username: 3-30 chars, alphanumeric + - _
            const clean = data.username.toLowerCase().replace(/[^a-z0-9_-]/g, '');
            if (clean.length < 3) throw new Error('사용자명은 3자 이상이어야 합니다');
            // Check uniqueness
            const existing = await this.prisma.user.findFirst({
                where: {
                    username: clean,
                    NOT: {
                        id: userId
                    }
                }
            });
            if (existing) throw new Error('이미 사용 중인 사용자명입니다');
            updateData.username = clean;
        }
        const updated = await this.prisma.user.update({
            where: {
                id: userId
            },
            data: updateData
        });
        return {
            id: updated.id,
            email: updated.email,
            name: updated.name,
            avatar: updated.avatar,
            provider: updated.provider,
            role: updated.role || 'user',
            plan: updated.plan || 'free',
            userType: updated.userType || 'personal',
            companyName: updated.companyName || '',
            companyTitle: updated.companyTitle || '',
            isOpenToWork: updated.isOpenToWork || false,
            openToWorkRoles: updated.openToWorkRoles || '',
            username: updated.username || ''
        };
    }
    async deleteAccount(userId) {
        const user = await this.prisma.user.findUnique({
            where: {
                id: userId
            }
        });
        if (!user) throw new _common.UnauthorizedException('사용자를 찾을 수 없습니다');
        // Delete all user data (cascade should handle related records)
        await this.prisma.user.delete({
            where: {
                id: userId
            }
        });
    }
    async login(email, password) {
        if (!email || !password) {
            throw new _common.UnauthorizedException('이메일과 비밀번호를 입력해주세요');
        }
        const user = await this.prisma.user.findUnique({
            where: {
                email
            }
        });
        if (!user || !user.passwordHash) {
            throw new _common.UnauthorizedException('이메일 또는 비밀번호가 올바르지 않습니다');
        }
        const bcrypt = await Promise.resolve().then(()=>/*#__PURE__*/ _interop_require_wildcard(require("bcryptjs")));
        const valid = await bcrypt.compare(password, user.passwordHash);
        if (!valid) {
            throw new _common.UnauthorizedException('이메일 또는 비밀번호가 올바르지 않습니다');
        }
        return this.jwt.sign({
            sub: user.id,
            role: user.role || 'user'
        });
    }
    constructor(prisma, jwt, config){
        this.prisma = prisma;
        this.jwt = jwt;
        this.config = config;
        this.logger = new _common.Logger(AuthService.name);
        this.STATE_TTL_MS = 10 * 60 * 1000; // 10분 (cold start 고려)
        this.frontendUrl = this.config.get('FRONTEND_URL') || 'http://localhost:5173';
        // JWT secret 재사용 (state 서명용)
        this.stateSecret = this.config.get('JWT_SECRET') || 'dev-only-state-secret';
    }
};
AuthService = _ts_decorate([
    (0, _common.Injectable)(),
    _ts_metadata("design:type", Function),
    _ts_metadata("design:paramtypes", [
        typeof _prismaservice.PrismaService === "undefined" ? Object : _prismaservice.PrismaService,
        typeof _jwt.JwtService === "undefined" ? Object : _jwt.JwtService,
        typeof _config.ConfigService === "undefined" ? Object : _config.ConfigService
    ])
], AuthService);
