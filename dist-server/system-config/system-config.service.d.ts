import { PrismaService } from '../prisma/prisma.service';
export declare class SystemConfigService {
    private prisma;
    constructor(prisma: PrismaService);
    getAll(): Promise<$Public.PrismaPromise<T>>;
    get(key: string): Promise<string | null>;
    getBoolean(key: string, defaultValue?: boolean): Promise<boolean>;
    getNumber(key: string, defaultValue?: number): Promise<number>;
    set(key: string, value: string): Promise<$Result.GetResult<import(".prisma/client").Prisma.$SystemConfigPayload<ExtArgs>, T, "upsert", GlobalOmitOptions>>;
    setMany(configs: {
        key: string;
        value: string;
    }[]): Promise<any>;
    getPublicConfig(): Promise<{
        [k: string]: any;
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
