import { NotificationsService } from './notifications.service';
export declare class NotificationsController {
    private readonly service;
    constructor(service: NotificationsService);
    getAll(req: any): never[] | Promise<{
        id: string;
        userId: string;
        createdAt: Date;
        link: string | null;
        type: string;
        message: string;
        read: boolean;
    }[]>;
    getUnread(req: any): never[] | Promise<{
        id: string;
        userId: string;
        createdAt: Date;
        link: string | null;
        type: string;
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
    deleteOne(id: string, req: any): Promise<{
        success: boolean;
    }> | {
        success: boolean;
    };
    deleteBulk(body: {
        ids: string[];
    }, req: any): Promise<{
        success: boolean;
        deleted: number;
    }> | {
        success: boolean;
    };
    cleanup(req: any): Promise<{
        deleted: number;
    }> | {
        success: boolean;
    };
}
