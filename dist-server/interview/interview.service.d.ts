import { PrismaService } from '../prisma/prisma.service';
export interface CreateInterviewAnswerDto {
    question: string;
    answer: string;
    resumeId?: string;
    jobRole?: string;
}
export declare class InterviewService {
    private prisma;
    constructor(prisma: PrismaService);
    create(userId: string, data: CreateInterviewAnswerDto): Promise<{
        id: string;
        userId: string;
        resumeId: string | null;
        createdAt: Date;
        question: string;
        answer: string;
        jobRole: string | null;
    }>;
    findAll(userId: string): Promise<{
        id: string;
        resumeId: string | null;
        createdAt: Date;
        question: string;
        answer: string;
        jobRole: string | null;
    }[]>;
    remove(id: string, userId: string): Promise<{
        success: boolean;
    }>;
}
