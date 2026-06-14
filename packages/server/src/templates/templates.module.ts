import { Module } from '@nestjs/common'

import { ResumesModule } from '../resumes/resumes.module'

import { LocalTransformService } from './local-transform.service'
import { TemplatesController } from './templates.controller'
import { TemplatesService } from './templates.service'

@Module({
  imports: [ResumesModule],
  controllers: [TemplatesController],
  providers: [TemplatesService, LocalTransformService],
  exports: [TemplatesService, LocalTransformService],
})
export class TemplatesModule {}
