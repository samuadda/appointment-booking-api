import { Body, Controller, Delete, Param, Post } from '@nestjs/common';
import { BookingsService } from './bookings.service';
import { CreateBookingDto } from './dto/create-booking.dto';
import { UuidValidationPipe } from '../common/pipes/uuid-validation.pipe';

@Controller('bookings')
export class BookingsController {
  constructor(private readonly bookingsService: BookingsService) {}

  @Post()
  async create(@Body() dto: CreateBookingDto) {
    const booking = await this.bookingsService.create(dto);

    return { booking };
  }

  @Delete(':bookingId')
  async cancel(@Param('bookingId', UuidValidationPipe) bookingId: string) {
    const booking = await this.bookingsService.cancel(bookingId);

    return { booking };
  }
}
