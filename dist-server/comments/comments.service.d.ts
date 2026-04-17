import { PrismaService } from '../prisma/prisma.service';
import { NotificationsService } from '../notifications/notifications.service';
import { ForbiddenWordsService } from '../forbidden-words/forbidden-words.service';
export declare class CommentsService {
    private prisma;
    private notificationsService;
    private forbiddenWords;
    constructor(prisma: PrismaService, notificationsService: NotificationsService, forbiddenWords: ForbiddenWordsService);
    findByResume(resumeId: string): Promise<$Public.PrismaPromise<T>>;
    create(resumeId: string, content: string, userId?: string, authorName?: string, parentId?: string): Promise<$Result.GetResult<import(".prisma/client").Prisma.$CommentPayload<ExtArgs>, T, "create", GlobalOmitOptions>>;
    remove(id: string, userId?: string, role?: string): Promise<{
        success: boolean;
    }>;
}
