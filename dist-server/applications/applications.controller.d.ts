import { ApplicationsService } from './applications.service';
import { CreateApplicationDto, UpdateApplicationDto } from './dto/application.dto';
export declare class ApplicationsController {
    private readonly service;
    constructor(service: ApplicationsService);
    findAll(req: any): Promise<{
        id: string;
        userId: string | null;
        company: string;
        position: string;
        location: string | null;
        salary: string | null;
        status: string;
        createdAt: Date;
        updatedAt: Date;
        resumeId: string | null;
        url: string | null;
        appliedDate: string | null;
        notes: string | null;
        visibility: string;
    }[]>;
    getStats(req: any): Promise<{
        total: number;
        byStatus: Record<string, number>;
    }>;
    create(dto: CreateApplicationDto, req: any): Promise<{
        id: string;
        userId: string | null;
        company: string;
        position: string;
        location: string | null;
        salary: string | null;
        status: string;
        createdAt: Date;
        updatedAt: Date;
        resumeId: string | null;
        url: string | null;
        appliedDate: string | null;
        notes: string | null;
        visibility: string;
    }>;
    update(id: string, dto: UpdateApplicationDto, req: any): Promise<{
        id: string;
        userId: string | null;
        company: string;
        position: string;
        location: string | null;
        salary: string | null;
        status: string;
        createdAt: Date;
        updatedAt: Date;
        resumeId: string | null;
        url: string | null;
        appliedDate: string | null;
        notes: string | null;
        visibility: string;
    }>;
    remove(id: string, req: any): Promise<{
        success: boolean;
    }>;
    getComments(id: string): Promise<{
        id: string;
        userId: string | null;
        createdAt: Date;
        applicationId: string;
        content: string;
        authorName: string;
    }[]>;
    addComment(id: string, body: {
        content: string;
    }, req: any): Promise<{
        id: string;
        userId: string | null;
        createdAt: Date;
        applicationId: string;
        content: string;
        authorName: string;
    }>;
}
