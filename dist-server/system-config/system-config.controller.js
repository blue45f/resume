"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.SystemConfigController = void 0;
const common_1 = require("@nestjs/common");
const system_config_service_1 = require("./system-config.service");
const auth_guard_1 = require("../auth/auth.guard");
const admin_guard_1 = require("../common/guards/admin.guard");
let SystemConfigController = class SystemConfigController {
    service;
    constructor(service) {
        this.service = service;
    }
    getPublic() {
        return this.service.getPublicConfig();
    }
    async getContent(req, body) {
        const key = req.params.key;
        const val = await this.service.get(`content_${key}`);
        if (!val)
            return null;
        try {
            return JSON.parse(val);
        }
        catch {
            return val;
        }
    }
    async setContent(req, body) {
        const key = req.params.key;
        const value = typeof body === 'string' ? body : JSON.stringify(body);
        await this.service.set(`content_${key}`, value);
        return { success: true };
    }
    getPermissions() {
        return this.service.getPermissions();
    }
    setPermissions(body) {
        return this.service.setPermissions(body);
    }
    getAll() {
        return this.service.getAll();
    }
    setMany(body) {
        return this.service.setMany(body.configs);
    }
};
exports.SystemConfigController = SystemConfigController;
__decorate([
    (0, common_1.Get)('public'),
    (0, auth_guard_1.Public)(),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], SystemConfigController.prototype, "getPublic", null);
__decorate([
    (0, common_1.Get)('content/:key'),
    (0, auth_guard_1.Public)(),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], SystemConfigController.prototype, "getContent", null);
__decorate([
    (0, common_1.Patch)('content/:key'),
    (0, common_1.UseGuards)(admin_guard_1.AdminGuard),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], SystemConfigController.prototype, "setContent", null);
__decorate([
    (0, common_1.Get)('permissions'),
    (0, auth_guard_1.Public)(),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], SystemConfigController.prototype, "getPermissions", null);
__decorate([
    (0, common_1.Patch)('permissions'),
    (0, common_1.UseGuards)(admin_guard_1.AdminGuard),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], SystemConfigController.prototype, "setPermissions", null);
__decorate([
    (0, common_1.Get)(),
    (0, common_1.UseGuards)(admin_guard_1.AdminGuard),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], SystemConfigController.prototype, "getAll", null);
__decorate([
    (0, common_1.Patch)(),
    (0, common_1.UseGuards)(admin_guard_1.AdminGuard),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], SystemConfigController.prototype, "setMany", null);
exports.SystemConfigController = SystemConfigController = __decorate([
    (0, common_1.Controller)('system-config'),
    __metadata("design:paramtypes", [system_config_service_1.SystemConfigService])
], SystemConfigController);
