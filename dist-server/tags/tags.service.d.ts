import { PrismaService } from '../prisma/prisma.service';
export declare class TagsService {
    private prisma;
    constructor(prisma: PrismaService);
    findAll(): Promise<{
        id: string;
        name: string;
        color: string;
        resumeCount: number;
    }[]>;
    create(data: {
        name: string;
        color?: string;
    }): Promise<{
        name: string;
        id: string;
        color: string;
    }>;
    remove(id: string): Promise<{
        success: boolean;
    }>;
    addTagToResume(resumeId: string, tagId: string): Promise<{
        success: boolean;
    }>;
    removeTagFromResume(resumeId: string, tagId: string): Promise<{
        success: boolean;
    }>;
}
