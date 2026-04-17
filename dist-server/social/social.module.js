"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
Object.defineProperty(exports, "SocialModule", {
    enumerable: true,
    get: function() {
        return SocialModule;
    }
});
const _common = require("@nestjs/common");
const _socialcontroller = require("./social.controller");
const _socialservice = require("./social.service");
const _prismamodule = require("../prisma/prisma.module");
const _notificationsmodule = require("../notifications/notifications.module");
function _ts_decorate(decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for(var i = decorators.length - 1; i >= 0; i--)if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
}
let SocialModule = class SocialModule {
};
SocialModule = _ts_decorate([
    (0, _common.Module)({
        imports: [
            _prismamodule.PrismaModule,
            _notificationsmodule.NotificationsModule
        ],
        controllers: [
            _socialcontroller.SocialController
        ],
        providers: [
            _socialservice.SocialService
        ]
    })
], SocialModule);
