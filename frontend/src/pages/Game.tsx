import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { useGameStore } from '../store/gameStore';
import axios from 'axios';
import './Game.css';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

export default function Game() {
  const [searchParams] = useSearchParams();
  const mode = (searchParams.get('mode') || 'casual') as 'casual' | 'ranked';
  const { user } = useAuthStore();
  const {
    gameState,
    myPlayerId,
    opponent,
    isInQueue,
    isInMatch,
    joinQueue,
    leaveQueue,
    playCard,
    endTurn,
    connectSocket,
  } = useGameStore();
  const [decks, setDecks] = useState<any[]>([]);
  const [selectedDeckId, setSelectedDeckId] = useState<string>('');
  const [cards, setCards] = useState<any[]>([]);
  const navigate = useNavigate();

  useEffect(() => {
    connectSocket();
    loadDecks();
    loadCards();
  }, []);

  const loadDecks = async () => {
    try {
      const response = await axios.get(`${API_URL}/decks`);
      setDecks(response.data);
      if (response.data.length > 0) {
        setSelectedDeckId(response.data[0].id);
      }
    } catch (error) {
      console.error('Failed to load decks:', error);
    }
  };

  const loadCards = async () => {
    try {
      const response = await axios.get(`${API_URL}/cards`);
      setCards(response.data);
    } catch (error) {
      console.error('Failed to load cards:', error);
    }
  };

  const handleFindMatch = () => {
    if (!selectedDeckId) {
      alert('Please select a deck');
      return;
    }
    joinQueue(selectedDeckId, mode);
  };

  const handlePlayCard = (cardId: string) => {
    if (!gameState || !myPlayerId) return;
    const player = gameState.players[myPlayerId];
    if (gameState.currentTurn !== myPlayerId) {
      alert('Not your turn!');
      return;
    }
    if (!player.canPlayCards) {
      alert('Cannot play cards right now!');
      return;
    }
    playCard(cardId);
  };

  const handleEndTurn = () => {
    if (!gameState || !myPlayerId) return;
    if (gameState.currentTurn !== myPlayerId) {
      alert('Not your turn!');
      return;
    }
    endTurn();
  };

  if (!isInMatch && !isInQueue) {
    return (
      <div className="game-container">
        <div className="game-lobby">
          <h2>Find Match - {mode.toUpperCase()}</h2>
          <div className="deck-selector">
            <label>Select Deck:</label>
            <select
              value={selectedDeckId}
              onChange={(e) => setSelectedDeckId(e.target.value)}
              className="input"
            >
              <option value="">Select a deck</option>
              {decks.map((deck) => (
                <option key={deck.id} value={deck.id}>
                  {deck.name}
                </option>
              ))}
            </select>
          </div>
          <button onClick={handleFindMatch} className="btn btn-primary">
            Find Match
          </button>
          <button onClick={() => navigate('/')} className="btn btn-secondary">
            Back to Home
          </button>
        </div>
      </div>
    );
  }

  if (isInQueue) {
    return (
      <div className="game-container">
        <div className="game-lobby">
          <h2>Searching for opponent...</h2>
          <div className="loading-spinner"></div>
          <button onClick={() => leaveQueue(mode)} className="btn btn-danger">
            Cancel
          </button>
        </div>
      </div>
    );
  }

  if (!gameState || !myPlayerId) {
    return <div>Loading game...</div>;
  }

  const myPlayer = gameState.players[myPlayerId];
  const opponentId = Object.keys(gameState.players).find((id) => id !== myPlayerId);
  const opponentPlayer = opponentId ? gameState.players[opponentId] : null;

  const getCardById = (cardId: string) => {
    if (cardId === 'hidden') return null;
    return cards.find((c) => c.id === cardId);
  };

  const isMyTurn = gameState.currentTurn === myPlayerId;

  return (
    <div className="game-container">
      <div className="game-header">
        <button onClick={() => navigate('/')} className="btn btn-secondary">
          Leave Game
        </button>
        <div className="game-info">
          Turn {gameState.turnNumber} - {isMyTurn ? 'Your Turn' : "Opponent's Turn"}
        </div>
      </div>

      <div className="game-board">
        {/* Opponent */}
        <div className="player-area opponent-area">
          <div className="player-info">
            <h3>{opponentPlayer?.username || 'Opponent'}</h3>
            <div className="player-stats">
              <div className="stat-bar">
                <span>HP: {opponentPlayer?.hp || 0}/{opponentPlayer?.maxHp || 30}</span>
                <div className="hp-bar">
                  <div
                    className="hp-fill"
                    style={{
                      width: `${((opponentPlayer?.hp || 0) / (opponentPlayer?.maxHp || 30)) * 100}%`,
                    }}
                  />
                </div>
              </div>
              <div className="stat-bar">
                <span>Shield: {opponentPlayer?.shield || 0}</span>
              </div>
              <div className="stat-bar">
                <span>Mana: {opponentPlayer?.mana || 0}/{opponentPlayer?.maxMana || 0}</span>
              </div>
            </div>
          </div>
          <div className="opponent-hand">
            {opponentPlayer?.hand.map((cardId, idx) => (
              <div key={idx} className="card-back">
                🃏
              </div>
            ))}
          </div>
        </div>

        {/* Game Center */}
        <div className="game-center"></div>

        {/* My Player */}
        <div className="player-area my-area">
          <div className="my-hand">
            {myPlayer.hand.map((cardId) => {
              const card = getCardById(cardId);
              if (!card) return null;
              const canPlay = isMyTurn && myPlayer.mana >= card.manaCost && myPlayer.canPlayCards;
              return (
                <div
                  key={cardId}
                  className={`card ${canPlay ? 'playable' : 'unplayable'}`}
                  onClick={() => canPlay && handlePlayCard(cardId)}
                >
                  <div className="card-header">
                    <span className="card-name">{card.name}</span>
                    <span className="card-mana">{card.manaCost}</span>
                  </div>
                  <div className="card-type">{card.type}</div>
                  <div className="card-description">{card.description}</div>
                </div>
              );
            })}
          </div>
          <div className="player-info">
            <h3>{myPlayer.username}</h3>
            <div className="player-stats">
              <div className="stat-bar">
                <span>HP: {myPlayer.hp}/{myPlayer.maxHp}</span>
                <div className="hp-bar">
                  <div
                    className="hp-fill"
                    style={{ width: `${(myPlayer.hp / myPlayer.maxHp) * 100}%` }}
                  />
                </div>
              </div>
              <div className="stat-bar">
                <span>Shield: {myPlayer.shield}</span>
              </div>
              <div className="stat-bar">
                <span>Mana: {myPlayer.mana}/{myPlayer.maxMana}</span>
              </div>
            </div>
            {isMyTurn && (
              <button onClick={handleEndTurn} className="btn btn-primary end-turn-btn">
                End Turn
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
