import { SystemConfigService } from './system-config.service';
export declare class SystemConfigController {
    private readonly service;
    constructor(service: SystemConfigService);
    getPublic(): Promise<{
        [k: string]: string;
    }>;
    getAll(req: any): Promise<{
        id: string;
        updatedAt: Date;
        key: string;
        value: string;
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
        key: string;
        value: string;
        label: string;
    }[]>;
}
