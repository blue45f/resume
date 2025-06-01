import { PrismaService } from '../prisma/prisma.service';
export declare class TemplatesService {
    private prisma;
    constructor(prisma: PrismaService);
    findAll(): Promise<{
        id: string;
        name: string;
        createdAt: Date;
        description: string;
        category: string;
        updatedAt: Date;
        prompt: string;
        layout: string;
        isDefault: boolean;
    }[]>;
    findOne(id: string): Promise<{
        id: string;
        name: string;
        createdAt: Date;
        description: string;
        category: string;
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
        id: string;
        name: string;
        createdAt: Date;
        description: string;
        category: string;
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
        id: string;
        name: string;
        createdAt: Date;
        description: string;
        category: string;
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
