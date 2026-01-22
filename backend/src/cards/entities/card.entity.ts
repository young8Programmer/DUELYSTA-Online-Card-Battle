import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
} from 'typeorm';

export enum CardType {
  ATTACK = 'attack',
  DEFENSE = 'defense',
  SPELL = 'spell',
}

export enum CardRarity {
  COMMON = 'common',
  RARE = 'rare',
  EPIC = 'epic',
  LEGENDARY = 'legendary',
}

export enum CardEffect {
  // Attack effects
  DAMAGE = 'damage',
  DOUBLE_DAMAGE = 'double_damage',
  PIERCE = 'pierce', // Ignores shield
  
  // Defense effects
  HEAL = 'heal',
  SHIELD = 'shield',
  
  // Spell effects
  STUN = 'stun', // Skip next turn
  DRAW_CARDS = 'draw_cards',
  STEAL_MANA = 'steal_mana',
  BURN = 'burn', // Damage over time
  FREEZE = 'freeze', // Can't play cards next turn
}

@Entity('cards')
export class Card {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  name: string;

  @Column()
  description: string;

  @Column({
    type: 'enum',
    enum: CardType,
  })
  type: CardType;

  @Column()
  manaCost: number;

  @Column('jsonb', { nullable: true })
  effects: {
    type: CardEffect;
    value: number;
    duration?: number; // For effects like burn, freeze
  }[];

  @Column({
    type: 'enum',
    enum: CardRarity,
    default: CardRarity.COMMON,
  })
  rarity: CardRarity;

  @Column({ nullable: true })
  imageUrl: string;

  @CreateDateColumn()
  createdAt: Date;
}
