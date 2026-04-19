import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  Req,
  UseGuards,
  UseInterceptors,
  UploadedFile,
  BadRequestException,
  UnauthorizedException,
} from '@nestjs/common';
import { AdminGuard } from '../common/guards/admin.guard';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import { Public } from '../auth/auth.guard';
import { CommunityService } from './community.service';
import { v2 as cloudinary } from 'cloudinary';
import { ConfigService } from '@nestjs/config';

const MAX_ATTACH_SIZE = 20 * 1024 * 1024; // 20MB
const ALLOWED_ATTACH_TYPES = [
  'image/jpeg',
  'image/png',
  'image/gif',
  'image/webp',
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'text/plain',
];

@ApiTags('community')
@Controller('community')
export class CommunityController {
  private useCloudinary: boolean;

  constructor(
    private readonly service: CommunityService,
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
  @ApiOperation({ summary: '커뮤니티 게시글 목록' })
  getPosts(
    @Query('category') category?: string,
    @Query('search') search?: string,
    @Query('page') page = '1',
    @Query('limit') limit = '20',
    @Query('showHidden') showHidden?: string,
    @Query('sort') sort = 'recent',
    @Req() req?: any,
  ) {
    const isAdmin = req?.user?.role === 'admin' || req?.user?.role === 'superadmin';
    const includeHidden = isAdmin && showHidden === 'true';
    return this.service.getPosts(
      category,
      search,
      parseInt(page),
      parseInt(limit),
      includeHidden,
      sort,
    );
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
  create(
    @Body() body: { title: string; content: string; category: string; attachments?: any[] },
    @Req() req: any,
  ) {
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
    @Body() body: { content: string; authorName?: string; parentId?: string },
    @Req() req: any,
  ) {
    return this.service.addComment(id, req.user?.id, body.content, body.authorName, body.parentId);
  }

  @Delete(':id/comments/:commentId')
  @ApiOperation({ summary: '댓글 삭제' })
  deleteComment(@Param('id') id: string, @Param('commentId') commentId: string, @Req() req: any) {
    if (!req.user?.id) return { error: '로그인이 필요합니다' };
    return this.service.deleteComment(commentId, req.user.id, req.user.role || 'user');
  }

  /** 파일 첨부 업로드 */
  @Post('upload')
  @Throttle({ short: { limit: 10, ttl: 60000 } })
  @ApiOperation({ summary: '커뮤니티 첨부파일 업로드' })
  @UseInterceptors(FileInterceptor('file', { limits: { fileSize: MAX_ATTACH_SIZE } }))
  async uploadAttachment(@UploadedFile() file: Express.Multer.File, @Req() req: any) {
    if (!req.user?.id) throw new BadRequestException('로그인이 필요합니다');
    if (!file) throw new BadRequestException('파일이 없습니다');
    if (!ALLOWED_ATTACH_TYPES.includes(file.mimetype)) {
      throw new BadRequestException('허용되지 않는 파일 형식입니다');
    }

    if (this.useCloudinary) {
      const result = await new Promise<any>((resolve, reject) => {
        const stream = cloudinary.uploader.upload_stream(
          { folder: 'community_attachments', resource_type: 'auto' },
          (err, result) => {
            if (err) reject(err);
            else resolve(result);
          },
        );
        stream.end(file.buffer);
      });
      return {
        url: result.secure_url,
        name: file.originalname,
        size: file.size,
        type: file.mimetype,
      };
    }

    // Cloudinary 없을 때: base64 data URL 반환 (개발용)
    const b64 = file.buffer.toString('base64');
    return {
      url: `data:${file.mimetype};base64,${b64}`,
      name: file.originalname,
      size: file.size,
      type: file.mimetype,
    };
  }

  // ── 신고 + admin 관리 ────────────────────────────────
  @Post(':id/report')
  @ApiOperation({ summary: '커뮤니티 게시물 신고 — 누적 시 autoHidden' })
  reportPost(
    @Param('id') id: string,
    @Body() body: { reason?: string; detail?: string },
    @Req() req: any,
  ) {
    if (!req.user?.id) throw new UnauthorizedException('로그인이 필요합니다');
    return this.service.reportPost(id, req.user.id, body.reason ?? 'other', body.detail ?? '');
  }

  @Get('admin/reports')
  @UseGuards(AdminGuard)
  @ApiOperation({ summary: '(admin) 커뮤니티 신고 목록' })
  adminListReports(@Query('page') page?: string, @Query('limit') limit?: string) {
    return this.service.adminListPostReports({
      page: page ? Number(page) : undefined,
      limit: limit ? Number(limit) : undefined,
    });
  }

  @Post('admin/:id/unhide')
  @UseGuards(AdminGuard)
  @ApiOperation({ summary: '(admin) 자동숨김 해제 + reportCount 리셋' })
  adminUnhide(@Param('id') id: string) {
    return this.service.adminUnhidePost(id);
  }
}
