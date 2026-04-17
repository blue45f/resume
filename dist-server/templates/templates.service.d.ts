import { PrismaService } from '../prisma/prisma.service';
export declare class TemplatesService {
    private prisma;
    constructor(prisma: PrismaService);
    findAll(): Promise<{
        name: string;
        description: string;
        id: string;
        userId: string | null;
        visibility: string;
        createdAt: Date;
        updatedAt: Date;
        category: string;
        prompt: string;
        layout: string;
        isDefault: boolean;
        usageCount: number;
        rating: number | null;
    }[]>;
    findOne(id: string): Promise<{
        name: string;
        description: string;
        id: string;
        userId: string | null;
        visibility: string;
        createdAt: Date;
        updatedAt: Date;
        category: string;
        prompt: string;
        layout: string;
        isDefault: boolean;
        usageCount: number;
        rating: number | null;
    }>;
    create(data: {
        name: string;
        description?: string;
        category?: string;
        prompt?: string;
        layout?: string;
        isDefault?: boolean;
    }, userId?: string): Promise<{
        name: string;
        description: string;
        id: string;
        userId: string | null;
        visibility: string;
        createdAt: Date;
        updatedAt: Date;
        category: string;
        prompt: string;
        layout: string;
        isDefault: boolean;
        usageCount: number;
        rating: number | null;
    }>;
    update(id: string, data: {
        name?: string;
        description?: string;
        category?: string;
        prompt?: string;
        layout?: string;
        visibility?: string;
        isDefault?: boolean;
    }, userId?: string, role?: string): Promise<{
        name: string;
        description: string;
        id: string;
        userId: string | null;
        visibility: string;
        createdAt: Date;
        updatedAt: Date;
        category: string;
        prompt: string;
        layout: string;
        isDefault: boolean;
        usageCount: number;
        rating: number | null;
    }>;
    remove(id: string, userId?: string, role?: string): Promise<{
        success: boolean;
    }>;
    findPublic(category?: string): Promise<{
        name: string;
        description: string;
        id: string;
        userId: string | null;
        visibility: string;
        createdAt: Date;
        updatedAt: Date;
        category: string;
        prompt: string;
        layout: string;
        isDefault: boolean;
        usageCount: number;
        rating: number | null;
    }[]>;
    incrementUsage(id: string): Promise<void>;
    seed(): Promise<{
        message: string;
    }>;
}
