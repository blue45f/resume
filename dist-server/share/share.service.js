"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ShareService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
const crypto_1 = require("crypto");
const bcrypt = __importStar(require("bcryptjs"));
const BCRYPT_ROUNDS = 10;
let ShareService = class ShareService {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    async createLink(resumeId, options) {
        const resume = await this.prisma.resume.findUnique({
            where: { id: resumeId },
        });
        if (!resume)
            throw new common_1.NotFoundException('이력서를 찾을 수 없습니다');
        const token = (0, crypto_1.randomBytes)(32).toString('hex');
        const passwordHash = options?.password
            ? await bcrypt.hash(options.password, BCRYPT_ROUNDS)
            : null;
        const expiresAt = options?.expiresInHours
            ? new Date(Date.now() + options.expiresInHours * 60 * 60 * 1000)
            : null;
        const link = await this.prisma.shareLink.create({
            data: { resumeId, token, passwordHash, expiresAt },
        });
        return {
            id: link.id,
            token: link.token,
            url: `/shared/${link.token}`,
            expiresAt: link.expiresAt?.toISOString() ?? null,
            hasPassword: !!link.passwordHash,
            createdAt: link.createdAt.toISOString(),
        };
    }
    async getByToken(token, password) {
        const link = await this.prisma.shareLink.findUnique({
            where: { token },
            include: {
                resume: {
                    include: {
                        personalInfo: true,
                        experiences: { orderBy: { sortOrder: 'asc' } },
                        educations: { orderBy: { sortOrder: 'asc' } },
                        skills: { orderBy: { sortOrder: 'asc' } },
                        projects: { orderBy: { sortOrder: 'asc' } },
                    },
                },
            },
        });
        if (!link)
            throw new common_1.ForbiddenException('공유 링크에 접근할 수 없습니다');
        if (link.expiresAt && link.expiresAt < new Date()) {
            throw new common_1.ForbiddenException('공유 링크에 접근할 수 없습니다');
        }
        if (link.passwordHash) {
            if (!password)
                throw new common_1.ForbiddenException('비밀번호가 필요합니다');
            const isValid = await bcrypt.compare(password, link.passwordHash);
            if (!isValid)
                throw new common_1.ForbiddenException('공유 링크에 접근할 수 없습니다');
        }
        return link.resume;
    }
    async getLinksForResume(resumeId) {
        const links = await this.prisma.shareLink.findMany({
            where: { resumeId },
            orderBy: { createdAt: 'desc' },
        });
        return links.map((l) => ({
            id: l.id,
            token: l.token,
            url: `/shared/${l.token}`,
            expiresAt: l.expiresAt?.toISOString() ?? null,
            hasPassword: !!l.passwordHash,
            isExpired: l.expiresAt ? l.expiresAt < new Date() : false,
            createdAt: l.createdAt.toISOString(),
        }));
    }
    async removeLink(id) {
        const existing = await this.prisma.shareLink.findUnique({ where: { id } });
        if (!existing)
            throw new common_1.NotFoundException('공유 링크를 찾을 수 없습니다');
        await this.prisma.shareLink.delete({ where: { id } });
        return { success: true };
    }
};
exports.ShareService = ShareService;
exports.ShareService = ShareService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], ShareService);
