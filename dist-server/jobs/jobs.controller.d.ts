import { JobsService } from './jobs.service';
export declare class JobsController {
    private readonly service;
    constructor(service: JobsService);
    findAll(query?: string, status?: string): Promise<({
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
    findMy(req: any): never[] | Promise<{
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
    create(body: any, req: any): Promise<{
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
    }> | {
        error: string;
    };
    update(id: string, body: any, req: any): Promise<{
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
    remove(id: string, req: any): Promise<{
        success: boolean;
    }>;
}
