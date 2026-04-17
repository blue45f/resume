import { ForbiddenWordsService } from './forbidden-words.service';
export declare class ForbiddenWordsController {
    private readonly service;
    constructor(service: ForbiddenWordsService);
    private isAdmin;
    findAll(category?: string, search?: string, page?: string, limit?: string, req?: any): Promise<{
        items: {
            id: string;
            createdAt: Date;
            updatedAt: Date;
            category: string;
            isActive: boolean;
            word: string;
            severity: string;
            createdBy: string | null;
        }[];
        total: number;
        page: number;
        limit: number;
        totalPages: number;
    }> | {
        items: never[];
        total: number;
    };
    getStats(req: any): {};
    getCategories(req: any): never[] | Promise<{
        category: string;
        count: number;
    }[]>;
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
    }, req: any): Promise<{
        id: string;
        createdAt: Date;
        updatedAt: Date;
        category: string;
        isActive: boolean;
        word: string;
        severity: string;
        createdBy: string | null;
    }> | {
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
    }, req: any): Promise<{
        id: string;
        createdAt: Date;
        updatedAt: Date;
        category: string;
        isActive: boolean;
        word: string;
        severity: string;
        createdBy: string | null;
    }> | {
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
