import { Module } from '@nestjs/common';
import { PrismaModule } from './prisma/prisma.module';
import { SlotsModule } from './slots/slots.module';
import { BookingsModule } from './bookings/bookings.module';

@Module({
  imports: [PrismaModule, SlotsModule, BookingsModule],
})
export class AppModule {}
