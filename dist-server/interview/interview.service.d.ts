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
    create(userId: string, data: CreateInterviewAnswerDto): Promise<any>;
    findAll(userId: string): Promise<any>;
    remove(id: string, userId: string): Promise<{
        success: boolean;
    }>;
}
