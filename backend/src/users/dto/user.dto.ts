import { ConsultationType, UserRole } from '@prisma/client';
import {
  IsBoolean,
  IsEmail,
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  MinLength,
} from 'class-validator';

export class CreateUserDto {
  @IsString()
  @MinLength(2)
  name!: string;

  @IsEmail()
  email!: string;

  @IsEnum([...Object.values(UserRole), 'CLINICAL_LEAD'])
  role!: UserRole | 'CLINICAL_LEAD';

  @IsOptional()
  @IsString()
  @MinLength(6)
  password?: string;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @IsOptional()
  @IsString()
  country?: string;

  @IsOptional()
  @IsEnum(ConsultationType)
  specialization?: ConsultationType;

  @IsOptional()
  @IsString()
  licenseNumber?: string;

  @IsOptional()
  @IsInt()
  experience?: number;

  @IsOptional()
  @IsInt()
  consultationFee?: number;
}

export class UpdateUserDto {
  @IsOptional()
  @IsString()
  @MinLength(2)
  name?: string;

  @IsOptional()
  @IsEnum([...Object.values(UserRole), 'CLINICAL_LEAD'])
  role?: UserRole | 'CLINICAL_LEAD';

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @IsOptional()
  @IsString()
  @MinLength(6)
  password?: string;
}
