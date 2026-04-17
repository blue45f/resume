"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
Object.defineProperty(exports, "TagsService", {
    enumerable: true,
    get: function() {
        return TagsService;
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
let TagsService = class TagsService {
    async findAll() {
        const tags = await this.prisma.tag.findMany({
            include: {
                _count: {
                    select: {
                        resumes: true
                    }
                }
            },
            orderBy: {
                name: 'asc'
            }
        });
        return tags.map((t)=>({
                id: t.id,
                name: t.name,
                color: t.color,
                resumeCount: t._count.resumes
            }));
    }
    async create(data, userId) {
        const existing = await this.prisma.tag.findUnique({
            where: {
                name: data.name
            }
        });
        if (existing) throw new _common.ConflictException('이미 존재하는 태그입니다');
        return this.prisma.tag.create({
            data: {
                ...data,
                userId: userId || null
            }
        });
    }
    async remove(id, userId, role) {
        const existing = await this.prisma.tag.findUnique({
            where: {
                id
            }
        });
        if (!existing) throw new _common.NotFoundException('태그를 찾을 수 없습니다');
        // admin은 모든 태그 삭제 가능
        if (role !== 'admin' && role !== 'superadmin' && existing.userId && existing.userId !== userId) {
            throw new _common.ForbiddenException('이 태그를 삭제할 권한이 없습니다');
        }
        await this.prisma.tag.delete({
            where: {
                id
            }
        });
        return {
            success: true
        };
    }
    async addTagToResume(resumeId, tagId) {
        await this.prisma.tagsOnResumes.create({
            data: {
                resumeId,
                tagId
            }
        });
        return {
            success: true
        };
    }
    async removeTagFromResume(resumeId, tagId) {
        await this.prisma.tagsOnResumes.delete({
            where: {
                resumeId_tagId: {
                    resumeId,
                    tagId
                }
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
TagsService = _ts_decorate([
    (0, _common.Injectable)(),
    _ts_metadata("design:type", Function),
    _ts_metadata("design:paramtypes", [
        typeof _prismaservice.PrismaService === "undefined" ? Object : _prismaservice.PrismaService
    ])
], TagsService);
