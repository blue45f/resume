import { PrismaService } from '../prisma/prisma.service';
import { NotificationsService } from '../notifications/notifications.service';
export declare class ApplicationsService {
    private prisma;
    private notifications;
    constructor(prisma: PrismaService, notifications: NotificationsService);
    findAll(userId: string): Promise<$Public.PrismaPromise<T>>;
    getStats(userId: string): Promise<{
        total: any;
        byStatus: Record<string, number>;
    }>;
    create(data: {
        company: string;
        position: string;
        url?: string;
        status?: string;
        appliedDate?: string;
        notes?: string;
        salary?: string;
        location?: string;
        resumeId?: string;
    }, userId: string): Promise<$Result.GetResult<import(".prisma/client").Prisma.$JobApplicationPayload<ExtArgs>, T, "create", GlobalOmitOptions>>;
    update(id: string, data: Partial<{
        company: string;
        position: string;
        url?: string;
        status: string;
        notes?: string;
        salary?: string;
        location?: string;
        resumeId?: string;
        visibility?: string;
    }>, userId: string): Promise<$Result.GetResult<import(".prisma/client").Prisma.$JobApplicationPayload<ExtArgs>, T, "update", GlobalOmitOptions>>;
    remove(id: string, userId: string): Promise<{
        success: boolean;
    }>;
    findOne(id: string): Promise<any>;
    getComments(applicationId: string): Promise<$Public.PrismaPromise<T>>;
    addComment(applicationId: string, content: string, userId?: string): Promise<$Result.GetResult<import(".prisma/client").Prisma.$ApplicationCommentPayload<ExtArgs>, T, "create", GlobalOmitOptions>>;
}
