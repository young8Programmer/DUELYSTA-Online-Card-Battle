import { IsString, IsArray, ValidateNested, IsUUID, Min, Max } from 'class-validator';
import { Type } from 'class-transformer';

class DeckCardDto {
  @IsUUID()
  cardId: string;

  @Min(1)
  @Max(3)
  quantity: number;
}

export class CreateDeckDto {
  @IsString()
  name: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => DeckCardDto)
  cards: DeckCardDto[];
}
