import { PrismaService } from '../prisma/prisma.service';
export declare class ForbiddenWordsService {
    private readonly prisma;
    private cache;
    private cacheTime;
    private readonly CACHE_TTL;
    constructor(prisma: PrismaService);
    private loadCache;
    checkContent(text: string): Promise<{
        blocked: boolean;
        matched: string[];
        warnings: string[];
    }>;
    validateOrThrow(...texts: (string | undefined)[]): Promise<{
        blocked: boolean;
        matched: string[];
        warnings: string[];
    }>;
    invalidateCache(): void;
    findAll(category?: string, search?: string, page?: number, limit?: number): Promise<{
        items: {
            id: string;
            createdAt: Date;
            updatedAt: Date;
            category: string;
            word: string;
            severity: string;
            isActive: boolean;
            createdBy: string | null;
        }[];
        total: number;
        page: number;
        limit: number;
        totalPages: number;
    }>;
    create(word: string, category: string, severity: string, createdBy?: string): Promise<{
        id: string;
        createdAt: Date;
        updatedAt: Date;
        category: string;
        word: string;
        severity: string;
        isActive: boolean;
        createdBy: string | null;
    }>;
    createBulk(words: string[], category: string, severity: string, createdBy?: string): Promise<{
        created: number;
        skipped: number;
    }>;
    update(id: string, data: {
        word?: string;
        category?: string;
        severity?: string;
        isActive?: boolean;
    }): Promise<{
        id: string;
        createdAt: Date;
        updatedAt: Date;
        category: string;
        word: string;
        severity: string;
        isActive: boolean;
        createdBy: string | null;
    }>;
    remove(id: string): Promise<{
        success: boolean;
    }>;
    removeBulk(ids: string[]): Promise<{
        success: boolean;
        deleted: number;
    }>;
    getCategories(): Promise<{
        category: string;
        count: number;
    }[]>;
    getStats(): Promise<{
        total: number;
        active: number;
        blocked: number;
        warned: number;
    }>;
}
