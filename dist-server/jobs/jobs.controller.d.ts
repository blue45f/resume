import { JobsService } from './jobs.service';
export declare class JobsController {
    private readonly service;
    constructor(service: JobsService);
    findAll(query?: string, status?: string): Promise<({
        user: {
            name: string;
            id: string;
            avatar: string;
            companyName: string | null;
        };
    } & {
        description: string;
        id: string;
        createdAt: Date;
        userId: string;
        updatedAt: Date;
        skills: string;
        company: string;
        position: string;
        type: string;
        status: string;
        salary: string;
        location: string;
        requirements: string;
        benefits: string;
    })[]>;
    findMy(req: any): never[] | Promise<{
        description: string;
        id: string;
        createdAt: Date;
        userId: string;
        updatedAt: Date;
        skills: string;
        company: string;
        position: string;
        type: string;
        status: string;
        salary: string;
        location: string;
        requirements: string;
        benefits: string;
    }[]>;
    findOne(id: string): Promise<{
        user: {
            name: string;
            id: string;
            email: string;
            avatar: string;
            companyName: string | null;
        };
    } & {
        description: string;
        id: string;
        createdAt: Date;
        userId: string;
        updatedAt: Date;
        skills: string;
        company: string;
        position: string;
        type: string;
        status: string;
        salary: string;
        location: string;
        requirements: string;
        benefits: string;
    }>;
    create(body: any, req: any): Promise<{
        description: string;
        id: string;
        createdAt: Date;
        userId: string;
        updatedAt: Date;
        skills: string;
        company: string;
        position: string;
        type: string;
        status: string;
        salary: string;
        location: string;
        requirements: string;
        benefits: string;
    }> | {
        error: string;
    };
    update(id: string, body: any, req: any): Promise<{
        description: string;
        id: string;
        createdAt: Date;
        userId: string;
        updatedAt: Date;
        skills: string;
        company: string;
        position: string;
        type: string;
        status: string;
        salary: string;
        location: string;
        requirements: string;
        benefits: string;
    }>;
    remove(id: string, req: any): Promise<{
        success: boolean;
    }>;
}
