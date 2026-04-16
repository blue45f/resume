import { SystemConfigService } from './system-config.service';
export declare class SystemConfigController {
    private readonly service;
    constructor(service: SystemConfigService);
    getPublic(): Promise<{
        [k: string]: string;
    }>;
    getPermissions(): Promise<Record<string, string>>;
    setPermissions(req: any, body: Record<string, string>): Promise<Record<string, string>>;
    getAll(req: any): Promise<{
        id: string;
        key: string;
        value: string;
        label: string;
        updatedAt: Date;
    }[]>;
    setMany(req: any, body: {
        configs: {
            key: string;
            value: string;
        }[];
    }): Promise<{
        id: string;
        key: string;
        value: string;
        label: string;
        updatedAt: Date;
    }[]>;
}
