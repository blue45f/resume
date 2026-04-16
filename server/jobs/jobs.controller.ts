import { Controller, Get, Post, Put, Delete, Param, Body, Req, Query } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { Public } from '../auth/auth.guard';
import { JobsService } from './jobs.service';

@ApiTags('jobs')
@Controller('jobs')
export class JobsController {
  constructor(private readonly service: JobsService) {}

  @Get()
  @Public()
  @ApiOperation({ summary: '채용 공고 목록' })
  findAll(@Query('q') query?: string, @Query('status') status?: string) {
    return this.service.findAll(status || 'active', query);
  }

  @Get('my')
  @ApiOperation({ summary: '내 채용 공고' })
  findMy(@Req() req: any) {
    if (!req.user?.id) return [];
    return this.service.findByUser(req.user.id);
  }

  @Get(':id')
  @Public()
  @ApiOperation({ summary: '채용 공고 상세' })
  findOne(@Param('id') id: string) {
    return this.service.findOne(id);
  }

  @Post()
  @ApiOperation({ summary: '채용 공고 등록' })
  create(@Body() body: any, @Req() req: any) {
    if (!req.user?.id) return { error: '로그인 필요' };
    return this.service.create(req.user.id, body);
  }

  @Put(':id')
  @ApiOperation({ summary: '채용 공고 수정' })
  update(@Param('id') id: string, @Body() body: any, @Req() req: any) {
    return this.service.update(id, req.user?.id, body);
  }

  @Delete(':id')
  @ApiOperation({ summary: '채용 공고 삭제' })
  remove(@Param('id') id: string, @Req() req: any) {
    return this.service.remove(id, req.user?.id, req.user?.role);
  }

  // ── External Job Links ──────────────────────────────────────────────

  @Get('external-links/list')
  @Public()
  @ApiOperation({ summary: '외부 채용 링크 목록 (필터 지원)' })
  getExternalLinks(
    @Query('category') category?: string,
    @Query('companySize') companySize?: string,
    @Query('careerLevel') careerLevel?: string,
    @Query('jobType') jobType?: string,
    @Query('location') location?: string,
    @Query('jobCategory') jobCategory?: string,
    @Query('q') q?: string,
  ) {
    return this.service.getExternalLinks({ category, companySize, careerLevel, jobType, location, jobCategory, q });
  }

  @Post('external-links/:id/click')
  @Public()
  @ApiOperation({ summary: '외부 채용 링크 클릭 추적 + URL 반환' })
  recordClick(@Param('id') id: string) {
    return this.service.recordExternalLinkClick(id);
  }

  @Post('external-links')
  @ApiOperation({ summary: '[어드민] 외부 채용 링크 등록' })
  createExternalLink(@Body() body: any, @Req() req: any) {
    return this.service.createExternalLink(body, req.user?.role);
  }

  @Put('external-links/:id')
  @ApiOperation({ summary: '[어드민] 외부 채용 링크 수정' })
  updateExternalLink(@Param('id') id: string, @Body() body: any, @Req() req: any) {
    return this.service.updateExternalLink(id, body, req.user?.role);
  }

  @Delete('external-links/:id')
  @ApiOperation({ summary: '[어드민] 외부 채용 링크 삭제' })
  deleteExternalLink(@Param('id') id: string, @Req() req: any) {
    return this.service.deleteExternalLink(id, req.user?.role);
  }
}
