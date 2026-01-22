import { Controller, Get, Param, Post } from '@nestjs/common';
import { CardsService } from './cards.service';

@Controller('cards')
export class CardsController {
  constructor(private cardsService: CardsService) {}

  @Get()
  async findAll() {
    return this.cardsService.findAll();
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    return this.cardsService.findOne(id);
  }

  @Post('init')
  async initDefaultCards() {
    await this.cardsService.createDefaultCards();
    return { message: 'Default cards initialized' };
  }
}
