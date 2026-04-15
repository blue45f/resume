import { PrismaService } from '../prisma/prisma.service';
export declare class SystemConfigService {
    private prisma;
    constructor(prisma: PrismaService);
    getAll(): Promise<{
        id: string;
        key: string;
        value: string;
        label: string;
        updatedAt: Date;
    }[]>;
    get(key: string): Promise<string | null>;
    getBoolean(key: string, defaultValue?: boolean): Promise<boolean>;
    getNumber(key: string, defaultValue?: number): Promise<number>;
    set(key: string, value: string): Promise<{
        id: string;
        key: string;
        value: string;
        label: string;
        updatedAt: Date;
    }>;
    setMany(configs: {
        key: string;
        value: string;
    }[]): Promise<{
        id: string;
        key: string;
        value: string;
        label: string;
        updatedAt: Date;
    }[]>;
    getPublicConfig(): Promise<{
        [k: string]: string;
    }>;
}
