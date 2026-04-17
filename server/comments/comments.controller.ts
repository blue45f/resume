import { Controller, Get, Post, Delete, Param, Body, Req } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import { Public } from '../auth/auth.guard';
import { CommentsService } from './comments.service';
import { CreateCommentDto } from './dto/comment.dto';

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
  @Throttle({ short: { limit: 5, ttl: 60000 } })
  @ApiOperation({ summary: '의견 작성' })
  create(
    @Param('resumeId') resumeId: string,
    @Body() dto: CreateCommentDto,
    @Req() req: any,
  ) {
    return this.service.create(resumeId, dto.content, req.user?.id, dto.authorName, dto.parentId);
  }

  @Delete(':commentId')
  @ApiOperation({ summary: '의견 삭제' })
  remove(@Param('commentId') commentId: string, @Req() req: any) {
    return this.service.remove(commentId, req.user?.id, req.user?.role);
  }
}
