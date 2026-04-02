import { Injectable, NestMiddleware, BadRequestException } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';

// HTML 콘텐츠를 허용하는 필드 (TipTap 리치 에디터 사용)
const HTML_ALLOWED_FIELDS = new Set([
  'summary', 'description', 'achievements', 'text',
]);

@Injectable()
export class SanitizeMiddleware implements NestMiddleware {
  use(req: Request, _res: Response, next: NextFunction) {
    if (req.body && typeof req.body === 'object') {
      req.body = this.sanitize(req.body);
    }
    next();
  }

  private sanitize(value: unknown, key?: string): unknown {
    if (typeof value === 'string') {
      // HTML 허용 필드는 태그를 제거하지 않고 trim만
      if (key && HTML_ALLOWED_FIELDS.has(key)) {
        return value.trim();
      }
      return value.replace(/<[^>]*>/g, '').trim();
    }

    if (Array.isArray(value)) {
      return value.map((item) => this.sanitize(item));
    }

    if (value !== null && typeof value === 'object') {
      const sanitized: Record<string, unknown> = {};
      for (const objKey of Object.keys(value)) {
        if (objKey.startsWith('$')) {
          throw new BadRequestException(`Invalid field name: ${objKey}`);
        }
        sanitized[objKey] = this.sanitize((value as Record<string, unknown>)[objKey], objKey);
      }
      return sanitized;
    }

    return value;
  }
}
