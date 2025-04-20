import { Module } from '@nestjs/common';
import { TemplatesController } from './templates.controller';
import { TemplatesService } from './templates.service';
import { LocalTransformService } from './local-transform.service';
import { ResumesModule } from '../resumes/resumes.module';

@Module({
  imports: [ResumesModule],
  controllers: [TemplatesController],
  providers: [TemplatesService, LocalTransformService],
  exports: [TemplatesService, LocalTransformService],
})
export class TemplatesModule {}
