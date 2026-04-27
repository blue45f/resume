import {
  Controller,
  Get,
  Post,
  Put,
  Patch,
  Delete,
  Param,
  Body,
  Req,
  Query,
  UnauthorizedException,
} from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { Public } from '../auth/auth.guard';
import {
  StudyGroupsService,
  CreateStudyGroupDto,
  CreateStudyGroupQuestionDto,
} from './study-groups.service';

@ApiTags('study-groups')
@Controller('study-groups')
export class StudyGroupsController {
  constructor(private readonly service: StudyGroupsService) {}

  @Get()
  @Public()
  @ApiOperation({ summary: '스터디 그룹 목록' })
  findAll(
    @Req() req: any,
    @Query('q') q?: string,
    @Query('companyName') companyName?: string,
    @Query('jobPostId') jobPostId?: string,
    @Query('jobKey') jobKey?: string,
    @Query('companyTier') companyTier?: string,
    @Query('cafeCategory') cafeCategory?: string,
    @Query('experienceLevel') experienceLevel?: string,
    @Query('mine') mine?: string,
    @Query('sort') sort?: string,
    @Query('openOnly') openOnly?: string,
    @Query('minMembers') minMembers?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.service.findAll({
      q,
      companyName,
      jobPostId,
      jobKey,
      companyTier,
      cafeCategory,
      experienceLevel,
      mine: mine === 'true' || mine === '1',
      sort,
      openOnly: openOnly === 'true' || openOnly === '1',
      minMembers: minMembers ? parseInt(minMembers, 10) : undefined,
      userId: req.user?.id,
      page: page ? parseInt(page, 10) : 1,
      limit: limit ? parseInt(limit, 10) : 20,
    });
  }

  @Post()
  @ApiOperation({ summary: '스터디 그룹 생성' })
  create(@Body() body: CreateStudyGroupDto, @Req() req: any) {
    if (!req.user?.id) throw new UnauthorizedException('로그인이 필요합니다');
    return this.service.create(req.user.id, body);
  }

  @Get(':id')
  @Public()
  @ApiOperation({ summary: '스터디 그룹 상세' })
  findOne(@Param('id') id: string, @Req() req: any) {
    return this.service.findOne(id, req.user?.id);
  }

  @Post(':id/join')
  @ApiOperation({ summary: '스터디 그룹 가입' })
  join(@Param('id') id: string, @Req() req: any) {
    if (!req.user?.id) throw new UnauthorizedException('로그인이 필요합니다');
    return this.service.join(id, req.user.id);
  }

  @Delete(':id/leave')
  @ApiOperation({ summary: '스터디 그룹 탈퇴' })
  leave(@Param('id') id: string, @Req() req: any) {
    if (!req.user?.id) throw new UnauthorizedException('로그인이 필요합니다');
    return this.service.leave(id, req.user.id);
  }

  @Delete(':id')
  @ApiOperation({ summary: '스터디 그룹 삭제' })
  remove(@Param('id') id: string, @Req() req: any) {
    if (!req.user?.id) throw new UnauthorizedException('로그인이 필요합니다');
    return this.service.remove(id, req.user.id, req.user?.role);
  }

  @Get(':id/questions')
  @Public()
  @ApiOperation({ summary: '스터디 그룹 질문 목록 (category/difficulty/q/sort 필터)' })
  listQuestions(
    @Param('id') id: string,
    @Req() req: any,
    @Query('category') category?: string,
    @Query('difficulty') difficulty?: string,
    @Query('q') q?: string,
    @Query('sort') sort?: 'upvotes' | 'recent',
  ) {
    return this.service.listQuestions(id, req.user?.id, { category, difficulty, q, sort });
  }

  @Post(':id/questions')
  @ApiOperation({ summary: '스터디 그룹 질문 추가' })
  addQuestion(@Param('id') id: string, @Body() body: CreateStudyGroupQuestionDto, @Req() req: any) {
    if (!req.user?.id) throw new UnauthorizedException('로그인이 필요합니다');
    return this.service.addQuestion(id, req.user.id, body);
  }

  @Post('questions/:questionId/upvote')
  @ApiOperation({ summary: '문제 추천 (upvote)' })
  upvoteQuestion(@Param('questionId') questionId: string, @Req() req: any) {
    if (!req.user?.id) throw new UnauthorizedException('로그인이 필요합니다');
    return this.service.upvoteQuestion(questionId, req.user.id);
  }

  // ─── 카페형 게시판 ──────────────────────────────────────────
  @Get(':id/posts')
  @Public()
  @ApiOperation({ summary: '스터디 그룹 게시글 목록 (카페 게시판)' })
  listPosts(
    @Param('id') id: string,
    @Req() req: any,
    @Query('category') category?: string,
    @Query('q') q?: string,
    @Query('authorId') authorId?: string,
    @Query('tag') tag?: string,
    @Query('sort') sort?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.service.listPosts(id, req.user?.id, {
      category,
      q,
      authorId,
      tag,
      sort,
      page: page ? Number(page) : undefined,
      limit: limit ? Number(limit) : undefined,
    });
  }

  @Get('posts/:postId')
  @Public()
  @ApiOperation({ summary: '스터디 게시글 상세' })
  getPost(@Param('postId') postId: string, @Req() req: any) {
    return this.service.getPost(postId, req.user?.id);
  }

  @Post(':id/posts')
  @ApiOperation({ summary: '스터디 그룹 게시글 작성' })
  createPost(
    @Param('id') id: string,
    @Body()
    body: {
      title: string;
      content: string;
      category?: string;
      attachments?: Array<{ url: string; name: string; size: number; type: string }>;
    },
    @Req() req: any,
  ) {
    if (!req.user?.id) throw new UnauthorizedException('로그인이 필요합니다');
    return this.service.createPost(id, req.user.id, body);
  }

