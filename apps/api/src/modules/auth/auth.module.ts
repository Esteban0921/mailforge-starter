import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';

@Module({
  // No signOptions here: access and refresh tokens need different expiresIn,
  // set per sign() call in AuthService instead of once for the whole module.
  imports: [JwtModule.register({ secret: process.env.JWT_SECRET })],
  controllers: [AuthController],
  providers: [AuthService],
})
export class AuthModule {}
