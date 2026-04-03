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
    findMy(req: any): Promise<{
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
    }[]> | never[];
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
    create(body: any, req: any): Promise<{
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
    }> | {
        error: string;
    };
    update(id: string, body: any, req: any): Promise<{
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
    remove(id: string, req: any): Promise<{
        success: boolean;
    }>;
}
