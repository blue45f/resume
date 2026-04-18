import { Controller, Get, Patch, Delete, Body, Param, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { AdminGuard } from '../common/guards/admin.guard';
import { JobInterviewQuestionsService } from './job-interview-questions.service';

@ApiTags('job-interview-questions-admin')
@Controller('job-interview-questions/admin')
@UseGuards(AdminGuard)
export class JobInterviewQuestionsAdminController {
  constructor(private readonly service: JobInterviewQuestionsService) {}

  @Get('all')
  @ApiOperation({ summary: '[관리자] 면접 질문 전체 목록' })
  list(
    @Query('status') status?: string,
    @Query('q') q?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.service.adminList({
      status,
      q,
      page: page ? parseInt(page, 10) : 1,
      limit: limit ? parseInt(limit, 10) : 20,
    });
  }

  @Patch(':id/approve')
  @ApiOperation({ summary: '[관리자] 질문 채택' })
  approve(@Param('id') id: string) {
    return this.service.adminApprove(id);
  }

  @Patch(':id/reject')
  @ApiOperation({ summary: '[관리자] 질문 반려' })
  reject(@Param('id') id: string) {
    return this.service.adminReject(id);
  }

  @Patch(':id/upvotes')
  @ApiOperation({ summary: '[관리자] upvote 수동 조정' })
  setUpvotes(@Param('id') id: string, @Body() body: { upvotes: number }) {
    return this.service.adminSetUpvotes(id, body.upvotes);
  }

  @Delete(':id')
  @ApiOperation({ summary: '[관리자] 질문 삭제' })
  remove(@Param('id') id: string) {
    return this.service.adminDelete(id);
  }
}
