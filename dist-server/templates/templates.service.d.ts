import { PrismaService } from '../prisma/prisma.service';
export declare class TemplatesService {
    private prisma;
    constructor(prisma: PrismaService);
    findAll(): Promise<$Public.PrismaPromise<T>>;
    findOne(id: string): Promise<any>;
    create(data: {
        name: string;
        description?: string;
        category?: string;
        prompt?: string;
        layout?: string;
        isDefault?: boolean;
    }, userId?: string): Promise<$Result.GetResult<import(".prisma/client").Prisma.$TemplatePayload<ExtArgs>, T, "create", GlobalOmitOptions>>;
    update(id: string, data: {
        name?: string;
        description?: string;
        category?: string;
        prompt?: string;
        layout?: string;
        visibility?: string;
        isDefault?: boolean;
    }, userId?: string, role?: string): Promise<$Result.GetResult<import(".prisma/client").Prisma.$TemplatePayload<ExtArgs>, T, "update", GlobalOmitOptions>>;
    remove(id: string, userId?: string, role?: string): Promise<{
        success: boolean;
    }>;
    findPublic(category?: string): Promise<$Public.PrismaPromise<T>>;
    incrementUsage(id: string): Promise<void>;
    seed(): Promise<{
        message: string;
    }>;
}
