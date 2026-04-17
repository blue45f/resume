import { Module, Global } from '@nestjs/common';
import { ForbiddenWordsController } from './forbidden-words.controller';
import { ForbiddenWordsService } from './forbidden-words.service';

@Global()
@Module({
  controllers: [ForbiddenWordsController],
  providers: [ForbiddenWordsService],
  exports: [ForbiddenWordsService],
})
export class ForbiddenWordsModule {}
