import { ApplicationsService } from './applications.service';
import { CreateApplicationDto, UpdateApplicationDto } from './dto/application.dto';
export declare class ApplicationsController {
    private readonly service;
    constructor(service: ApplicationsService);
    findAll(req: any): Promise<{
        id: string;
        createdAt: Date;
        userId: string | null;
        company: string;
        visibility: string;
        updatedAt: Date;
        resumeId: string | null;
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
    create(dto: CreateApplicationDto, req: any): Promise<{
        id: string;
        createdAt: Date;
        userId: string | null;
        company: string;
        visibility: string;
        updatedAt: Date;
        resumeId: string | null;
        position: string;
        url: string | null;
        status: string;
        appliedDate: string | null;
        notes: string | null;
        salary: string | null;
        location: string | null;
    }>;
    update(id: string, dto: UpdateApplicationDto, req: any): Promise<{
        id: string;
        createdAt: Date;
        userId: string | null;
        company: string;
        visibility: string;
        updatedAt: Date;
        resumeId: string | null;
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
    getComments(id: string): Promise<{
        id: string;
        createdAt: Date;
        userId: string | null;
        applicationId: string;
        authorName: string;
        content: string;
    }[]>;
    addComment(id: string, body: {
        content: string;
    }, req: any): Promise<{
        id: string;
        createdAt: Date;
        userId: string | null;
        applicationId: string;
        authorName: string;
        content: string;
    }>;
}
