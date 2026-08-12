import { Injectable, NotFoundException } from '@nestjs/common';
import { AppointmentStatus } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { paginate, skipTake } from '../common/dto/pagination.dto';
import { CreateAppointmentDto } from './dto/create-appointment.dto';

@Injectable()
export class AppointmentsService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(
    filters: { userId?: string; doctorId?: string; status?: AppointmentStatus },
    page = 1,
    limit = 20,
  ) {
    const where = {
      ...(filters.userId ? { userId: filters.userId } : {}),
      ...(filters.doctorId ? { doctorId: filters.doctorId } : {}),
      ...(filters.status ? { status: filters.status } : {}),
    };

    const [total, rows] = await Promise.all([
      this.prisma.appointment.count({ where }),
      this.prisma.appointment.findMany({
        where,
        include: {
          patient: { include: { user: { select: { id: true, name: true, email: true } } } },
          doctor: { include: { user: { select: { id: true, name: true, email: true } } } },
        },
        orderBy: { scheduledAt: 'asc' },
        ...skipTake(page, limit),
      }),
    ]);

    return paginate(rows, total, page, limit);
  }

  async findOne(id: string) {
    const appointment = await this.prisma.appointment.findUnique({
      where: { id },
      include: {
        patient: { include: { user: { select: { id: true, name: true, email: true } } } },
        doctor: { include: { user: { select: { id: true, name: true, email: true } } } },
        consultation: true,
      },
    });

    if (!appointment) {
      throw new NotFoundException(`Appointment ${id} not found`);
    }

    return appointment;
  }

  async create(dto: CreateAppointmentDto) {
    const patient = await this.prisma.patientProfile.findUnique({
      where: { id: dto.patientId },
    });
    if (!patient) {
      throw new NotFoundException(`Patient ${dto.patientId} not found`);
    }

    const doctor = await this.prisma.doctorProfile.findUnique({
      where: { id: dto.doctorId },
    });
    if (!doctor) {
      throw new NotFoundException(`Doctor ${dto.doctorId} not found`);
    }

    return this.prisma.appointment.create({
      data: {
        patientId: dto.patientId,
        doctorId: dto.doctorId,
        userId: dto.userId,
        consultationType: dto.consultationType,
        scheduledAt: new Date(dto.scheduledAt),
        concern: dto.concern,
        notes: dto.notes,
        status: AppointmentStatus.SCHEDULED,
      },
      include: {
        patient: { include: { user: { select: { id: true, name: true, email: true } } } },
        doctor: { include: { user: { select: { id: true, name: true, email: true } } } },
      },
    });
  }

  async update(id: string, dto: import('./dto/update-appointment.dto').UpdateAppointmentDto) {
    await this.findOne(id);
    return this.prisma.appointment.update({
      where: { id },
      data: {
        ...(dto.status ? { status: dto.status } : {}),
        ...(dto.scheduledAt ? { scheduledAt: new Date(dto.scheduledAt) } : {}),
        ...(dto.concern !== undefined ? { concern: dto.concern } : {}),
        ...(dto.notes !== undefined ? { notes: dto.notes } : {}),
        ...(dto.consultationType ? { consultationType: dto.consultationType } : {}),
        ...(dto.cancellationReason ? { cancellationReason: dto.cancellationReason } : {}),
        ...(dto.status === AppointmentStatus.CANCELLED ? { cancelledAt: new Date() } : {}),
      },
      include: {
        patient: { include: { user: { select: { id: true, name: true, email: true } } } },
        doctor: { include: { user: { select: { id: true, name: true, email: true } } } },
      },
    });
  }

  async remove(id: string) {
    await this.findOne(id);
    await this.prisma.appointment.delete({ where: { id } });
    return { deleted: true, id };
  }
}
