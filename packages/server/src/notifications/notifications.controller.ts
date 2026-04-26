import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  ForbiddenException,
  Get,
  Param,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { AdminGuard } from '../common/guards/admin.guard';
import { PrismaService } from '../prisma/prisma.service';
import { NotificationsService } from './notifications.service';

@ApiTags('notifications')
@Controller('notifications')
export class NotificationsController {
  constructor(
    private readonly service: NotificationsService,
    private readonly prisma: PrismaService,
  ) {}

  @Get()
  @ApiOperation({ summary: '알림 목록' })
  getAll(@Req() req: any) {
    if (!req.user?.id) return [];
    return this.service.getAll(req.user.id);
  }

  @Get('unread')
  @ApiOperation({ summary: '읽지 않은 알림' })
  getUnread(@Req() req: any) {
    if (!req.user?.id) return [];
    return this.service.getUnread(req.user.id);
  }

  @Get('count')
  @ApiOperation({ summary: '읽지 않은 알림 수' })
  async getCount(@Req() req: any) {
    if (!req.user?.id) return { count: 0 };
    const count = await this.service.getUnreadCount(req.user.id);
    return { count };
  }

  @Post('read-all')
  @ApiOperation({ summary: '모든 알림 읽음 처리' })
  markAllRead(@Req() req: any) {
    if (!req.user?.id) return { success: false };
    return this.service.markAsRead(req.user.id);
  }

  @Post(':id/read')
  @ApiOperation({ summary: '알림 읽음 처리' })
  markRead(@Param('id') id: string, @Req() req: any) {
    if (!req.user?.id) return { success: false };
    return this.service.markAsRead(req.user.id, id);
  }

  @Delete(':id')
  @ApiOperation({ summary: '알림 삭제' })
  deleteOne(@Param('id') id: string, @Req() req: any) {
    if (!req.user?.id) return { success: false };
    return this.service.deleteOne(req.user.id, id);
  }

  @Post('delete-bulk')
  @ApiOperation({ summary: '알림 일괄 삭제' })
  deleteBulk(@Body() body: { ids: string[] }, @Req() req: any) {
    if (!req.user?.id) return { success: false };
    return this.service.deleteBulk(req.user.id, body.ids);
  }

  @Delete('cleanup')
  @ApiOperation({ summary: '오래된 읽은 알림 정리 (관리자 전용)' })
  cleanup(@Req() req: any) {
    if (!req.user?.id) return { success: false };
    if (req.user.role !== 'superadmin') {
      throw new ForbiddenException('관리자만 사용할 수 있습니다');
    }
    return this.service.cleanupOld();
  }

  /**
   * 관리자 공지 발송 — 활성 사용자에게 1회 알림.
   *
   * activeWithinDays: 최근 N일 내 createdAt OR notification 받음 OR resume update 한 사용자만.
   *                   기본 30일. 1000명 cap (안전).
   * 같은 (type, message) 조합 중복 방지 — 재호출해도 받은 사용자에겐 다시 안 감.
   */
  @Post('admin/announce')
  @UseGuards(AdminGuard)
  @ApiOperation({
    summary:
      '관리자: 활성 사용자에게 일괄 공지 발송. type+message 중복 방지 (idempotent), 1000명 cap',
  })
  async announce(
    @Body()
    body: {
      type: string;
      message: string;
      link?: string;
      activeWithinDays?: number;
    },
    @Req() req: any,
  ) {
    if (req.user?.role !== 'admin' && req.user?.role !== 'superadmin') {
      throw new ForbiddenException('관리자만 가능');
    }
    if (!body.type || !body.message) {
      throw new BadRequestException('type, message 필수');
    }
    if (body.message.length > 200) {
      throw new BadRequestException('메시지는 200자 이내');
    }
    const days = Math.min(365, Math.max(1, body.activeWithinDays ?? 30));
    const cutoff = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

    // 활성 기준: 최근 N일 내 가입했거나, 최근 이력서 수정 / 알림 받음
    const users = await this.prisma.user.findMany({
      where: {
        isSuspended: false,
        OR: [
          { createdAt: { gte: cutoff } },
          { resumes: { some: { updatedAt: { gte: cutoff } } } },
          { notifications: { some: { createdAt: { gte: cutoff } } } },
        ],
      },
      select: { id: true },
      take: 1000,
    });

    const userIds = users.map((u) => u.id);
    const result = await this.service.createBulk(userIds, body.type, body.message, body.link);
    return { ...result, candidates: userIds.length, activeWithinDays: days };
  }
}
