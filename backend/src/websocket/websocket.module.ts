import { Module } from '@nestjs/common';
import { WebSocketGateway } from './websocket.gateway';
import { GameModule } from '../game/game.module';
import { MatchesModule } from '../matches/matches.module';
import { UsersModule } from '../users/users.module';
import { DecksModule } from '../decks/decks.module';

@Module({
  imports: [GameModule, MatchesModule, UsersModule, DecksModule],
  providers: [WebSocketGateway],
})
export class WebSocketModule {}
