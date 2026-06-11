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
  BadRequestException,
  UseInterceptors,
  UploadedFile,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiTags, ApiOperation, ApiConsumes } from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import { ConfigService } from '@nestjs/config';
import { v2 as cloudinary } from 'cloudinary';
import { Public } from '../auth/auth.guard';
import {
  StudyGroupsService,
  CreateStudyGroupDto,
  CreateStudyGroupQuestionDto,
} from './study-groups.service';

/** 게시글 첨부 정책 — 이미지(클라 1600px 리사이즈) + PDF, 파일당 2MB 캡. */
const STUDY_ATTACH_MAX_SIZE = 2 * 1024 * 1024; // 2MB
const STUDY_ATTACH_ALLOWED_TYPES = [
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/gif',
  'application/pdf',
];

/**
 * P3-1 — 컨트롤러 레벨 기본 throttle. 모든 endpoint 는 사용자당 60/min 으로 시작.
 * 개별 endpoint 가 더 보수적이어야 하면 @Throttle 로 override.
 */
@ApiTags('study-groups')
@Controller('study-groups')
@Throttle({ default: { limit: 60, ttl: 60_000 } })
export class StudyGroupsController {
  /** Cloudinary 설정 여부 — 미설정(개발) 시 data: URL 폴백 (community/upload 와 동일 패턴). */
  private useCloudinary: boolean;

  constructor(
    private readonly service: StudyGroupsService,
    private readonly config: ConfigService,
  ) {
    const cloudName = this.config.get('CLOUDINARY_CLOUD_NAME');
    const apiKey = this.config.get('CLOUDINARY_API_KEY');
    const apiSecret = this.config.get('CLOUDINARY_API_SECRET');
    this.useCloudinary = !!(cloudName && apiKey && apiSecret);
    if (this.useCloudinary) {
      cloudinary.config({
        cloud_name: cloudName,
        api_key: apiKey,
        api_secret: apiSecret,
        secure: true,
      });
    }
  }

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
  @Throttle({ default: { limit: 5, ttl: 60_000 } })
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
  @Throttle({ default: { limit: 10, ttl: 60_000 } })
  @ApiOperation({ summary: '스터디 그룹 질문 추가' })
  addQuestion(@Param('id') id: string, @Body() body: CreateStudyGroupQuestionDto, @Req() req: any) {
    if (!req.user?.id) throw new UnauthorizedException('로그인이 필요합니다');
    return this.service.addQuestion(id, req.user.id, body);
  }

  @Post('questions/:questionId/upvote')
  @ApiOperation({ summary: '문제 추천 (upvote) — 토글, 사용자당 1회' })
  upvoteQuestion(@Param('questionId') questionId: string, @Req() req: any) {
    if (!req.user?.id) throw new UnauthorizedException('로그인이 필요합니다');
    return this.service.upvoteQuestion(questionId, req.user.id);
  }

  // ─── 스터디 문제 답변 ───────────────────────────────
  @Get('questions/:questionId/answers')
  @Public()
  @ApiOperation({ summary: '문제 답변 목록 (sort=upvotes|recent)' })
  listAnswers(
    @Param('questionId') questionId: string,
    @Req() req: any,
    @Query('sort') sort?: 'upvotes' | 'recent',
  ) {
    return this.service.listAnswers(questionId, req.user?.id, { sort });
  }

  @Post('questions/:questionId/answers')
  @Throttle({ default: { limit: 20, ttl: 60_000 } })
  @ApiOperation({ summary: '문제 답변 작성 (parentId 지정 시 답글)' })
  createAnswer(
    @Param('questionId') questionId: string,
    @Body() body: { body: string; parentId?: string | null },
    @Req() req: any,
  ) {
    if (!req.user?.id) throw new UnauthorizedException('로그인이 필요합니다');
    return this.service.createAnswer(questionId, req.user.id, body);
  }

  @Patch('answers/:answerId')
  @ApiOperation({ summary: '답변 수정 (본인만)' })
  updateAnswer(
    @Param('answerId') answerId: string,
    @Body() body: { body: string },
    @Req() req: any,
  ) {
    if (!req.user?.id) throw new UnauthorizedException('로그인이 필요합니다');
    return this.service.updateAnswer(answerId, req.user.id, body);
  }