  @Put('posts/:postId')
  @ApiOperation({ summary: '스터디 그룹 게시글 수정' })
  updatePost(
    @Param('postId') postId: string,
    @Body() body: { title?: string; content?: string; category?: string; isPinned?: boolean },
    @Req() req: any,
  ) {
    if (!req.user?.id) throw new UnauthorizedException('로그인이 필요합니다');
    return this.service.updatePost(postId, req.user.id, body);
  }

  @Patch(':id')
  @ApiOperation({ summary: '스터디 그룹 owner 수정 (공개/비공개 / 이름 / 설명 / 정원)' })
  ownerUpdate(
    @Param('id') id: string,
    @Body()
    body: { name?: string; description?: string; isPrivate?: boolean; maxMembers?: number },
    @Req() req: any,
  ) {
    if (!req.user?.id) throw new UnauthorizedException('로그인이 필요합니다');
    return this.service.ownerUpdate(id, req.user.id, body);
  }

  @Delete('posts/:postId')
  @ApiOperation({ summary: '스터디 그룹 게시글 삭제' })
  deletePost(@Param('postId') postId: string, @Req() req: any) {
    if (!req.user?.id) throw new UnauthorizedException('로그인이 필요합니다');
    return this.service.deletePost(postId, req.user.id);
  }

  @Post('posts/:postId/like')
  @ApiOperation({ summary: '스터디 그룹 게시글 좋아요' })
  likePost(@Param('postId') postId: string, @Req() req: any) {
    if (!req.user?.id) throw new UnauthorizedException('로그인이 필요합니다');
    return this.service.likePost(postId, req.user.id);
  }

  // ─── 이모지 리액션 ──────────────────────────────────
  @Get('posts/:postId/reactions')
  @Public()
  @ApiOperation({ summary: '게시글 리액션 요약 (이모지별 카운트 + 내 선택)' })
  listReactions(@Param('postId') postId: string, @Req() req: any) {
    return this.service.listReactions(postId, req.user?.id);
  }

  @Post('posts/:postId/reactions')
  @ApiOperation({ summary: '게시글 이모지 리액션 토글' })
  toggleReaction(
    @Param('postId') postId: string,
    @Body() body: { emoji: string },
    @Req() req: any,
  ) {
    if (!req.user?.id) throw new UnauthorizedException('로그인이 필요합니다');
    return this.service.toggleReaction(postId, req.user.id, body.emoji);
  }

  // ─── 댓글 ──────────────────────────────────────────
  @Get('posts/:postId/comments')
  @Public()
  @ApiOperation({ summary: '게시글 댓글 목록' })
  listComments(@Param('postId') postId: string, @Req() req: any) {
    return this.service.listComments(postId, req.user?.id);
  }

  @Post('posts/:postId/comments')
  @ApiOperation({ summary: '게시글 댓글 작성' })
  createComment(
    @Param('postId') postId: string,
    @Body() body: { content: string; parentId?: string | null },
    @Req() req: any,
  ) {
    if (!req.user?.id) throw new UnauthorizedException('로그인이 필요합니다');
    return this.service.createComment(postId, req.user.id, body);
  }

  @Delete('comments/:commentId')
  @ApiOperation({ summary: '댓글 삭제' })
  deleteComment(@Param('commentId') commentId: string, @Req() req: any) {
    if (!req.user?.id) throw new UnauthorizedException('로그인이 필요합니다');
    return this.service.deleteComment(commentId, req.user.id);
  }

  // ─── 일정 ──────────────────────────────────────────
  @Get(':id/events')
  @Public()
  @ApiOperation({ summary: '스터디 그룹 일정 목록 (다가오는 순)' })
  listEvents(@Param('id') id: string, @Req() req: any, @Query('limit') limit?: string) {
    return this.service.listEvents(id, req.user?.id, {
      limit: limit ? Number(limit) : undefined,
    });
  }

  @Post(':id/events')
  @ApiOperation({ summary: '스터디 그룹 일정 생성' })
  createEvent(
    @Param('id') id: string,
    @Body()
    body: {
      title: string;
      description?: string;
      kind?: string;
      location?: string;
      meetingUrl?: string;
      startsAt: string;
      endsAt?: string | null;
    },
    @Req() req: any,
  ) {
    if (!req.user?.id) throw new UnauthorizedException('로그인이 필요합니다');
    return this.service.createEvent(id, req.user.id, body);
  }

  @Delete('events/:eventId')
  @ApiOperation({ summary: '일정 삭제' })
  deleteEvent(@Param('eventId') eventId: string, @Req() req: any) {
    if (!req.user?.id) throw new UnauthorizedException('로그인이 필요합니다');
    return this.service.deleteEvent(eventId, req.user.id);
  }

  @Post('events/:eventId/rsvp')
  @ApiOperation({ summary: '일정 참석 응답 (going/maybe/declined)' })
  rsvpEvent(@Param('eventId') eventId: string, @Body() body: { status: string }, @Req() req: any) {
    if (!req.user?.id) throw new UnauthorizedException('로그인이 필요합니다');
    return this.service.rsvpEvent(eventId, req.user.id, body.status);
  }

  // ─── 통계 ──────────────────────────────────────────
  @Get(':id/stats')
  @Public()
  @ApiOperation({ summary: '그룹 활동 통계 (게시글·질문·일정·TOP 기여자)' })
  stats(@Param('id') id: string, @Req() req: any) {
    return this.service.stats(id, req.user?.id);
  }
}
