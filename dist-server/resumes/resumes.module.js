"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
Object.defineProperty(exports, "ResumesModule", {
    enumerable: true,
    get: function() {
        return ResumesModule;
    }
});
const _common = require("@nestjs/common");
const _resumescontroller = require("./resumes.controller");
const _resumesservice = require("./resumes.service");
const _exportservice = require("./export.service");
const _analyticsservice = require("./analytics.service");
const _notificationsmodule = require("../notifications/notifications.module");
function _ts_decorate(decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for(var i = decorators.length - 1; i >= 0; i--)if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
}
let ResumesModule = class ResumesModule {
};
ResumesModule = _ts_decorate([
    (0, _common.Module)({
        imports: [
            _notificationsmodule.NotificationsModule
        ],
        controllers: [
            _resumescontroller.ResumesController
        ],
        providers: [
            _resumesservice.ResumesService,
            _exportservice.ExportService,
            _analyticsservice.AnalyticsService
        ],
        exports: [
            _resumesservice.ResumesService
        ]
    })
], ResumesModule);
