"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
Object.defineProperty(exports, "SystemConfigController", {
    enumerable: true,
    get: function() {
        return SystemConfigController;
    }
});
const _common = require("@nestjs/common");
const _systemconfigservice = require("./system-config.service");
const _authguard = require("../auth/auth.guard");
function _ts_decorate(decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for(var i = decorators.length - 1; i >= 0; i--)if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
}
function _ts_metadata(k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
}
function _ts_param(paramIndex, decorator) {
    return function(target, key) {
        decorator(target, key, paramIndex);
    };
}
let SystemConfigController = class SystemConfigController {
    getPublic() {
        return this.service.getPublicConfig();
    }
    async getContent(req, body) {
        const key = req.params.key;
        const val = await this.service.get(`content_${key}`);
        if (!val) return null;
        try {
            return JSON.parse(val);
        } catch  {
            return val;
        }
    }
    async setContent(req, body) {
        if (req.user?.role !== 'admin' && req.user?.role !== 'superadmin') throw new _common.ForbiddenException();
        const key = req.params.key;
        const value = typeof body === 'string' ? body : JSON.stringify(body);
        await this.service.set(`content_${key}`, value);
        return {
            success: true
        };
    }
    getPermissions() {
        return this.service.getPermissions();
    }
    setPermissions(req, body) {
        if (req.user?.role !== 'admin' && req.user?.role !== 'superadmin') throw new _common.ForbiddenException();
        return this.service.setPermissions(body);
    }
    getAll(req) {
        if (req.user?.role !== 'admin') throw new _common.ForbiddenException();
        return this.service.getAll();
    }
    setMany(req, body) {
        if (req.user?.role !== 'admin') throw new _common.ForbiddenException();
        return this.service.setMany(body.configs);
    }
    constructor(service){
        this.service = service;
    }
};
_ts_decorate([
    (0, _common.Get)('public'),
    (0, _authguard.Public)(),
    _ts_metadata("design:type", Function),
    _ts_metadata("design:paramtypes", []),
    _ts_metadata("design:returntype", void 0)
], SystemConfigController.prototype, "getPublic", null);
_ts_decorate([
    (0, _common.Get)('content/:key'),
    (0, _authguard.Public)(),
    _ts_param(0, (0, _common.Req)()),
    _ts_param(1, (0, _common.Body)()),
    _ts_metadata("design:type", Function),
    _ts_metadata("design:paramtypes", [
        Object,
        Object
    ]),
    _ts_metadata("design:returntype", Promise)
], SystemConfigController.prototype, "getContent", null);
_ts_decorate([
    (0, _common.Patch)('content/:key'),
    _ts_param(0, (0, _common.Req)()),
    _ts_param(1, (0, _common.Body)()),
    _ts_metadata("design:type", Function),
    _ts_metadata("design:paramtypes", [
        Object,
        Object
    ]),
    _ts_metadata("design:returntype", Promise)
], SystemConfigController.prototype, "setContent", null);
_ts_decorate([
    (0, _common.Get)('permissions'),
    (0, _authguard.Public)(),
    _ts_metadata("design:type", Function),
    _ts_metadata("design:paramtypes", []),
    _ts_metadata("design:returntype", void 0)
], SystemConfigController.prototype, "getPermissions", null);
_ts_decorate([
    (0, _common.Patch)('permissions'),
    _ts_param(0, (0, _common.Req)()),
    _ts_param(1, (0, _common.Body)()),
    _ts_metadata("design:type", Function),
    _ts_metadata("design:paramtypes", [
        Object,
        typeof Record === "undefined" ? Object : Record
    ]),
    _ts_metadata("design:returntype", void 0)
], SystemConfigController.prototype, "setPermissions", null);
_ts_decorate([
    (0, _common.Get)(),
    _ts_param(0, (0, _common.Req)()),
    _ts_metadata("design:type", Function),
    _ts_metadata("design:paramtypes", [
        Object
    ]),
    _ts_metadata("design:returntype", void 0)
], SystemConfigController.prototype, "getAll", null);
_ts_decorate([
    (0, _common.Patch)(),
    _ts_param(0, (0, _common.Req)()),
    _ts_param(1, (0, _common.Body)()),
    _ts_metadata("design:type", Function),
    _ts_metadata("design:paramtypes", [
        Object,
        Object
    ]),
    _ts_metadata("design:returntype", void 0)
], SystemConfigController.prototype, "setMany", null);
SystemConfigController = _ts_decorate([
    (0, _common.Controller)('system-config'),
    _ts_metadata("design:type", Function),
    _ts_metadata("design:paramtypes", [
        typeof _systemconfigservice.SystemConfigService === "undefined" ? Object : _systemconfigservice.SystemConfigService
    ])
], SystemConfigController);
