import { VersionsService } from './versions.service';
export declare class VersionsController {
    private readonly versionsService;
    constructor(versionsService: VersionsService);
    findAll(resumeId: string): Promise<{
        createdAt: string;
        id: string;
        description: string;
        versionNumber: number;
    }[]>;
    findOne(resumeId: string, versionId: string): Promise<{
        snapshot: any;
        createdAt: string;
        id: string;
        description: string;
        resumeId: string;
        versionNumber: number;
    }>;
    restore(resumeId: string, versionId: string): Promise<{
        success: boolean;
        restoredVersion: number;
    }>;
}
