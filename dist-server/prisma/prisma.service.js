"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var PrismaService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.PrismaService = void 0;
const common_1 = require("@nestjs/common");
const client_1 = require("@prisma/client");
let PrismaService = PrismaService_1 = class PrismaService extends client_1.PrismaClient {
    logger = new common_1.Logger(PrismaService_1.name);
    isConnected = false;
    constructor() {
        super({
            log: process.env.NODE_ENV !== 'production'
                ? [{ emit: 'event', level: 'query' }]
                : [{ emit: 'event', level: 'warn' }, { emit: 'event', level: 'error' }],
            datasources: {
                db: {
                    url: process.env.DATABASE_URL,
                },
            },
        });
        if (process.env.NODE_ENV !== 'production') {
            this.$on('query', (e) => {
                if (e.duration > 100) {
                    this.logger.warn(`Slow query (${e.duration}ms): ${e.query}`);
                }
            });
        }
        this.$on('warn', (e) => {
            this.logger.warn(`Prisma warning: ${e.message}`);
        });
        this.$on('error', (e) => {
            this.logger.error(`Prisma error: ${e.message}`);
        });
    }
    async onModuleInit() {
        try {
            await this.$connect();
            this.isConnected = true;
            this.logger.log('Database connection established');
        }
        catch (error) {
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
};
exports.PrismaService = PrismaService;
exports.PrismaService = PrismaService = PrismaService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [])
], PrismaService);
