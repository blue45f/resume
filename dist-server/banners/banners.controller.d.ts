import { BannersService } from './banners.service';
export declare class BannersController {
    private readonly service;
    constructor(service: BannersService);
    getActive(): Promise<{
        id: string;
        createdAt: Date;
        title: string;
        updatedAt: Date;
        subtitle: string;
        imageUrl: string;
        linkUrl: string;
        bgColor: string;
        isActive: boolean;
        order: number;
        startAt: Date | null;
        endAt: Date | null;
    }[]>;
    getAll(req: any): Promise<{
        id: string;
        createdAt: Date;
        title: string;
        updatedAt: Date;
        subtitle: string;
        imageUrl: string;
        linkUrl: string;
        bgColor: string;
        isActive: boolean;
        order: number;
        startAt: Date | null;
        endAt: Date | null;
    }[]>;
    create(req: any, body: any): Promise<{
        id: string;
        createdAt: Date;
        title: string;
        updatedAt: Date;
        subtitle: string;
        imageUrl: string;
        linkUrl: string;
        bgColor: string;
        isActive: boolean;
        order: number;
        startAt: Date | null;
        endAt: Date | null;
    }>;
    reorder(req: any, body: {
        ids: string[];
    }): Promise<{
        id: string;
        createdAt: Date;
        title: string;
        updatedAt: Date;
        subtitle: string;
        imageUrl: string;
        linkUrl: string;
        bgColor: string;
        isActive: boolean;
        order: number;
        startAt: Date | null;
        endAt: Date | null;
    }[]>;
    update(req: any, id: string, body: any): Promise<{
        id: string;
        createdAt: Date;
        title: string;
        updatedAt: Date;
        subtitle: string;
        imageUrl: string;
        linkUrl: string;
        bgColor: string;
        isActive: boolean;
        order: number;
        startAt: Date | null;
        endAt: Date | null;
    }>;
    remove(req: any, id: string): Promise<{
        id: string;
        createdAt: Date;
        title: string;
        updatedAt: Date;
        subtitle: string;
        imageUrl: string;
        linkUrl: string;
        bgColor: string;
        isActive: boolean;
        order: number;
        startAt: Date | null;
        endAt: Date | null;
    }>;
}
