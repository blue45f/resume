import { Controller, Get, Post, Patch, Delete, Body, Param, Query, Req } from '@nestjs/common';
import { NoticesService } from './notices.service';

@Controller('notices')
export class NoticesController {
  constructor(private readonly service: NoticesService) {}

  @Get('popup')
  getPopup() {
    return this.service.getPopup();
  }

  @Get()
  getAll(@Query('type') type?: string, @Query('page') page = '1', @Query('limit') limit = '10') {
    return this.service.getAll(type, parseInt(page), parseInt(limit));
  }

  @Get(':id')
  getOne(@Param('id') id: string) {
    return this.service.getOne(id);
  }

  @Post()
  create(@Req() req: any, @Body() body: any) {
    if (req.user?.role !== 'admin') throw new Error('Forbidden');
    return this.service.create(body);
  }

  @Patch(':id')
  update(@Req() req: any, @Param('id') id: string, @Body() body: any) {
    if (req.user?.role !== 'admin') throw new Error('Forbidden');
    return this.service.update(id, body);
  }

  @Delete(':id')
  remove(@Req() req: any, @Param('id') id: string) {
    if (req.user?.role !== 'admin') throw new Error('Forbidden');
    return this.service.remove(id);
  }
}
