import { NoticesService } from './notices.service';
export declare class NoticesController {
    private readonly service;
    constructor(service: NoticesService);
    getPopup(): Promise<{
        id: string;
        createdAt: Date;
        content: string;
        title: string;
        updatedAt: Date;
        type: string;
        startAt: Date | null;
        endAt: Date | null;
        isPopup: boolean;
        isPinned: boolean;
    }[]>;
    getAll(type?: string, page?: string, limit?: string): Promise<{
        items: {
            id: string;
            createdAt: Date;
            content: string;
            title: string;
            updatedAt: Date;
            type: string;
            startAt: Date | null;
            endAt: Date | null;
            isPopup: boolean;
            isPinned: boolean;
        }[];
        total: number;
        page: number;
        limit: number;
        totalPages: number;
    }>;
    getOne(id: string): Promise<{
        id: string;
        createdAt: Date;
        content: string;
        title: string;
        updatedAt: Date;
        type: string;
        startAt: Date | null;
        endAt: Date | null;
        isPopup: boolean;
        isPinned: boolean;
    }>;
    create(req: any, body: any): Promise<{
        id: string;
        createdAt: Date;
        content: string;
        title: string;
        updatedAt: Date;
        type: string;
        startAt: Date | null;
        endAt: Date | null;
        isPopup: boolean;
        isPinned: boolean;
    }>;
    update(req: any, id: string, body: any): Promise<{
        id: string;
        createdAt: Date;
        content: string;
        title: string;
        updatedAt: Date;
        type: string;
        startAt: Date | null;
        endAt: Date | null;
        isPopup: boolean;
        isPinned: boolean;
    }>;
    remove(req: any, id: string): Promise<{
        id: string;
        createdAt: Date;
        content: string;
        title: string;
        updatedAt: Date;
        type: string;
        startAt: Date | null;
        endAt: Date | null;
        isPopup: boolean;
        isPinned: boolean;
    }>;
}
