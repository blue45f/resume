import { Controller, Get, Post, Delete, Param, Body, Req, UnauthorizedException } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { InterviewService, CreateInterviewAnswerDto } from './interview.service';

@ApiTags('interview')
@Controller('interview')
export class InterviewController {
  constructor(private readonly service: InterviewService) {}

  @Get('answers')
  @ApiOperation({ summary: '내 면접 답변 목록' })
  findAll(@Req() req: any) {
    if (!req.user?.id) throw new UnauthorizedException('로그인이 필요합니다');
    return this.service.findAll(req.user.id);
  }

  @Post('answers')
  @ApiOperation({ summary: '면접 답변 저장' })
  create(@Body() body: CreateInterviewAnswerDto, @Req() req: any) {
    if (!req.user?.id) throw new UnauthorizedException('로그인이 필요합니다');
    return this.service.create(req.user.id, body);
  }

  @Delete('answers/:id')
  @ApiOperation({ summary: '면접 답변 삭제' })
  remove(@Param('id') id: string, @Req() req: any) {
    if (!req.user?.id) throw new UnauthorizedException('로그인이 필요합니다');
    return this.service.remove(id, req.user.id);
  }
}
