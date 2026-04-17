import { Controller, Get, Post, Delete, Param, Body, Req, ForbiddenException } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { NotificationsService } from './notifications.service';

@ApiTags('notifications')
@Controller('notifications')
export class NotificationsController {
  constructor(private readonly service: NotificationsService) {}

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
}
