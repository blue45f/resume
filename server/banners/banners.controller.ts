import { Controller, Get, Post, Patch, Delete, Body, Param, UseGuards, Req } from '@nestjs/common';
import { BannersService } from './banners.service';

@Controller('banners')
export class BannersController {
  constructor(private readonly service: BannersService) {}

  @Get('active')
  getActive() {
    return this.service.getActive();
  }

  @Get()
  getAll(@Req() req: any) {
    if (req.user?.role !== 'admin') return this.service.getActive();
    return this.service.getAll();
  }

  @Post()
  create(@Req() req: any, @Body() body: any) {
    if (req.user?.role !== 'admin') throw new Error('Forbidden');
    return this.service.create(body);
  }

  @Patch('reorder')
  reorder(@Req() req: any, @Body() body: { ids: string[] }) {
    if (req.user?.role !== 'admin') throw new Error('Forbidden');
    return this.service.reorder(body.ids);
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
