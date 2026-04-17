import { ForbiddenWordsService } from './forbidden-words.service';
export declare class ForbiddenWordsController {
    private readonly service;
    constructor(service: ForbiddenWordsService);
    private isAdmin;
    findAll(category?: string, search?: string, page?: string, limit?: string, req?: any): Promise<{
        items: any;
        total: any;
        page: number;
        limit: number;
        totalPages: number;
    }> | {
        items: never[];
        total: number;
    };
    getStats(req: any): {};
    getCategories(req: any): Promise<any> | never[];
    check(body: {
        text: string;
    }): Promise<{
        blocked: boolean;
        matched: string[];
        warnings: string[];
    }>;
    create(body: {
        word: string;
        category?: string;
        severity?: string;
    }, req: any): Promise<$Result.GetResult<import(".prisma/client").Prisma.$ForbiddenWordPayload<ExtArgs>, T, "create", GlobalOmitOptions>> | {
        error: string;
    };
    createBulk(body: {
        words: string[];
        category?: string;
        severity?: string;
    }, req: any): Promise<{
        created: number;
        skipped: number;
    }> | {
        error: string;
    };
    update(id: string, body: {
        word?: string;
        category?: string;
        severity?: string;
        isActive?: boolean;
    }, req: any): Promise<$Result.GetResult<import(".prisma/client").Prisma.$ForbiddenWordPayload<ExtArgs>, T, "update", GlobalOmitOptions>> | {
        error: string;
    };
    removeBulk(body: {
        ids: string[];
    }, req: any): Promise<{
        success: boolean;
        deleted: number;
    }> | {
        error: string;
    };
    remove(id: string, req: any): Promise<{
        success: boolean;
    }> | {
        error: string;
    };
}
