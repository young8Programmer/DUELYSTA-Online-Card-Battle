import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Match, MatchStatus, MatchMode } from './entities/match.entity';
import { UsersService } from '../users/users.service';

@Injectable()
export class MatchesService {
  constructor(
    @InjectRepository(Match)
    private matchesRepository: Repository<Match>,
    private usersService: UsersService,
  ) {}

  async create(player1Id: string, player2Id: string, mode: MatchMode): Promise<Match> {
    const match = this.matchesRepository.create({
      player1Id,
      player2Id,
      mode,
      status: MatchStatus.IN_PROGRESS,
    });
    return this.matchesRepository.save(match);
  }

  async findOne(id: string): Promise<Match> {
    const match = await this.matchesRepository.findOne({
      where: { id },
      relations: ['player1', 'player2', 'winner'],
    });
    if (!match) {
      throw new NotFoundException('Match not found');
    }
    return match;
  }

  async findByUser(userId: string): Promise<Match[]> {
    return this.matchesRepository.find({
      where: [
        { player1Id: userId },
        { player2Id: userId },
      ],
      relations: ['player1', 'player2', 'winner'],
      order: { createdAt: 'DESC' },
      take: 50,
    });
  }

  async finishMatch(matchId: string, winnerId: string | null): Promise<Match> {
    const match = await this.findOne(matchId);
    match.winnerId = winnerId;
    match.status = MatchStatus.FINISHED;
    match.finishedAt = new Date();

    // Update user stats
    if (winnerId) {
      if (match.player1Id === winnerId) {
        await this.usersService.incrementWins(match.player1Id);
        await this.usersService.incrementLosses(match.player2Id);
      } else {
        await this.usersService.incrementWins(match.player2Id);
        await this.usersService.incrementLosses(match.player1Id);
      }
    } else {
      // Draw
      await this.usersService.incrementDraws(match.player1Id);
      await this.usersService.incrementDraws(match.player2Id);
    }

    return this.matchesRepository.save(match);
  }
}
