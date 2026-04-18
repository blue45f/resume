import {
  Controller,
  Get,
  Post,
  Patch,
  Param,
  Body,
  Query,
  Req,
  UnauthorizedException,
} from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import {
  CoachingService,
  UpsertCoachProfileDto,
  CreateSessionDto,
  UpdateSessionStatusDto,
  ReviewSessionDto,
} from './coaching.service';

@ApiTags('coaching')
@Controller('coaching')
export class CoachingController {
  constructor(private readonly service: CoachingService) {}

  @Get('coaches')
  @ApiOperation({ summary: '코치 목록' })
  listCoaches(
    @Query('specialty') specialty?: string,
    @Query('minRate') minRate?: string,
    @Query('maxRate') maxRate?: string,
  ) {
    return this.service.listCoaches({
      specialty,
      minRate: minRate ? Number(minRate) : undefined,
      maxRate: maxRate ? Number(maxRate) : undefined,
    });
  }

  @Get('coaches/:id')
  @ApiOperation({ summary: '코치 상세' })
  getCoach(@Param('id') id: string) {
    return this.service.getCoach(id);
  }

  @Post('coach-profile')
  @ApiOperation({ summary: '코치 프로필 생성/수정' })
  upsertCoachProfile(@Body() body: UpsertCoachProfileDto, @Req() req: any) {
    if (!req.user?.id) throw new UnauthorizedException('로그인이 필요합니다');
    return this.service.upsertCoachProfile(req.user.id, body);
  }

  @Post('sessions')
  @ApiOperation({ summary: '코칭 세션 예약' })
  createSession(@Body() body: CreateSessionDto, @Req() req: any) {
    if (!req.user?.id) throw new UnauthorizedException('로그인이 필요합니다');
    return this.service.createSession(req.user.id, body);
  }

  @Get('sessions/my')
  @ApiOperation({ summary: '내 세션 목록 (클라이언트/코치 양쪽)' })
  mySessions(@Req() req: any) {
    if (!req.user?.id) throw new UnauthorizedException('로그인이 필요합니다');
    return this.service.mySessions(req.user.id);
  }

  @Patch('sessions/:id/status')
  @ApiOperation({ summary: '세션 상태 변경' })
  updateStatus(@Param('id') id: string, @Body() body: UpdateSessionStatusDto, @Req() req: any) {
    if (!req.user?.id) throw new UnauthorizedException('로그인이 필요합니다');
    return this.service.updateStatus(id, req.user.id, body);
  }

  @Post('sessions/:id/review')
  @ApiOperation({ summary: '세션 리뷰 및 평점 등록' })
  reviewSession(@Param('id') id: string, @Body() body: ReviewSessionDto, @Req() req: any) {
    if (!req.user?.id) throw new UnauthorizedException('로그인이 필요합니다');
    return this.service.reviewSession(id, req.user.id, body);
  }
}
