import { CoverLettersService } from './cover-letters.service';
export declare class CoverLettersController {
    private readonly service;
    constructor(service: CoverLettersService);
    findAll(req: any): never[] | Promise<{
        id: string;
        createdAt: Date;
        company: string;
        position: string;
        updatedAt: Date;
        resumeId: string | null;
        content: string;
        applicationId: string | null;
        tone: string;
    }[]>;
    findOne(id: string, req: any): Promise<{
        id: string;
        createdAt: Date;
        userId: string;
        company: string;
        position: string;
        updatedAt: Date;
        resumeId: string | null;
        content: string;
        jobDescription: string;
        applicationId: string | null;
        tone: string;
    }>;
    create(body: any, req: any): Promise<{
        id: string;
        createdAt: Date;
        userId: string;
        company: string;
        position: string;
        updatedAt: Date;
        resumeId: string | null;
        content: string;
        jobDescription: string;
        applicationId: string | null;
        tone: string;
    }> | {
        error: string;
    };
    update(id: string, body: any, req: any): Promise<{
        id: string;
        createdAt: Date;
        userId: string;
        company: string;
        position: string;
        updatedAt: Date;
        resumeId: string | null;
        content: string;
        jobDescription: string;
        applicationId: string | null;
        tone: string;
    }>;
    remove(id: string, req: any): Promise<{
        success: boolean;
    }>;
    getByResume(resumeId: string, req: any): never[] | Promise<{
        id: string;
        createdAt: Date;
        userId: string;
        company: string;
        position: string;
        updatedAt: Date;
        resumeId: string | null;
        content: string;
        jobDescription: string;
        applicationId: string | null;
        tone: string;
    }[]>;
}
