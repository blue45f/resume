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
exports.StudyGroupsService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
let StudyGroupsService = class StudyGroupsService {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    async findAll(filters) {
        const page = filters.page && filters.page > 0 ? filters.page : 1;
        const limit = Math.min(filters.limit || 20, 50);
        const where = {};
        if (filters.companyName) {
            where.companyName = { contains: filters.companyName, mode: 'insensitive' };
        }
        if (filters.jobPostId) {
            where.jobPostId = filters.jobPostId;
        }
        if (filters.jobKey) {
            where.jobKey = filters.jobKey;
        }
        if (filters.q) {
            where.OR = [
                { name: { contains: filters.q, mode: 'insensitive' } },
                { description: { contains: filters.q, mode: 'insensitive' } },
                { companyName: { contains: filters.q, mode: 'insensitive' } },
                { position: { contains: filters.q, mode: 'insensitive' } },
            ];
        }
        if (filters.mine && filters.userId) {
            where.members = { some: { userId: filters.userId } };
        }
        else if (!filters.mine) {
            where.isPrivate = false;
        }
        const [items, total] = await Promise.all([
            this.prisma.studyGroup.findMany({
                where,
                orderBy: [{ createdAt: 'desc' }],
                skip: (page - 1) * limit,
                take: limit,
                include: {
                    owner: { select: { id: true, name: true, avatar: true } },
                },
            }),
            this.prisma.studyGroup.count({ where }),
        ]);
        return {
            items,
            total,
            page,
            limit,
            totalPages: Math.ceil(total / limit),
        };
    }
    async findOne(id, userId) {
        const group = await this.prisma.studyGroup.findUnique({
            where: { id },
            include: {
                owner: { select: { id: true, name: true, avatar: true } },
                members: {
                    include: { user: { select: { id: true, name: true, avatar: true } } },
                    orderBy: { joinedAt: 'asc' },
                },
            },
        });
        if (!group)
            throw new common_1.NotFoundException('스터디 그룹을 찾을 수 없습니다');
        if (group.isPrivate) {
            if (!userId)
                throw new common_1.ForbiddenException('비공개 그룹입니다');
            const isMember = group.members.some((m) => m.userId === userId);
            if (!isMember && group.ownerId !== userId) {
                throw new common_1.ForbiddenException('비공개 그룹입니다');
            }
        }
        return group;
    }
    async create(userId, data) {
        if (!data.name || data.name.trim().length === 0) {
            throw new common_1.BadRequestException('그룹 이름을 입력하세요');
        }
        const maxMembers = Math.min(Math.max(data.maxMembers || 20, 2), 200);
        return this.prisma.$transaction(async (tx) => {
            const group = await tx.studyGroup.create({
                data: {
                    name: data.name.trim(),
                    description: data.description || '',
                    jobPostId: data.jobPostId || null,
                    jobKey: data.jobKey || null,
                    companyName: data.companyName || null,
                    position: data.position || null,
                    ownerId: userId,
                    isPrivate: !!data.isPrivate,
                    maxMembers,
                    memberCount: 1,
                },
            });
            await tx.studyGroupMember.create({
                data: {
                    groupId: group.id,
                    userId,
                    role: 'owner',
                },
            });
            return group;
        });
    }
    async join(groupId, userId) {
        const group = await this.prisma.studyGroup.findUnique({
            where: { id: groupId },
            select: { id: true, maxMembers: true, memberCount: true, isPrivate: true, ownerId: true },
        });
        if (!group)
            throw new common_1.NotFoundException('스터디 그룹을 찾을 수 없습니다');
        const existing = await this.prisma.studyGroupMember.findUnique({
            where: { groupId_userId: { groupId, userId } },
        });
        if (existing)
            throw new common_1.ConflictException('이미 가입한 그룹입니다');
        if (group.memberCount >= group.maxMembers) {
            throw new common_1.ForbiddenException('그룹 정원이 가득 찼습니다');
        }
        return this.prisma.$transaction(async (tx) => {
            const member = await tx.studyGroupMember.create({
                data: {
                    groupId,
                    userId,
                    role: 'member',
                },
            });
            await tx.studyGroup.update({
                where: { id: groupId },
                data: { memberCount: { increment: 1 } },
            });
            return member;
        });
    }
    async leave(groupId, userId) {
        const group = await this.prisma.studyGroup.findUnique({
            where: { id: groupId },
            select: { id: true, ownerId: true, memberCount: true },
        });
        if (!group)
            throw new common_1.NotFoundException('스터디 그룹을 찾을 수 없습니다');
        if (group.ownerId === userId) {
            throw new common_1.ForbiddenException('그룹 소유자는 그룹을 나갈 수 없습니다. 그룹을 삭제하세요.');
        }
        const membership = await this.prisma.studyGroupMember.findUnique({
            where: { groupId_userId: { groupId, userId } },
        });
        if (!membership)
            throw new common_1.NotFoundException('그룹 멤버가 아닙니다');
        return this.prisma.$transaction(async (tx) => {
            await tx.studyGroupMember.delete({
                where: { groupId_userId: { groupId, userId } },
            });
            await tx.studyGroup.update({
                where: { id: groupId },
                data: { memberCount: { decrement: 1 } },
            });
            return { success: true };
        });
    }
    async remove(groupId, userId, role) {
        const group = await this.prisma.studyGroup.findUnique({ where: { id: groupId } });
        if (!group)
            throw new common_1.NotFoundException();
        if (group.ownerId !== userId && role !== 'admin' && role !== 'superadmin') {
            throw new common_1.ForbiddenException('그룹을 삭제할 권한이 없습니다');
        }
        await this.prisma.studyGroup.delete({ where: { id: groupId } });
        return { success: true };
    }
    async addQuestion(groupId, userId, data) {
        if (!data.question || data.question.trim().length === 0) {
            throw new common_1.BadRequestException('질문 내용을 입력하세요');
        }
        const group = await this.prisma.studyGroup.findUnique({
            where: { id: groupId },
            select: { id: true, isPrivate: true, ownerId: true },
        });
        if (!group)
            throw new common_1.NotFoundException('스터디 그룹을 찾을 수 없습니다');
        const membership = await this.prisma.studyGroupMember.findUnique({
            where: { groupId_userId: { groupId, userId } },
        });
        if (!membership && group.ownerId !== userId) {
            throw new common_1.ForbiddenException('그룹 멤버만 질문을 추가할 수 있습니다');
        }
        return this.prisma.studyGroupQuestion.create({
            data: {
                groupId,
                userId,
                question: data.question.trim(),
                sampleAnswer: data.sampleAnswer || '',
                category: data.category || '',
                difficulty: data.difficulty || 'intermediate',
            },
            include: {
                user: { select: { id: true, name: true, avatar: true } },
            },
        });
    }
    async listQuestions(groupId, userId) {
        const group = await this.prisma.studyGroup.findUnique({
            where: { id: groupId },
            select: { id: true, isPrivate: true, ownerId: true },
        });
        if (!group)
            throw new common_1.NotFoundException('스터디 그룹을 찾을 수 없습니다');
        if (group.isPrivate) {
            if (!userId)
                throw new common_1.ForbiddenException('비공개 그룹입니다');
            const membership = await this.prisma.studyGroupMember.findUnique({
                where: { groupId_userId: { groupId, userId } },
            });
            if (!membership && group.ownerId !== userId) {
                throw new common_1.ForbiddenException('비공개 그룹입니다');
            }
        }
        return this.prisma.studyGroupQuestion.findMany({
            where: { groupId },
            orderBy: [{ upvotes: 'desc' }, { createdAt: 'desc' }],
            include: {
                user: { select: { id: true, name: true, avatar: true } },
            },
        });
    }
};
exports.StudyGroupsService = StudyGroupsService;
exports.StudyGroupsService = StudyGroupsService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], StudyGroupsService);
