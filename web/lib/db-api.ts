/**
 * Direct Prisma CRUD — used when DATABASE_URL is set (Neon).
 * NestJS is preferred when NEST_API_URL is configured; otherwise Prisma serves the API routes.
 */

import { db } from '@/lib/db';
import { paginate, skipTake } from '@/lib/pagination';

export async function dbListUsers(page = 1, limit = 50) {
  const [total, users] = await Promise.all([
    db.user.count(),
    db.user.findMany({
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        isActive: true,
        image: true,
        createdAt: true,
        updatedAt: true,
        patientProfile: { select: { id: true } },
        doctorProfile: { select: { id: true, specialization: true } },
      },
      orderBy: { createdAt: 'desc' },
      ...skipTake(page, limit),
    }),
  ]);

  const mapped = users.map((u) => ({
    id: u.id,
    email: u.email,
    name: u.name,
    role: u.role,
    isActive: u.isActive,
    accessStatus: u.isActive ? 'active' : 'pending',
    doctorId: u.doctorProfile?.id,
    specialization: u.doctorProfile?.specialization,
    createdAt: u.createdAt.toISOString(),
  }));

  return paginate(mapped, total, page, limit);
}

export async function dbCreateUser(data: {
  name: string;
  email: string;
  role: string;
  password: string;
  isActive?: boolean;
  specialization?: string;
}) {
  const { hash } = await import('bcryptjs');
  const password = await hash(data.password, 12);
  const role = data.role === 'CLINICAL_LEAD' ? 'DOCTOR' : data.role;

  return db.user.create({
    data: {
      email: data.email,
      name: data.name,
      password,
      role: role as 'PATIENT' | 'DOCTOR' | 'ADMIN',
      isActive: data.isActive ?? false,
      ...(role === 'PATIENT' ? { patientProfile: { create: { country: 'India' } } } : {}),
      ...(role === 'DOCTOR'
        ? {
            doctorProfile: {
              create: {
                specialization: (data.specialization ?? 'HOMEOPATHY') as never,
                licenseNumber: `VCL-${Date.now()}`,
                licenseExpiry: new Date('2030-12-31'),
                qualifications: ['MBBS'],
                experience: 5,
                consultationFee: 1000,
                currency: 'INR',
                isVerified: data.isActive ?? false,
              },
            },
          }
        : {}),
    },
    include: { patientProfile: true, doctorProfile: true },
  });
}

export async function dbUpdateUser(
  id: string,
  data: { name?: string; role?: string; isActive?: boolean; password?: string },
) {
  const patch: Record<string, unknown> = {};
  if (data.name) patch.name = data.name;
  if (data.role) patch.role = data.role === 'CLINICAL_LEAD' ? 'DOCTOR' : data.role;
  if (data.isActive !== undefined) patch.isActive = data.isActive;
  if (data.password) {
    const { hash } = await import('bcryptjs');
    patch.password = await hash(data.password, 12);
  }
  return db.user.update({ where: { id }, data: patch, include: { doctorProfile: true } });
}

export async function dbDeleteUser(id: string) {
  await db.user.delete({ where: { id } });
  return { deleted: true, id };
}

export async function dbListDoctors(specialization?: string | null, page = 1, limit = 20) {
  const where = {
    isVerified: true,
    ...(specialization ? { specialization: specialization as never } : {}),
  };
  const [total, rows] = await Promise.all([
    db.doctorProfile.count({ where }),
    db.doctorProfile.findMany({
      where,
      include: { user: { select: { name: true, email: true, image: true } } },
      orderBy: [{ rating: 'desc' }],
      ...skipTake(page, limit),
    }),
  ]);

  const doctors = rows.map((d) => ({
    id: d.id,
    name: d.user.name,
    specialization: d.specialization,
    experience: d.experience,
    consultationFee: d.consultationFee,
    currency: d.currency,
    rating: d.rating,
    totalConsultations: d.totalConsultations,
    bio: d.bio ?? '',
    isVerified: d.isVerified,
    qualifications: d.qualifications,
    profileImage: d.profileImage ?? d.user.image ?? undefined,
    source: 'managed' as const,
    linkedUserEmail: d.user.email,
    createdAt: d.createdAt.toISOString(),
  }));

  return { ...paginate(doctors, total, page, limit), doctors };
}

export async function dbListAppointments(filters: {
  userId?: string;
  doctorId?: string;
  page?: number;
  limit?: number;
}) {
  const page = filters.page ?? 1;
  const limit = filters.limit ?? 20;
  const where = {
    ...(filters.userId ? { userId: filters.userId } : {}),
    ...(filters.doctorId ? { doctorId: filters.doctorId } : {}),
  };

  const [total, rows] = await Promise.all([
    db.appointment.count({ where }),
    db.appointment.findMany({
      where,
      include: {
        patient: { include: { user: { select: { name: true, email: true } } } },
        doctor: { include: { user: { select: { name: true, email: true } } } },
      },
      orderBy: { scheduledAt: 'desc' },
      ...skipTake(page, limit),
    }),
  ]);

  const appointments = rows.map((a) => ({
    id: a.id,
    status: a.status,
    scheduledAt: a.scheduledAt.toISOString(),
    concern: a.concern,
    notes: a.notes,
    consultationType: a.consultationType,
    patientName: a.patient.user.name,
    patientEmail: a.patient.user.email,
    doctorName: a.doctor.user.name,
    doctorId: a.doctorId,
    duration: a.duration,
    source: 'database' as const,
  }));

  return { ...paginate(appointments, total, page, limit), appointments };
}

export async function dbUpdateAppointment(
  id: string,
  data: { status?: string; notes?: string; cancellationReason?: string },
) {
  return db.appointment.update({
    where: { id },
    data: {
      ...(data.status ? { status: data.status as never } : {}),
      ...(data.notes !== undefined ? { notes: data.notes } : {}),
      ...(data.cancellationReason ? { cancellationReason: data.cancellationReason } : {}),
      ...(data.status === 'CANCELLED' ? { cancelledAt: new Date() } : {}),
    },
    include: {
      patient: { include: { user: true } },
      doctor: { include: { user: true } },
    },
  });
}

export async function dbAdminStats() {
  const [users, doctors, appointments, patients] = await Promise.all([
    db.user.count(),
    db.doctorProfile.count(),
    db.appointment.count(),
    db.patientProfile.count(),
  ]);
  return {
    totalUsers: users,
    totalDoctors: doctors,
    totalPatients: patients,
    totalAppointments: appointments,
    pendingUsers: await db.user.count({ where: { isActive: false } }),
    liveFromDatabase: true,
  };
}
