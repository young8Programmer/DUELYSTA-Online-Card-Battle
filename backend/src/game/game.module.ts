import { Module } from '@nestjs/common';
import { GameService } from './game.service';
import { MatchmakingService } from './matchmaking.service';
import { RatingService } from './rating.service';

@Module({
  providers: [GameService, MatchmakingService, RatingService],
  exports: [GameService, MatchmakingService, RatingService],
})
export class GameModule {}
