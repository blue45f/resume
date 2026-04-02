import { Controller, Get, Post, Put, Delete, Body, Param, Req } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { ApplicationsService } from './applications.service';
import { Public } from '../auth/auth.guard';

@ApiTags('applications')
@Controller('applications')
export class ApplicationsController {
  constructor(private readonly service: ApplicationsService) {}

  @Get()
  @ApiOperation({ summary: '지원 내역 목록' })
  findAll(@Req() req: any) {
    return this.service.findAll(req.user?.id);
  }

  @Get('stats')
  @ApiOperation({ summary: '지원 통계' })
  getStats(@Req() req: any) {
    return this.service.getStats(req.user?.id);
  }

  @Post()
  @ApiOperation({ summary: '지원 내역 추가' })
  create(@Body() body: { company: string; position: string; url?: string; status?: string; appliedDate?: string; notes?: string; salary?: string; location?: string; resumeId?: string }, @Req() req: any) {
    return this.service.create(body, req.user?.id);
  }

  @Put(':id')
  @ApiOperation({ summary: '지원 내역 수정' })
  update(@Param('id') id: string, @Body() body: any, @Req() req: any) {
    return this.service.update(id, body, req.user?.id);
  }

  @Delete(':id')
  @ApiOperation({ summary: '지원 내역 삭제' })
  remove(@Param('id') id: string, @Req() req: any) {
    return this.service.remove(id, req.user?.id);
  }

  @Get(':id/comments')
  @Public()
  @ApiOperation({ summary: '지원 내역 댓글 목록' })
  async getComments(@Param('id') id: string) {
    const app = await this.service.findOne(id);
    if (!app || app.visibility !== 'public') return [];
    return this.service.getComments(id);
  }

  @Post(':id/comments')
  @ApiOperation({ summary: '지원 내역에 댓글 작성' })
  async addComment(
    @Param('id') id: string,
    @Body() body: { content: string },
    @Req() req: any,
  ) {
    return this.service.addComment(id, body.content, req.user?.id);
  }
}
