import { Controller, Get, Post, Delete, Param, Body, Req } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { SocialService } from './social.service';

@ApiTags('social')
@Controller('social')
export class SocialController {
  constructor(private readonly service: SocialService) {}

  @Post('follow/:userId')
  @ApiOperation({ summary: '팔로우' })
  follow(@Param('userId') userId: string, @Req() req: any) {
    if (!req.user?.id) return { error: '로그인 필요' };
    return this.service.follow(req.user.id, userId);
  }

  @Delete('follow/:userId')
  @ApiOperation({ summary: '언팔로우' })
  unfollow(@Param('userId') userId: string, @Req() req: any) {
    if (!req.user?.id) return { error: '로그인 필요' };
    return this.service.unfollow(req.user.id, userId);
  }

  @Get('followers')
  @ApiOperation({ summary: '내 팔로워 목록' })
  getFollowers(@Req() req: any) {
    if (!req.user?.id) return [];
    return this.service.getFollowers(req.user.id);
  }

  @Get('following')
  @ApiOperation({ summary: '내 팔로잉 목록' })
  getFollowing(@Req() req: any) {
    if (!req.user?.id) return [];
    return this.service.getFollowing(req.user.id);
  }

  @Post('scout')
  @ApiOperation({ summary: '스카우트 메시지 보내기' })
  sendScout(@Body() body: { receiverId: string; resumeId?: string; company: string; position: string; message: string }, @Req() req: any) {
    if (!req.user?.id) return { error: '로그인 필요' };
    return this.service.sendScout(req.user.id, body);
  }

  @Get('scouts')
  @ApiOperation({ summary: '받은 스카우트 목록' })
  getScouts(@Req() req: any) {
    if (!req.user?.id) return [];
    return this.service.getReceivedScouts(req.user.id);
  }

  @Post('scouts/:id/read')
  @ApiOperation({ summary: '스카우트 읽음 처리' })
  markRead(@Param('id') id: string, @Req() req: any) {
    if (!req.user?.id) return { success: false };
    return this.service.markScoutRead(id, req.user.id);
  }
}