  @Delete('answers/:answerId')
  @ApiOperation({ summary: '답변 삭제 (본인 또는 그룹 owner)' })
  deleteAnswer(@Param('answerId') answerId: string, @Req() req: any) {
    if (!req.user?.id) throw new UnauthorizedException('로그인이 필요합니다');
    return this.service.deleteAnswer(answerId, req.user.id);
  }

  @Post('answers/:answerId/upvote')
  @ApiOperation({ summary: '답변 추천 (좋아요) — 토글, 사용자당 1회' })
  upvoteAnswer(@Param('answerId') answerId: string, @Req() req: any) {
    if (!req.user?.id) throw new UnauthorizedException('로그인이 필요합니다');
    return this.service.upvoteAnswer(answerId, req.user.id);
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
  @Throttle({ default: { limit: 10, ttl: 60_000 } })
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
  @ApiOperation({ summary: '스터디 그룹 게시글 수정 (첨부 교체 포함)' })
  updatePost(
    @Param('postId') postId: string,
    @Body()
    body: {
      title?: string;
      content?: string;
      category?: string;
      isPinned?: boolean;
      tags?: string[];
      attachments?: Array<{ url: string; name: string; size: number; type: string }>;
    },
    @Req() req: any,
  ) {
    if (!req.user?.id) throw new UnauthorizedException('로그인이 필요합니다');
    return this.service.updatePost(postId, req.user.id, body);
  }

  /**
   * 게시글 첨부 업로드 — 멤버(또는 공개 그룹 사용자) 전용.
   * Cloudinary 설정 시 원격 저장, 미설정(개발) 시 data: URL 폴백.
   * 반환 shape 은 게시글 attachments JSON 항목과 동일: { url, name, size, type }.
   */
  @Post(':id/attachments')
  @Throttle({ default: { limit: 10, ttl: 60_000 } })
  @ApiOperation({ summary: '스터디 게시글 첨부 업로드 (이미지/PDF, 2MB)' })
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(FileInterceptor('file', { limits: { fileSize: STUDY_ATTACH_MAX_SIZE } }))
  async uploadPostAttachment(
    @Param('id') id: string,
    @UploadedFile() file: Express.Multer.File,
    @Req() req: any,
  ) {
    if (!req.user?.id) throw new UnauthorizedException('로그인이 필요합니다');
    if (!file) throw new BadRequestException('파일이 없습니다');
    if (!STUDY_ATTACH_ALLOWED_TYPES.includes(file.mimetype)) {
      throw new BadRequestException('이미지(JPEG/PNG/WebP/GIF) 또는 PDF만 첨부할 수 있습니다');
    }
    // multer limits 가 1차 차단하지만 방어적으로 한 번 더 확인
    if (file.size > STUDY_ATTACH_MAX_SIZE) {
      throw new BadRequestException('파일 크기는 2MB 이하여야 합니다');
    }
    await this.service.assertPostAccess(id, req.user.id);

    // Multer 는 파일명을 Latin1 로 인코딩 → UTF-8 복원 (attachments.service 와 동일 처리)
    const originalName = Buffer.from(file.originalname, 'latin1').toString('utf8').slice(0, 200);

    if (this.useCloudinary) {
      const result = await new Promise<any>((resolve, reject) => {
        const stream = cloudinary.uploader.upload_stream(
          { folder: `study-group-attachments/${id}`, resource_type: 'auto' },
          (err, uploaded) => {
            if (err) reject(err);
            else resolve(uploaded);
          },
        );
        stream.end(file.buffer);
      });
      return { url: result.secure_url, name: originalName, size: file.size, type: file.mimetype };
    }

    // Cloudinary 미설정: base64 data URL 폴백 (개발용 — normalizeAttachments 의 허용 prefix)
    const b64 = file.buffer.toString('base64');
    return {
      url: `data:${file.mimetype};base64,${b64}`,
      name: originalName,
      size: file.size,
      type: file.mimetype,
    };
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
