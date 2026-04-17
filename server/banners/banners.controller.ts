import { Controller, Get, Post, Patch, Delete, Body, Param, UseGuards, Req } from '@nestjs/common';
import { BannersService } from './banners.service';
import { AdminGuard } from '../common/guards/admin.guard';
import { isAdmin } from '../common/roles';

@Controller('banners')
export class BannersController {
  constructor(private readonly service: BannersService) {}

  @Get('active')
  getActive() {
    return this.service.getActive();
  }

  @Get()
  getAll(@Req() req: any) {
    if (!isAdmin(req.user?.role)) return this.service.getActive();
    return this.service.getAll();
  }

  @Post()
  @UseGuards(AdminGuard)
  create(@Body() body: any) {
    return this.service.create(body);
  }

  @Patch('reorder')
  @UseGuards(AdminGuard)
  reorder(@Body() body: { ids: string[] }) {
    return this.service.reorder(body.ids);
  }

  @Patch(':id')
  @UseGuards(AdminGuard)
  update(@Param('id') id: string, @Body() body: any) {
    return this.service.update(id, body);
  }

  @Delete(':id')
  @UseGuards(AdminGuard)
  remove(@Param('id') id: string) {
    return this.service.remove(id);
  }
}
