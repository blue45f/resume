import { PrismaService } from '../prisma/prisma.service';
import { NotificationsService } from '../notifications/notifications.service';
import { ForbiddenWordsService } from '../forbidden-words/forbidden-words.service';
export declare class CommentsService {
    private prisma;
    private notificationsService;
    private forbiddenWords;
    constructor(prisma: PrismaService, notificationsService: NotificationsService, forbiddenWords: ForbiddenWordsService);
    findByResume(resumeId: string): Promise<{
        id: string;
        createdAt: Date;
        userId: string | null;
        resumeId: string;
        content: string;
        authorName: string;
        parentId: string | null;
    }[]>;
    create(resumeId: string, content: string, userId?: string, authorName?: string, parentId?: string): Promise<{
        id: string;
        createdAt: Date;
        userId: string | null;
        resumeId: string;
        content: string;
        authorName: string;
        parentId: string | null;
    }>;
    remove(id: string, userId?: string, role?: string): Promise<{
        success: boolean;
    }>;
}
