import { Controller, Get, Patch, Delete, Body, Param, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { AdminGuard } from '../common/guards/admin.guard';
import { StudyGroupsService, type AdminStudyGroupUpdateInput } from './study-groups.service';

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

  // ─── 게시글/댓글/답변 모더레이션 ─────────────────────
  @Get('posts')
  @ApiOperation({ summary: '[관리자] 전체 그룹 게시글 모더레이션 목록' })
  listPosts(
    @Query('q') q?: string,
    @Query('groupId') groupId?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.service.adminListPosts({
      q,
      groupId,
      page: page ? parseInt(page, 10) : 1,
      limit: limit ? parseInt(limit, 10) : 20,
    });
  }

  @Delete('posts/:postId')
  @ApiOperation({ summary: '[관리자] 게시글 삭제' })
  removePost(@Param('postId') postId: string) {
    return this.service.adminDeletePost(postId);
  }

  @Patch('posts/:postId/attachments')
  @ApiOperation({ summary: '[관리자] 게시글 첨부 제거 (url 일치 항목)' })
  removePostAttachment(@Param('postId') postId: string, @Body() body: { url: string }) {
    return this.service.adminRemovePostAttachment(postId, body?.url);
  }

  @Get('posts/:postId/comments')
  @ApiOperation({ summary: '[관리자] 게시글 댓글 목록 (모더레이션용, tombstone 포함)' })
  listPostComments(@Param('postId') postId: string) {
    return this.service.adminListPostComments(postId);
  }

  @Delete('comments/:commentId')
  @ApiOperation({ summary: '[관리자] 게시글 댓글 삭제 (답글 있으면 tombstone)' })
  removeComment(@Param('commentId') commentId: string) {
    return this.service.adminDeleteComment(commentId);
  }

  @Get('answers')
  @ApiOperation({ summary: '[관리자] 전체 그룹 문제 답변 모더레이션 목록' })
  listAnswers(
    @Query('q') q?: string,
    @Query('groupId') groupId?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.service.adminListAnswers({
      q,
      groupId,
      page: page ? parseInt(page, 10) : 1,
      limit: limit ? parseInt(limit, 10) : 20,
    });
  }

  @Delete('answers/:answerId')
  @ApiOperation({ summary: '[관리자] 문제 답변 삭제 (답글 있으면 tombstone)' })
  removeAnswer(@Param('answerId') answerId: string) {
    return this.service.adminDeleteAnswer(answerId);
  }

  @Patch(':id/force-close')
  @ApiOperation({ summary: '[관리자] 그룹 강제 종료' })
  forceClose(@Param('id') id: string) {
    return this.service.adminForceClose(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: '[관리자] 그룹 수정' })
  update(@Param('id') id: string, @Body() body: AdminStudyGroupUpdateInput) {
    return this.service.adminUpdate(id, body);
  }

  @Delete(':id')
  @ApiOperation({ summary: '[관리자] 그룹 삭제' })
  remove(@Param('id') id: string) {
    return this.service.adminDelete(id);
  }
}
