import { PrismaService } from '../prisma/prisma.service';
export declare class ApplicationsService {
    private prisma;
    constructor(prisma: PrismaService);
    findAll(userId: string): Promise<{
        id: string;
        createdAt: Date;
        userId: string | null;
        updatedAt: Date;
        resumeId: string | null;
        company: string;
        position: string;
        url: string | null;
        status: string;
        appliedDate: string | null;
        notes: string | null;
        salary: string | null;
        location: string | null;
    }[]>;
    getStats(userId: string): Promise<{
        total: number;
        byStatus: Record<string, number>;
    }>;
    create(data: {
        company: string;
        position: string;
        url?: string;
        status?: string;
        appliedDate?: string;
        notes?: string;
        salary?: string;
        location?: string;
        resumeId?: string;
    }, userId: string): Promise<{
        id: string;
        createdAt: Date;
        userId: string | null;
        updatedAt: Date;
        resumeId: string | null;
        company: string;
        position: string;
        url: string | null;
        status: string;
        appliedDate: string | null;
        notes: string | null;
        salary: string | null;
        location: string | null;
    }>;
    update(id: string, data: Partial<{
        company: string;
        position: string;
        url?: string;
        status: string;
        notes?: string;
        salary?: string;
        location?: string;
        resumeId?: string;
    }>, userId: string): Promise<{
        id: string;
        createdAt: Date;
        userId: string | null;
        updatedAt: Date;
        resumeId: string | null;
        company: string;
        position: string;
        url: string | null;
        status: string;
        appliedDate: string | null;
        notes: string | null;
        salary: string | null;
        location: string | null;
    }>;
    remove(id: string, userId: string): Promise<{
        success: boolean;
    }>;
}
