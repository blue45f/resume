"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
Object.defineProperty(exports, "PrismaService", {
    enumerable: true,
    get: function() {
        return PrismaService;
    }
});
const _common = require("@nestjs/common");
const _client = require("@prisma/client");
function _ts_decorate(decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for(var i = decorators.length - 1; i >= 0; i--)if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
}
function _ts_metadata(k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
}
let PrismaService = class PrismaService extends _client.PrismaClient {
    async onModuleInit() {
        try {
            await this.$connect();
            this.isConnected = true;
            this.logger.log('Database connection established');
        } catch (error) {
            this.logger.error('Failed to connect to database', error);
            throw error;
        }
    }
    async beforeApplicationShutdown(signal) {
        this.logger.log(`Application shutting down (signal: ${signal}), closing database connections...`);
        if (this.isConnected) {
            await this.$disconnect();
            this.isConnected = false;
            this.logger.log('Database connections closed');
        }
    }
    async onModuleDestroy() {
        if (this.isConnected) {
            await this.$disconnect();
            this.isConnected = false;
        }
    }
    constructor(){
        super({
            log: process.env.NODE_ENV !== 'production' ? [
                {
                    emit: 'event',
                    level: 'query'
                }
            ] : [
                {
                    emit: 'event',
                    level: 'warn'
                },
                {
                    emit: 'event',
                    level: 'error'
                }
            ],
            datasources: {
                db: {
                    url: process.env.DATABASE_URL
                }
            }
        }), this.logger = new _common.Logger(PrismaService.name), this.isConnected = false;
        if (process.env.NODE_ENV !== 'production') {
            this.$on('query', (e)=>{
                if (e.duration > 100) {
                    this.logger.warn(`Slow query (${e.duration}ms): ${e.query}`);
                }
            });
        }
        // Log connection pool warnings in production
        this.$on('warn', (e)=>{
            this.logger.warn(`Prisma warning: ${e.message}`);
        });
        this.$on('error', (e)=>{
            this.logger.error(`Prisma error: ${e.message}`);
        });
    }
};
PrismaService = _ts_decorate([
    (0, _common.Injectable)(),
    _ts_metadata("design:type", Function),
    _ts_metadata("design:paramtypes", [])
], PrismaService);
