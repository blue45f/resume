import { Controller, Get, Patch, Delete, Body, Param, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { AdminGuard } from '../common/guards/admin.guard';
import { StudyGroupsService } from './study-groups.service';

@ApiTags('study-groups-admin')
@Controller('study-groups/admin')
@UseGuards(AdminGuard)
export class StudyGroupsAdminController {
  constructor(private readonly service: StudyGroupsService) {}

  @Get('all')
  @ApiOperation({ summary: '[관리자] 전체 스터디 그룹 목록' })
  list(
    @Query('q') q?: string,
    @Query('tier') tier?: string,
    @Query('cafe') cafe?: string,
    @Query('experienceLevel') experienceLevel?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.service.adminList({
      q,
      tier,
      cafe,
      experienceLevel,
      page: page ? parseInt(page, 10) : 1,
      limit: limit ? parseInt(limit, 10) : 20,
    });
  }

  @Patch(':id/force-close')
  @ApiOperation({ summary: '[관리자] 그룹 강제 종료' })
  forceClose(@Param('id') id: string) {
    return this.service.adminForceClose(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: '[관리자] 그룹 수정' })
  update(@Param('id') id: string, @Body() body: any) {
    return this.service.adminUpdate(id, body);
  }

  @Delete(':id')
  @ApiOperation({ summary: '[관리자] 그룹 삭제' })
  remove(@Param('id') id: string) {
    return this.service.adminDelete(id);
  }
}
