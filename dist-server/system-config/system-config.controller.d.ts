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
    setPermissions(req: any, body: Record<string, string>): Promise<Record<string, string>>;
    getAll(req: any): Promise<{
        id: string;
        updatedAt: Date;
        value: string;
        key: string;
        label: string;
    }[]>;
    setMany(req: any, body: {
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
