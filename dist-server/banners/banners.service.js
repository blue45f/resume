"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
Object.defineProperty(exports, "BannersService", {
    enumerable: true,
    get: function() {
        return BannersService;
    }
});
const _common = require("@nestjs/common");
const _prismaservice = require("../prisma/prisma.service");
function _ts_decorate(decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for(var i = decorators.length - 1; i >= 0; i--)if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
}
function _ts_metadata(k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
}
let BannersService = class BannersService {
    async getActive() {
        const now = new Date();
        return this.prisma.banner.findMany({
            where: {
                isActive: true,
                OR: [
                    {
                        startAt: null
                    },
                    {
                        startAt: {
                            lte: now
                        }
                    }
                ],
                AND: [
                    {
                        OR: [
                            {
                                endAt: null
                            },
                            {
                                endAt: {
                                    gte: now
                                }
                            }
                        ]
                    }
                ]
            },
            orderBy: {
                order: 'asc'
            }
        });
    }
    async getAll() {
        return this.prisma.banner.findMany({
            orderBy: {
                order: 'asc'
            }
        });
    }
    async create(data) {
        return this.prisma.banner.create({
            data
        });
    }
    async update(id, data) {
        return this.prisma.banner.update({
            where: {
                id
            },
            data
        });
    }
    async remove(id) {
        return this.prisma.banner.delete({
            where: {
                id
            }
        });
    }
    async reorder(ids) {
        return Promise.all(ids.map((id, index)=>this.prisma.banner.update({
                where: {
                    id
                },
                data: {
                    order: index
                }
            })));
    }
    constructor(prisma){
        this.prisma = prisma;
    }
};
BannersService = _ts_decorate([
    (0, _common.Injectable)(),
    _ts_metadata("design:type", Function),
    _ts_metadata("design:paramtypes", [
        typeof _prismaservice.PrismaService === "undefined" ? Object : _prismaservice.PrismaService
    ])
], BannersService);
