import { PrismaService } from '../prisma/prisma.service';
export declare class NotificationsService {
    private prisma;
    constructor(prisma: PrismaService);
    getUnread(userId: string): Promise<{
        link: string | null;
        id: string;
        createdAt: Date;
        userId: string;
        type: string;
        message: string;
        read: boolean;
    }[]>;
    getAll(userId: string): Promise<{
        link: string | null;
        id: string;
        createdAt: Date;
        userId: string;
        type: string;
        message: string;
        read: boolean;
    }[]>;
    markAsRead(userId: string, notificationId?: string): Promise<{
        success: boolean;
    }>;
    create(userId: string, type: string, message: string, link?: string): Promise<{
        link: string | null;
        id: string;
        createdAt: Date;
        userId: string;
        type: string;
        message: string;
        read: boolean;
    }>;
    getUnreadCount(userId: string): Promise<number>;
    deleteOne(userId: string, id: string): Promise<{
        success: boolean;
    }>;
    deleteBulk(userId: string, ids: string[]): Promise<{
        success: boolean;
        deleted: number;
    }>;
    cleanupOld(): Promise<{
        deleted: number;
    }>;
}
