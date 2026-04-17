import { NotificationsService } from './notifications.service';
export declare class NotificationsController {
    private readonly service;
    constructor(service: NotificationsService);
    getAll(req: any): Promise<$Public.PrismaPromise<T>> | never[];
    getUnread(req: any): Promise<$Public.PrismaPromise<T>> | never[];
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
        deleted: $Public.PrismaPromise<T>;
    }> | {
        success: boolean;
    };
    cleanup(req: any): Promise<{
        deleted: $Public.PrismaPromise<T>;
    }> | {
        success: boolean;
    };
}
