import { Controller, Get, Post, Patch, Delete, Body, Param, Query, Req } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { ForbiddenWordsService } from './forbidden-words.service';

@ApiTags('forbidden-words')
@Controller('forbidden-words')
export class ForbiddenWordsController {
  constructor(private readonly service: ForbiddenWordsService) {}

  private isAdmin(req: any): boolean {
    return req.user?.role === 'admin' || req.user?.role === 'superadmin';
  }

  @Get()
  @ApiOperation({ summary: '금칙어 목록 (관리자)' })
  findAll(
    @Query('category') category?: string,
    @Query('search') search?: string,
    @Query('page') page = '1',
    @Query('limit') limit = '50',
    @Req() req?: any,
  ) {
    if (!this.isAdmin(req)) return { items: [], total: 0 };
    return this.service.findAll(category, search, parseInt(page), parseInt(limit));
  }

  @Get('stats')
  @ApiOperation({ summary: '금칙어 통계' })
  getStats(@Req() req: any) {
    if (!this.isAdmin(req)) return {};
    return this.service.getStats();
  }

  @Get('categories')
  @ApiOperation({ summary: '금칙어 카테고리 목록' })
  getCategories(@Req() req: any) {
    if (!this.isAdmin(req)) return [];
    return this.service.getCategories();
  }

  @Post('check')
  @ApiOperation({ summary: '콘텐츠 금칙어 검사' })
  check(@Body() body: { text: string }) {
    return this.service.checkContent(body.text);
  }

  @Post()
  @ApiOperation({ summary: '금칙어 등록' })
  create(@Body() body: { word: string; category?: string; severity?: string }, @Req() req: any) {
    if (!this.isAdmin(req)) return { error: '권한이 없습니다' };
    return this.service.create(
      body.word,
      body.category || 'general',
      body.severity || 'block',
      req.user?.id,
    );
  }

  @Post('bulk')
  @ApiOperation({ summary: '금칙어 일괄 등록' })
  createBulk(
    @Body() body: { words: string[]; category?: string; severity?: string },
    @Req() req: any,
  ) {
    if (!this.isAdmin(req)) return { error: '권한이 없습니다' };
    return this.service.createBulk(
      body.words,
      body.category || 'general',
      body.severity || 'block',
      req.user?.id,
    );
  }

  @Patch(':id')
  @ApiOperation({ summary: '금칙어 수정' })
  update(
    @Param('id') id: string,
    @Body() body: { word?: string; category?: string; severity?: string; isActive?: boolean },
    @Req() req: any,
  ) {
    if (!this.isAdmin(req)) return { error: '권한이 없습니다' };
    return this.service.update(id, body);
  }

  @Delete('bulk')
  @ApiOperation({ summary: '금칙어 일괄 삭제' })
  removeBulk(@Body() body: { ids: string[] }, @Req() req: any) {
    if (!this.isAdmin(req)) return { error: '권한이 없습니다' };
    return this.service.removeBulk(body.ids);
  }

  @Delete(':id')
  @ApiOperation({ summary: '금칙어 삭제' })
  remove(@Param('id') id: string, @Req() req: any) {
    if (!this.isAdmin(req)) return { error: '권한이 없습니다' };
    return this.service.remove(id);
  }
}
