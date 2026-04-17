import { VersionsService } from './versions.service';
export declare class VersionsController {
    private readonly versionsService;
    constructor(versionsService: VersionsService);
    findAll(resumeId: string): Promise<any>;
    findOne(resumeId: string, versionId: string): Promise<any>;
    restore(resumeId: string, versionId: string, req: any): Promise<{
        success: boolean;
        restoredVersion: any;
    }>;
}
