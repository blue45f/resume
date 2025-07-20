import { Controller, Get, Post, Delete, Body, Param, Req } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { ResumesService } from '../resumes/resumes.service';
import { TagsService } from './tags.service';
import { CreateTagDto } from './dto/tag.dto';

@ApiTags('tags')
@Controller('tags')
export class TagsController {
  constructor(
    private readonly tagsService: TagsService,
    private readonly resumesService: ResumesService,
  ) {}

  @Get()
  @ApiOperation({ summary: '태그 목록 조회' })
  findAll() {
    return this.tagsService.findAll();
  }

  @Post()
  @ApiOperation({ summary: '태그 생성' })
  create(@Body() dto: CreateTagDto, @Req() req: any) {
    return this.tagsService.create(dto, req.user?.id);
  }

  @Delete(':id')
  @ApiOperation({ summary: '태그 삭제' })
  remove(@Param('id') id: string, @Req() req: any) {
    return this.tagsService.remove(id, req.user?.id, req.user?.role);
  }

  @Post(':tagId/resumes/:resumeId')
  @ApiOperation({ summary: '이력서에 태그 추가' })
  async addToResume(
    @Param('tagId') tagId: string,
    @Param('resumeId') resumeId: string,
    @Req() req: any,
  ) {
    await this.resumesService.findOne(resumeId, req.user?.id);
    return this.tagsService.addTagToResume(resumeId, tagId);
  }

  @Delete(':tagId/resumes/:resumeId')
  @ApiOperation({ summary: '이력서에서 태그 제거' })
  async removeFromResume(
    @Param('tagId') tagId: string,
    @Param('resumeId') resumeId: string,
    @Req() req: any,
  ) {
    await this.resumesService.findOne(resumeId, req.user?.id);
    return this.tagsService.removeTagFromResume(resumeId, tagId);
  }
}
