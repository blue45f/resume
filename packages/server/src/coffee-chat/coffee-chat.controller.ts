import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  Req,
  UnauthorizedException,
} from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import { CoffeeChatService } from './coffee-chat.service';

@ApiTags('coffee-chat')
@Controller('coffee-chats')
export class CoffeeChatController {
  constructor(private readonly service: CoffeeChatService) {}

  @Post()
  @Throttle({ default: { limit: 10, ttl: 60000 } })
  @ApiOperation({ summary: '커피챗 신청' })
  create(
    @Body()
    body: {
      hostId: string;
      message?: string;
      topic?: string;
      modality?: string;
      durationMin?: number;
      scheduledAt?: string | null;
    },
    @Req() req: any,
  ) {
    if (!req.user?.id) throw new UnauthorizedException('로그인이 필요합니다');
    return this.service.create(req.user.id, body);
  }

  @Get()
  @ApiOperation({ summary: '내 커피챗 목록 (sent/received/all)' })
  list(
    @Query('role') role: 'sent' | 'received' | 'all' = 'all',
    @Query('status') status: string,
    @Req() req: any,
  ) {
    if (!req.user?.id) throw new UnauthorizedException('로그인이 필요합니다');
    return this.service.listMine(req.user.id, role, status);
  }

  @Get(':id')
  @ApiOperation({ summary: '커피챗 상세' })
  findOne(@Param('id') id: string, @Req() req: any) {
    if (!req.user?.id) throw new UnauthorizedException('로그인이 필요합니다');
    return this.service.findOne(id, req.user.id);
  }

  @Patch(':id/respond')
  @ApiOperation({ summary: '호스트가 수락/거절' })
  respond(
    @Param('id') id: string,
    @Body() body: { decision: 'accepted' | 'rejected'; note?: string },
    @Req() req: any,
  ) {
    if (!req.user?.id) throw new UnauthorizedException('로그인이 필요합니다');
    return this.service.respond(id, req.user.id, body.decision, body.note);
  }

  @Delete(':id')
  @ApiOperation({ summary: '신청자가 취소' })
  cancel(@Param('id') id: string, @Req() req: any) {
    if (!req.user?.id) throw new UnauthorizedException('로그인이 필요합니다');
    return this.service.cancel(id, req.user.id);
  }

  @Patch(':id/complete')
  @ApiOperation({ summary: '커피챗 완료 처리 (양쪽 가능)' })
  complete(@Param('id') id: string, @Req() req: any) {
    if (!req.user?.id) throw new UnauthorizedException('로그인이 필요합니다');
    return this.service.complete(id, req.user.id);
  }

  // ──────── WebRTC 신호 (P2P 미디어용) ────────

  @Post('signal')
  @Throttle({ default: { limit: 60, ttl: 60000 } })
  @ApiOperation({ summary: 'WebRTC offer/answer/ICE 전송' })
  sendSignal(
    @Body() body: { roomId: string; toUserId: string; type: string; payload: unknown },
    @Req() req: any,
  ) {
    if (!req.user?.id) throw new UnauthorizedException('로그인이 필요합니다');
    return this.service.sendSignal(req.user.id, body);
  }

  @Get('signal/:roomId/poll')
  @Throttle({ default: { limit: 120, ttl: 60000 } })
  @ApiOperation({ summary: '내가 받을 WebRTC 신호 drain (한 번 읽으면 삭제)' })
  drainSignals(@Param('roomId') roomId: string, @Req() req: any) {
    if (!req.user?.id) throw new UnauthorizedException('로그인이 필요합니다');
    return this.service.drainSignals(req.user.id, roomId);
  }
}
