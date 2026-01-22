import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  CreateDateColumn,
  JoinColumn,
} from 'typeorm';
import { User } from '../../users/entities/user.entity';

export enum MatchStatus {
  WAITING = 'waiting',
  IN_PROGRESS = 'in_progress',
  FINISHED = 'finished',
  ABANDONED = 'abandoned',
}

export enum MatchMode {
  CASUAL = 'casual',
  RANKED = 'ranked',
}

@Entity('matches')
export class Match {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  player1Id: string;

  @Column()
  player2Id: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'player1Id' })
  player1: User;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'player2Id' })
  player2: User;

  @Column({ nullable: true })
  winnerId: string;

  @ManyToOne(() => User, { nullable: true })
  @JoinColumn({ name: 'winnerId' })
  winner: User;

  @Column({
    type: 'enum',
    enum: MatchStatus,
    default: MatchStatus.WAITING,
  })
  status: MatchStatus;

  @Column({
    type: 'enum',
    enum: MatchMode,
    default: MatchMode.CASUAL,
  })
  mode: MatchMode;

  @Column('jsonb', { nullable: true })
  player1RatingChange: number;

  @Column('jsonb', { nullable: true })
  player2RatingChange: number;

  @CreateDateColumn()
  createdAt: Date;

  @Column({ nullable: true })
  finishedAt: Date;
}
