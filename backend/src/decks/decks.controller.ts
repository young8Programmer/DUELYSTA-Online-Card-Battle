import { Controller, Get, Post, Body, Param, Delete, UseGuards, Request } from '@nestjs/common';
import { DecksService } from './decks.service';
import { CreateDeckDto } from './dto/create-deck.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('decks')
@UseGuards(JwtAuthGuard)
export class DecksController {
  constructor(private decksService: DecksService) {}

  @Post()
  async create(@Request() req, @Body() createDeckDto: CreateDeckDto) {
    return this.decksService.create(req.user.id, createDeckDto);
  }

  @Get()
  async findAll(@Request() req) {
    return this.decksService.findAll(req.user.id);
  }

  @Get(':id')
  async findOne(@Request() req, @Param('id') id: string) {
    return this.decksService.findOneForUser(id, req.user.id);
  }

  @Delete(':id')
  async remove(@Request() req, @Param('id') id: string) {
    await this.decksService.remove(id, req.user.id);
    return { message: 'Deck deleted successfully' };
  }
}
