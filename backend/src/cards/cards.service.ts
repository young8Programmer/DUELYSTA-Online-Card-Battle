import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Card } from './entities/card.entity';

@Injectable()
export class CardsService {
  constructor(
    @InjectRepository(Card)
    private cardsRepository: Repository<Card>,
  ) {}

  async findAll(): Promise<Card[]> {
    return this.cardsRepository.find();
  }

  async findOne(id: string): Promise<Card> {
    return this.cardsRepository.findOne({ where: { id } });
  }

  async createDefaultCards(): Promise<void> {
    const defaultCards = [
      // Attack Cards
      {
        name: 'Fireball',
        description: 'Deal 5 damage',
        type: 'attack' as const,
        manaCost: 3,
        effects: [{ type: 'damage' as const, value: 5 }],
        rarity: 'common' as const,
      },
      {
        name: 'Lightning Bolt',
        description: 'Deal 4 damage',
        type: 'attack' as const,
        manaCost: 2,
        effects: [{ type: 'damage' as const, value: 4 }],
        rarity: 'common' as const,
      },
      {
        name: 'Double Strike',
        description: 'Deal 3 damage twice',
        type: 'attack' as const,
        manaCost: 4,
        effects: [{ type: 'double_damage' as const, value: 3 }],
        rarity: 'rare' as const,
      },
      {
        name: 'Piercing Arrow',
        description: 'Deal 6 damage, ignores shield',
        type: 'attack' as const,
        manaCost: 4,
        effects: [{ type: 'pierce' as const, value: 6 }],
        rarity: 'rare' as const,
      },
      // Defense Cards
      {
        name: 'Heal',
        description: 'Restore 3 HP',
        type: 'defense' as const,
        manaCost: 2,
        effects: [{ type: 'heal' as const, value: 3 }],
        rarity: 'common' as const,
      },
      {
        name: 'Shield',
        description: 'Gain 5 shield',
        type: 'defense' as const,
        manaCost: 3,
        effects: [{ type: 'shield' as const, value: 5 }],
        rarity: 'common' as const,
      },
      {
        name: 'Greater Heal',
        description: 'Restore 6 HP',
        type: 'defense' as const,
        manaCost: 4,
        effects: [{ type: 'heal' as const, value: 6 }],
        rarity: 'rare' as const,
      },
      // Spell Cards
      {
        name: 'Freeze',
        description: 'Opponent skips next turn',
        type: 'spell' as const,
        manaCost: 3,
        effects: [{ type: 'freeze' as const, value: 1, duration: 1 }],
        rarity: 'rare' as const,
      },
      {
        name: 'Stun',
        description: 'Opponent cannot play cards next turn',
        type: 'spell' as const,
        manaCost: 2,
        effects: [{ type: 'stun' as const, value: 1, duration: 1 }],
        rarity: 'common' as const,
      },
      {
        name: 'Draw Cards',
        description: 'Draw 2 cards',
        type: 'spell' as const,
        manaCost: 2,
        effects: [{ type: 'draw_cards' as const, value: 2 }],
        rarity: 'common' as const,
      },
      {
        name: 'Mana Steal',
        description: 'Steal 2 mana from opponent',
        type: 'spell' as const,
        manaCost: 3,
        effects: [{ type: 'steal_mana' as const, value: 2 }],
        rarity: 'epic' as const,
      },
      {
        name: 'Burn',
        description: 'Deal 2 damage for 3 turns',
        type: 'spell' as const,
        manaCost: 4,
        effects: [{ type: 'burn' as const, value: 2, duration: 3 }],
        rarity: 'epic' as const,
      },
    ];

    for (const cardData of defaultCards) {
      const existing = await this.cardsRepository.findOne({
        where: { name: cardData.name },
      });
      if (!existing) {
        const card = this.cardsRepository.create(cardData as any);
        await this.cardsRepository.save(card);
      }
    }
  }
}
