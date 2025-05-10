import { TagsService } from './tags.service';
import { CreateTagDto } from './dto/tag.dto';
export declare class TagsController {
    private readonly tagsService;
    constructor(tagsService: TagsService);
    findAll(): Promise<{
        id: string;
        name: string;
        color: string;
        resumeCount: number;
    }[]>;
    create(dto: CreateTagDto): Promise<{
        name: string;
        id: string;
        color: string;
    }>;
    remove(id: string): Promise<{
        success: boolean;
    }>;
    addToResume(tagId: string, resumeId: string): Promise<{
        success: boolean;
    }>;
    removeFromResume(tagId: string, resumeId: string): Promise<{
        success: boolean;
    }>;
}
