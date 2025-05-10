"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.UpdateResumeDto = void 0;
const swagger_1 = require("@nestjs/swagger");
const create_resume_dto_1 = require("./create-resume.dto");
class UpdateResumeDto extends (0, swagger_1.PartialType)(create_resume_dto_1.CreateResumeDto) {
}
exports.UpdateResumeDto = UpdateResumeDto;
