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
        userId: string;
        company: string;
        position: string;
        location: string;
        salary: string;
        description: string;
        requirements: string;
        benefits: string;
        type: string;
        status: string;
        skills: string;
        createdAt: Date;
        updatedAt: Date;
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
        userId: string;
        company: string;
        position: string;
        location: string;
        salary: string;
        description: string;
        requirements: string;
        benefits: string;
        type: string;
        status: string;
        skills: string;
        createdAt: Date;
        updatedAt: Date;
    }>;
    findByUser(userId: string): Promise<{
        id: string;
        userId: string;
        company: string;
        position: string;
        location: string;
        salary: string;
        description: string;
        requirements: string;
        benefits: string;
        type: string;
        status: string;
        skills: string;
        createdAt: Date;
        updatedAt: Date;
    }[]>;
    create(userId: string, data: any): Promise<{
        id: string;
        userId: string;
        company: string;
        position: string;
        location: string;
        salary: string;
        description: string;
        requirements: string;
        benefits: string;
        type: string;
        status: string;
        skills: string;
        createdAt: Date;
        updatedAt: Date;
    }>;
    update(id: string, userId: string, data: any): Promise<{
        id: string;
        userId: string;
        company: string;
        position: string;
        location: string;
        salary: string;
        description: string;
        requirements: string;
        benefits: string;
        type: string;
        status: string;
        skills: string;
        createdAt: Date;
        updatedAt: Date;
    }>;
    remove(id: string, userId: string, role?: string): Promise<{
        success: boolean;
    }>;
}
