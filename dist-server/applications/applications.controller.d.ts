import { ApplicationsService } from './applications.service';
import { CreateApplicationDto, UpdateApplicationDto } from './dto/application.dto';
export declare class ApplicationsController {
    private readonly service;
    constructor(service: ApplicationsService);
    findAll(req: any): Promise<{
        id: string;
        userId: string | null;
        resumeId: string | null;
        company: string;
        position: string;
        url: string | null;
        status: string;
        appliedDate: string | null;
        notes: string | null;
        salary: string | null;
        location: string | null;
        visibility: string;
        createdAt: Date;
        updatedAt: Date;
    }[]>;
    getStats(req: any): Promise<{
        total: number;
        byStatus: Record<string, number>;
    }>;
    create(dto: CreateApplicationDto, req: any): Promise<{
        id: string;
        userId: string | null;
        resumeId: string | null;
        company: string;
        position: string;
        url: string | null;
        status: string;
        appliedDate: string | null;
        notes: string | null;
        salary: string | null;
        location: string | null;
        visibility: string;
        createdAt: Date;
        updatedAt: Date;
    }>;
    update(id: string, dto: UpdateApplicationDto, req: any): Promise<{
        id: string;
        userId: string | null;
        resumeId: string | null;
        company: string;
        position: string;
        url: string | null;
        status: string;
        appliedDate: string | null;
        notes: string | null;
        salary: string | null;
        location: string | null;
        visibility: string;
        createdAt: Date;
        updatedAt: Date;
    }>;
    remove(id: string, req: any): Promise<{
        success: boolean;
    }>;
    getComments(id: string): Promise<{
        id: string;
        userId: string | null;
        createdAt: Date;
        applicationId: string;
        authorName: string;
        content: string;
    }[]>;
    addComment(id: string, body: {
        content: string;
    }, req: any): Promise<{
        id: string;
        userId: string | null;
        createdAt: Date;
        applicationId: string;
        authorName: string;
        content: string;
    }>;
}
