import { Module } from '@nestjs/common'

import { PrismaModule } from '../prisma/prisma.module'

import { CoverLettersController } from './cover-letters.controller'
import { CoverLettersService } from './cover-letters.service'

@Module({
  imports: [PrismaModule],
  controllers: [CoverLettersController],
  providers: [CoverLettersService],
})
export class CoverLettersModule {}
