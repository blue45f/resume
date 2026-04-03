import { PrismaService } from '../prisma/prisma.service';
export declare class JobsService {
    private prisma;
    constructor(prisma: PrismaService);
    findAll(status?: string, query?: string): Promise<({
        user: {
            id: string;
            name: string;
            avatar: string;
            companyName: string | null;
        };
    } & {
        id: string;
        createdAt: Date;
        userId: string;
        company: string;
        description: string;
        updatedAt: Date;
        skills: string;
        position: string;
        status: string;
        salary: string;
        location: string;
        type: string;
        requirements: string;
        benefits: string;
    })[]>;
    findOne(id: string): Promise<{
        user: {
            id: string;
            email: string;
            name: string;
            avatar: string;
            companyName: string | null;
        };
    } & {
        id: string;
        createdAt: Date;
        userId: string;
        company: string;
        description: string;
        updatedAt: Date;
        skills: string;
        position: string;
        status: string;
        salary: string;
        location: string;
        type: string;
        requirements: string;
        benefits: string;
    }>;
    findByUser(userId: string): Promise<{
        id: string;
        createdAt: Date;
        userId: string;
        company: string;
        description: string;
        updatedAt: Date;
        skills: string;
        position: string;
        status: string;
        salary: string;
        location: string;
        type: string;
        requirements: string;
        benefits: string;
    }[]>;
    create(userId: string, data: any): Promise<{
        id: string;
        createdAt: Date;
        userId: string;
        company: string;
        description: string;
        updatedAt: Date;
        skills: string;
        position: string;
        status: string;
        salary: string;
        location: string;
        type: string;
        requirements: string;
        benefits: string;
    }>;
    update(id: string, userId: string, data: any): Promise<{
        id: string;
        createdAt: Date;
        userId: string;
        company: string;
        description: string;
        updatedAt: Date;
        skills: string;
        position: string;
        status: string;
        salary: string;
        location: string;
        type: string;
        requirements: string;
        benefits: string;
    }>;
    remove(id: string, userId: string, role?: string): Promise<{
        success: boolean;
    }>;
}
