import { PrismaService } from '../prisma/prisma.service';
export declare class CoverLettersService {
    private prisma;
    constructor(prisma: PrismaService);
    findAll(userId: string): Promise<$Public.PrismaPromise<T>>;
    findOne(id: string, userId: string): Promise<any>;
    create(userId: string, data: {
        resumeId?: string;
        applicationId?: string;
        company: string;
        position: string;
        tone: string;
        jobDescription: string;
        content: string;
    }): Promise<$Result.GetResult<import(".prisma/client").Prisma.$CoverLetterPayload<ExtArgs>, T, "create", GlobalOmitOptions>>;
    update(id: string, userId: string, data: {
        content?: string;
        company?: string;
        position?: string;
    }): Promise<$Result.GetResult<import(".prisma/client").Prisma.$CoverLetterPayload<ExtArgs>, T, "update", GlobalOmitOptions>>;
    remove(id: string, userId: string): Promise<{
        success: boolean;
    }>;
    getByResume(resumeId: string, userId: string): Promise<$Public.PrismaPromise<T>>;
}
