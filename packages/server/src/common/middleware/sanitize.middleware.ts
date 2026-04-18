import { Injectable, NestMiddleware, BadRequestException } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import sanitizeHtml from 'sanitize-html';

// HTML 콘텐츠를 허용하는 필드 (TipTap 리치 에디터 사용)
const HTML_ALLOWED_FIELDS = new Set(['summary', 'description', 'achievements', 'text']);

// sanitize-html 설정: TipTap 에디터 출력 기준 허용 태그/속성
const SANITIZE_OPTIONS: sanitizeHtml.IOptions = {
  allowedTags: [
    'p',
    'br',
    'strong',
    'b',
    'em',
    'i',
    'u',
    's',
    'del',
    'h1',
    'h2',
    'h3',
    'h4',
    'h5',
    'h6',
    'ul',
    'ol',
    'li',
    'blockquote',
    'pre',
    'code',
    'a',
    'span',
    'div',
    'sub',
    'sup',
    'table',
    'thead',
    'tbody',
    'tr',
    'th',
    'td',
    'hr',
    'img',
  ],
  allowedAttributes: {
    a: ['href', 'target', 'rel'],
    img: ['src', 'alt', 'width', 'height'],
    span: ['class', 'style'],
    div: ['class', 'style'],
    p: ['class', 'style'],
    td: ['colspan', 'rowspan'],
    th: ['colspan', 'rowspan'],
  },
  allowedSchemes: ['http', 'https', 'mailto'],
  disallowedTagsMode: 'discard',
};

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
      // HTML 허용 필드는 sanitize-html로 위험한 태그/속성만 제거
      if (key && HTML_ALLOWED_FIELDS.has(key)) {
        return sanitizeHtml(value.trim(), SANITIZE_OPTIONS);
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
