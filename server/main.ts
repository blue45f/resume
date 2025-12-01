import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import { ValidationPipe, Logger } from '@nestjs/common';
import { LoggingInterceptor } from './common/interceptors/logging.interceptor';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import { AppModule } from './app.module';
import { GlobalExceptionFilter } from './common/filters/http-exception.filter';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    logger: ['error', 'warn', 'log'],
  });

  const isProd = process.env.NODE_ENV === 'production';

  // Graceful shutdown
  app.enableShutdownHooks();

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
              connectSrc: ["'self'"],
            },
          }
        : false,
      xContentTypeOptions: true,
      referrerPolicy: { policy: 'strict-origin-when-cross-origin' },
    }),
  );

  app.use(cookieParser());

  // CORS - 프론트엔드 도메인 허용
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
  app.useGlobalFilters(new GlobalExceptionFilter());
  app.useGlobalInterceptors(new LoggingInterceptor());
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: true,
    }),
  );

  if (!isProd) {
    const config = new DocumentBuilder()
      .setTitle('Resume Platform API')
      .setDescription('LLM 기반 이력서 관리 플랫폼')
      .setVersion('2.0')
      .addBearerAuth()
      .build();
    const document = SwaggerModule.createDocument(app, config);
    SwaggerModule.setup('api/docs', app, document);
  }

  const port = process.env.PORT || 3001;
  await app.listen(port);
  Logger.log(`Server running on http://localhost:${port}`, 'Bootstrap');
  if (!isProd) {
    Logger.log(`Swagger docs at http://localhost:${port}/api/docs`, 'Bootstrap');
  }
}

bootstrap();
