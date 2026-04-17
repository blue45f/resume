import { Response } from 'express';
import { AttachmentsService } from './attachments.service';
export declare class AttachmentsController {
    private readonly attachmentsService;
    constructor(attachmentsService: AttachmentsService);
    upload(resumeId: string, file: Express.Multer.File, category: string, description: string, req: any): Promise<{
        id: any;
        resumeId: any;
        originalName: any;
        mimeType: any;
        size: any;
        category: any;
        description: any;
        downloadUrl: any;
        createdAt: any;
    }>;
    findAll(resumeId: string, req: any): Promise<any>;
    download(id: string, req: any, res: Response): Promise<void>;
    remove(id: string, req: any): Promise<{
        success: boolean;
    }>;
}
