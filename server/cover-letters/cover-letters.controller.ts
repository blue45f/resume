import { Controller, Get, Post, Put, Delete, Param, Body, Req } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { CoverLettersService } from './cover-letters.service';

@ApiTags('cover-letters')
@Controller('cover-letters')
export class CoverLettersController {
  constructor(private readonly service: CoverLettersService) {}

  @Get()
  @ApiOperation({ summary: '내 자소서 목록' })
  findAll(@Req() req: any) {
    if (!req.user?.id) return [];
    return this.service.findAll(req.user.id);
  }

  @Get(':id')
  @ApiOperation({ summary: '자소서 상세' })
  findOne(@Param('id') id: string, @Req() req: any) {
    return this.service.findOne(id, req.user?.id);
  }

  @Post()
  @ApiOperation({ summary: '자소서 저장' })
  create(@Body() body: any, @Req() req: any) {
    if (!req.user?.id) return { error: '로그인 필요' };
    return this.service.create(req.user.id, body);
  }

  @Put(':id')
  @ApiOperation({ summary: '자소서 수정' })
  update(@Param('id') id: string, @Body() body: any, @Req() req: any) {
    return this.service.update(id, req.user?.id, body);
  }

  @Delete(':id')
  @ApiOperation({ summary: '자소서 삭제' })
  remove(@Param('id') id: string, @Req() req: any) {
    return this.service.remove(id, req.user?.id);
  }

  @Get('resume/:resumeId')
  @ApiOperation({ summary: '이력서별 자소서 목록' })
  getByResume(@Param('resumeId') resumeId: string, @Req() req: any) {
    if (!req.user?.id) return [];
    return this.service.getByResume(resumeId, req.user.id);
  }
}
