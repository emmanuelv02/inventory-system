import { IsNotEmpty, IsUUID } from 'class-validator';

export class RegisterInventoryDto {
  @IsUUID()
  productId: string;

  @IsNotEmpty()
  quantity: number;

  description: string;
}
