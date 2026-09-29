import { ApiProperty } from '@nestjs/swagger';

export class ErrorBodyDto {
  @ApiProperty({
    example: 'SLOT_UNAVAILABLE',
  })
  code: string;

  @ApiProperty({
    example: 'This slot already has an active booking.',
  })
  message: string;
}

export class ErrorResponseDto {
  @ApiProperty({
    type: ErrorBodyDto,
  })
  error: ErrorBodyDto;
}

export class SlotDto {
  @ApiProperty({
    format: 'uuid',
    example: '11111111-1111-4111-8111-111111111111',
  })
  id: string;

  @ApiProperty({
    format: 'date-time',
    example: '2030-01-15T09:00:00.000Z',
  })
  startsAt: string;

  @ApiProperty({
    format: 'date-time',
    example: '2030-01-15T09:30:00.000Z',
  })
  endsAt: string;
}

export class SlotsResponseDto {
  @ApiProperty({
    type: [SlotDto],
  })
  slots: SlotDto[];
}

export class BookingDto {
  @ApiProperty({
    format: 'uuid',
    example: '22222222-2222-4222-8222-222222222222',
  })
  id: string;

  @ApiProperty({
    format: 'uuid',
    example: '11111111-1111-4111-8111-111111111111',
  })
  slotId: string;

  @ApiProperty({
    example: 'Alex Morgan',
  })
  customerName: string;

  @ApiProperty({
    format: 'email',
    example: 'alex@example.com',
  })
  customerEmail: string;

  @ApiProperty({
    enum: ['active', 'cancelled'],
    example: 'active',
  })
  status: 'active' | 'cancelled';
}

export class BookingResponseDto {
  @ApiProperty({
    type: BookingDto,
  })
  booking: BookingDto;
}
