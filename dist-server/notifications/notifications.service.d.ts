import { PrismaService } from '../prisma/prisma.service';
export declare class NotificationsService {
    private prisma;
    constructor(prisma: PrismaService);
    getUnread(userId: string): Promise<$Public.PrismaPromise<T>>;
    getAll(userId: string): Promise<$Public.PrismaPromise<T>>;
    markAsRead(userId: string, notificationId?: string): Promise<{
        success: boolean;
    }>;
    create(userId: string, type: string, message: string, link?: string): Promise<$Result.GetResult<import(".prisma/client").Prisma.$NotificationPayload<ExtArgs>, T, "create", GlobalOmitOptions>>;
    getUnreadCount(userId: string): Promise<number>;
    deleteOne(userId: string, id: string): Promise<{
        success: boolean;
    }>;
    deleteBulk(userId: string, ids: string[]): Promise<{
        success: boolean;
        deleted: $Public.PrismaPromise<T>;
    }>;
    cleanupOld(): Promise<{
        deleted: $Public.PrismaPromise<T>;
    }>;
}
