"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
require("reflect-metadata");
const core_1 = require("@nestjs/core");
const common_1 = require("@nestjs/common");
const logging_interceptor_1 = require("./common/interceptors/logging.interceptor");
const cache_interceptor_1 = require("./common/interceptors/cache.interceptor");
const etag_interceptor_1 = require("./common/interceptors/etag.interceptor");
const swagger_1 = require("@nestjs/swagger");
const core_2 = require("@nestjs/core");
const compression_1 = __importDefault(require("compression"));
const helmet_1 = __importDefault(require("helmet"));
const cookie_parser_1 = __importDefault(require("cookie-parser"));
const app_module_1 = require("./app.module");
const http_exception_filter_1 = require("./common/filters/http-exception.filter");
async function bootstrap() {
    const app = await core_1.NestFactory.create(app_module_1.AppModule, {
        logger: ['error', 'warn', 'log'],
    });
    const isProd = process.env.NODE_ENV === 'production';
    app.enableShutdownHooks();
    app.use((0, compression_1.default)());
    app.use((0, helmet_1.default)({
        contentSecurityPolicy: isProd
            ? {
                directives: {
                    defaultSrc: ["'self'"],
                    scriptSrc: ["'self'"],
                    styleSrc: ["'self'", "'unsafe-inline'", 'https://fonts.googleapis.com'],
                    fontSrc: ["'self'", 'https://fonts.gstatic.com'],
                    imgSrc: ["'self'", 'data:', 'https:'],
                    connectSrc: ["'self'"],
                },
            }
            : false,
        xContentTypeOptions: true,
        referrerPolicy: { policy: 'strict-origin-when-cross-origin' },
    }));
    app.use((0, cookie_parser_1.default)());
    const allowedOrigins = process.env.ALLOWED_ORIGINS?.split(',') || [
        'http://localhost:5173',
        'http://localhost:3001',
    ];
    app.enableCors({
        origin: allowedOrigins,
        methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
        allowedHeaders: ['Content-Type', 'Authorization'],
        credentials: true,
        maxAge: 3600,
    });
    app.setGlobalPrefix('api');
    app.useGlobalFilters(new http_exception_filter_1.GlobalExceptionFilter());
    app.useGlobalInterceptors(new logging_interceptor_1.LoggingInterceptor());
    const reflector = app.get(core_2.Reflector);
    app.useGlobalInterceptors(new cache_interceptor_1.CacheHeaderInterceptor(reflector));
    app.useGlobalInterceptors(new etag_interceptor_1.ETagInterceptor());
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
            .addBearerAuth()
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
