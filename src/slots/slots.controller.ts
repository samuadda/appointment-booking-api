import { Controller, Get } from '@nestjs/common';
import { ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import { SlotsService } from './slots.service';
import { SlotsResponseDto } from '../common/dto/api-response.dto';

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
    type: SlotsResponseDto,
  })
  async findAvailable() {
    const slots = await this.slotsService.findAvailable();

    return { slots };
  }
}
