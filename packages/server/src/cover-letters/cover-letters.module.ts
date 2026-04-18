import { Module } from '@nestjs/common';
import { CoverLettersController } from './cover-letters.controller';
import { CoverLettersService } from './cover-letters.service';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [CoverLettersController],
  providers: [CoverLettersService],
})
export class CoverLettersModule {}
