import { Module } from '@nestjs/common';
import { InnovationController } from './innovation.controller';
import { InnovationService } from './innovation.service';

@Module({
  controllers: [InnovationController],
  providers: [InnovationService],
})
export class InnovationModule {}
