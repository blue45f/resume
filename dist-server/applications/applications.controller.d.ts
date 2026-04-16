import { ApplicationsService } from './applications.service';
import { CreateApplicationDto, UpdateApplicationDto } from './dto/application.dto';
export declare class ApplicationsController {
    private readonly service;
    constructor(service: ApplicationsService);
    findAll(req: any): Promise<{
        url: string | null;
        id: string;
        createdAt: Date;
        userId: string | null;
        visibility: string;
        updatedAt: Date;
        resumeId: string | null;
        company: string;
        position: string;
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
    create(dto: CreateApplicationDto, req: any): Promise<{
        url: string | null;
        id: string;
        createdAt: Date;
        userId: string | null;
        visibility: string;
        updatedAt: Date;
        resumeId: string | null;
        company: string;
        position: string;
        status: string;
        appliedDate: string | null;
        notes: string | null;
        salary: string | null;
        location: string | null;
    }>;
    update(id: string, dto: UpdateApplicationDto, req: any): Promise<{
        url: string | null;
        id: string;
        createdAt: Date;
        userId: string | null;
        visibility: string;
        updatedAt: Date;
        resumeId: string | null;
        company: string;
        position: string;
        status: string;
        appliedDate: string | null;
        notes: string | null;
        salary: string | null;
        location: string | null;
    }>;
    remove(id: string, req: any): Promise<{
        success: boolean;
    }>;
    getComments(id: string): Promise<{
        id: string;
        createdAt: Date;
        userId: string | null;
        content: string;
        applicationId: string;
        authorName: string;
    }[]>;
    addComment(id: string, body: {
        content: string;
    }, req: any): Promise<{
        id: string;
        createdAt: Date;
        userId: string | null;
        content: string;
        applicationId: string;
        authorName: string;
    }>;
}
