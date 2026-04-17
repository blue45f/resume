import { CoverLettersService } from './cover-letters.service';
export declare class CoverLettersController {
    private readonly service;
    constructor(service: CoverLettersService);
    findAll(req: any): never[] | Promise<{
        id: string;
        resumeId: string | null;
        company: string;
        position: string;
        createdAt: Date;
        updatedAt: Date;
        applicationId: string | null;
        content: string;
        tone: string;
    }[]>;
    findOne(id: string, req: any): Promise<{
        id: string;
        userId: string;
        resumeId: string | null;
        company: string;
        position: string;
        createdAt: Date;
        updatedAt: Date;
        applicationId: string | null;
        content: string;
        tone: string;
        jobDescription: string;
    }>;
    create(body: any, req: any): Promise<{
        id: string;
        userId: string;
        resumeId: string | null;
        company: string;
        position: string;
        createdAt: Date;
        updatedAt: Date;
        applicationId: string | null;
        content: string;
        tone: string;
        jobDescription: string;
    }> | {
        error: string;
    };
    update(id: string, body: any, req: any): Promise<{
        id: string;
        userId: string;
        resumeId: string | null;
        company: string;
        position: string;
        createdAt: Date;
        updatedAt: Date;
        applicationId: string | null;
        content: string;
        tone: string;
        jobDescription: string;
    }>;
    remove(id: string, req: any): Promise<{
        success: boolean;
    }>;
    getByResume(resumeId: string, req: any): never[] | Promise<{
        id: string;
        userId: string;
        resumeId: string | null;
        company: string;
        position: string;
        createdAt: Date;
        updatedAt: Date;
        applicationId: string | null;
        content: string;
        tone: string;
        jobDescription: string;
    }[]>;
}
