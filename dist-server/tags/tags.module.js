"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
Object.defineProperty(exports, "TagsModule", {
    enumerable: true,
    get: function() {
        return TagsModule;
    }
});
const _common = require("@nestjs/common");
const _resumesmodule = require("../resumes/resumes.module");
const _tagscontroller = require("./tags.controller");
const _tagsservice = require("./tags.service");
function _ts_decorate(decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for(var i = decorators.length - 1; i >= 0; i--)if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
}
let TagsModule = class TagsModule {
};
TagsModule = _ts_decorate([
    (0, _common.Module)({
        imports: [
            _resumesmodule.ResumesModule
        ],
        controllers: [
            _tagscontroller.TagsController
        ],
        providers: [
            _tagsservice.TagsService
        ],
        exports: [
            _tagsservice.TagsService
        ]
    })
], TagsModule);
