"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = {
    sanitize: (dirty) => {
        return dirty
            .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
            .replace(/on\w+="[^"]*"/gi, '')
            .replace(/javascript:/gi, '');
    },
};
