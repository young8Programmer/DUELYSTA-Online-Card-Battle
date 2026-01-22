import { Injectable, NotFoundException, ForbiddenException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Deck } from './entities/deck.entity';
import { DeckCard } from './entities/deck-card.entity';
import { CreateDeckDto } from './dto/create-deck.dto';
import { CardsService } from '../cards/cards.service';

@Injectable()
export class DecksService {
  constructor(
    @InjectRepository(Deck)
    private decksRepository: Repository<Deck>,
    @InjectRepository(DeckCard)
    private deckCardsRepository: Repository<DeckCard>,
    private cardsService: CardsService,
  ) {}

  async create(userId: string, createDeckDto: CreateDeckDto): Promise<Deck> {
    // Validate deck has exactly 30 cards
    const totalCards = createDeckDto.cards.reduce((sum, card) => sum + card.quantity, 0);
    if (totalCards !== 30) {
      throw new BadRequestException('Deck must contain exactly 30 cards');
    }

    // Validate max 3 copies per card
    for (const card of createDeckDto.cards) {
      if (card.quantity > 3) {
        throw new BadRequestException('Maximum 3 copies of each card allowed');
      }
    }

    const deck = this.decksRepository.create({
      name: createDeckDto.name,
      userId,
    });

    const savedDeck = await this.decksRepository.save(deck);

    // Create deck cards
    for (const cardData of createDeckDto.cards) {
      const card = await this.cardsService.findOne(cardData.cardId);
      if (!card) {
        throw new NotFoundException(`Card with ID ${cardData.cardId} not found`);
      }

      const deckCard = this.deckCardsRepository.create({
        deckId: savedDeck.id,
        cardId: cardData.cardId,
        quantity: cardData.quantity,
      });
      await this.deckCardsRepository.save(deckCard);
    }

    return this.findOne(savedDeck.id);
  }

  async findAll(userId: string): Promise<Deck[]> {
    return this.decksRepository.find({
      where: { userId },
      relations: ['cards', 'cards.card'],
    });
  }

  async findOne(id: string): Promise<Deck> {
    const deck = await this.decksRepository.findOne({
      where: { id },
      relations: ['cards', 'cards.card'],
    });
    if (!deck) {
      throw new NotFoundException('Deck not found');
    }
    return deck;
  }

  async findOneForUser(id: string, userId: string): Promise<Deck> {
    const deck = await this.findOne(id);
    if (deck.userId !== userId) {
      throw new ForbiddenException('You do not have access to this deck');
    }
    return deck;
  }

  async remove(id: string, userId: string): Promise<void> {
    const deck = await this.findOneForUser(id, userId);
    await this.decksRepository.remove(deck);
  }
}
