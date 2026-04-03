import { CoverLettersService } from './cover-letters.service';
export declare class CoverLettersController {
    private readonly service;
    constructor(service: CoverLettersService);
    findAll(req: any): never[] | Promise<{
        id: string;
        company: string;
        position: string;
        createdAt: Date;
        updatedAt: Date;
        resumeId: string | null;
        applicationId: string | null;
        tone: string;
        content: string;
    }[]>;
    findOne(id: string, req: any): Promise<{
        id: string;
        userId: string;
        company: string;
        position: string;
        createdAt: Date;
        updatedAt: Date;
        resumeId: string | null;
        applicationId: string | null;
        tone: string;
        jobDescription: string;
        content: string;
    }>;
    create(body: any, req: any): Promise<{
        id: string;
        userId: string;
        company: string;
        position: string;
        createdAt: Date;
        updatedAt: Date;
        resumeId: string | null;
        applicationId: string | null;
        tone: string;
        jobDescription: string;
        content: string;
    }> | {
        error: string;
    };
    update(id: string, body: any, req: any): Promise<{
        id: string;
        userId: string;
        company: string;
        position: string;
        createdAt: Date;
        updatedAt: Date;
        resumeId: string | null;
        applicationId: string | null;
        tone: string;
        jobDescription: string;
        content: string;
    }>;
    remove(id: string, req: any): Promise<{
        success: boolean;
    }>;
    getByResume(resumeId: string, req: any): never[] | Promise<{
        id: string;
        userId: string;
        company: string;
        position: string;
        createdAt: Date;
        updatedAt: Date;
        resumeId: string | null;
        applicationId: string | null;
        tone: string;
        jobDescription: string;
        content: string;
    }[]>;
}
