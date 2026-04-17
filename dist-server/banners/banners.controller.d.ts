import { BannersService } from './banners.service';
export declare class BannersController {
    private readonly service;
    constructor(service: BannersService);
    getActive(): Promise<$Public.PrismaPromise<T>>;
    getAll(req: any): Promise<$Public.PrismaPromise<T>>;
    create(body: any): Promise<$Result.GetResult<import(".prisma/client").Prisma.$BannerPayload<ExtArgs>, T, "create", GlobalOmitOptions>>;
    reorder(body: {
        ids: string[];
    }): Promise<any>;
    update(id: string, body: any): Promise<$Result.GetResult<import(".prisma/client").Prisma.$BannerPayload<ExtArgs>, T, "update", GlobalOmitOptions>>;
    remove(id: string): Promise<$Result.GetResult<import(".prisma/client").Prisma.$BannerPayload<ExtArgs>, T, "delete", GlobalOmitOptions>>;
}
