import {
  Body,
  Controller,
  Delete,
  Get,
  Header,
  Param,
  Patch,
  Post,
  Query,
  Req,
  Res,
  UnauthorizedException,
} from '@nestjs/common';
import type { Response } from 'express';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import { Public } from '../auth/auth.guard';
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

  @Get('topics')
  @Public()
  @ApiOperation({ summary: 'Topic templates 카탈로그 (Topmate 패턴, 7개 preset)' })
  listTopics() {
    return this.service.listTopics();
  }

  @Get('host-stats/:hostId')
  @Public()
  @ApiOperation({
    summary: 'Host 응답률 / 평균 응답 시간 / no-show 통계 (Adplist 신뢰 패턴)',
  })
  hostStats(@Param('hostId') hostId: string) {
    return this.service.getHostStats(hostId);
  }

  @Get(':id/ics')
  @Header('Content-Type', 'text/calendar; charset=utf-8')
  @ApiOperation({ summary: 'Google/Outlook 캘린더 ICS export — accepted 만 가능' })
  async exportIcs(@Param('id') id: string, @Req() req: any, @Res() res: Response) {
    if (!req.user?.id) throw new UnauthorizedException('로그인이 필요합니다');
    const ics = await this.service.generateIcs(id, req.user.id);
    res.setHeader('Content-Disposition', `attachment; filename="coffee-chat-${id}.ics"`);
    res.send(ics);
  }

  @Patch(':id/join')
  @ApiOperation({ summary: 'WebRTC room 입장 — no-show 추적' })
  recordJoin(@Param('id') id: string, @Req() req: any) {
    if (!req.user?.id) throw new UnauthorizedException('로그인이 필요합니다');
    return this.service.recordJoin(id, req.user.id);
  }

  @Patch(':id/feedback')
  @Throttle({ default: { limit: 5, ttl: 60000 } })
  @ApiOperation({ summary: '커피챗 후기 (host/requester 본인 측 필드만)' })
  leaveFeedback(@Param('id') id: string, @Body('feedback') feedback: string, @Req() req: any) {
    if (!req.user?.id) throw new UnauthorizedException('로그인이 필요합니다');
    return this.service.leaveFeedback(id, req.user.id, feedback || '');
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

  @Post('signal/telemetry')
  @Throttle({ default: { limit: 30, ttl: 60000 } })
  @ApiOperation({
    summary:
      'WebRTC peer connection state 변화 telemetry — 성공률 측정용 (비용 X, fire-and-forget)',
  })
  recordTelemetry(
    @Body()
    body: {
      roomId: string;
      state: 'connecting' | 'connected' | 'disconnected' | 'failed';
      modality?: 'voice' | 'video' | 'chat';
      durationMs?: number;
      errorName?: string;
    },
    @Req() req: any,
  ) {
    if (!req.user?.id) return { ok: false };
    return this.service.recordPeerTelemetry(req.user.id, body);
  }
}
