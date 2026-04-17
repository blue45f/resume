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
        createdAt: Date;
        userId: string;
        resumeId: string | null;
        jobRole: string | null;
        question: string;
        answer: string;
    }>;
    findAll(userId: string): Promise<{
        id: string;
        createdAt: Date;
        resumeId: string | null;
        jobRole: string | null;
        question: string;
        answer: string;
    }[]>;
    remove(id: string, userId: string): Promise<{
        success: boolean;
    }>;
}
