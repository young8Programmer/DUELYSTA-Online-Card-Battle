import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { GameWebSocketGateway } from './websocket.gateway';
import { GameModule } from '../game/game.module';
import { MatchesModule } from '../matches/matches.module';
import { UsersModule } from '../users/users.module';
import { DecksModule } from '../decks/decks.module';

@Module({
  imports: [
    JwtModule.register({
      secret: process.env.JWT_SECRET || 'your-secret-key',
      signOptions: { expiresIn: process.env.JWT_EXPIRES_IN || '7d' },
    }),
    GameModule,
    MatchesModule,
    UsersModule,
    DecksModule,
  ],
  providers: [GameWebSocketGateway],
})
export class WebSocketModule {}
