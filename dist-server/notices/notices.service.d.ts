import { PrismaService } from '../prisma/prisma.service';
export declare class NoticesService {
    private prisma;
    constructor(prisma: PrismaService);
    getAll(type?: string, page?: number, limit?: number): Promise<{
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
    create(data: any): Promise<{
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
    update(id: string, data: any): Promise<{
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
    remove(id: string): Promise<{
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
