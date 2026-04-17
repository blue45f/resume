import { PrismaService } from '../prisma/prisma.service';
export declare class BannersService {
    private prisma;
    constructor(prisma: PrismaService);
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
    getAll(): Promise<{
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
    create(data: any): Promise<{
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
    update(id: string, data: any): Promise<{
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
    reorder(ids: string[]): Promise<{
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
}
