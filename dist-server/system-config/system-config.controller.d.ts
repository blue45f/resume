import { SystemConfigService } from './system-config.service';
export declare class SystemConfigController {
    private readonly service;
    constructor(service: SystemConfigService);
    getPublic(): Promise<{
        [k: string]: string;
    }>;
    getContent(req: any, body: any): Promise<any>;
    setContent(req: any, body: any): Promise<{
        success: boolean;
    }>;
    getPermissions(): Promise<Record<string, string>>;
    setPermissions(body: Record<string, string>): Promise<Record<string, string>>;
    getAll(): Promise<{
        id: string;
        updatedAt: Date;
        value: string;
        key: string;
        label: string;
    }[]>;
    setMany(body: {
        configs: {
            key: string;
            value: string;
        }[];
    }): Promise<{
        id: string;
        updatedAt: Date;
        value: string;
        key: string;
        label: string;
    }[]>;
}
