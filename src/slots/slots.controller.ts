import { Controller, Get } from '@nestjs/common';
import { ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import { SlotsService } from './slots.service';

@ApiTags('slots')
@Controller('slots')
export class SlotsController {
  constructor(private readonly slotsService: SlotsService) {}

  @Get()
  @ApiOperation({
    summary: 'List available appointment slots',
    description:
      'Returns only slots with no active booking, ordered by startsAt ascending then id ascending. No authentication is required.',
  })
  @ApiOkResponse({
    description: 'Available slots.',
    schema: {
      example: {
        slots: [
          {
            id: '11111111-1111-4111-8111-111111111111',
            startsAt: '2030-01-15T09:00:00.000Z',
            endsAt: '2030-01-15T09:30:00.000Z',
          },
        ],
      },
    },
  })
  async findAvailable() {
    const slots = await this.slotsService.findAvailable();

    return { slots };
  }
}