import { Module } from '@nestjs/common';
import { GameService } from './game.service';
import { MatchmakingService } from './matchmaking.service';
import { RatingService } from './rating.service';
import { CardsModule } from '../cards/cards.module';
import { DecksModule } from '../decks/decks.module';

@Module({
  imports: [CardsModule, DecksModule],
  providers: [GameService, MatchmakingService, RatingService],
  exports: [GameService, MatchmakingService, RatingService],
})
export class GameModule {}
