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
exports.TagsService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
let TagsService = class TagsService {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    async findAll() {
        const tags = await this.prisma.tag.findMany({
            include: { _count: { select: { resumes: true } } },
            orderBy: { name: 'asc' },
        });
        return tags.map((t) => ({
            id: t.id,
            name: t.name,
            color: t.color,
            resumeCount: t._count.resumes,
        }));
    }
    async create(data) {
        const existing = await this.prisma.tag.findUnique({
            where: { name: data.name },
        });
        if (existing)
            throw new common_1.ConflictException('이미 존재하는 태그입니다');
        return this.prisma.tag.create({ data });
    }
    async remove(id) {
        const existing = await this.prisma.tag.findUnique({ where: { id } });
        if (!existing)
            throw new common_1.NotFoundException('태그를 찾을 수 없습니다');
        await this.prisma.tag.delete({ where: { id } });
        return { success: true };
    }
    async addTagToResume(resumeId, tagId) {
        await this.prisma.tagsOnResumes.create({
            data: { resumeId, tagId },
        });
        return { success: true };
    }
    async removeTagFromResume(resumeId, tagId) {
        await this.prisma.tagsOnResumes.delete({
            where: { resumeId_tagId: { resumeId, tagId } },
        });
        return { success: true };
    }
};
exports.TagsService = TagsService;
exports.TagsService = TagsService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], TagsService);
