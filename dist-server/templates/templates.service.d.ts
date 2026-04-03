import { PrismaService } from '../prisma/prisma.service';
export declare class TemplatesService {
    private prisma;
    constructor(prisma: PrismaService);
    findAll(): Promise<{
        id: string;
        name: string;
        description: string;
        category: string;
        userId: string | null;
        prompt: string;
        layout: string;
        visibility: string;
        usageCount: number;
        rating: number | null;
        isDefault: boolean;
        createdAt: Date;
        updatedAt: Date;
    }[]>;
    findOne(id: string): Promise<{
        id: string;
        name: string;
        description: string;
        category: string;
        userId: string | null;
        prompt: string;
        layout: string;
        visibility: string;
        usageCount: number;
        rating: number | null;
        isDefault: boolean;
        createdAt: Date;
        updatedAt: Date;
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
        description: string;
        category: string;
        userId: string | null;
        prompt: string;
        layout: string;
        visibility: string;
        usageCount: number;
        rating: number | null;
        isDefault: boolean;
        createdAt: Date;
        updatedAt: Date;
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
        description: string;
        category: string;
        userId: string | null;
        prompt: string;
        layout: string;
        visibility: string;
        usageCount: number;
        rating: number | null;
        isDefault: boolean;
        createdAt: Date;
        updatedAt: Date;
    }>;
    remove(id: string, userId?: string, role?: string): Promise<{
        success: boolean;
    }>;
    findPublic(category?: string): Promise<{
        id: string;
        name: string;
        description: string;
        category: string;
        userId: string | null;
        prompt: string;
        layout: string;
        visibility: string;
        usageCount: number;
        rating: number | null;
        isDefault: boolean;
        createdAt: Date;
        updatedAt: Date;
    }[]>;
    incrementUsage(id: string): Promise<void>;
    seed(): Promise<{
        message: string;
    }>;
}
