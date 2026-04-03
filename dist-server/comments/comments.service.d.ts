import { PrismaService } from '../prisma/prisma.service';
import { NotificationsService } from '../notifications/notifications.service';
export declare class CommentsService {
    private prisma;
    private notificationsService;
    constructor(prisma: PrismaService, notificationsService: NotificationsService);
    findByResume(resumeId: string): Promise<{
        id: string;
        userId: string | null;
        createdAt: Date;
        resumeId: string;
        content: string;
        authorName: string;
    }[]>;
    create(resumeId: string, content: string, userId?: string, authorName?: string): Promise<{
        id: string;
        userId: string | null;
        createdAt: Date;
        resumeId: string;
        content: string;
        authorName: string;
    }>;
    remove(id: string, userId?: string, role?: string): Promise<{
        success: boolean;
    }>;
}
