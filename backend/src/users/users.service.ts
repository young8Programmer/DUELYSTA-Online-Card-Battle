import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from './entities/user.entity';
import { CreateUserDto } from './dto/create-user.dto';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private usersRepository: Repository<User>,
  ) {}

  async create(createUserDto: CreateUserDto): Promise<User> {
    const existingUser = await this.usersRepository.findOne({
      where: { username: createUserDto.username },
    });

    if (existingUser) {
      throw new ConflictException('Username already exists');
    }

    const user = this.usersRepository.create(createUserDto);
    return this.usersRepository.save(user);
  }

  async findAll(): Promise<User[]> {
    return this.usersRepository.find({
      select: ['id', 'username', 'rating', 'wins', 'losses', 'draws', 'createdAt'],
    });
  }

  async findOne(id: string): Promise<User> {
    const user = await this.usersRepository.findOne({ where: { id } });
    if (!user) {
      throw new NotFoundException('User not found');
    }
    return user;
  }

  async findByUsername(username: string): Promise<User | null> {
    return this.usersRepository.findOne({ where: { username } });
  }

  async updateRating(userId: string, newRating: number): Promise<User> {
    const user = await this.findOne(userId);
    user.rating = newRating;
    return this.usersRepository.save(user);
  }

  async incrementWins(userId: string): Promise<User> {
    const user = await this.findOne(userId);
    user.wins += 1;
    return this.usersRepository.save(user);
  }

  async incrementLosses(userId: string): Promise<User> {
    const user = await this.findOne(userId);
    user.losses += 1;
    return this.usersRepository.save(user);
  }

  async incrementDraws(userId: string): Promise<User> {
    const user = await this.findOne(userId);
    user.draws += 1;
    return this.usersRepository.save(user);
  }

  async getLeaderboard(limit: number = 100): Promise<User[]> {
    return this.usersRepository.find({
      select: ['id', 'username', 'rating', 'wins', 'losses', 'draws'],
      order: { rating: 'DESC' },
      take: limit,
    });
  }
}
