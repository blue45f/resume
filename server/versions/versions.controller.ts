import { Controller, Get, Post, Param } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { VersionsService } from './versions.service';

@ApiTags('versions')
@Controller('resumes/:resumeId/versions')
export class VersionsController {
  constructor(private readonly versionsService: VersionsService) {}

  @Get()
  @ApiOperation({ summary: '이력서 버전 목록 조회' })
  findAll(@Param('resumeId') resumeId: string) {
    return this.versionsService.findAll(resumeId);
  }

  @Get(':versionId')
  @ApiOperation({ summary: '특정 버전 상세 조회' })
  findOne(
    @Param('resumeId') resumeId: string,
    @Param('versionId') versionId: string,
  ) {
    return this.versionsService.findOne(resumeId, versionId);
  }

  @Post(':versionId/restore')
  @ApiOperation({ summary: '특정 버전으로 복원' })
  restore(
    @Param('resumeId') resumeId: string,
    @Param('versionId') versionId: string,
  ) {
    return this.versionsService.restore(resumeId, versionId);
  }
}
