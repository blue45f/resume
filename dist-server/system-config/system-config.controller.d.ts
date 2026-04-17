import { SystemConfigService } from './system-config.service';
export declare class SystemConfigController {
    private readonly service;
    constructor(service: SystemConfigService);
    getPublic(): Promise<{
        [k: string]: any;
    }>;
    getContent(req: any, body: any): Promise<any>;
    setContent(req: any, body: any): Promise<{
        success: boolean;
    }>;
    getPermissions(): Promise<Record<string, string>>;
    setPermissions(body: Record<string, string>): Promise<Record<string, string>>;
    getAll(): Promise<$Public.PrismaPromise<T>>;
    setMany(body: {
        configs: {
            key: string;
            value: string;
        }[];
    }): Promise<any>;
}
