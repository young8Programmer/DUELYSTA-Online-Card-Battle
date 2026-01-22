import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  OnGatewayConnection,
  OnGatewayDisconnect,
  ConnectedSocket,
  MessageBody,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { UseGuards } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { GameService } from '../game/game.service';
import { MatchmakingService } from '../game/matchmaking.service';
import { RatingService } from '../game/rating.service';
import { MatchesService } from '../matches/matches.service';
import { UsersService } from '../users/users.service';
import { MatchMode } from '../matches/entities/match.entity';

interface AuthenticatedSocket extends Socket {
  userId?: string;
  username?: string;
}

@WebSocketGateway({
  cors: {
    origin: process.env.FRONTEND_URL || 'http://localhost:5173',
    credentials: true,
  },
})
export class GameWebSocketGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  private connectedUsers: Map<string, AuthenticatedSocket> = new Map();
  private userMatchMap: Map<string, string> = new Map(); // userId -> matchId

  constructor(
    private jwtService: JwtService,
    private gameService: GameService,
    private matchmakingService: MatchmakingService,
    private ratingService: RatingService,
    private matchesService: MatchesService,
    private usersService: UsersService,
  ) {}

  async handleConnection(client: AuthenticatedSocket) {
    try {
      const token = client.handshake.auth?.token || client.handshake.headers?.authorization?.split(' ')[1];
      
      if (!token) {
        client.disconnect();
        return;
      }

      const payload = this.jwtService.verify(token);
      const user = await this.usersService.findOne(payload.sub);

      client.userId = user.id;
      client.username = user.username;
      this.connectedUsers.set(user.id, client);

      console.log(`✅ User connected: ${user.username} (${user.id})`);
    } catch (error) {
      console.error('❌ Connection error:', error);
      client.disconnect();
    }
  }

  async handleDisconnect(client: AuthenticatedSocket) {
    if (client.userId) {
      this.connectedUsers.delete(client.userId);
      
      // Leave matchmaking queue
      this.matchmakingService.leaveQueue(client.userId, MatchMode.CASUAL);
      this.matchmakingService.leaveQueue(client.userId, MatchMode.RANKED);

      // Handle match abandonment
      const matchId = this.userMatchMap.get(client.userId);
      if (matchId) {
        // Notify opponent
        const gameState = this.gameService.getGameState(matchId);
        const opponentId = Object.keys(gameState.players).find(id => id !== client.userId);
        if (opponentId) {
          const opponentSocket = this.connectedUsers.get(opponentId);
          if (opponentSocket) {
            opponentSocket.emit('opponent_disconnected');
          }
        }
        this.userMatchMap.delete(client.userId);
      }

      console.log(`❌ User disconnected: ${client.username} (${client.userId})`);
    }
  }

  @SubscribeMessage('join_queue')
  async handleJoinQueue(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody() data: { deckId: string; mode: MatchMode },
  ) {
    if (!client.userId || !client.username) {
      return { error: 'Not authenticated' };
    }

    const matchedOpponent = this.matchmakingService.joinQueue(
      client.userId,
      client.username,
      data.deckId,
      data.mode,
    );

    if (matchedOpponent) {
      // Match found!
      const match = await this.matchesService.create(
        client.userId,
        matchedOpponent.userId,
        data.mode,
      );

      // Initialize game
      const gameState = await this.gameService.initializeGame(
        match.id,
        client.userId,
        client.username,
        data.deckId,
        matchedOpponent.userId,
        matchedOpponent.username,
        matchedOpponent.deckId,
        data.mode,
      );

      // Map users to match
      this.userMatchMap.set(client.userId, match.id);
      this.userMatchMap.set(matchedOpponent.userId, match.id);

      // Get opponent socket
      const opponentSocket = this.connectedUsers.get(matchedOpponent.userId);

      // Emit match found to both players
      client.emit('match_found', {
        matchId: match.id,
        opponent: {
          id: matchedOpponent.userId,
          username: matchedOpponent.username,
        },
        gameState: this.sanitizeGameState(gameState, client.userId),
      });

      if (opponentSocket) {
        opponentSocket.emit('match_found', {
          matchId: match.id,
          opponent: {
            id: client.userId,
            username: client.username,
          },
          gameState: this.sanitizeGameState(gameState, matchedOpponent.userId),
        });
      }

      return { success: true, matchId: match.id };
    } else {
      // Waiting for opponent
      return { success: true, waiting: true };
    }
  }

  @SubscribeMessage('leave_queue')
  async handleLeaveQueue(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody() data: { mode: MatchMode },
  ) {
    if (!client.userId) {
      return { error: 'Not authenticated' };
    }

    this.matchmakingService.leaveQueue(client.userId, data.mode);
    return { success: true };
  }

  @SubscribeMessage('play_card')
  async handlePlayCard(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody() data: { matchId: string; cardId: string; target?: string },
  ) {
    if (!client.userId) {
      return { error: 'Not authenticated' };
    }

    try {
      const gameState = await this.gameService.playCard(data.matchId, client.userId, {
        cardId: data.cardId,
        target: data.target,
      });

      // Broadcast updated game state to both players
      this.broadcastGameState(data.matchId, gameState);

      // Check if game is over
      if (gameState.status === 'finished' && gameState.winner) {
        await this.handleGameEnd(data.matchId, gameState);
      }

      return { success: true, gameState: this.sanitizeGameState(gameState, client.userId) };
    } catch (error) {
      return { error: error.message };
    }
  }

  @SubscribeMessage('end_turn')
  async handleEndTurn(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody() data: { matchId: string },
  ) {
    if (!client.userId) {
      return { error: 'Not authenticated' };
    }

    try {
      const gameState = await this.gameService.endTurn(data.matchId, client.userId);
      this.broadcastGameState(data.matchId, gameState);

      return { success: true, gameState: this.sanitizeGameState(gameState, client.userId) };
    } catch (error) {
      return { error: error.message };
    }
  }

  @SubscribeMessage('get_game_state')
  async handleGetGameState(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody() data: { matchId: string },
  ) {
    if (!client.userId) {
      return { error: 'Not authenticated' };
    }

    try {
      const gameState = this.gameService.getGameState(data.matchId);
      return { gameState: this.sanitizeGameState(gameState, client.userId) };
    } catch (error) {
      return { error: error.message };
    }
  }

  private broadcastGameState(matchId: string, gameState: any): void {
    const playerIds = Object.keys(gameState.players);
    
    for (const playerId of playerIds) {
      const socket = this.connectedUsers.get(playerId);
      if (socket) {
        socket.emit('game_state_update', {
          gameState: this.sanitizeGameState(gameState, playerId),
        });
      }
    }
  }

  private sanitizeGameState(gameState: any, playerId: string): any {
    // Hide opponent's hand from player
    const sanitized = JSON.parse(JSON.stringify(gameState));
    const opponentId = Object.keys(sanitized.players).find(id => id !== playerId);
    
    if (opponentId && sanitized.players[opponentId]) {
      sanitized.players[opponentId].hand = sanitized.players[opponentId].hand.map(() => 'hidden');
      sanitized.players[opponentId].deck = []; // Hide deck
    }

    return sanitized;
  }

  private async handleGameEnd(matchId: string, gameState: any): Promise<void> {
    const playerIds = Object.keys(gameState.players);
    const player1Id = playerIds[0];
    const player2Id = playerIds[1];

    // Get current ratings
    const player1 = await this.usersService.findOne(player1Id);
    const player2 = await this.usersService.findOne(player2Id);

    // Determine winner
    let winner: 'player1' | 'player2' | null = null;
    if (gameState.winner === player1Id) {
      winner = 'player1';
    } else if (gameState.winner === player2Id) {
      winner = 'player2';
    }

    // Calculate rating changes
    const ratingChanges = this.ratingService.calculateNewRatings(
      player1.rating,
      player2.rating,
      winner,
    );

    // Update ratings
    await this.usersService.updateRating(player1Id, ratingChanges.player1NewRating);
    await this.usersService.updateRating(player2Id, ratingChanges.player2NewRating);

    // Finish match
    await this.matchesService.finishMatch(
      matchId,
      gameState.winner,
    );

    // Broadcast game over
    const player1Socket = this.connectedUsers.get(player1Id);
    const player2Socket = this.connectedUsers.get(player2Id);

    if (player1Socket) {
      player1Socket.emit('game_over', {
        winner: gameState.winner,
        ratingChange: ratingChanges.player1Change,
        newRating: ratingChanges.player1NewRating,
      });
    }

    if (player2Socket) {
      player2Socket.emit('game_over', {
        winner: gameState.winner,
        ratingChange: ratingChanges.player2Change,
        newRating: ratingChanges.player2NewRating,
      });
    }

    // Clean up
    this.userMatchMap.delete(player1Id);
    this.userMatchMap.delete(player2Id);
    this.gameService.deleteGameState(matchId);
  }
}
