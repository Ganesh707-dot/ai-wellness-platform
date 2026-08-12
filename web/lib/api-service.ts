import { backend, getNestApiUrl, useDatabaseMode } from '@/lib/backend-client';
import {
  dbAdminStats,
  dbCreateUser,
  dbDeleteUser,
  dbListAppointments,
  dbListDoctors,
  dbListUsers,
  dbUpdateAppointment,
  dbUpdateUser,
} from '@/lib/db-api';

/** Users CRUD — Nest if configured, else Prisma on Neon */
export async function apiListUsers(page = 1, limit = 50) {
  if (getNestApiUrl()) return backend.users.list(page, limit);
  return dbListUsers(page, limit);
}

export async function apiCreateUser(body: Record<string, unknown>) {
  if (getNestApiUrl()) return backend.users.create(body);
  const user = await dbCreateUser(body as Parameters<typeof dbCreateUser>[0]);
  const { password: _p, ...safe } = user;
  return safe;
}

export async function apiUpdateUser(id: string, body: Record<string, unknown>) {
  if (getNestApiUrl()) return backend.users.update(id, body);
  const user = await dbUpdateUser(id, body as Parameters<typeof dbUpdateUser>[1]);
  const { password: _p, ...safe } = user;
  return safe;
}

export async function apiDeleteUser(id: string) {
  if (getNestApiUrl()) return backend.users.delete(id);
  return dbDeleteUser(id);
}

export async function apiListDoctors(specialization?: string | null, page = 1, limit = 20) {
  if (getNestApiUrl()) {
    const res = await backend.doctors.list(specialization ?? undefined, page, limit);
    const doctors = (res.data as Array<Record<string, unknown>>).map(mapNestDoctor);
    return { doctors, pagination: res.meta };
  }
  const res = await dbListDoctors(specialization, page, limit);
  return { doctors: res.doctors, pagination: res.meta };
}

export async function apiListAppointments(filters: {
  userId?: string;
  doctorId?: string;
  page?: number;
  limit?: number;
}) {
  if (getNestApiUrl()) {
    const res = await backend.appointments.list(filters);
    return { appointments: res.data, pagination: res.meta };
  }
  const res = await dbListAppointments(filters);
  return { appointments: res.appointments, pagination: res.meta };
}

export async function apiUpdateAppointment(id: string, body: Record<string, unknown>) {
  if (getNestApiUrl()) return backend.appointments.update(id, body);
  return dbUpdateAppointment(id, body as Parameters<typeof dbUpdateAppointment>[1]);
}

export async function apiAdminStats() {
  if (getNestApiUrl()) {
    const stats = await backend.analytics.stats();
    return {
      totalUsers: stats.breakdown.users,
      totalDoctors: stats.breakdown.doctors,
      totalPatients: stats.breakdown.patients,
      totalAppointments: stats.breakdown.appointments,
      pendingUsers: 0,
      liveFromDatabase: true,
    };
  }
  return dbAdminStats();
}

export { useDatabaseMode };

function mapNestDoctor(d: Record<string, unknown>) {
  const user = d.user as { name?: string; email?: string; image?: string } | undefined;
  return {
    id: d.id as string,
    name: user?.name ?? 'Clinician',
    specialization: d.specialization as string,
    experience: d.experience as number,
    consultationFee: d.consultationFee as number,
    currency: (d.currency as string) ?? 'INR',
    rating: d.rating as number,
    totalConsultations: d.totalConsultations as number,
    bio: (d.bio as string) ?? '',
    isVerified: d.isVerified as boolean,
    qualifications: (d.qualifications as string[]) ?? [],
    profileImage: (d.profileImage as string) ?? user?.image,
    source: 'managed' as const,
    linkedUserEmail: user?.email,
    createdAt: new Date().toISOString(),
  };
}
