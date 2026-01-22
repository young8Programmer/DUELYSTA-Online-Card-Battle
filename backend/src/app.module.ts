import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule } from '@nestjs/config';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { CardsModule } from './cards/cards.module';
import { DecksModule } from './decks/decks.module';
import { MatchesModule } from './matches/matches.module';
import { GameModule } from './game/game.module';
import { WebSocketModule } from './websocket/websocket.module';
import { User } from './users/entities/user.entity';
import { Card } from './cards/entities/card.entity';
import { Deck } from './decks/entities/deck.entity';
import { DeckCard } from './decks/entities/deck-card.entity';
import { Match } from './matches/entities/match.entity';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    TypeOrmModule.forRoot({
      type: 'postgres',
      host: process.env.DB_HOST || 'localhost',
      port: parseInt(process.env.DB_PORT || '5432'),
      username: process.env.DB_USERNAME || 'postgres',
      password: process.env.DB_PASSWORD || 'postgres',
      database: process.env.DB_DATABASE || 'duelysta',
      entities: [User, Card, Deck, DeckCard, Match],
      synchronize: process.env.NODE_ENV !== 'production',
      logging: process.env.NODE_ENV === 'development',
    }),
    AuthModule,
    UsersModule,
    CardsModule,
    DecksModule,
    MatchesModule,
    GameModule,
    WebSocketModule,
  ],
})
export class AppModule {}
