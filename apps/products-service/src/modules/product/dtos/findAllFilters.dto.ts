import { IsOptional } from 'class-validator';

export class FindAllFiltersDto {
  @IsOptional()
  category?: string;
}
