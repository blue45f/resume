import {
  Controller, Get, Post, Put, Patch, Delete, Body, Param, Req, Query,
} from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { Public } from '../auth/auth.guard';
import { ResumesService } from './resumes.service';
import { CreateResumeDto } from './dto/create-resume.dto';
import { UpdateResumeDto } from './dto/update-resume.dto';

@ApiTags('resumes')
@Controller('resumes')
export class ResumesController {
  constructor(private readonly resumesService: ResumesService) {}

  @Get()
  @ApiOperation({ summary: '내 이력서 목록 (로그인 시) 또는 공개 이력서 목록' })
  findAll(@Req() req: any, @Query('public') isPublic?: string) {
    if (isPublic === 'true') {
      return this.resumesService.findPublic();
    }
    return this.resumesService.findAll(req.user?.id);
  }

  @Get('public')
  @Public()
  @ApiOperation({ summary: '공개 이력서 목록' })
  findPublicResumes() {
    return this.resumesService.findPublic();
  }

  @Get(':id')
  @ApiOperation({ summary: '이력서 상세 조회' })
  findOne(@Param('id') id: string, @Req() req: any) {
    return this.resumesService.findOne(id, req.user?.id);
  }

  @Post()
  @ApiOperation({ summary: '이력서 생성' })
  create(@Body() dto: CreateResumeDto, @Req() req: any) {
    return this.resumesService.create(dto, req.user?.id);
  }

  @Put(':id')
  @ApiOperation({ summary: '이력서 수정' })
  update(@Param('id') id: string, @Body() dto: UpdateResumeDto) {
    return this.resumesService.update(id, dto);
  }

  @Patch(':id/visibility')
  @ApiOperation({ summary: '이력서 공개/비공개 설정' })
  setVisibility(
    @Param('id') id: string,
    @Body('visibility') visibility: string,
  ) {
    return this.resumesService.setVisibility(id, visibility);
  }

  @Delete(':id')
  @ApiOperation({ summary: '이력서 삭제' })
  remove(@Param('id') id: string) {
    return this.resumesService.remove(id);
  }

  @Post(':id/duplicate')
  @ApiOperation({ summary: '이력서 복제' })
  duplicate(@Param('id') id: string, @Req() req: any) {
    return this.resumesService.duplicate(id, req.user?.id);
  }
}
