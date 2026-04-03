import { PrismaService } from '../prisma/prisma.service';
import { NotificationsService } from '../notifications/notifications.service';
export declare class CommentsService {
    private prisma;
    private notificationsService;
    constructor(prisma: PrismaService, notificationsService: NotificationsService);
    findByResume(resumeId: string): Promise<{
        id: string;
        createdAt: Date;
        userId: string | null;
        content: string;
        resumeId: string;
        authorName: string;
    }[]>;
    create(resumeId: string, content: string, userId?: string, authorName?: string): Promise<{
        id: string;
        createdAt: Date;
        userId: string | null;
        content: string;
        resumeId: string;
        authorName: string;
    }>;
    remove(id: string, userId?: string, role?: string): Promise<{
        success: boolean;
    }>;
}
