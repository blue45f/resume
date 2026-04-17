"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.SanitizeMiddleware = void 0;
const common_1 = require("@nestjs/common");
const sanitize_html_1 = __importDefault(require("sanitize-html"));
const HTML_ALLOWED_FIELDS = new Set([
    'summary', 'description', 'achievements', 'text',
]);
const SANITIZE_OPTIONS = {
    allowedTags: [
        'p', 'br', 'strong', 'b', 'em', 'i', 'u', 's', 'del',
        'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
        'ul', 'ol', 'li',
        'blockquote', 'pre', 'code',
        'a', 'span', 'div', 'sub', 'sup',
        'table', 'thead', 'tbody', 'tr', 'th', 'td',
        'hr', 'img',
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
let SanitizeMiddleware = class SanitizeMiddleware {
    use(req, _res, next) {
        if (req.body && typeof req.body === 'object') {
            req.body = this.sanitize(req.body);
        }
        next();
    }
    sanitize(value, key) {
        if (typeof value === 'string') {
            if (key && HTML_ALLOWED_FIELDS.has(key)) {
                return (0, sanitize_html_1.default)(value.trim(), SANITIZE_OPTIONS);
            }
            return value.replace(/<[^>]*>/g, '').trim();
        }
        if (Array.isArray(value)) {
            return value.map((item) => this.sanitize(item));
        }
        if (value !== null && typeof value === 'object') {
            const sanitized = {};
            for (const objKey of Object.keys(value)) {
                if (objKey.startsWith('$')) {
                    throw new common_1.BadRequestException(`Invalid field name: ${objKey}`);
                }
                sanitized[objKey] = this.sanitize(value[objKey], objKey);
            }
            return sanitized;
        }
        return value;
    }
};
exports.SanitizeMiddleware = SanitizeMiddleware;
exports.SanitizeMiddleware = SanitizeMiddleware = __decorate([
    (0, common_1.Injectable)()
], SanitizeMiddleware);
