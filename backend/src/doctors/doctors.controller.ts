import { Controller, Get, Param, Query } from '@nestjs/common';
import { PaginationQueryDto } from '../common/dto/pagination.dto';
import { DoctorsService } from './doctors.service';

@Controller('doctors')
export class DoctorsController {
  constructor(private readonly doctorsService: DoctorsService) {}

  @Get()
  findAll(
    @Query('specialization') specialization?: string,
    @Query() pagination?: PaginationQueryDto,
  ) {
    return this.doctorsService.findAll(
      specialization,
      pagination?.page ?? 1,
      pagination?.limit ?? 20,
    );
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.doctorsService.findOne(id);
  }
}
