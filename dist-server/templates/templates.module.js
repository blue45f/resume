"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
Object.defineProperty(exports, "TemplatesModule", {
    enumerable: true,
    get: function() {
        return TemplatesModule;
    }
});
const _common = require("@nestjs/common");
const _templatescontroller = require("./templates.controller");
const _templatesservice = require("./templates.service");
const _localtransformservice = require("./local-transform.service");
const _resumesmodule = require("../resumes/resumes.module");
function _ts_decorate(decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for(var i = decorators.length - 1; i >= 0; i--)if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
}
let TemplatesModule = class TemplatesModule {
};
TemplatesModule = _ts_decorate([
    (0, _common.Module)({
        imports: [
            _resumesmodule.ResumesModule
        ],
        controllers: [
            _templatescontroller.TemplatesController
        ],
        providers: [
            _templatesservice.TemplatesService,
            _localtransformservice.LocalTransformService
        ],
        exports: [
            _templatesservice.TemplatesService,
            _localtransformservice.LocalTransformService
        ]
    })
], TemplatesModule);
