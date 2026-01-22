import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { GameState, PlayerState, PlayCardPayload, ActiveEffect } from './interfaces/game-state.interface';
import { Card, CardEffect } from '../cards/entities/card.entity';
import { CardsService } from '../cards/cards.service';
import { DecksService } from '../decks/decks.service';
import { MatchMode } from '../matches/entities/match.entity';

@Injectable()
export class GameService {
  private gameStates: Map<string, GameState> = new Map();

  constructor(
    private cardsService: CardsService,
    private decksService: DecksService,
  ) {}

  async initializeGame(
    matchId: string,
    player1Id: string,
    player1Username: string,
    player1DeckId: string,
    player2Id: string,
    player2Username: string,
    player2DeckId: string,
    mode: MatchMode,
  ): Promise<GameState> {
    // Load decks
    const deck1 = await this.decksService.findOne(player1DeckId);
    const deck2 = await this.decksService.findOne(player2DeckId);

    // Build deck arrays (with duplicates based on quantity)
    const deck1Cards: string[] = [];
    const deck2Cards: string[] = [];

    for (const deckCard of deck1.cards) {
      for (let i = 0; i < deckCard.quantity; i++) {
        deck1Cards.push(deckCard.cardId);
      }
    }

    for (const deckCard of deck2.cards) {
      for (let i = 0; i < deckCard.quantity; i++) {
        deck2Cards.push(deckCard.cardId);
      }
    }

    // Shuffle decks
    this.shuffleArray(deck1Cards);
    this.shuffleArray(deck2Cards);

    // Initialize player states
    const player1State: PlayerState = {
      userId: player1Id,
      username: player1Username,
      hp: 30,
      maxHp: 30,
      mana: 0,
      maxMana: 0,
      shield: 0,
      deck: deck1Cards,
      hand: [],
      effects: [],
      isStunned: false,
      isFrozen: false,
      canPlayCards: true,
    };

    const player2State: PlayerState = {
      userId: player2Id,
      username: player2Username,
      hp: 30,
      maxHp: 30,
      mana: 0,
      maxMana: 0,
      shield: 0,
      deck: deck2Cards,
      hand: [],
      effects: [],
      isStunned: false,
      isFrozen: false,
      canPlayCards: true,
    };

    // Create game state
    const gameState: GameState = {
      matchId,
      mode,
      currentTurn: player1Id, // Player 1 starts
      turnNumber: 1,
      players: {
        [player1Id]: player1State,
        [player2Id]: player2State,
      },
      winner: null,
      status: 'in_progress',
      createdAt: new Date(),
    };

    // Draw initial hands (3 cards each)
    this.drawCards(gameState, player1Id, 3);
    this.drawCards(gameState, player2Id, 3);

    // Start first turn
    this.startTurn(gameState, player1Id);

    this.gameStates.set(matchId, gameState);
    return gameState;
  }

  getGameState(matchId: string): GameState {
    const state = this.gameStates.get(matchId);
    if (!state) {
      throw new NotFoundException('Game state not found');
    }
    return state;
  }

  async playCard(matchId: string, playerId: string, payload: PlayCardPayload): Promise<GameState> {
    const gameState = this.getGameState(matchId);
    const player = gameState.players[playerId];
    const opponentId = Object.keys(gameState.players).find(id => id !== playerId);
    const opponent = gameState.players[opponentId];

    // Validate turn
    if (gameState.currentTurn !== playerId) {
      throw new BadRequestException('Not your turn');
    }

    // Validate player can play cards
    if (!player.canPlayCards || player.isFrozen) {
      throw new BadRequestException('Cannot play cards right now');
    }

    // Validate card in hand
    if (!player.hand.includes(payload.cardId)) {
      throw new BadRequestException('Card not in hand');
    }

    // Get card data
    const card = await this.cardsService.findOne(payload.cardId);
    if (!card) {
      throw new NotFoundException('Card not found');
    }

    // Validate mana
    if (player.mana < card.manaCost) {
      throw new BadRequestException('Not enough mana');
    }

    // Remove card from hand
    player.hand = player.hand.filter(id => id !== payload.cardId);

    // Deduct mana
    player.mana -= card.manaCost;

    // Apply card effects
    await this.applyCardEffects(gameState, playerId, opponentId, card);

    // Check win condition
    if (opponent.hp <= 0) {
      gameState.winner = playerId;
      gameState.status = 'finished';
    }

    this.gameStates.set(matchId, gameState);
    return gameState;
  }

