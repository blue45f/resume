import { ApplicationsService } from './applications.service';
export declare class ApplicationsController {
    private readonly service;
    constructor(service: ApplicationsService);
    findAll(req: any): Promise<{
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
    getStats(req: any): Promise<{
        total: number;
        byStatus: Record<string, number>;
    }>;
    create(body: {
        company: string;
        position: string;
        url?: string;
        status?: string;
        appliedDate?: string;
        notes?: string;
        salary?: string;
        location?: string;
        resumeId?: string;
    }, req: any): Promise<{
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
    update(id: string, body: any, req: any): Promise<{
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
    remove(id: string, req: any): Promise<{
        success: boolean;
    }>;
}
