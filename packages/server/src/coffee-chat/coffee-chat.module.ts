import { Module } from '@nestjs/common';
import { CoffeeChatController } from './coffee-chat.controller';
import { CoffeeChatService } from './coffee-chat.service';
import { PrismaModule } from '../prisma/prisma.module';
import { NotificationsModule } from '../notifications/notifications.module';

@Module({
  imports: [PrismaModule, NotificationsModule],
  controllers: [CoffeeChatController],
  providers: [CoffeeChatService],
  exports: [CoffeeChatService],
})
export class CoffeeChatModule {}
