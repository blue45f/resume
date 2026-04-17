"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
Object.defineProperty(exports, "SanitizeMiddleware", {
    enumerable: true,
    get: function() {
        return SanitizeMiddleware;
    }
});
const _common = require("@nestjs/common");
const _sanitizehtml = /*#__PURE__*/ _interop_require_default(require("sanitize-html"));
function _interop_require_default(obj) {
    return obj && obj.__esModule ? obj : {
        default: obj
    };
}
function _ts_decorate(decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for(var i = decorators.length - 1; i >= 0; i--)if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
}
// HTML 콘텐츠를 허용하는 필드 (TipTap 리치 에디터 사용)
const HTML_ALLOWED_FIELDS = new Set([
    'summary',
    'description',
    'achievements',
    'text'
]);
// sanitize-html 설정: TipTap 에디터 출력 기준 허용 태그/속성
const SANITIZE_OPTIONS = {
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
        'img'
    ],
    allowedAttributes: {
        a: [
            'href',
            'target',
            'rel'
        ],
        img: [
            'src',
            'alt',
            'width',
            'height'
        ],
        span: [
            'class',
            'style'
        ],
        div: [
            'class',
            'style'
        ],
        p: [
            'class',
            'style'
        ],
        td: [
            'colspan',
            'rowspan'
        ],
        th: [
            'colspan',
            'rowspan'
        ]
    },
    allowedSchemes: [
        'http',
        'https',
        'mailto'
    ],
    disallowedTagsMode: 'discard'
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
            // HTML 허용 필드는 sanitize-html로 위험한 태그/속성만 제거
            if (key && HTML_ALLOWED_FIELDS.has(key)) {
                return (0, _sanitizehtml.default)(value.trim(), SANITIZE_OPTIONS);
            }
            return value.replace(/<[^>]*>/g, '').trim();
        }
        if (Array.isArray(value)) {
            return value.map((item)=>this.sanitize(item));
        }
        if (value !== null && typeof value === 'object') {
            const sanitized = {};
            for (const objKey of Object.keys(value)){
                if (objKey.startsWith('$')) {
                    throw new _common.BadRequestException(`Invalid field name: ${objKey}`);
                }
                sanitized[objKey] = this.sanitize(value[objKey], objKey);
            }
            return sanitized;
        }
        return value;
    }
};
SanitizeMiddleware = _ts_decorate([
    (0, _common.Injectable)()
], SanitizeMiddleware);
