import { Module } from '@nestjs/common'
import { ConfigModule, ConfigService } from '@nestjs/config'
import { JwtModule } from '@nestjs/jwt'

import { AuthController } from './auth.controller'
import { AuthGuard } from './auth.guard'
import { AuthService } from './auth.service'

@Module({
  imports: [
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => {
        const secret = config.get<string>('JWT_SECRET')
        const isProd = config.get('NODE_ENV') === 'production'
        if (!secret && isProd) {
          throw new Error('JWT_SECRET 환경변수는 프로덕션에서 반드시 설정해야 합니다')
        }
        return {
          secret: secret || 'dev-only-jwt-secret-do-not-use-in-production',
          signOptions: { expiresIn: '7d' },
        }
      },
    }),
  ],
  controllers: [AuthController],
  providers: [AuthService, AuthGuard],
  exports: [AuthService, AuthGuard, JwtModule],
})
export class AuthModule {}
