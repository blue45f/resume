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
  ForbiddenException,
} from '@nestjs/common';
import type { Prisma } from '@prisma/client';
import { ApiTags } from '@nestjs/swagger';
import { Public } from '../auth/auth.guard';
import { NoticesService, type NoticeCreateBody } from './notices.service';
import type { AuthenticatedRequest } from '../common/request.types';

@ApiTags('notices')
@Controller('notices')
export class NoticesController {
  constructor(private readonly service: NoticesService) {}

  @Get('popup')
  @Public()
  getPopup() {
    return this.service.getPopup();
  }

  @Get()
  @Public()
  getAll(@Query('type') type?: string, @Query('page') page = '1', @Query('limit') limit = '10') {
    return this.service.getAll(type, parseInt(page), parseInt(limit));
  }

  @Get(':id')
  @Public()
  getOne(@Param('id') id: string) {
    return this.service.getOne(id);
  }

  @Post()
  create(@Req() req: AuthenticatedRequest, @Body() body: NoticeCreateBody) {
    if (req.user?.role !== 'admin' && req.user?.role !== 'superadmin')
      throw new ForbiddenException();
    return this.service.create(body, req.user.id);
  }

  @Patch(':id')
  update(
    @Req() req: AuthenticatedRequest,
    @Param('id') id: string,
    @Body() body: Prisma.NoticeUpdateInput & { reason?: string },
  ) {
    if (req.user?.role !== 'admin' && req.user?.role !== 'superadmin')
      throw new ForbiddenException();
    const { reason, ...data } = body;
    return this.service.update(id, data, req.user.id, reason);
  }

  @Delete(':id')
  remove(@Req() req: AuthenticatedRequest, @Param('id') id: string) {
    if (req.user?.role !== 'admin' && req.user?.role !== 'superadmin')
      throw new ForbiddenException();
    return this.service.remove(id);
  }

  // ── Comments ─────────────────────────────────────────────────

  @Post(':id/comments')
  addComment(
    @Req() req: AuthenticatedRequest,
    @Param('id') noticeId: string,
    @Body() body: { content: string },
  ) {
    if (!req.user?.id) throw new ForbiddenException('로그인 필요');
    return this.service.addComment(noticeId, req.user.id, body.content);
  }

  @Delete(':noticeId/comments/:commentId')
  deleteComment(
    @Req() req: AuthenticatedRequest,
    @Param('noticeId') _noticeId: string,
    @Param('commentId') commentId: string,
  ) {
    if (!req.user?.id) throw new ForbiddenException();
    return this.service.deleteComment(commentId, req.user.id, req.user.role);
  }

  @Patch(':id/toggle-comments')
  toggleComments(
    @Req() req: AuthenticatedRequest,
    @Param('id') id: string,
    @Body() body: { allow: boolean },
  ) {
    if (req.user?.role !== 'admin' && req.user?.role !== 'superadmin')
      throw new ForbiddenException();
    return this.service.toggleComments(id, body.allow);
  }

  // ── History ───────────────────────────────────────────────────

  @Get(':id/history')
  getHistory(@Req() req: AuthenticatedRequest, @Param('id') id: string) {
    if (req.user?.role !== 'admin' && req.user?.role !== 'superadmin')
      throw new ForbiddenException();
    return this.service.getHistory(id);
  }
}
