import { VersionsService } from './versions.service';
export declare class VersionsController {
    private readonly versionsService;
    constructor(versionsService: VersionsService);
    findAll(resumeId: string): Promise<{
        createdAt: string;
        description: string;
        id: string;
        versionNumber: number;
    }[]>;
    findOne(resumeId: string, versionId: string): Promise<{
        snapshot: any;
        createdAt: string;
        description: string;
        id: string;
        resumeId: string;
        versionNumber: number;
    }>;
    restore(resumeId: string, versionId: string, req: any): Promise<{
        success: boolean;
        restoredVersion: number;
    }>;
}
