import { Controller, Get } from '@nestjs/common';
import { InnovationService } from './innovation.service';

@Controller('innovation')
export class InnovationController {
  constructor(private readonly innovationService: InnovationService) {}

  @Get('live-data')
  getLiveData() {
    return this.innovationService.getLiveBioprintData();
  }
}
