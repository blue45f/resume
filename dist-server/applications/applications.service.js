"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
Object.defineProperty(exports, "ApplicationsService", {
    enumerable: true,
    get: function() {
        return ApplicationsService;
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
let ApplicationsService = class ApplicationsService {
    async findAll(userId) {
        const applications = await this.prisma.jobApplication.findMany({
            where: {
                userId
            },
            orderBy: {
                updatedAt: 'desc'
            }
        });
        return applications;
    }
    async getStats(userId) {
        const all = await this.prisma.jobApplication.findMany({
            where: {
                userId
            }
        });
        const statusCounts = {};
        for (const app of all){
            statusCounts[app.status] = (statusCounts[app.status] || 0) + 1;
        }
        return {
            total: all.length,
            byStatus: statusCounts
        };
    }
    async create(data, userId) {
        return this.prisma.jobApplication.create({
            data: {
                ...data,
                userId
            }
        });
    }
    async update(id, data, userId) {
        const app = await this.prisma.jobApplication.findUnique({
            where: {
                id
            }
        });
        if (!app) throw new _common.NotFoundException('지원 내역을 찾을 수 없습니다');
        if (app.userId !== userId) throw new _common.ForbiddenException('권한이 없습니다');
        return this.prisma.jobApplication.update({
            where: {
                id
            },
            data
        });
    }
    async remove(id, userId) {
        const app = await this.prisma.jobApplication.findUnique({
            where: {
                id
            }
        });
        if (!app) throw new _common.NotFoundException('지원 내역을 찾을 수 없습니다');
        if (app.userId !== userId) throw new _common.ForbiddenException('권한이 없습니다');
        await this.prisma.jobApplication.delete({
            where: {
                id
            }
        });
        return {
            success: true
        };
    }
    async findOne(id) {
        return this.prisma.jobApplication.findUnique({
            where: {
                id
            }
        });
    }
    async getComments(applicationId) {
        return this.prisma.applicationComment.findMany({
            where: {
                applicationId
            },
            orderBy: {
                createdAt: 'desc'
            }
        });
    }
    async addComment(applicationId, content, userId) {
        const app = await this.prisma.jobApplication.findUnique({
            where: {
                id: applicationId
            }
        });
        if (!app || app.visibility !== 'public') {
            throw new _common.NotFoundException('공개된 지원 내역만 댓글을 작성할 수 있습니다');
        }
        if (!content || content.trim().length < 5) {
            throw new _common.ForbiddenException('5자 이상 입력해주세요');
        }
        const cleanContent = content.trim().replace(/<[^>]*>/g, '');
        let authorName = '익명';
        if (userId) {
            const user = await this.prisma.user.findUnique({
                where: {
                    id: userId
                }
            });
            if (user) authorName = user.name || user.email;
        }
        return this.prisma.applicationComment.create({
            data: {
                applicationId,
                userId,
                authorName,
                content: cleanContent
            }
        });
    }
    constructor(prisma){
        this.prisma = prisma;
    }
};
ApplicationsService = _ts_decorate([
    (0, _common.Injectable)(),
    _ts_metadata("design:type", Function),
    _ts_metadata("design:paramtypes", [
        typeof _prismaservice.PrismaService === "undefined" ? Object : _prismaservice.PrismaService
    ])
], ApplicationsService);
