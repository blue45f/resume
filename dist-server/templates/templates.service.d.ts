import { PrismaService } from '../prisma/prisma.service';
export declare class TemplatesService {
    private prisma;
    constructor(prisma: PrismaService);
    findAll(): Promise<{
        name: string;
        id: string;
        description: string;
        category: string;
        createdAt: Date;
        updatedAt: Date;
        prompt: string;
        layout: string;
        isDefault: boolean;
    }[]>;
    findOne(id: string): Promise<{
        name: string;
        id: string;
        description: string;
        category: string;
        createdAt: Date;
        updatedAt: Date;
        prompt: string;
        layout: string;
        isDefault: boolean;
    }>;
    create(data: {
        name: string;
        description?: string;
        category?: string;
        prompt?: string;
        layout?: string;
        isDefault?: boolean;
    }): Promise<{
        name: string;
        id: string;
        description: string;
        category: string;
        createdAt: Date;
        updatedAt: Date;
        prompt: string;
        layout: string;
        isDefault: boolean;
    }>;
    update(id: string, data: {
        name?: string;
        description?: string;
        category?: string;
        prompt?: string;
        layout?: string;
        isDefault?: boolean;
    }): Promise<{
        name: string;
        id: string;
        description: string;
        category: string;
        createdAt: Date;
        updatedAt: Date;
        prompt: string;
        layout: string;
        isDefault: boolean;
    }>;
    remove(id: string): Promise<{
        success: boolean;
    }>;
    seed(): Promise<{
        message: string;
    }>;
}
