import { Body, Controller, Delete, Param, Post } from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiConflictResponse,
  ApiCreatedResponse,
  ApiExtraModels,
  ApiInternalServerErrorResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiTags,
  getSchemaPath,
} from '@nestjs/swagger';

import {
  BookingResponseDto,
  ErrorResponseDto,
} from '../common/dto/api-response.dto';
import { UuidValidationPipe } from '../common/pipes/uuid-validation.pipe';
import { BookingsService } from './bookings.service';
import { CreateBookingDto } from './dto/create-booking.dto';

@ApiTags('bookings')
@ApiExtraModels(BookingResponseDto, ErrorResponseDto)
@Controller('bookings')
export class BookingsController {
  constructor(private readonly bookingsService: BookingsService) {}

  @Post()
  @ApiOperation({
    summary: 'Create a booking',
    description:
      'Creates an active booking for a slot. Only one active booking may exist per slot. No authentication is required.',
  })
  @ApiCreatedResponse({
    description: 'Booking created.',
    content: {
      'application/json': {
        schema: {
          $ref: getSchemaPath(BookingResponseDto),
        },
        example: {
          booking: {
            id: '22222222-2222-4222-8222-222222222222',
            slotId: '11111111-1111-4111-8111-111111111111',
            customerName: 'Alex Morgan',
            customerEmail: 'alex@example.com',
            status: 'active',
          },
        },
      },
    },
  })
  @ApiBadRequestResponse({
    description: 'Invalid or missing request data, including malformed JSON.',
    content: {
      'application/json': {
        schema: {
          $ref: getSchemaPath(ErrorResponseDto),
        },
        example: {
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Invalid request data.',
          },
        },
      },
    },
  })
  @ApiNotFoundResponse({
    description: 'Valid UUID, but the slot does not exist.',
    content: {
      'application/json': {
        schema: {
          $ref: getSchemaPath(ErrorResponseDto),
        },
        example: {
          error: {
            code: 'SLOT_NOT_FOUND',
            message: 'Slot not found.',
          },
        },
      },
    },
  })
  @ApiConflictResponse({
    description: 'The slot already has an active booking.',
    content: {
      'application/json': {
        schema: {
          $ref: getSchemaPath(ErrorResponseDto),
        },
        example: {
          error: {
            code: 'SLOT_UNAVAILABLE',
            message: 'This slot already has an active booking.',
          },
        },
      },
    },
  })
  @ApiInternalServerErrorResponse({
    description: 'Unexpected server error.',
    content: {
      'application/json': {
        schema: {
          $ref: getSchemaPath(ErrorResponseDto),
        },
        example: {
          error: {
            code: 'INTERNAL_ERROR',
            message: 'An unexpected error occurred.',
          },
        },
      },
    },
  })
  async create(@Body() dto: CreateBookingDto) {
    const booking = await this.bookingsService.create(dto);

    return { booking };
  }

  @Delete(':bookingId')
  @ApiOperation({
    summary: 'Cancel a booking',
    description:
      'Cancels an active booking. Cancelling an already-cancelled booking is idempotent: it returns 200 with the same booking and emits no additional realtime event. No authentication is required.',
  })
  @ApiParam({
    name: 'bookingId',
    required: true,
    type: String,
    format: 'uuid',
    example: '22222222-2222-4222-8222-222222222222',
  })
  @ApiOkResponse({
    description: 'Booking cancelled, or already cancelled.',
    content: {
      'application/json': {
        schema: {
          $ref: getSchemaPath(BookingResponseDto),
        },
        example: {
          booking: {
            id: '22222222-2222-4222-8222-222222222222',
            slotId: '11111111-1111-4111-8111-111111111111',
            customerName: 'Alex Morgan',
            customerEmail: 'alex@example.com',
            status: 'cancelled',
          },
        },
      },
    },
  })
  @ApiBadRequestResponse({
    description: 'Invalid booking UUID.',
    content: {
      'application/json': {
        schema: {
          $ref: getSchemaPath(ErrorResponseDto),
        },
        example: {
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Invalid UUID.',
          },
        },
      },
    },
  })
  @ApiNotFoundResponse({
    description: 'Valid UUID, but the booking does not exist.',
    content: {
      'application/json': {
        schema: {
          $ref: getSchemaPath(ErrorResponseDto),
        },
        example: {
          error: {
            code: 'BOOKING_NOT_FOUND',
            message: 'Booking not found.',
          },
        },
      },
    },
  })
  @ApiInternalServerErrorResponse({
    description: 'Unexpected server error.',
    content: {
      'application/json': {
        schema: {
          $ref: getSchemaPath(ErrorResponseDto),
        },
        example: {
          error: {
            code: 'INTERNAL_ERROR',
            message: 'An unexpected error occurred.',
          },
        },
      },
    },
  })
  async cancel(@Param('bookingId', UuidValidationPipe) bookingId: string) {
    const booking = await this.bookingsService.cancel(bookingId);

    return { booking };
  }
}
