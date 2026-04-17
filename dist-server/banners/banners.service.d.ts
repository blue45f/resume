import { PrismaService } from '../prisma/prisma.service';
export declare class BannersService {
    private prisma;
    constructor(prisma: PrismaService);
    getActive(): Promise<$Public.PrismaPromise<T>>;
    getAll(): Promise<$Public.PrismaPromise<T>>;
    create(data: any): Promise<$Result.GetResult<import(".prisma/client").Prisma.$BannerPayload<ExtArgs>, T, "create", GlobalOmitOptions>>;
    update(id: string, data: any): Promise<$Result.GetResult<import(".prisma/client").Prisma.$BannerPayload<ExtArgs>, T, "update", GlobalOmitOptions>>;
    remove(id: string): Promise<$Result.GetResult<import(".prisma/client").Prisma.$BannerPayload<ExtArgs>, T, "delete", GlobalOmitOptions>>;
    reorder(ids: string[]): Promise<any>;
}
