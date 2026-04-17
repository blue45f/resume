import { Controller, Get, Post, Param, Req, UnauthorizedException } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { VersionsService } from './versions.service';

@ApiTags('versions')
@Controller('resumes/:resumeId/versions')
export class VersionsController {
  constructor(private readonly versionsService: VersionsService) {}

  @Get()
  @ApiOperation({ summary: '이력서 버전 목록 조회 (소유자 전용)' })
  findAll(@Param('resumeId') resumeId: string, @Req() req: any) {
    if (!req.user?.id) throw new UnauthorizedException('로그인이 필요합니다');
    return this.versionsService.findAll(resumeId, req.user.id, req.user.role);
  }

  @Get(':versionId')
  @ApiOperation({ summary: '특정 버전 상세 조회 (소유자 전용)' })
  findOne(
    @Param('resumeId') resumeId: string,
    @Param('versionId') versionId: string,
    @Req() req: any,
  ) {
    if (!req.user?.id) throw new UnauthorizedException('로그인이 필요합니다');
    return this.versionsService.findOne(resumeId, versionId, req.user.id, req.user.role);
  }

  @Post(':versionId/restore')
  @ApiOperation({ summary: '특정 버전으로 복원' })
  restore(
    @Param('resumeId') resumeId: string,
    @Param('versionId') versionId: string,
    @Req() req: any,
  ) {
    if (!req.user?.id) throw new UnauthorizedException('로그인이 필요합니다');
    return this.versionsService.restore(resumeId, versionId, req.user.id, req.user.role);
  }
}
