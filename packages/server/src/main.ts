// Sentry must be imported before everything else so its instrumentation hooks
// are installed first. No-op unless SENTRY_DSN is set (see instrument.ts).
import './instrument'
import 'reflect-metadata'
import { ValidationPipe, Logger } from '@nestjs/common'
import { NestFactory, Reflector } from '@nestjs/core'
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger'
import compression from 'compression'
import cookieParser from 'cookie-parser'
import { json, urlencoded } from 'express'
import helmet from 'helmet'

import { AppModule } from './app.module'
import { GlobalExceptionFilter } from './common/filters/http-exception.filter'
import { CacheHeaderInterceptor } from './common/interceptors/cache.interceptor'
import { ETagInterceptor } from './common/interceptors/etag.interceptor'
import { LoggingInterceptor } from './common/interceptors/logging.interceptor'
import { validateEnv, formatValidationReport } from './gcp/env-validation'
import { GcpLoggerService } from './gcp/gcp-logger.service'

async function bootstrap() {
  const isProd = process.env.NODE_ENV === 'production'

  // --- Boot-time env validation (GCP/Cloud Run) ---
  // Validate before creating the app so misconfiguration fails fast with a
  // clear message. In production, missing required secrets abort startup.
  const validation = validateEnv(process.env, isProd)
  const report = formatValidationReport(validation)
  for (const line of report.lines) {
    if (line.startsWith('ERROR:')) console.error(line)
    else if (line.startsWith('WARN:')) console.warn(line)
    else console.log(line)
  }
  if (isProd && validation.errors.length) {
    console.error(
      `Refusing to start: ${validation.errors.length} required env var(s) missing. ` +
        'On Cloud Run, source secrets from Secret Manager (see docs/DEPLOYMENT.md).'
    )
    process.exit(1)
  }

  const app = await NestFactory.create(AppModule, {
    // In production, emit Cloud Logging-friendly structured JSON logs so they
    // are queryable in GCP. In dev, keep Nest's pretty console logger.
    logger: isProd ? new GcpLoggerService(['error', 'warn', 'log']) : ['error', 'warn', 'log'],
  })

  // Graceful shutdown
  app.enableShutdownHooks()

  // --- Request size limits (DoS prevention) ---
  app.use(json({ limit: '10mb' }))
  app.use(urlencoded({ extended: true, limit: '50mb' }))

  app.use(compression())

  app.use(
    helmet({
      contentSecurityPolicy: isProd
        ? {
            directives: {
              defaultSrc: ["'self'"],
              scriptSrc: ["'self'"],
              styleSrc: ["'self'", "'unsafe-inline'", 'https://fonts.googleapis.com'],
              fontSrc: ["'self'", 'https://fonts.gstatic.com'],
              imgSrc: ["'self'", 'data:', 'https:'],
              connectSrc: [
                "'self'",
                'https://*.run.app',
                'https://*.onrender.com',
                'https://res.cloudinary.com',
              ],
              frameAncestors: ["'none'"],
            },
          }
        : false,
      // Security headers (applied in all environments)
      xContentTypeOptions: true,
      referrerPolicy: { policy: 'strict-origin-when-cross-origin' },
      frameguard: { action: 'deny' }, // X-Frame-Options: DENY
      hsts: isProd ? { maxAge: 63072000, includeSubDomains: true, preload: true } : false,
      hidePoweredBy: true,
      crossOriginOpenerPolicy: { policy: 'same-origin' },
      crossOriginResourcePolicy: { policy: 'cross-origin' },
    })
  )

  app.use(cookieParser())

  // CORS - 프론트엔드 도메인 허용
  const allowedOrigins = process.env.ALLOWED_ORIGINS?.split(',').map((s) => s.trim()) || [
    'http://localhost:5173',
    'http://localhost:3001',
  ]
  app.enableCors({
    origin: allowedOrigins,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-CSRF-Token'],
    credentials: true,
    maxAge: 3600,
  })

  app.setGlobalPrefix('api')
  app.useGlobalFilters(new GlobalExceptionFilter())
  app.useGlobalInterceptors(new LoggingInterceptor())
  const reflector = app.get(Reflector)
  app.useGlobalInterceptors(new CacheHeaderInterceptor(reflector))
  app.useGlobalInterceptors(new ETagInterceptor())
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: true,
    })
  )

  if (!isProd) {
    const config = new DocumentBuilder()
      .setTitle('Resume Platform API')
      .setDescription('LLM 기반 이력서 관리 플랫폼')
      .setVersion('2.0')
      .addBearerAuth()
      .build()
    const document = SwaggerModule.createDocument(app, config)
    SwaggerModule.setup('api/docs', app, document)
  }

  const port = process.env.PORT || 3001
  await app.listen(port)
  Logger.log(`Server running on http://localhost:${port}`, 'Bootstrap')
  if (!isProd) {
    Logger.log(`Swagger docs at http://localhost:${port}/api/docs`, 'Bootstrap')
  }
}

bootstrap()
