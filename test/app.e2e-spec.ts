import {
  BadRequestException,
  INestApplication,
  ValidationPipe,
} from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import request from 'supertest';

import { AppModule } from '../src/app.module';
import { ApiExceptionFilter } from '../src/common/filters/api-exception.filter';
import { PrismaService } from '../src/prisma/prisma.service';
import { RealtimeGateway } from '../src/realtime/realtime.gateway';
import { jest } from '@jest/globals';

describe('Appointment Booking API (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let realtime: RealtimeGateway;

  beforeAll(async () => {
    if (!process.env.TEST_DATABASE_URL) {
      throw new Error('TEST_DATABASE_URL is required for e2e tests');
    }

    process.env.DATABASE_URL = process.env.TEST_DATABASE_URL;

    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();

    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        transform: true,
        exceptionFactory: () =>
          new BadRequestException({
            error: {
              code: 'VALIDATION_ERROR',
              message: 'Invalid request data.',
            },
          }),
      }),
    );

    app.useGlobalFilters(new ApiExceptionFilter());

    prisma = app.get(PrismaService);
    realtime = app.get(RealtimeGateway);

    await app.init();
  });

  beforeEach(async () => {
    await prisma.booking.deleteMany();
  });

  afterAll(async () => {
    if (app) {
      await app.close();
    }
  });

  it('books an available slot and removes it from GET /slots', async () => {
    const slotId = '11111111-1111-4111-8111-111111111111';

    const bookingResponse = await request(app.getHttpServer())
      .post('/bookings')
      .send({
        slotId,
        customerName: 'Alex Morgan',
        customerEmail: 'alex@example.com',
      })
      .expect(201);

    expect(bookingResponse.body.booking).toMatchObject({
      slotId,
      customerName: 'Alex Morgan',
      customerEmail: 'alex@example.com',
      status: 'active',
    });

    const slotsResponse = await request(app.getHttpServer())
      .get('/slots')
      .expect(200);

    const returnedSlotIds = slotsResponse.body.slots.map(
      (slot: { id: string }) => slot.id,
    );

    expect(returnedSlotIds).not.toContain(slotId);
  });

  it('allows only one active booking when two requests race for the same slot', async () => {
    const slotId = '22222222-2222-4222-8222-222222222222';

    const [first, second] = await Promise.all([
      request(app.getHttpServer()).post('/bookings').send({
        slotId,
        customerName: 'First Customer',
        customerEmail: 'first@example.com',
      }),

      request(app.getHttpServer()).post('/bookings').send({
        slotId,
        customerName: 'Second Customer',
        customerEmail: 'second@example.com',
      }),
    ]);

    const statuses = [first.status, second.status].sort();

    expect(statuses).toEqual([201, 409]);

    const activeBookings = await prisma.booking.count({
      where: {
        slotId,
        status: 'active',
      },
    });

    expect(activeBookings).toBe(1);
  });

  it('cancels a booking, releases the slot, and allows a new booking', async () => {
    const slotId = '33333333-3333-4333-8333-333333333333';

    const firstBooking = await request(app.getHttpServer())
      .post('/bookings')
      .send({
        slotId,
        customerName: 'First Customer',
        customerEmail: 'first@example.com',
      })
      .expect(201);

    const bookingId = firstBooking.body.booking.id;

    await request(app.getHttpServer())
      .delete(`/bookings/${bookingId}`)
      .expect(200);

    const slotsResponse = await request(app.getHttpServer())
      .get('/slots')
      .expect(200);

    const returnedSlotIds = slotsResponse.body.slots.map(
      (slot: { id: string }) => slot.id,
    );

    expect(returnedSlotIds).toContain(slotId);

    const secondBooking = await request(app.getHttpServer())
      .post('/bookings')
      .send({
        slotId,
        customerName: 'Second Customer',
        customerEmail: 'second@example.com',
      })
      .expect(201);

    expect(secondBooking.body.booking).toMatchObject({
      slotId,
      customerName: 'Second Customer',
      customerEmail: 'second@example.com',
      status: 'active',
    });
  });

  it('emits slot.released only once when two cancellation requests race', async () => {
    const slotId = '44444444-4444-4444-8444-444444444444';

    const bookingResponse = await request(app.getHttpServer())
      .post('/bookings')
      .send({
        slotId,
        customerName: 'Concurrent Cancel',
        customerEmail: 'cancel@example.com',
      })
      .expect(201);

    const bookingId = bookingResponse.body.booking.id;

    const releaseSpy = jest.spyOn(realtime, 'emitSlotReleased');

    const [first, second] = await Promise.all([
      request(app.getHttpServer()).delete(`/bookings/${bookingId}`),
      request(app.getHttpServer()).delete(`/bookings/${bookingId}`),
    ]);

    expect([first.status, second.status]).toEqual([200, 200]);

    const booking = await prisma.booking.findUnique({
      where: { id: bookingId },
    });

    expect(booking?.status).toBe('cancelled');

    expect(releaseSpy).toHaveBeenCalledTimes(1);
    expect(releaseSpy).toHaveBeenCalledWith(slotId, bookingId);

    releaseSpy.mockRestore();
  });
});
