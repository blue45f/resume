"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
require("reflect-metadata");
const core_1 = require("@nestjs/core");
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const helmet_1 = __importDefault(require("helmet"));
const app_module_1 = require("./app.module");
async function bootstrap() {
    const app = await core_1.NestFactory.create(app_module_1.AppModule, {
        logger: ['error', 'warn', 'log'],
    });
    const isProd = process.env.NODE_ENV === 'production';
    app.use((0, helmet_1.default)({ contentSecurityPolicy: false }));
    const allowedOrigins = process.env.ALLOWED_ORIGINS?.split(',') || [
        'http://localhost:5173',
        'http://localhost:3001',
    ];
    app.enableCors({
        origin: allowedOrigins,
        methods: ['GET', 'POST', 'PUT', 'DELETE'],
        allowedHeaders: ['Content-Type', 'Authorization'],
        maxAge: 3600,
    });
    app.setGlobalPrefix('api');
    app.useGlobalPipes(new common_1.ValidationPipe({
        whitelist: true,
        transform: true,
        forbidNonWhitelisted: true,
    }));
    if (!isProd) {
        const config = new swagger_1.DocumentBuilder()
            .setTitle('Resume Platform API')
            .setDescription('LLM 기반 이력서 관리 플랫폼')
            .setVersion('2.0')
            .build();
        const document = swagger_1.SwaggerModule.createDocument(app, config);
        swagger_1.SwaggerModule.setup('api/docs', app, document);
    }
    const port = process.env.PORT || 3001;
    await app.listen(port);
    common_1.Logger.log(`Server running on http://localhost:${port}`, 'Bootstrap');
    if (!isProd) {
        common_1.Logger.log(`Swagger docs at http://localhost:${port}/api/docs`, 'Bootstrap');
    }
}
bootstrap();
