import { ResumesService } from '../resumes/resumes.service';
import { TagsService } from './tags.service';
import { CreateTagDto } from './dto/tag.dto';
export declare class TagsController {
    private readonly tagsService;
    private readonly resumesService;
    constructor(tagsService: TagsService, resumesService: ResumesService);
    findAll(): Promise<any>;
    create(dto: CreateTagDto, req: any): Promise<$Result.GetResult<import(".prisma/client").Prisma.$TagPayload<ExtArgs>, T, "create", GlobalOmitOptions>>;
    remove(id: string, req: any): Promise<{
        success: boolean;
    }>;
    addToResume(tagId: string, resumeId: string, req: any): Promise<{
        success: boolean;
    }>;
    removeFromResume(tagId: string, resumeId: string, req: any): Promise<{
        success: boolean;
    }>;
}
