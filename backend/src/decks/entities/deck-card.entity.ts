import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Deck } from './deck.entity';
import { Card } from '../../cards/entities/card.entity';

@Entity('deck_cards')
export class DeckCard {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  deckId: string;

  @Column()
  cardId: string;

  @Column()
  quantity: number; // How many copies of this card in the deck

  @ManyToOne(() => Deck, (deck) => deck.cards, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'deckId' })
  deck: Deck;

  @ManyToOne(() => Card)
  @JoinColumn({ name: 'cardId' })
  card: Card;
}
