import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '../generated/prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { RealtimeGateway } from '../realtime/realtime.gateway';
import { CreateBookingDto } from './dto/create-booking.dto';

@Injectable()
export class BookingsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly realtime: RealtimeGateway,
  ) {}

  async create(dto: CreateBookingDto) {
    const slot = await this.prisma.slot.findUnique({
      where: { id: dto.slotId },
      select: { id: true },
    });

    if (!slot) {
      throw new NotFoundException({
        error: {
          code: 'SLOT_NOT_FOUND',
          message: 'Slot not found.',
        },
      });
    }

    try {
      const booking = await this.prisma.booking.create({
        data: {
          slotId: dto.slotId,
          customerName: dto.customerName,
          customerEmail: dto.customerEmail,
          status: 'active',
        },
        select: {
          id: true,
          slotId: true,
          customerName: true,
          customerEmail: true,
          status: true,
        },
      });

      this.realtime.emitSlotBooked(booking.slotId, booking.id);

      return booking;
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2002'
      ) {
        throw new ConflictException({
          error: {
            code: 'SLOT_UNAVAILABLE',
            message: 'This slot already has an active booking.',
          },
        });
      }

      throw error;
    }
  }

  async cancel(bookingId: string) {
    const booking = await this.prisma.booking.findUnique({
      where: { id: bookingId },
      select: {
        id: true,
        slotId: true,
        customerName: true,
        customerEmail: true,
        status: true,
      },
    });

    if (!booking) {
      throw new NotFoundException({
        error: {
          code: 'BOOKING_NOT_FOUND',
          message: 'Booking not found.',
        },
      });
    }

    if (booking.status === 'cancelled') {
      return booking;
    }

    const cancelled = await this.prisma.booking.update({
      where: { id: bookingId },
      data: {
        status: 'cancelled',
      },
      select: {
        id: true,
        slotId: true,
        customerName: true,
        customerEmail: true,
        status: true,
      },
    });

    this.realtime.emitSlotReleased(cancelled.slotId, cancelled.id);

    return cancelled;
  }
}
