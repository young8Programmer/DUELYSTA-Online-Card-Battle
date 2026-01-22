import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import './DeckBuilder.css';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

export default function DeckBuilder() {
  const [decks, setDecks] = useState<any[]>([]);
  const [cards, setCards] = useState<any[]>([]);
  const [selectedDeck, setSelectedDeck] = useState<any>(null);
  const [deckName, setDeckName] = useState('');
  const [deckCards, setDeckCards] = useState<{ cardId: string; quantity: number }[]>([]);
  const navigate = useNavigate();

  useEffect(() => {
    loadDecks();
    loadCards();
  }, []);

  const loadDecks = async () => {
    try {
      const response = await axios.get(`${API_URL}/decks`);
      setDecks(response.data);
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

  const addCardToDeck = (cardId: string) => {
    const existing = deckCards.find((dc) => dc.cardId === cardId);
    const totalCards = deckCards.reduce((sum, dc) => sum + dc.quantity, 0);

    if (totalCards >= 30) {
      alert('Deck is full (30 cards)');
      return;
    }

    if (existing) {
      if (existing.quantity >= 3) {
        alert('Maximum 3 copies per card');
        return;
      }
      setDeckCards(
        deckCards.map((dc) => (dc.cardId === cardId ? { ...dc, quantity: dc.quantity + 1 } : dc))
      );
    } else {
      setDeckCards([...deckCards, { cardId, quantity: 1 }]);
    }
  };

  const removeCardFromDeck = (cardId: string) => {
    const existing = deckCards.find((dc) => dc.cardId === cardId);
    if (existing) {
      if (existing.quantity === 1) {
        setDeckCards(deckCards.filter((dc) => dc.cardId !== cardId));
      } else {
        setDeckCards(
          deckCards.map((dc) => (dc.cardId === cardId ? { ...dc, quantity: dc.quantity - 1 } : dc))
        );
      }
    }
  };

  const saveDeck = async () => {
    if (!deckName.trim()) {
      alert('Please enter a deck name');
      return;
    }

    const totalCards = deckCards.reduce((sum, dc) => sum + dc.quantity, 0);
    if (totalCards !== 30) {
      alert(`Deck must contain exactly 30 cards (currently: ${totalCards})`);
      return;
    }

    try {
      await axios.post(`${API_URL}/decks`, {
        name: deckName,
        cards: deckCards,
      });
      alert('Deck saved!');
      setDeckName('');
      setDeckCards([]);
      loadDecks();
    } catch (error: any) {
      alert(error.response?.data?.message || 'Failed to save deck');
    }
  };

  const getCardQuantity = (cardId: string) => {
    const deckCard = deckCards.find((dc) => dc.cardId === cardId);
    return deckCard?.quantity || 0;
  };

  const totalCards = deckCards.reduce((sum, dc) => sum + dc.quantity, 0);

  return (
    <div className="deck-builder">
      <div className="deck-builder-header">
        <h1>Deck Builder</h1>
        <button onClick={() => navigate('/')} className="btn btn-secondary">
          Back to Home
        </button>
      </div>

      <div className="deck-builder-content">
        <div className="cards-panel">
          <h2>Available Cards</h2>
          <div className="cards-grid">
            {cards.map((card) => {
              const quantity = getCardQuantity(card.id);
              return (
                <div key={card.id} className="card-item">
                  <div className="card-item-header">
                    <span className="card-item-name">{card.name}</span>
                    <span className="card-item-mana">{card.manaCost}</span>
                  </div>
                  <div className="card-item-type">{card.type}</div>
                  <div className="card-item-description">{card.description}</div>
                  <div className="card-item-actions">
                    <button
                      onClick={() => addCardToDeck(card.id)}
                      className="btn btn-primary"
                      disabled={quantity >= 3 || totalCards >= 30}
                    >
                      Add ({quantity}/3)
                    </button>
                    {quantity > 0 && (
                      <button
                        onClick={() => removeCardFromDeck(card.id)}
                        className="btn btn-danger"
                      >
                        Remove
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="deck-panel">
          <h2>My Deck</h2>
          <input
            type="text"
            placeholder="Deck Name"
            value={deckName}
            onChange={(e) => setDeckName(e.target.value)}
            className="input"
          />
          <div className="deck-stats">
            <div>Total Cards: {totalCards}/30</div>
          </div>
          <div className="deck-cards-list">
            {deckCards.map((deckCard) => {
              const card = cards.find((c) => c.id === deckCard.cardId);
              if (!card) return null;
              return (
                <div key={deckCard.cardId} className="deck-card-item">
                  <span>
                    {deckCard.quantity}x {card.name}
                  </span>
                  <button
                    onClick={() => removeCardFromDeck(deckCard.cardId)}
                    className="btn btn-danger"
                  >
                    Remove
                  </button>
                </div>
              );
            })}
          </div>
          <button onClick={saveDeck} className="btn btn-primary" disabled={totalCards !== 30}>
            Save Deck
          </button>
        </div>
      </div>

      <div className="my-decks">
        <h2>My Decks</h2>
        <div className="decks-list">
          {decks.map((deck) => (
            <div key={deck.id} className="deck-item">
              <h3>{deck.name}</h3>
              <p>{deck.cards?.length || 0} unique cards</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
