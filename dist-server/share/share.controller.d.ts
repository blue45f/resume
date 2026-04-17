import { ResumesService } from '../resumes/resumes.service';
import { ShareService } from './share.service';
import { CreateShareLinkDto } from './dto/share.dto';
export declare class ShareController {
    private readonly shareService;
    private readonly resumesService;
    constructor(shareService: ShareService, resumesService: ResumesService);
    createLink(resumeId: string, dto: CreateShareLinkDto, req: any): Promise<{
        id: any;
        token: any;
        url: string;
        expiresAt: any;
        hasPassword: boolean;
        createdAt: any;
    }>;
    getLinks(resumeId: string, req: any): Promise<any>;
    removeLink(id: string, req: any): Promise<{
        success: boolean;
    }>;
    getShared(token: string, password?: string): Promise<any>;
}
