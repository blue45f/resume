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
        type: string;
        description: string;
        id: string;
        createdAt: Date;
        userId: string;
        company: string;
        position: string;
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
        type: string;
        description: string;
        id: string;
        createdAt: Date;
        userId: string;
        company: string;
        position: string;
        skills: string;
        updatedAt: Date;
        status: string;
        salary: string;
        location: string;
        requirements: string;
        benefits: string;
    }>;
    findByUser(userId: string): Promise<{
        type: string;
        description: string;
        id: string;
        createdAt: Date;
        userId: string;
        company: string;
        position: string;
        skills: string;
        updatedAt: Date;
        status: string;
        salary: string;
        location: string;
        requirements: string;
        benefits: string;
    }[]>;
    create(userId: string, data: any): Promise<{
        type: string;
        description: string;
        id: string;
        createdAt: Date;
        userId: string;
        company: string;
        position: string;
        skills: string;
        updatedAt: Date;
        status: string;
        salary: string;
        location: string;
        requirements: string;
        benefits: string;
    }>;
    update(id: string, userId: string, data: any): Promise<{
        type: string;
        description: string;
        id: string;
        createdAt: Date;
        userId: string;
        company: string;
        position: string;
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
