import { Module } from '@nestjs/common'

import { NotificationsModule } from '../notifications/notifications.module'
import { PrismaModule } from '../prisma/prisma.module'

import { CoachingController } from './coaching.controller'
import { CoachingService } from './coaching.service'

@Module({
  imports: [PrismaModule, NotificationsModule],
  controllers: [CoachingController],
  providers: [CoachingService],
})
export class CoachingModule {}
