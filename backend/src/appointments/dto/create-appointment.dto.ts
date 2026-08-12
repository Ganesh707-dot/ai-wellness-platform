import { AppointmentStatus, ConsultationType } from '@prisma/client';
import { IsDateString, IsEnum, IsOptional, IsString } from 'class-validator';
import { PaginationQueryDto } from '../../common/dto/pagination.dto';

export class CreateAppointmentDto {
  @IsString()
  patientId!: string;

  @IsString()
  doctorId!: string;

  @IsString()
  userId!: string;

  @IsEnum(ConsultationType)
  consultationType!: ConsultationType;

  @IsDateString()
  scheduledAt!: string;

  @IsString()
  concern!: string;

  @IsOptional()
  @IsString()
  notes?: string;
}

export class ListAppointmentsQueryDto extends PaginationQueryDto {
  @IsOptional()
  @IsString()
  userId?: string;

  @IsOptional()
  @IsString()
  doctorId?: string;

  @IsOptional()
  @IsEnum(AppointmentStatus)
  status?: AppointmentStatus;
}
