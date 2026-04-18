import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Param,
  Body,
  Req,
  Query,
  UnauthorizedException,
} from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { Public } from '../auth/auth.guard';
import { JobsService } from './jobs.service';

@ApiTags('jobs')
@Controller('jobs')
export class JobsController {
  constructor(private readonly service: JobsService) {}

  // ── 정적 경로는 반드시 :id 앞에 위치해야 함 ──────────────────────────

  @Get()
  @Public()
  @ApiOperation({ summary: '채용 공고 목록' })
  findAll(@Query('q') query?: string, @Query('status') status?: string) {
    return this.service.findAll(status || 'active', query);
  }

  @Get('stats')
  @Public()
  @ApiOperation({ summary: '채용 통계' })
  async getStats(
    @Query('location') location?: string,
    @Query('type') type?: string,
    @Query('skill') skill?: string,
  ) {
    return this.service.getJobStats(location, type, skill);
  }

  @Get('my')
  @ApiOperation({ summary: '내 채용 공고' })
  findMy(@Req() req: any) {
    if (!req.user?.id) return [];
    return this.service.findByUser(req.user.id);
  }

  // ── External Job Links (정적 경로 — :id 앞에 반드시 위치) ───────────

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
    return this.service.getExternalLinks({
      category,
      companySize,
      careerLevel,
      jobType,
      location,
      jobCategory,
      q,
    });
  }

  @Post('external-links')
  @ApiOperation({ summary: '외부 채용 링크 등록' })
  createExternalLink(@Body() body: any, @Req() req: any) {
    if (!req.user?.id) throw new UnauthorizedException('로그인이 필요합니다');
    return this.service.createExternalLink(body, {
      id: req.user.id,
      role: req.user.role,
      userType: req.user.userType,
    });
  }

  @Post('external-links/:id/click')
  @Public()
  @ApiOperation({ summary: '외부 채용 링크 클릭 추적 + URL 반환' })
  recordClick(@Param('id') id: string) {
    return this.service.recordExternalLinkClick(id);
  }

  @Put('external-links/:id')
  @ApiOperation({ summary: '외부 채용 링크 수정' })
  updateExternalLink(@Param('id') id: string, @Body() body: any, @Req() req: any) {
    if (!req.user?.id) throw new UnauthorizedException('로그인이 필요합니다');
    return this.service.updateExternalLink(id, body, {
      id: req.user.id,
      role: req.user.role,
      userType: req.user.userType,
    });
  }

  @Delete('external-links/:id')
  @ApiOperation({ summary: '외부 채용 링크 삭제' })
  deleteExternalLink(@Param('id') id: string, @Req() req: any) {
    if (!req.user?.id) throw new UnauthorizedException('로그인이 필요합니다');
    return this.service.deleteExternalLink(id, {
      id: req.user.id,
      role: req.user.role,
      userType: req.user.userType,
    });
  }

  // ── Curated Jobs (외부 채용 정보 카드) ───────────────────────────────

  @Get('curated/list')
  @Public()
  @ApiOperation({ summary: '큐레이션 채용 정보 목록' })
  getCuratedJobs(
    @Query('jobType') jobType?: string,
    @Query('experienceLevel') experienceLevel?: string,
    @Query('companySize') companySize?: string,
    @Query('industry') industry?: string,
    @Query('location') location?: string,
    @Query('q') q?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.service.getCuratedJobs({
      jobType,
      experienceLevel,
      companySize,
      industry,
      location,
      q,
      page: page ? parseInt(page) : 1,
      limit: limit ? parseInt(limit) : 20,
    });
  }

  @Get('curated/:id')
  @Public()
  @ApiOperation({ summary: '큐레이션 채용 정보 상세' })
  getCuratedJob(@Param('id') id: string) {
    return this.service.getCuratedJob(id);
  }

  @Post('curated')
  @ApiOperation({ summary: '큐레이션 채용 정보 등록 (관리자/채용담당자)' })
  createCuratedJob(@Body() body: any, @Req() req: any) {
    return this.service.createCuratedJob(body, req.user?.id, req.user?.role, req.user?.userType);
  }

  @Put('curated/:id')
  @ApiOperation({ summary: '큐레이션 채용 정보 수정' })
  updateCuratedJob(@Param('id') id: string, @Body() body: any, @Req() req: any) {
    return this.service.updateCuratedJob(
      id,
      body,
      req.user?.id,
      req.user?.role,
      req.user?.userType,
    );
  }

  @Delete('curated/:id')
  @ApiOperation({ summary: '큐레이션 채용 정보 삭제' })
  deleteCuratedJob(@Param('id') id: string, @Req() req: any) {
    return this.service.deleteCuratedJob(id, req.user?.id, req.user?.role, req.user?.userType);
  }

  @Post('curated/:id/click')
  @Public()
  @ApiOperation({ summary: '큐레이션 채용 클릭 추적' })
  recordCuratedJobClick(@Param('id') id: string) {
    return this.service.recordCuratedJobClick(id);
  }

  // ── 동적 :id 경로 — 반드시 정적 경로 뒤에 위치 ─────────────────────

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
}
