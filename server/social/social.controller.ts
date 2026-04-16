import { Controller, Get, Post, Delete, Param, Body, Req, Query } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import { SocialService } from './social.service';

@ApiTags('social')
@Controller('social')
export class SocialController {
  constructor(private readonly service: SocialService) {}

  @Post('follow/:userId')
  @Throttle({ short: { limit: 10, ttl: 60000 } })
  @ApiOperation({ summary: '팔로우' })
  follow(@Param('userId') userId: string, @Req() req: any) {
    if (!req.user?.id) return { error: '로그인 필요' };
    return this.service.follow(req.user.id, userId);
  }

  @Delete('follow/:userId')
  @Throttle({ short: { limit: 10, ttl: 60000 } })
  @ApiOperation({ summary: '언팔로우' })
  unfollow(@Param('userId') userId: string, @Req() req: any) {
    if (!req.user?.id) return { error: '로그인 필요' };
    return this.service.unfollow(req.user.id, userId);
  }

  @Get('followers')
  @Throttle({ short: { limit: 10, ttl: 60000 } })
  @ApiOperation({ summary: '내 팔로워 목록' })
  getFollowers(@Req() req: any) {
    if (!req.user?.id) return [];
    return this.service.getFollowers(req.user.id);
  }

  @Get('following')
  @Throttle({ short: { limit: 10, ttl: 60000 } })
  @ApiOperation({ summary: '내 팔로잉 목록' })
  getFollowing(@Req() req: any) {
    if (!req.user?.id) return [];
    return this.service.getFollowing(req.user.id);
  }

  @Post('scout')
  @Throttle({ short: { limit: 10, ttl: 60000 } })
  @ApiOperation({ summary: '스카우트 메시지 보내기' })
  sendScout(@Body() body: { receiverId: string; resumeId?: string; company: string; position: string; message: string }, @Req() req: any) {
    if (!req.user?.id) return { error: '로그인 필요' };
    return this.service.sendScout(req.user.id, body);
  }

  // ── 정적 경로 먼저 ──────────────────────────────────────
  @Get('scouts')
  @Throttle({ short: { limit: 10, ttl: 60000 } })
  @ApiOperation({ summary: '받은 스카우트 목록' })
  getScouts(@Req() req: any) {
    if (!req.user?.id) return [];
    return this.service.getReceivedScouts(req.user.id);
  }

  @Get('scouts/sent')
  @Throttle({ short: { limit: 10, ttl: 60000 } })
  @ApiOperation({ summary: '보낸 스카우트 목록' })
  getSentScouts(@Req() req: any) {
    if (!req.user?.id) return [];
    return this.service.getSentScouts(req.user.id);
  }

  @Post('bulk-scout')
  @Throttle({ short: { limit: 5, ttl: 60000 } })
  @ApiOperation({ summary: '일괄 스카우트 전송' })
  sendBulkScout(@Body() body: { targetIds: string[]; message: string; company: string }, @Req() req: any) {
    if (!req.user?.id) return { error: '로그인 필요' };
    return this.service.sendBulkScout(req.user.id, body);
  }

  // ── 동적 :id 경로 ─────────────────────────────────────
  @Post('scouts/:id/read')
  @Throttle({ short: { limit: 10, ttl: 60000 } })
  @ApiOperation({ summary: '스카우트 읽음 처리' })
  markRead(@Param('id') id: string, @Req() req: any) {
    if (!req.user?.id) return { success: false };
    return this.service.markScoutRead(id, req.user.id);
  }

  @Post('scouts/:id/respond')
  @Throttle({ short: { limit: 10, ttl: 60000 } })
  @ApiOperation({ summary: '스카우트 수락/거절' })
  respondToScout(@Param('id') id: string, @Body() body: { status: string }, @Req() req: any) {
    if (!req.user?.id) return { success: false };
    return this.service.respondToScout(id, req.user.id, body.status);
  }

  @Get('messages')
  @Throttle({ short: { limit: 10, ttl: 60000 } })
  @ApiOperation({ summary: '대화 목록' })
  getConversations(@Req() req: any) {
    if (!req.user?.id) return [];
    return this.service.getConversations(req.user.id);
  }

  @Get('messages/unread/count')
  @Throttle({ short: { limit: 10, ttl: 60000 } })
  @ApiOperation({ summary: '읽지 않은 쪽지 수' })
  async getUnreadCount(@Req() req: any) {
    if (!req.user?.id) return { count: 0 };
    const count = await this.service.getUnreadMessageCount(req.user.id);
    return { count };
  }

  @Get('messages/:partnerId')
  @Throttle({ short: { limit: 10, ttl: 60000 } })
  @ApiOperation({ summary: '대화 내용' })
  getMessages(@Param('partnerId') partnerId: string, @Req() req: any) {
    if (!req.user?.id) return [];
    return this.service.getMessages(req.user.id, partnerId);
  }

  @Post('messages/:receiverId')
  @Throttle({ short: { limit: 10, ttl: 60000 } })
  @ApiOperation({ summary: '쪽지 보내기' })
  sendMessage(@Param('receiverId') receiverId: string, @Body('content') content: string, @Req() req: any) {
    if (!req.user?.id) return { error: '로그인 필요' };
    return this.service.sendMessage(req.user.id, receiverId, content);
  }
}
