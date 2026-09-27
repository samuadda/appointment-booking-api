import { Controller, Get } from '@nestjs/common';
import { SlotsService } from './slots.service';

@Controller('slots')
export class SlotsController {
  constructor(private readonly slotsService: SlotsService) {}

  @Get()
  async findAvailable() {
    const slots = await this.slotsService.findAvailable();

    return { slots };
  }
}
