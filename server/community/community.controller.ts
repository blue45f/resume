import { Controller, Get, Post, Patch, Delete, Body, Param, Query, Req } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import { Public } from '../auth/auth.guard';
import { CommunityService } from './community.service';

@ApiTags('community')
@Controller('community')
export class CommunityController {
  constructor(private readonly service: CommunityService) {}

  @Get()
  @Public()
  @ApiOperation({ summary: '커뮤니티 게시글 목록' })
  getPosts(
    @Query('category') category?: string,
    @Query('search') search?: string,
    @Query('page') page = '1',
    @Query('limit') limit = '20',
  ) {
    return this.service.getPosts(category, search, parseInt(page), parseInt(limit));
  }

  @Get(':id')
  @Public()
  @ApiOperation({ summary: '게시글 상세' })
  getPost(@Param('id') id: string, @Req() req: any) {
    return this.service.getPost(id, req.user?.id);
  }

  @Post()
  @Throttle({ short: { limit: 5, ttl: 60000 } })
  @ApiOperation({ summary: '게시글 작성' })
  create(@Body() body: { title: string; content: string; category: string }, @Req() req: any) {
    if (!req.user?.id) return { error: '로그인이 필요합니다' };
    return this.service.createPost(req.user.id, body);
  }

  @Patch(':id')
  @ApiOperation({ summary: '게시글 수정' })
  update(@Param('id') id: string, @Body() body: any, @Req() req: any) {
    if (!req.user?.id) return { error: '로그인이 필요합니다' };
    return this.service.updatePost(id, req.user.id, req.user.role || 'user', body);
  }

  @Delete(':id')
  @ApiOperation({ summary: '게시글 삭제' })
  delete(@Param('id') id: string, @Req() req: any) {
    if (!req.user?.id) return { error: '로그인이 필요합니다' };
    return this.service.deletePost(id, req.user.id, req.user.role || 'user');
  }

  @Post(':id/like')
  @Throttle({ short: { limit: 20, ttl: 60000 } })
  @ApiOperation({ summary: '좋아요 토글' })
  toggleLike(@Param('id') id: string, @Req() req: any) {
    if (!req.user?.id) return { error: '로그인이 필요합니다' };
    return this.service.toggleLike(id, req.user.id);
  }

  @Get(':id/comments')
  @Public()
  @ApiOperation({ summary: '댓글 목록' })
  getComments(@Param('id') id: string) {
    return this.service.getComments(id);
  }

  @Post(':id/comments')
  @Throttle({ short: { limit: 10, ttl: 60000 } })
  @ApiOperation({ summary: '댓글 작성' })
  addComment(
    @Param('id') id: string,
    @Body() body: { content: string; authorName?: string },
    @Req() req: any,
  ) {
    return this.service.addComment(id, req.user?.id, body.content, body.authorName);
  }

  @Delete(':id/comments/:commentId')
  @ApiOperation({ summary: '댓글 삭제' })
  deleteComment(@Param('id') id: string, @Param('commentId') commentId: string, @Req() req: any) {
    if (!req.user?.id) return { error: '로그인이 필요합니다' };
    return this.service.deleteComment(commentId, req.user.id, req.user.role || 'user');
  }
}
