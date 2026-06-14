import { Module } from '@nestjs/common'

import { NotificationsModule } from '../notifications/notifications.module'
import { PrismaModule } from '../prisma/prisma.module'
import { SystemConfigModule } from '../system-config/system-config.module'

import { CoffeeChatController } from './coffee-chat.controller'
import { CoffeeChatService } from './coffee-chat.service'

@Module({
  imports: [PrismaModule, NotificationsModule, SystemConfigModule],
  controllers: [CoffeeChatController],
  providers: [CoffeeChatService],
  exports: [CoffeeChatService],
})
export class CoffeeChatModule {}
