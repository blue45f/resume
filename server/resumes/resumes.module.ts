import { Module } from '@nestjs/common';
import { ResumesController } from './resumes.controller';
import { ResumesService } from './resumes.service';
import { ExportService } from './export.service';

@Module({
  controllers: [ResumesController],
  providers: [ResumesService, ExportService],
  exports: [ResumesService],
})
export class ResumesModule {}
