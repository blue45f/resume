import { BannersService } from './banners.service';
export declare class BannersController {
    private readonly service;
    constructor(service: BannersService);
    getActive(): Promise<{
        id: string;
        createdAt: Date;
        updatedAt: Date;
        title: string;
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
        updatedAt: Date;
        title: string;
        subtitle: string;
        imageUrl: string;
        linkUrl: string;
        bgColor: string;
        isActive: boolean;
        order: number;
        startAt: Date | null;
        endAt: Date | null;
    }[]>;
    create(body: any): Promise<{
        id: string;
        createdAt: Date;
        updatedAt: Date;
        title: string;
        subtitle: string;
        imageUrl: string;
        linkUrl: string;
        bgColor: string;
        isActive: boolean;
        order: number;
        startAt: Date | null;
        endAt: Date | null;
    }>;
    reorder(body: {
        ids: string[];
    }): Promise<{
        id: string;
        createdAt: Date;
        updatedAt: Date;
        title: string;
        subtitle: string;
        imageUrl: string;
        linkUrl: string;
        bgColor: string;
        isActive: boolean;
        order: number;
        startAt: Date | null;
        endAt: Date | null;
    }[]>;
    update(id: string, body: any): Promise<{
        id: string;
        createdAt: Date;
        updatedAt: Date;
        title: string;
        subtitle: string;
        imageUrl: string;
        linkUrl: string;
        bgColor: string;
        isActive: boolean;
        order: number;
        startAt: Date | null;
        endAt: Date | null;
    }>;
    remove(id: string): Promise<{
        id: string;
        createdAt: Date;
        updatedAt: Date;
        title: string;
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
