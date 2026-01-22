import { create } from 'zustand';
import { io, Socket } from 'socket.io-client';
import { useAuthStore } from './authStore';

interface Card {
  id: string;
  name: string;
  description: string;
  type: 'attack' | 'defense' | 'spell';
  manaCost: number;
  effects: any[];
  rarity: string;
}

interface PlayerState {
  userId: string;
  username: string;
  hp: number;
  maxHp: number;
  mana: number;
  maxMana: number;
  shield: number;
  deck: string[];
  hand: string[];
  effects: any[];
  isStunned: boolean;
  isFrozen: boolean;
  canPlayCards: boolean;
}

interface GameState {
  matchId: string;
  mode: string;
  currentTurn: string;
  turnNumber: number;
  players: {
    [userId: string]: PlayerState;
  };
  winner: string | null;
  status: string;
}

interface GameStoreState {
  socket: Socket | null;
  gameState: GameState | null;
  myPlayerId: string | null;
  opponent: { id: string; username: string } | null;
  isInQueue: boolean;
  isInMatch: boolean;
  connectSocket: () => void;
  disconnectSocket: () => void;
  joinQueue: (deckId: string, mode: 'casual' | 'ranked') => void;
  leaveQueue: (mode: 'casual' | 'ranked') => void;
  playCard: (cardId: string, target?: string) => void;
  endTurn: () => void;
  setGameState: (gameState: GameState) => void;
}

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || 'http://localhost:3000';

export const useGameStore = create<GameStoreState>((set, get) => ({
  socket: null,
  gameState: null,
  myPlayerId: null,
  opponent: null,
  isInQueue: false,
  isInMatch: false,

  connectSocket: () => {
    const { token } = useAuthStore.getState();
    if (!token) return;

    const socket = io(SOCKET_URL, {
      auth: { token },
      transports: ['websocket'],
    });

    socket.on('connect', () => {
      console.log('✅ Connected to game server');
    });

    socket.on('disconnect', () => {
      console.log('❌ Disconnected from game server');
    });

    socket.on('match_found', (data: { matchId: string; opponent: any; gameState: GameState }) => {
      const { user } = useAuthStore.getState();
      set({
        gameState: data.gameState,
        myPlayerId: user?.id || null,
        opponent: data.opponent,
        isInQueue: false,
        isInMatch: true,
      });
    });

    socket.on('game_state_update', (data: { gameState: GameState }) => {
      set({ gameState: data.gameState });
    });

    socket.on('game_over', (data: { winner: string; ratingChange: number; newRating: number }) => {
      set({ isInMatch: false });
      alert(`Game Over! Winner: ${data.winner ? 'You' : 'Opponent'}\nRating Change: ${data.ratingChange > 0 ? '+' : ''}${data.ratingChange}\nNew Rating: ${data.newRating}`);
    });

    socket.on('opponent_disconnected', () => {
      alert('Opponent disconnected. You win!');
      set({ isInMatch: false });
    });

    set({ socket });
  },

  disconnectSocket: () => {
    const { socket } = get();
    if (socket) {
      socket.disconnect();
      set({ socket: null, gameState: null, isInMatch: false, isInQueue: false });
    }
  },

  joinQueue: (deckId: string, mode: 'casual' | 'ranked') => {
    const { socket } = get();
    if (!socket) {
      get().connectSocket();
    }
    
    const currentSocket = get().socket;
    if (currentSocket) {
      currentSocket.emit('join_queue', { deckId, mode });
      set({ isInQueue: true });
    }
  },

  leaveQueue: (mode: 'casual' | 'ranked') => {
    const { socket } = get();
    if (socket) {
      socket.emit('leave_queue', { mode });
      set({ isInQueue: false });
    }
  },

  playCard: (cardId: string, target?: string) => {
    const { socket, gameState } = get();
    if (!socket || !gameState) return;

    socket.emit('play_card', {
      matchId: gameState.matchId,
      cardId,
      target,
    });
  },

  endTurn: () => {
    const { socket, gameState } = get();
    if (!socket || !gameState) return;

    socket.emit('end_turn', {
      matchId: gameState.matchId,
    });
  },

  setGameState: (gameState: GameState) => {
    set({ gameState });
  },
}));
