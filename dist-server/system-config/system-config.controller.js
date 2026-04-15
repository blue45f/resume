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
const common_2 = require("@nestjs/common");
let SystemConfigController = class SystemConfigController {
    service;
    constructor(service) {
        this.service = service;
    }
    getPublic() {
        return this.service.getPublicConfig();
    }
    getAll(req) {
        if (req.user?.role !== 'admin')
            throw new common_2.ForbiddenException();
        return this.service.getAll();
    }
    setMany(req, body) {
        if (req.user?.role !== 'admin')
            throw new common_2.ForbiddenException();
        return this.service.setMany(body.configs);
    }
};
exports.SystemConfigController = SystemConfigController;
__decorate([
    (0, common_1.Get)('public'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], SystemConfigController.prototype, "getPublic", null);
__decorate([
    (0, common_1.Get)(),
    __param(0, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], SystemConfigController.prototype, "getAll", null);
__decorate([
    (0, common_1.Patch)(),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", void 0)
], SystemConfigController.prototype, "setMany", null);
exports.SystemConfigController = SystemConfigController = __decorate([
    (0, common_1.Controller)('system-config'),
    __metadata("design:paramtypes", [system_config_service_1.SystemConfigService])
], SystemConfigController);
