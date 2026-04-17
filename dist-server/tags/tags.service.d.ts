import { PrismaService } from '../prisma/prisma.service';
export declare class TagsService {
    private prisma;
    constructor(prisma: PrismaService);
    findAll(): Promise<any>;
    create(data: {
        name: string;
        color?: string;
    }, userId?: string): Promise<$Result.GetResult<import(".prisma/client").Prisma.$TagPayload<ExtArgs>, T, "create", GlobalOmitOptions>>;
    remove(id: string, userId?: string, role?: string): Promise<{
        success: boolean;
    }>;
    addTagToResume(resumeId: string, tagId: string): Promise<{
        success: boolean;
    }>;
    removeTagFromResume(resumeId: string, tagId: string): Promise<{
        success: boolean;
    }>;
}
