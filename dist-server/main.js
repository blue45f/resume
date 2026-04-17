"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
require("reflect-metadata");
const _core = require("@nestjs/core");
const _common = require("@nestjs/common");
const _logginginterceptor = require("./common/interceptors/logging.interceptor");
const _cacheinterceptor = require("./common/interceptors/cache.interceptor");
const _etaginterceptor = require("./common/interceptors/etag.interceptor");
const _swagger = require("@nestjs/swagger");
const _compression = /*#__PURE__*/ _interop_require_default(require("compression"));
const _helmet = /*#__PURE__*/ _interop_require_default(require("helmet"));
const _cookieparser = /*#__PURE__*/ _interop_require_default(require("cookie-parser"));
const _express = require("express");
const _appmodule = require("./app.module");
const _httpexceptionfilter = require("./common/filters/http-exception.filter");
function _interop_require_default(obj) {
    return obj && obj.__esModule ? obj : {
        default: obj
    };
}
async function bootstrap() {
    const app = await _core.NestFactory.create(_appmodule.AppModule, {
        logger: [
            'error',
            'warn',
            'log'
        ]
    });
    const isProd = process.env.NODE_ENV === 'production';
    // Graceful shutdown
    app.enableShutdownHooks();
    // --- Request size limits (DoS prevention) ---
    app.use((0, _express.json)({
        limit: '10mb'
    }));
    app.use((0, _express.urlencoded)({
        extended: true,
        limit: '50mb'
    }));
    app.use((0, _compression.default)());
    app.use((0, _helmet.default)({
        contentSecurityPolicy: isProd ? {
            directives: {
                defaultSrc: [
                    "'self'"
                ],
                scriptSrc: [
                    "'self'"
                ],
                styleSrc: [
                    "'self'",
                    "'unsafe-inline'",
                    'https://fonts.googleapis.com'
                ],
                fontSrc: [
                    "'self'",
                    'https://fonts.gstatic.com'
                ],
                imgSrc: [
                    "'self'",
                    'data:',
                    'https:'
                ],
                connectSrc: [
                    "'self'",
                    'https://*.run.app',
                    'https://*.onrender.com',
                    'https://res.cloudinary.com'
                ],
                frameAncestors: [
                    "'none'"
                ]
            }
        } : false,
        // Security headers (applied in all environments)
        xContentTypeOptions: true,
        referrerPolicy: {
            policy: 'strict-origin-when-cross-origin'
        },
        frameguard: {
            action: 'deny'
        },
        hsts: isProd ? {
            maxAge: 63072000,
            includeSubDomains: true,
            preload: true
        } : false,
        hidePoweredBy: true,
        crossOriginOpenerPolicy: {
            policy: 'same-origin'
        },
        crossOriginResourcePolicy: {
            policy: 'cross-origin'
        }
    }));
    app.use((0, _cookieparser.default)());
    // CORS - 프론트엔드 도메인 허용
    const allowedOrigins = process.env.ALLOWED_ORIGINS?.split(',').map((s)=>s.trim()) || [
        'http://localhost:5173',
        'http://localhost:3001'
    ];
    app.enableCors({
        origin: allowedOrigins,
        methods: [
            'GET',
            'POST',
            'PUT',
            'DELETE',
            'PATCH'
        ],
        allowedHeaders: [
            'Content-Type',
            'Authorization',
            'X-CSRF-Token'
        ],
        credentials: true,
        maxAge: 3600
    });
    app.setGlobalPrefix('api');
    app.useGlobalFilters(new _httpexceptionfilter.GlobalExceptionFilter());
    app.useGlobalInterceptors(new _logginginterceptor.LoggingInterceptor());
    const reflector = app.get(_core.Reflector);
    app.useGlobalInterceptors(new _cacheinterceptor.CacheHeaderInterceptor(reflector));
    app.useGlobalInterceptors(new _etaginterceptor.ETagInterceptor());
    app.useGlobalPipes(new _common.ValidationPipe({
        whitelist: true,
        transform: true,
        forbidNonWhitelisted: true
    }));
    if (!isProd) {
        const config = new _swagger.DocumentBuilder().setTitle('Resume Platform API').setDescription('LLM 기반 이력서 관리 플랫폼').setVersion('2.0').addBearerAuth().build();
        const document = _swagger.SwaggerModule.createDocument(app, config);
        _swagger.SwaggerModule.setup('api/docs', app, document);
    }
    const port = process.env.PORT || 3001;
    await app.listen(port);
    _common.Logger.log(`Server running on http://localhost:${port}`, 'Bootstrap');
    if (!isProd) {
        _common.Logger.log(`Swagger docs at http://localhost:${port}/api/docs`, 'Bootstrap');
    }
}
bootstrap();
