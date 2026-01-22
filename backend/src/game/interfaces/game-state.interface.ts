import { Card, CardEffect } from '../../cards/entities/card.entity';
import { MatchMode } from '../../matches/entities/match.entity';

export interface PlayerState {
  userId: string;
  username: string;
  hp: number;
  maxHp: number;
  mana: number;
  maxMana: number;
  shield: number;
  deck: string[]; // Card IDs
  hand: string[]; // Card IDs
  effects: ActiveEffect[];
  isStunned: boolean;
  isFrozen: boolean;
  canPlayCards: boolean;
}

export interface ActiveEffect {
  type: CardEffect;
  value: number;
  duration: number;
  source: string; // Card ID that applied this effect
}

export interface GameState {
  matchId: string;
  mode: MatchMode;
  currentTurn: string; // userId
  turnNumber: number;
  players: {
    [userId: string]: PlayerState;
  };
  winner: string | null;
  status: 'waiting' | 'in_progress' | 'finished';
  createdAt: Date;
}

export interface PlayCardPayload {
  cardId: string;
  target?: string; // For targeted effects
}

export interface GameAction {
  type: 'play_card' | 'end_turn' | 'draw_card';
  playerId: string;
  payload?: PlayCardPayload;
  timestamp: Date;
}
