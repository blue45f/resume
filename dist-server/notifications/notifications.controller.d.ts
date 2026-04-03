import { NotificationsService } from './notifications.service';
export declare class NotificationsController {
    private readonly service;
    constructor(service: NotificationsService);
    getAll(req: any): never[] | Promise<{
        type: string;
        link: string | null;
        id: string;
        createdAt: Date;
        userId: string;
        message: string;
        read: boolean;
    }[]>;
    getUnread(req: any): never[] | Promise<{
        type: string;
        link: string | null;
        id: string;
        createdAt: Date;
        userId: string;
        message: string;
        read: boolean;
    }[]>;
    getCount(req: any): Promise<{
        count: number;
    }>;
    markAllRead(req: any): Promise<{
        success: boolean;
    }> | {
        success: boolean;
    };
    markRead(id: string, req: any): Promise<{
        success: boolean;
    }> | {
        success: boolean;
    };
    cleanup(req: any): Promise<{
        deleted: number;
    }> | {
        success: boolean;
    };
}
