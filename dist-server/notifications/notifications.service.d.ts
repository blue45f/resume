import { PrismaService } from '../prisma/prisma.service';
export declare class NotificationsService {
    private prisma;
    constructor(prisma: PrismaService);
    getUnread(userId: string): Promise<{
        type: string;
        link: string | null;
        id: string;
        createdAt: Date;
        userId: string;
        message: string;
        read: boolean;
    }[]>;
    getAll(userId: string): Promise<{
        type: string;
        link: string | null;
        id: string;
        createdAt: Date;
        userId: string;
        message: string;
        read: boolean;
    }[]>;
    markAsRead(userId: string, notificationId?: string): Promise<{
        success: boolean;
    }>;
    create(userId: string, type: string, message: string, link?: string): Promise<{
        type: string;
        link: string | null;
        id: string;
        createdAt: Date;
        userId: string;
        message: string;
        read: boolean;
    }>;
    getUnreadCount(userId: string): Promise<number>;
    cleanupOld(): Promise<{
        deleted: number;
    }>;
}
