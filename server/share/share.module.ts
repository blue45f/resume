import { Module } from '@nestjs/common';
import { ResumesModule } from '../resumes/resumes.module';
import { ShareController } from './share.controller';
import { ShareService } from './share.service';

@Module({
  imports: [ResumesModule],
  controllers: [ShareController],
  providers: [ShareService],
  exports: [ShareService],
})
export class ShareModule {}
