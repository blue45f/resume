import { CoverLettersService } from './cover-letters.service';
export declare class CoverLettersController {
    private readonly service;
    constructor(service: CoverLettersService);
    findAll(req: any): never[] | Promise<{
        id: string;
        createdAt: Date;
        company: string;
        updatedAt: Date;
        resumeId: string | null;
        position: string;
        applicationId: string | null;
        content: string;
        tone: string;
    }[]>;
    findOne(id: string, req: any): Promise<{
        id: string;
        createdAt: Date;
        userId: string;
        company: string;
        updatedAt: Date;
        resumeId: string | null;
        position: string;
        jobDescription: string;
        applicationId: string | null;
        content: string;
        tone: string;
    }>;
    create(body: any, req: any): Promise<{
        id: string;
        createdAt: Date;
        userId: string;
        company: string;
        updatedAt: Date;
        resumeId: string | null;
        position: string;
        jobDescription: string;
        applicationId: string | null;
        content: string;
        tone: string;
    }> | {
        error: string;
    };
    update(id: string, body: any, req: any): Promise<{
        id: string;
        createdAt: Date;
        userId: string;
        company: string;
        updatedAt: Date;
        resumeId: string | null;
        position: string;
        jobDescription: string;
        applicationId: string | null;
        content: string;
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
        updatedAt: Date;
        resumeId: string | null;
        position: string;
        jobDescription: string;
        applicationId: string | null;
        content: string;
        tone: string;
    }[]>;
}
