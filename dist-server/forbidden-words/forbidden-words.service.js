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
exports.ForbiddenWordsService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
let ForbiddenWordsService = class ForbiddenWordsService {
    prisma;
    cache = [];
    cacheTime = 0;
    CACHE_TTL = 60_000;
    constructor(prisma) {
        this.prisma = prisma;
    }
    async loadCache() {
        if (Date.now() - this.cacheTime < this.CACHE_TTL && this.cache.length)
            return;
        this.cache = await this.prisma.forbiddenWord.findMany({
            where: { isActive: true },
            select: { word: true, category: true, severity: true },
        });
        this.cacheTime = Date.now();
    }
    async checkContent(text) {
        if (!text?.trim())
            return { blocked: false, matched: [], warnings: [] };
        await this.loadCache();
        const lower = text.toLowerCase();
        const matched = [];
        const warnings = [];
        for (const entry of this.cache) {
            if (lower.includes(entry.word.toLowerCase())) {
                if (entry.severity === 'block') {
                    matched.push(entry.word);
                }
                else {
                    warnings.push(entry.word);
                }
            }
        }
        return { blocked: matched.length > 0, matched, warnings };
    }
    async validateOrThrow(...texts) {
        const combined = texts.filter(Boolean).join(' ');
        const result = await this.checkContent(combined);
        if (result.blocked) {
            throw new common_1.BadRequestException(`금칙어가 포함되어 있습니다: ${result.matched.map(w => w.replace(/./g, '*').slice(0, -1) + w.slice(-1)).join(', ')}`);
        }
        return result;
    }
    invalidateCache() {
        this.cacheTime = 0;
    }
    async findAll(category, search, page = 1, limit = 50) {
        const where = {};
        if (category && category !== 'all')
            where.category = category;
        if (search)
            where.word = { contains: search, mode: 'insensitive' };
        const [items, total] = await Promise.all([
            this.prisma.forbiddenWord.findMany({
                where,
                orderBy: { createdAt: 'desc' },
                skip: (page - 1) * limit,
                take: limit,
            }),
            this.prisma.forbiddenWord.count({ where }),
        ]);
        return { items, total, page, limit, totalPages: Math.ceil(total / limit) };
    }
    async create(word, category, severity, createdBy) {
        const existing = await this.prisma.forbiddenWord.findUnique({ where: { word: word.toLowerCase().trim() } });
        if (existing)
            throw new common_1.BadRequestException('이미 등록된 금칙어입니다');
        const result = await this.prisma.forbiddenWord.create({
            data: { word: word.toLowerCase().trim(), category, severity, createdBy },
        });
        this.invalidateCache();
        return result;
    }
    async createBulk(words, category, severity, createdBy) {
        const cleaned = [...new Set(words.map(w => w.toLowerCase().trim()).filter(Boolean))];
        const existing = await this.prisma.forbiddenWord.findMany({
            where: { word: { in: cleaned } },
            select: { word: true },
        });
        const existingSet = new Set(existing.map(e => e.word));
        const newWords = cleaned.filter(w => !existingSet.has(w));
        if (!newWords.length)
            return { created: 0, skipped: cleaned.length };
        await this.prisma.forbiddenWord.createMany({
            data: newWords.map(w => ({ word: w, category, severity, createdBy })),
            skipDuplicates: true,
        });
        this.invalidateCache();
        return { created: newWords.length, skipped: cleaned.length - newWords.length };
    }
    async update(id, data) {
        const update = {};
        if (data.word !== undefined)
            update.word = data.word.toLowerCase().trim();
        if (data.category !== undefined)
            update.category = data.category;
        if (data.severity !== undefined)
            update.severity = data.severity;
        if (data.isActive !== undefined)
            update.isActive = data.isActive;
        const result = await this.prisma.forbiddenWord.update({ where: { id }, data: update });
        this.invalidateCache();
        return result;
    }
    async remove(id) {
        await this.prisma.forbiddenWord.delete({ where: { id } });
        this.invalidateCache();
        return { success: true };
    }
    async removeBulk(ids) {
        await this.prisma.forbiddenWord.deleteMany({ where: { id: { in: ids } } });
        this.invalidateCache();
        return { success: true, deleted: ids.length };
    }
    async getCategories() {
        const result = await this.prisma.forbiddenWord.groupBy({
            by: ['category'],
            _count: { category: true },
        });
        return result.map(r => ({ category: r.category, count: r._count.category }));
    }
    async getStats() {
        const [total, active, blocked, warned] = await Promise.all([
            this.prisma.forbiddenWord.count(),
            this.prisma.forbiddenWord.count({ where: { isActive: true } }),
            this.prisma.forbiddenWord.count({ where: { severity: 'block', isActive: true } }),
            this.prisma.forbiddenWord.count({ where: { severity: 'warn', isActive: true } }),
        ]);
        return { total, active, blocked, warned };
    }
};
exports.ForbiddenWordsService = ForbiddenWordsService;
exports.ForbiddenWordsService = ForbiddenWordsService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], ForbiddenWordsService);
