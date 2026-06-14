import { Controller, Get, Post, Put, Delete, Body, Param, Req, Query } from '@nestjs/common'
import { ApiTags, ApiOperation } from '@nestjs/swagger'
import { Throttle } from '@nestjs/throttler'

import { Public } from '../auth/auth.guard'
import { requireRequestUserId } from '../common/request.types'

import { ApplicationsService } from './applications.service'
import { CreateApplicationDto, UpdateApplicationDto } from './dto/application.dto'

import type { AuthenticatedRequest } from '../common/request.types'

@ApiTags('applications')
@Controller('applications')
export class ApplicationsController {
  constructor(private readonly service: ApplicationsService) {}

  @Get()
  @ApiOperation({ summary: '지원 내역 목록' })
  findAll(
    @Req() req: AuthenticatedRequest,
    @Query('sort') sort?: string,
    @Query('status') status?: string,
    @Query('q') q?: string
  ) {
    return this.service.findAll(requireRequestUserId(req), { sort, status, q })
  }

  @Get('stats')
  @ApiOperation({ summary: '지원 통계' })
  getStats(@Req() req: AuthenticatedRequest) {
    return this.service.getStats(requireRequestUserId(req))
  }

  @Post()
  @ApiOperation({ summary: '지원 내역 추가' })
  create(@Body() dto: CreateApplicationDto, @Req() req: AuthenticatedRequest) {
    return this.service.create(dto, requireRequestUserId(req))
  }

  @Put(':id')
  @ApiOperation({ summary: '지원 내역 수정' })
  update(
    @Param('id') id: string,
    @Body() dto: UpdateApplicationDto,
    @Req() req: AuthenticatedRequest
  ) {
    return this.service.update(id, dto, requireRequestUserId(req))
  }

  @Delete(':id')
  @ApiOperation({ summary: '지원 내역 삭제' })
  remove(@Param('id') id: string, @Req() req: AuthenticatedRequest) {
    return this.service.remove(id, requireRequestUserId(req))
  }

  @Get(':id/comments')
  @Public()
  @ApiOperation({ summary: '지원 내역 댓글 목록' })
  async getComments(@Param('id') id: string) {
    const app = await this.service.findOne(id)
    if (!app || app.visibility !== 'public') return []
    return this.service.getComments(id)
  }

  @Post(':id/comments')
  @Throttle({ short: { limit: 5, ttl: 60000 } })
  @ApiOperation({ summary: '지원 내역에 댓글 작성' })
  async addComment(
    @Param('id') id: string,
    @Body() body: { content: string },
    @Req() req: AuthenticatedRequest
  ) {
    return this.service.addComment(id, body.content, req.user?.id)
  }
}
