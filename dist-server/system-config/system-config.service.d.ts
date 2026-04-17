import { PrismaService } from '../prisma/prisma.service';
export declare class SystemConfigService {
    private prisma;
    constructor(prisma: PrismaService);
    getAll(): Promise<{
        id: string;
        updatedAt: Date;
        value: string;
        key: string;
        label: string;
    }[]>;
    get(key: string): Promise<string | null>;
    getBoolean(key: string, defaultValue?: boolean): Promise<boolean>;
    getNumber(key: string, defaultValue?: number): Promise<number>;
    set(key: string, value: string): Promise<{
        id: string;
        updatedAt: Date;
        value: string;
        key: string;
        label: string;
    }>;
    setMany(configs: {
        key: string;
        value: string;
    }[]): Promise<{
        id: string;
        updatedAt: Date;
        value: string;
        key: string;
        label: string;
    }[]>;
    getPublicConfig(): Promise<{
        [k: string]: string;
    }>;
    private static readonly PERMISSION_DEFAULTS;
    getPermissions(): Promise<Record<string, string>>;
    setPermissions(perms: Record<string, string>): Promise<Record<string, string>>;
    checkPermission(permKey: string, user: {
        id?: string;
        role?: string;
        userType?: string;
    } | null, authorId?: string | null): Promise<boolean>;
}
