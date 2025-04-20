import { Controller, Get, Post, Delete, Body, Param } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { TagsService } from './tags.service';
import { CreateTagDto } from './dto/tag.dto';

@ApiTags('tags')
@Controller('tags')
export class TagsController {
  constructor(private readonly tagsService: TagsService) {}

  @Get()
  @ApiOperation({ summary: '태그 목록 조회' })
  findAll() {
    return this.tagsService.findAll();
  }

  @Post()
  @ApiOperation({ summary: '태그 생성' })
  create(@Body() dto: CreateTagDto) {
    return this.tagsService.create(dto);
  }

  @Delete(':id')
  @ApiOperation({ summary: '태그 삭제' })
  remove(@Param('id') id: string) {
    return this.tagsService.remove(id);
  }

  @Post(':tagId/resumes/:resumeId')
  @ApiOperation({ summary: '이력서에 태그 추가' })
  addToResume(
    @Param('tagId') tagId: string,
    @Param('resumeId') resumeId: string,
  ) {
    return this.tagsService.addTagToResume(resumeId, tagId);
  }

  @Delete(':tagId/resumes/:resumeId')
  @ApiOperation({ summary: '이력서에서 태그 제거' })
  removeFromResume(
    @Param('tagId') tagId: string,
    @Param('resumeId') resumeId: string,
  ) {
    return this.tagsService.removeTagFromResume(resumeId, tagId);
  }
}
