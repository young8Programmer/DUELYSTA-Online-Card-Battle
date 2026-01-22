import { Injectable } from '@nestjs/common';
import { MatchMode } from '../matches/entities/match.entity';

interface QueueEntry {
  userId: string;
  username: string;
  deckId: string;
  mode: MatchMode;
  joinedAt: Date;
}

@Injectable()
export class MatchmakingService {
  private queues: Map<MatchMode, QueueEntry[]> = new Map();

  constructor() {
    // Initialize queues
    this.queues.set(MatchMode.CASUAL, []);
    this.queues.set(MatchMode.RANKED, []);
  }

  joinQueue(userId: string, username: string, deckId: string, mode: MatchMode): QueueEntry | null {
    const queue = this.queues.get(mode) || [];
    
    // Check if already in queue
    const existing = queue.find(entry => entry.userId === userId);
    if (existing) {
      return null; // Already in queue
    }

    const entry: QueueEntry = {
      userId,
      username,
      deckId,
      mode,
      joinedAt: new Date(),
    };

    queue.push(entry);

    // Try to find a match
    if (queue.length >= 2) {
      const player1 = queue.shift();
      const player2 = queue.shift();
      
      if (player1 && player2) {
        this.queues.set(mode, queue);
        return player2; // Return matched opponent
      }
    }

    this.queues.set(mode, queue);
    return null; // No match found yet
  }

  leaveQueue(userId: string, mode: MatchMode): boolean {
    const queue = this.queues.get(mode) || [];
    const index = queue.findIndex(entry => entry.userId === userId);
    
    if (index !== -1) {
      queue.splice(index, 1);
      this.queues.set(mode, queue);
      return true;
    }
    
    return false;
  }

  isInQueue(userId: string, mode: MatchMode): boolean {
    const queue = this.queues.get(mode) || [];
    return queue.some(entry => entry.userId === userId);
  }

  getQueueSize(mode: MatchMode): number {
    const queue = this.queues.get(mode) || [];
    return queue.length;
  }
}
