"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
Object.defineProperty(exports, "CoverLettersService", {
    enumerable: true,
    get: function() {
        return CoverLettersService;
    }
});
const _common = require("@nestjs/common");
const _prismaservice = require("../prisma/prisma.service");
function _ts_decorate(decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for(var i = decorators.length - 1; i >= 0; i--)if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
}
function _ts_metadata(k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
}
let CoverLettersService = class CoverLettersService {
    async findAll(userId) {
        return this.prisma.coverLetter.findMany({
            where: {
                userId
            },
            orderBy: {
                updatedAt: 'desc'
            },
            select: {
                id: true,
                company: true,
                position: true,
                tone: true,
                content: true,
                resumeId: true,
                applicationId: true,
                createdAt: true,
                updatedAt: true
            }
        });
    }
    async findOne(id, userId) {
        const cl = await this.prisma.coverLetter.findUnique({
            where: {
                id
            }
        });
        if (!cl) throw new _common.NotFoundException('자소서를 찾을 수 없습니다');
        if (cl.userId !== userId) throw new _common.ForbiddenException('권한이 없습니다');
        return cl;
    }
    async create(userId, data) {
        return this.prisma.coverLetter.create({
            data: {
                userId,
                ...data
            }
        });
    }
    async update(id, userId, data) {
        const cl = await this.prisma.coverLetter.findUnique({
            where: {
                id
            }
        });
        if (!cl) throw new _common.NotFoundException();
        if (cl.userId !== userId) throw new _common.ForbiddenException();
        return this.prisma.coverLetter.update({
            where: {
                id
            },
            data
        });
    }
    async remove(id, userId) {
        const cl = await this.prisma.coverLetter.findUnique({
            where: {
                id
            }
        });
        if (!cl) throw new _common.NotFoundException();
        if (cl.userId !== userId) throw new _common.ForbiddenException();
        await this.prisma.coverLetter.delete({
            where: {
                id
            }
        });
        return {
            success: true
        };
    }
    async getByResume(resumeId, userId) {
        return this.prisma.coverLetter.findMany({
            where: {
                resumeId,
                userId
            },
            orderBy: {
                updatedAt: 'desc'
            }
        });
    }
    constructor(prisma){
        this.prisma = prisma;
    }
};
CoverLettersService = _ts_decorate([
    (0, _common.Injectable)(),
    _ts_metadata("design:type", Function),
    _ts_metadata("design:paramtypes", [
        typeof _prismaservice.PrismaService === "undefined" ? Object : _prismaservice.PrismaService
    ])
], CoverLettersService);
