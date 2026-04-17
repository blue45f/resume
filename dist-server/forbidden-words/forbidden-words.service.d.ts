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
        items: any;
        total: any;
        page: number;
        limit: number;
        totalPages: number;
    }>;
    create(word: string, category: string, severity: string, createdBy?: string): Promise<$Result.GetResult<import(".prisma/client").Prisma.$ForbiddenWordPayload<ExtArgs>, T, "create", GlobalOmitOptions>>;
    createBulk(words: string[], category: string, severity: string, createdBy?: string): Promise<{
        created: number;
        skipped: number;
    }>;
    update(id: string, data: {
        word?: string;
        category?: string;
        severity?: string;
        isActive?: boolean;
    }): Promise<$Result.GetResult<import(".prisma/client").Prisma.$ForbiddenWordPayload<ExtArgs>, T, "update", GlobalOmitOptions>>;
    remove(id: string): Promise<{
        success: boolean;
    }>;
    removeBulk(ids: string[]): Promise<{
        success: boolean;
        deleted: number;
    }>;
    getCategories(): Promise<any>;
    getStats(): Promise<{
        total: any;
        active: any;
        blocked: any;
        warned: any;
    }>;
}
