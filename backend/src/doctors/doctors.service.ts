import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { paginate, skipTake } from '../common/dto/pagination.dto';

@Injectable()
export class DoctorsService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(specialization?: string, page = 1, limit = 20) {
    const where = {
      isVerified: true,
      ...(specialization ? { specialization: specialization as never } : {}),
    };

    const [total, rows] = await Promise.all([
      this.prisma.doctorProfile.count({ where }),
      this.prisma.doctorProfile.findMany({
        where,
        include: {
          user: {
            select: { id: true, name: true, email: true, image: true },
          },
        },
        orderBy: [{ rating: 'desc' }, { totalConsultations: 'desc' }],
        ...skipTake(page, limit),
      }),
    ]);

    return paginate(rows, total, page, limit);
  }

  async findOne(id: string) {
    const doctor = await this.prisma.doctorProfile.findUnique({
      where: { id },
      include: {
        user: {
          select: { id: true, name: true, email: true, image: true },
        },
        testimonials: {
          where: { published: true },
          orderBy: { createdAt: 'desc' },
          take: 10,
        },
      },
    });

    if (!doctor) {
      throw new NotFoundException(`Doctor ${id} not found`);
    }

    return doctor;
  }
}
