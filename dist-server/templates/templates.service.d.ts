import { PrismaService } from '../prisma/prisma.service';
export declare class TemplatesService {
    private prisma;
    constructor(prisma: PrismaService);
    findAll(): Promise<{
        id: string;
        name: string;
        createdAt: Date;
        userId: string | null;
        visibility: string;
        updatedAt: Date;
        category: string;
        description: string;
        prompt: string;
        layout: string;
        usageCount: number;
        rating: number | null;
        isDefault: boolean;
    }[]>;
    findOne(id: string): Promise<{
        id: string;
        name: string;
        createdAt: Date;
        userId: string | null;
        visibility: string;
        updatedAt: Date;
        category: string;
        description: string;
        prompt: string;
        layout: string;
        usageCount: number;
        rating: number | null;
        isDefault: boolean;
    }>;
    create(data: {
        name: string;
        description?: string;
        category?: string;
        prompt?: string;
        layout?: string;
        isDefault?: boolean;
    }, userId?: string): Promise<{
        id: string;
        name: string;
        createdAt: Date;
        userId: string | null;
        visibility: string;
        updatedAt: Date;
        category: string;
        description: string;
        prompt: string;
        layout: string;
        usageCount: number;
        rating: number | null;
        isDefault: boolean;
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
        id: string;
        name: string;
        createdAt: Date;
        userId: string | null;
        visibility: string;
        updatedAt: Date;
        category: string;
        description: string;
        prompt: string;
        layout: string;
        usageCount: number;
        rating: number | null;
        isDefault: boolean;
    }>;
    remove(id: string, userId?: string, role?: string): Promise<{
        success: boolean;
    }>;
    findPublic(category?: string): Promise<{
        id: string;
        name: string;
        createdAt: Date;
        userId: string | null;
        visibility: string;
        updatedAt: Date;
        category: string;
        description: string;
        prompt: string;
        layout: string;
        usageCount: number;
        rating: number | null;
        isDefault: boolean;
    }[]>;
    incrementUsage(id: string): Promise<void>;
    seed(): Promise<{
        message: string;
    }>;
}
