import { Injectable, NestMiddleware, BadRequestException } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';

@Injectable()
export class SanitizeMiddleware implements NestMiddleware {
  use(req: Request, _res: Response, next: NextFunction) {
    if (req.body && typeof req.body === 'object') {
      req.body = this.sanitize(req.body);
    }
    next();
  }

  private sanitize(value: unknown): unknown {
    if (typeof value === 'string') {
      return value.replace(/<[^>]*>/g, '').trim();
    }

    if (Array.isArray(value)) {
      return value.map((item) => this.sanitize(item));
    }

    if (value !== null && typeof value === 'object') {
      const sanitized: Record<string, unknown> = {};
      for (const key of Object.keys(value)) {
        if (key.startsWith('$')) {
          throw new BadRequestException(`Invalid field name: ${key}`);
        }
        sanitized[key] = this.sanitize((value as Record<string, unknown>)[key]);
      }
      return sanitized;
    }

    return value;
  }
}