  async endTurn(matchId: string, playerId: string): Promise<GameState> {
    const gameState = this.getGameState(matchId);

    // Validate turn
    if (gameState.currentTurn !== playerId) {
      throw new BadRequestException('Not your turn');
    }

    const opponentId = Object.keys(gameState.players).find(id => id !== playerId);
    
    // Process end-of-turn effects
    this.processEndOfTurnEffects(gameState, playerId);

    // Switch turn
    gameState.currentTurn = opponentId;
    gameState.turnNumber += 1;

    // Start opponent's turn
    this.startTurn(gameState, opponentId);

    this.gameStates.set(matchId, gameState);
    return gameState;
  }

  private startTurn(gameState: GameState, playerId: string): void {
    const player = gameState.players[playerId];

    // Reset turn flags
    player.isStunned = false;
    player.isFrozen = false;
    player.canPlayCards = true;

    // Increase max mana (up to 10)
    if (player.maxMana < 10) {
      player.maxMana += 1;
    }
    player.mana = player.maxMana;

    // Draw a card
    this.drawCards(gameState, playerId, 1);

    // Process start-of-turn effects
    this.processStartOfTurnEffects(gameState, playerId);
  }

  private drawCards(gameState: GameState, playerId: string, count: number): void {
    const player = gameState.players[playerId];
    
    for (let i = 0; i < count && player.deck.length > 0 && player.hand.length < 7; i++) {
      const cardId = player.deck.shift();
      if (cardId) {
        player.hand.push(cardId);
      }
    }
  }

  private async applyCardEffects(
    gameState: GameState,
    playerId: string,
    opponentId: string,
    card: Card,
  ): Promise<void> {
    const player = gameState.players[playerId];
    const opponent = gameState.players[opponentId];

    for (const effect of card.effects || []) {
      switch (effect.type) {
        case CardEffect.DAMAGE:
          this.applyDamage(opponent, effect.value);
          break;

        case CardEffect.DOUBLE_DAMAGE:
          this.applyDamage(opponent, effect.value);
          this.applyDamage(opponent, effect.value);
          break;

        case CardEffect.PIERCE:
          // Pierce ignores shield
          const pierceDamage = Math.max(0, effect.value - opponent.shield);
          opponent.shield = Math.max(0, opponent.shield - effect.value);
          opponent.hp = Math.max(0, opponent.hp - pierceDamage);
          break;

        case CardEffect.HEAL:
          player.hp = Math.min(player.maxHp, player.hp + effect.value);
          break;

        case CardEffect.SHIELD:
          player.shield += effect.value;
          break;

        case CardEffect.STUN:
          opponent.isStunned = true;
          break;

        case CardEffect.FREEZE:
          opponent.isFrozen = true;
          opponent.canPlayCards = false;
          break;

        case CardEffect.DRAW_CARDS:
          this.drawCards(gameState, playerId, effect.value);
          break;

        case CardEffect.STEAL_MANA:
          const stolenMana = Math.min(opponent.mana, effect.value);
          opponent.mana -= stolenMana;
          player.mana += stolenMana;
          break;

        case CardEffect.BURN:
          // Add burn effect
          opponent.effects.push({
            type: CardEffect.BURN,
            value: effect.value,
            duration: effect.duration || 3,
            source: card.id,
          });
          break;
      }
    }
  }

  private applyDamage(target: PlayerState, damage: number): void {
    // Shield absorbs damage first
    if (target.shield > 0) {
      const shieldAbsorbed = Math.min(target.shield, damage);
      target.shield -= shieldAbsorbed;
      damage -= shieldAbsorbed;
    }

    // Remaining damage goes to HP
    target.hp = Math.max(0, target.hp - damage);
  }

  private processStartOfTurnEffects(gameState: GameState, playerId: string): void {
    const player = gameState.players[playerId];

    // Process burn effects
    for (const effect of player.effects) {
      if (effect.type === CardEffect.BURN) {
        this.applyDamage(player, effect.value);
        effect.duration -= 1;
      }
    }

    // Remove expired effects
    player.effects = player.effects.filter(e => e.duration > 0);
  }

  private processEndOfTurnEffects(gameState: GameState, playerId: string): void {
    const player = gameState.players[playerId];

    // Reduce effect durations
    for (const effect of player.effects) {
      if (effect.duration > 0) {
        effect.duration -= 1;
      }
    }

    // Remove expired effects
    player.effects = player.effects.filter(e => e.duration > 0);
  }

  private shuffleArray<T>(array: T[]): void {
    for (let i = array.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [array[i], array[j]] = [array[j], array[i]];
    }
  }

  deleteGameState(matchId: string): void {
    this.gameStates.delete(matchId);
  }
}
