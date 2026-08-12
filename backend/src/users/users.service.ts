import { hash } from 'bcryptjs';
import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { UserRole } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { paginate, skipTake } from '../common/dto/pagination.dto';
import { CreateUserDto, UpdateUserDto } from './dto/user.dto';

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(page = 1, limit = 50, role?: UserRole) {
    const where = role ? { role } : {};
    const [total, users] = await Promise.all([
      this.prisma.user.count({ where }),
      this.prisma.user.findMany({
        where,
        select: {
          id: true,
          email: true,
          name: true,
          role: true,
          isActive: true,
          image: true,
          createdAt: true,
          updatedAt: true,
          lastLogin: true,
          patientProfile: { select: { id: true } },
          doctorProfile: { select: { id: true, specialization: true } },
        },
        orderBy: { createdAt: 'desc' },
        ...skipTake(page, limit),
      }),
    ]);

    const mapped = users.map((u) => this.toSafeUser(u));
    return paginate(mapped, total, page, limit);
  }

  async findOne(id: string) {
    const user = await this.prisma.user.findUnique({
      where: { id },
      include: {
        patientProfile: true,
        doctorProfile: true,
      },
    });
    if (!user) throw new NotFoundException(`User ${id} not found`);
    const { password: _p, ...safe } = user;
    return this.toSafeUser(safe);
  }

  async create(dto: CreateUserDto) {
    const existing = await this.prisma.user.findUnique({ where: { email: dto.email } });
    if (existing) throw new ConflictException('Email already registered');

    const password = await hash(dto.password ?? 'password123', 12);
    const role = this.mapRole(dto.role);

    const user = await this.prisma.user.create({
      data: {
        email: dto.email,
        name: dto.name,
        password,
        role,
        isActive: dto.isActive ?? false,
        ...(role === UserRole.PATIENT
          ? {
              patientProfile: {
                create: { country: dto.country ?? 'India' },
              },
            }
          : {}),
        ...(role === UserRole.DOCTOR
          ? {
              doctorProfile: {
                create: {
                  specialization: dto.specialization ?? 'HOMEOPATHY',
                  licenseNumber: dto.licenseNumber ?? `VCL-${Date.now()}`,
                  licenseExpiry: new Date('2030-12-31'),
                  qualifications: ['MBBS'],
                  experience: dto.experience ?? 5,
                  consultationFee: dto.consultationFee ?? 1000,
                  currency: 'INR',
                  isVerified: dto.isActive ?? false,
                },
              },
            }
          : {}),
      },
      include: { patientProfile: true, doctorProfile: true },
    });

    const { password: _p, ...safe } = user;
    return this.toSafeUser(safe);
  }

  async update(id: string, dto: UpdateUserDto) {
    await this.findOne(id);

    const data: Record<string, unknown> = {};
    if (dto.name !== undefined) data.name = dto.name;
    if (dto.role !== undefined) data.role = this.mapRole(dto.role);
    if (dto.isActive !== undefined) data.isActive = dto.isActive;
    if (dto.password) data.password = await hash(dto.password, 12);

    const user = await this.prisma.user.update({
      where: { id },
      data,
      include: { patientProfile: true, doctorProfile: true },
    });

    const { password: _p, ...safe } = user;
    return this.toSafeUser(safe);
  }

  async remove(id: string) {
    await this.findOne(id);
    await this.prisma.user.delete({ where: { id } });
    return { deleted: true, id };
  }

  private mapRole(role: string): UserRole {
    if (role === 'CLINICAL_LEAD') return UserRole.DOCTOR;
    return role as UserRole;
  }

  private toSafeUser(user: {
    id: string;
    email: string;
    name: string;
    role: UserRole | string;
    isActive: boolean;
    image?: string | null;
    createdAt?: Date;
    updatedAt?: Date;
    lastLogin?: Date | null;
    patientProfile?: { id: string } | null;
    doctorProfile?: { id: string; specialization?: string } | null;
  }) {
    return {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      isActive: user.isActive,
      accessStatus: user.isActive ? 'active' : 'pending',
      image: user.image,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
      lastLogin: user.lastLogin,
      patientProfileId: user.patientProfile?.id,
      doctorProfileId: user.doctorProfile?.id,
      doctorId: user.doctorProfile?.id,
      specialization: user.doctorProfile?.specialization,
    };
  }
}
