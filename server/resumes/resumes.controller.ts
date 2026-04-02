import {
  Controller, Get, Post, Put, Patch, Delete, Body, Param, Req, Query, Res,
} from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { Response } from 'express';
import { Public } from '../auth/auth.guard';
import { CacheTTL } from '../common/interceptors/cache.interceptor';
import { ResumesService } from './resumes.service';
import { ExportService } from './export.service';
import { AnalyticsService } from './analytics.service';
import { CreateResumeDto } from './dto/create-resume.dto';
import { UpdateResumeDto } from './dto/update-resume.dto';

@ApiTags('resumes')
@Controller('resumes')
export class ResumesController {
  constructor(
    private readonly resumesService: ResumesService,
    private readonly exportService: ExportService,
    private readonly analyticsService: AnalyticsService,
  ) {}

  @Get()
  @ApiOperation({ summary: '내 이력서 목록 (로그인 시) 또는 공개 이력서 목록' })
  findAll(
    @Req() req: any,
    @Query('public') isPublic?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    if (isPublic === 'true') {
      return this.resumesService.findPublic();
    }
    return this.resumesService.findAll(
      req.user?.id,
      parseInt(page || '1'),
      Math.min(parseInt(limit || '20'), 50),
    );
  }

  @Get('dashboard/analytics')
  @ApiOperation({ summary: '사용자 대시보드 분석' })
  analytics(@Req() req: any) {
    return this.analyticsService.getUserDashboard(req.user?.id);
  }

  @Get('bookmarks/list')
  @ApiOperation({ summary: '내 북마크 목록' })
  getBookmarks(@Req() req: any) {
    if (!req.user?.id) return [];
    return this.resumesService.getBookmarks(req.user.id);
  }

  @Get('@:username/:slug')
  @Public()
  @CacheTTL(60)
  @ApiOperation({ summary: '슬러그로 이력서 조회 (/@username/slug)' })
  findBySlug(@Param('username') username: string, @Param('slug') slug: string) {
    return this.resumesService.findBySlug(username, slug);
  }

  @Get('public')
  @Public()
  @CacheTTL(60)
  @ApiOperation({ summary: '공개 이력서 검색/목록' })
  findPublicResumes(
    @Query('q') query?: string,
    @Query('tag') tag?: string,
    @Query('sort') sort?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.resumesService.searchPublic({
      query, tag, sort,
      page: parseInt(page || '1'),
      limit: Math.min(parseInt(limit || '20'), 50),
    });
  }

  @Get(':id/bookmark/status')
  @ApiOperation({ summary: '북마크 여부 확인' })
  async isBookmarked(@Param('id') id: string, @Req() req: any) {
    if (!req.user?.id) return { bookmarked: false };
    const bookmarked = await this.resumesService.isBookmarked(id, req.user.id);
    return { bookmarked };
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
  update(@Param('id') id: string, @Body() dto: UpdateResumeDto, @Req() req: any) {
    return this.resumesService.update(id, dto, req.user?.id);
  }

  @Patch(':id/visibility')
  @ApiOperation({ summary: '이력서 공개/비공개 설정' })
  setVisibility(
    @Param('id') id: string,
    @Body('visibility') visibility: string,
    @Req() req: any,
  ) {
    return this.resumesService.setVisibility(id, visibility, req.user?.id);
  }

  @Delete(':id')
  @ApiOperation({ summary: '이력서 삭제' })
  remove(@Param('id') id: string, @Req() req: any) {
    return this.resumesService.remove(id, req.user?.id);
  }

  @Post(':id/bookmark')
  @ApiOperation({ summary: '이력서 북마크 추가' })
  addBookmark(@Param('id') id: string, @Req() req: any) {
    if (!req.user?.id) return { error: '로그인이 필요합니다' };
    return this.resumesService.addBookmark(id, req.user.id);
  }

  @Delete(':id/bookmark')
  @ApiOperation({ summary: '이력서 북마크 해제' })
  removeBookmark(@Param('id') id: string, @Req() req: any) {
    if (!req.user?.id) return { error: '로그인이 필요합니다' };
    return this.resumesService.removeBookmark(id, req.user.id);
  }

  @Post(':id/duplicate')
  @ApiOperation({ summary: '이력서 복제' })
  duplicate(@Param('id') id: string, @Req() req: any) {
    return this.resumesService.duplicate(id, req.user?.id);
  }

  @Get(':id/export/text')
  @ApiOperation({ summary: '이력서 텍스트 내보내기' })
  async exportText(@Param('id') id: string, @Res() res: Response) {
    const text = await this.exportService.exportAsText(id);
    res.setHeader('Content-Type', 'text/plain; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="resume.txt"`);
    res.send(text);
  }

  @Get(':id/export/markdown')
  @ApiOperation({ summary: '이력서 마크다운 내보내기' })
  async exportMarkdown(@Param('id') id: string, @Res() res: Response) {
    const text = await this.exportService.exportAsMarkdown(id);
    res.setHeader('Content-Type', 'text/markdown; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="resume.md"`);
    res.send(text);
  }
}
