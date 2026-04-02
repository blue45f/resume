import { Controller, Get, Post, Delete, Param, Body, Req } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { Public } from '../auth/auth.guard';
import { CommentsService } from './comments.service';

@ApiTags('comments')
@Controller('resumes/:resumeId/comments')
export class CommentsController {
  constructor(private readonly service: CommentsService) {}

  @Get()
  @Public()
  @ApiOperation({ summary: '이력서 의견 목록' })
  findAll(@Param('resumeId') resumeId: string) {
    return this.service.findByResume(resumeId);
  }

  @Post()
  @ApiOperation({ summary: '의견 작성' })
  create(
    @Param('resumeId') resumeId: string,
    @Body() body: { content: string; authorName?: string },
    @Req() req: any,
  ) {
    return this.service.create(resumeId, body.content, req.user?.id, body.authorName);
  }

  @Delete(':commentId')
  @ApiOperation({ summary: '의견 삭제' })
  remove(@Param('commentId') commentId: string, @Req() req: any) {
    return this.service.remove(commentId, req.user?.id);
  }
}
