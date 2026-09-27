import { IsEmail, IsNotEmpty, IsUUID } from 'class-validator';
import { Transform } from 'class-transformer';

export class CreateBookingDto {
  @IsUUID()
  slotId: string;

  @Transform(({ value }: { value: unknown }) =>
    typeof value === 'string' ? value.trim() : value,
  )
  @IsNotEmpty()
  customerName: string;

  @Transform(({ value }: { value: unknown }) =>
    typeof value === 'string' ? value.trim() : value,
  )
  @IsEmail()
  customerEmail: string;
}
