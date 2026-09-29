import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsNotEmpty, IsUUID } from 'class-validator';
import { Transform } from 'class-transformer';

export class CreateBookingDto {
  @ApiProperty({
    format: 'uuid',
    example: '11111111-1111-4111-8111-111111111111',
  })
  @IsUUID()
  slotId: string;

  @ApiProperty({
    example: 'Alex Morgan',
    description: 'Customer name. Leading and trailing whitespace is trimmed.',
  })
  @Transform(({ value }: { value: unknown }) =>
    typeof value === 'string' ? value.trim() : value,
  )
  @IsNotEmpty()
  customerName: string;

  @ApiProperty({
    format: 'email',
    example: 'alex@example.com',
    description: 'Customer email. Leading and trailing whitespace is trimmed.',
  })
  @Transform(({ value }: { value: unknown }) =>
    typeof value === 'string' ? value.trim() : value,
  )
  @IsEmail()
  customerEmail: string;
}
