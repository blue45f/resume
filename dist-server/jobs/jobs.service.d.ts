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
        description: string;
        id: string;
        createdAt: Date;
        userId: string;
        company: string;
        position: string;
        type: string;
        skills: string;
        updatedAt: Date;
        status: string;
        salary: string;
        location: string;
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
        description: string;
        id: string;
        createdAt: Date;
        userId: string;
        company: string;
        position: string;
        type: string;
        skills: string;
        updatedAt: Date;
        status: string;
        salary: string;
        location: string;
        requirements: string;
        benefits: string;
    }>;
    findByUser(userId: string): Promise<{
        description: string;
        id: string;
        createdAt: Date;
        userId: string;
        company: string;
        position: string;
        type: string;
        skills: string;
        updatedAt: Date;
        status: string;
        salary: string;
        location: string;
        requirements: string;
        benefits: string;
    }[]>;
    create(userId: string, data: any): Promise<{
        description: string;
        id: string;
        createdAt: Date;
        userId: string;
        company: string;
        position: string;
        type: string;
        skills: string;
        updatedAt: Date;
        status: string;
        salary: string;
        location: string;
        requirements: string;
        benefits: string;
    }>;
    update(id: string, userId: string, data: any): Promise<{
        description: string;
        id: string;
        createdAt: Date;
        userId: string;
        company: string;
        position: string;
        type: string;
        skills: string;
        updatedAt: Date;
        status: string;
        salary: string;
        location: string;
        requirements: string;
        benefits: string;
    }>;
    remove(id: string, userId: string, role?: string): Promise<{
        success: boolean;
    }>;
}
