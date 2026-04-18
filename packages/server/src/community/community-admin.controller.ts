import {
  Controller,
  Get,
  Patch,
  Delete,
  Post,
  Body,
  Param,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { AdminGuard } from '../common/guards/admin.guard';
import { CommunityService } from './community.service';

@ApiTags('community-admin')
@Controller('community/admin')
@UseGuards(AdminGuard)
export class CommunityAdminController {
  constructor(private readonly service: CommunityService) {}

  @Get('posts')
  @ApiOperation({ summary: '[관리자] 전체 커뮤니티 게시물 목록' })
  list(
    @Query('q') q?: string,
    @Query('category') category?: string,
    @Query('hidden') hidden?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.service.adminList({
      q,
      category,
      hidden,
      page: page ? parseInt(page, 10) : 1,
      limit: limit ? parseInt(limit, 10) : 20,
    });
  }

  @Patch('posts/:id/hide')
  @ApiOperation({ summary: '[관리자] 게시물 숨김 토글' })
  hide(@Param('id') id: string, @Body() body: { isHidden?: boolean }) {
    return this.service.adminToggleHide(id, body?.isHidden);
  }

  @Patch('posts/:id/pin')
  @ApiOperation({ summary: '[관리자] 게시물 핀 토글' })
  pin(@Param('id') id: string, @Body() body: { isPinned?: boolean }) {
    return this.service.adminTogglePin(id, body?.isPinned);
  }

  @Patch('posts/:id/category')
  @ApiOperation({ summary: '[관리자] 카테고리 변경' })
  category(@Param('id') id: string, @Body() body: { category: string }) {
    return this.service.adminChangeCategory(id, body.category);
  }

  @Delete('posts/:id')
  @ApiOperation({ summary: '[관리자] 게시물 삭제' })
  remove(@Param('id') id: string) {
    return this.service.adminDelete(id);
  }

  @Post('posts/bulk')
  @ApiOperation({ summary: '[관리자] 일괄 처리' })
  bulk(@Body() body: { action: 'hide' | 'delete' | 'show'; ids: string[] }) {
    return this.service.adminBulk(body.action, body.ids || []);
  }
}
