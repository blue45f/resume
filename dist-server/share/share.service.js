"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
Object.defineProperty(exports, "ShareService", {
    enumerable: true,
    get: function() {
        return ShareService;
    }
});
const _common = require("@nestjs/common");
const _prismaservice = require("../prisma/prisma.service");
const _crypto = require("crypto");
const _bcryptjs = /*#__PURE__*/ _interop_require_wildcard(require("bcryptjs"));
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
const BCRYPT_ROUNDS = 10;
let ShareService = class ShareService {
    async createLink(resumeId, options) {
        const resume = await this.prisma.resume.findUnique({
            where: {
                id: resumeId
            }
        });
        if (!resume) throw new _common.NotFoundException('이력서를 찾을 수 없습니다');
        const token = (0, _crypto.randomBytes)(32).toString('hex');
        const passwordHash = options?.password ? await _bcryptjs.hash(options.password, BCRYPT_ROUNDS) : null;
        const expiresAt = options?.expiresInHours ? new Date(Date.now() + options.expiresInHours * 60 * 60 * 1000) : null;
        const link = await this.prisma.shareLink.create({
            data: {
                resumeId,
                token,
                passwordHash,
                expiresAt
            }
        });
        return {
            id: link.id,
            token: link.token,
            url: `/shared/${link.token}`,
            expiresAt: link.expiresAt?.toISOString() ?? null,
            hasPassword: !!link.passwordHash,
            createdAt: link.createdAt.toISOString()
        };
    }
    async getByToken(token, password) {
        const link = await this.prisma.shareLink.findUnique({
            where: {
                token
            },
            include: {
                resume: {
                    include: {
                        personalInfo: true,
                        experiences: {
                            orderBy: {
                                sortOrder: 'asc'
                            }
                        },
                        educations: {
                            orderBy: {
                                sortOrder: 'asc'
                            }
                        },
                        skills: {
                            orderBy: {
                                sortOrder: 'asc'
                            }
                        },
                        projects: {
                            orderBy: {
                                sortOrder: 'asc'
                            }
                        }
                    }
                }
            }
        });
        // Generic error message to prevent information disclosure
        if (!link) throw new _common.ForbiddenException('공유 링크에 접근할 수 없습니다');
        if (link.expiresAt && link.expiresAt < new Date()) {
            throw new _common.ForbiddenException('공유 링크에 접근할 수 없습니다');
        }
        if (link.passwordHash) {
            if (!password) throw new _common.ForbiddenException('비밀번호가 필요합니다');
            const isValid = await _bcryptjs.compare(password, link.passwordHash);
            if (!isValid) throw new _common.ForbiddenException('공유 링크에 접근할 수 없습니다');
        }
        return link.resume;
    }
    async getLinksForResume(resumeId) {
        const links = await this.prisma.shareLink.findMany({
            where: {
                resumeId
            },
            orderBy: {
                createdAt: 'desc'
            }
        });
        return links.map((l)=>({
                id: l.id,
                token: l.token,
                url: `/shared/${l.token}`,
                expiresAt: l.expiresAt?.toISOString() ?? null,
                hasPassword: !!l.passwordHash,
                isExpired: l.expiresAt ? l.expiresAt < new Date() : false,
                createdAt: l.createdAt.toISOString()
            }));
    }
    async removeLink(id) {
        const existing = await this.prisma.shareLink.findUnique({
            where: {
                id
            }
        });
        if (!existing) throw new _common.NotFoundException('공유 링크를 찾을 수 없습니다');
        await this.prisma.shareLink.delete({
            where: {
                id
            }
        });
        return {
            success: true
        };
    }
    constructor(prisma){
        this.prisma = prisma;
    }
};
ShareService = _ts_decorate([
    (0, _common.Injectable)(),
    _ts_metadata("design:type", Function),
    _ts_metadata("design:paramtypes", [
        typeof _prismaservice.PrismaService === "undefined" ? Object : _prismaservice.PrismaService
    ])
], ShareService);
