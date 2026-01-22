import { Injectable } from '@nestjs/common';

@Injectable()
export class RatingService {
  // ELO-like rating system
  private readonly K_FACTOR = 32; // Standard K-factor for ELO

  calculateRatingChange(playerRating: number, opponentRating: number, result: 'win' | 'loss' | 'draw'): number {
    const expectedScore = this.getExpectedScore(playerRating, opponentRating);
    
    let actualScore: number;
    if (result === 'win') {
      actualScore = 1;
    } else if (result === 'loss') {
      actualScore = 0;
    } else {
      actualScore = 0.5;
    }

    const ratingChange = Math.round(this.K_FACTOR * (actualScore - expectedScore));
    return ratingChange;
  }

  private getExpectedScore(ratingA: number, ratingB: number): number {
    return 1 / (1 + Math.pow(10, (ratingB - ratingA) / 400));
  }

  calculateNewRatings(
    player1Rating: number,
    player2Rating: number,
    winner: 'player1' | 'player2' | null,
  ): { player1NewRating: number; player2NewRating: number; player1Change: number; player2Change: number } {
    let player1Result: 'win' | 'loss' | 'draw';
    let player2Result: 'win' | 'loss' | 'draw';

    if (winner === 'player1') {
      player1Result = 'win';
      player2Result = 'loss';
    } else if (winner === 'player2') {
      player1Result = 'loss';
      player2Result = 'win';
    } else {
      player1Result = 'draw';
      player2Result = 'draw';
    }

    const player1Change = this.calculateRatingChange(player1Rating, player2Rating, player1Result);
    const player2Change = this.calculateRatingChange(player2Rating, player1Rating, player2Result);

    const player1NewRating = Math.max(0, player1Rating + player1Change);
    const player2NewRating = Math.max(0, player2Rating + player2Change);

    return {
      player1NewRating,
      player2NewRating,
      player1Change,
      player2Change,
    };
  }
}
