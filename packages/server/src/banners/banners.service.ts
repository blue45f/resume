import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class BannersService {
  constructor(private prisma: PrismaService) {}

  async getActive() {
    const now = new Date();
    return this.prisma.banner.findMany({
      where: {
        isActive: true,
        OR: [{ startAt: null }, { startAt: { lte: now } }],
        AND: [{ OR: [{ endAt: null }, { endAt: { gte: now } }] }],
      },
      orderBy: { order: 'asc' },
    });
  }

  async getAll() {
    return this.prisma.banner.findMany({ orderBy: { order: 'asc' } });
  }

  async create(data: any) {
    return this.prisma.banner.create({ data });
  }

  async update(id: string, data: any) {
    return this.prisma.banner.update({ where: { id }, data });
  }

  async remove(id: string) {
    return this.prisma.banner.delete({ where: { id } });
  }

  async reorder(ids: string[]) {
    return Promise.all(
      ids.map((id, index) => this.prisma.banner.update({ where: { id }, data: { order: index } })),
    );
  }
}
