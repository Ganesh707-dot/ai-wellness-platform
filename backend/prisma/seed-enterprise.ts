/**
 * Enterprise-scale seed — ~10,000+ clinical records for Neon PostgreSQL.
 * Run: npm run db:seed:enterprise
 *
 * Breakdown (approx):
 * - 50 doctors · 2,000 patients · 10,000 appointments
 * - 500 audit logs · 500 notifications
 */
import { hash } from 'bcryptjs';
import {
  AppointmentStatus,
  ConsultationType,
  Gender,
  PrismaClient,
  UserRole,
} from '@prisma/client';

const db = new PrismaClient();

const SPECIALTIES: ConsultationType[] = [
  'HOMEOPATHY',
  'PEDIATRICS',
  'FERTILITY',
  'WOMENS_WELLNESS',
  'EMOTIONAL_WELLNESS',
  'FAMILY_WELLNESS',
  'PREVENTIVE_CARE',
];

const STATUSES: AppointmentStatus[] = [
  'SCHEDULED',
  'CONFIRMED',
  'COMPLETED',
  'CANCELLED',
  'IN_PROGRESS',
];

const FIRST = ['Asha', 'Priya', 'Rahul', 'Ananya', 'Vikram', 'Meera', 'Arjun', 'Kavya', 'Rohan', 'Sneha'];
const LAST = ['Sharma', 'Patel', 'Reddy', 'Iyer', 'Gupta', 'Nair', 'Menon', 'Das', 'Khan', 'Singh'];

function pick<T>(arr: T[], i: number) {
  return arr[i % arr.length];
}

function chunk<T>(arr: T[], size: number): T[][] {
  const out: T[][] = [];
  for (let i = 0; i < arr.length; i += size) out.push(arr.slice(i, i + size));
  return out;
}

async function wipe() {
  console.log('Clearing existing data…');
  await db.auditLog.deleteMany();
  await db.notification.deleteMany();
  await db.prescription.deleteMany();
  await db.medicalReport.deleteMany();
  await db.consultation.deleteMany();
  await db.appointment.deleteMany();
  await db.article.deleteMany();
  await db.category.deleteMany();
  await db.testimonial.deleteMany();
  await db.patientProfile.deleteMany();
  await db.doctorProfile.deleteMany();
  await db.consentLog.deleteMany();
  await db.user.deleteMany();
}

async function main() {
  const password = await hash('password123', 12);
  await wipe();

  console.log('Creating demo accounts…');
  const demoPatient = await db.user.create({
    data: {
      email: 'patient@test.com',
      name: 'Asha Patient',
      password,
      role: UserRole.PATIENT,
      patientProfile: {
        create: { age: 32, gender: Gender.FEMALE, country: 'India', phone: '+91 98765 43210' },
      },
    },
    include: { patientProfile: true },
  });

  const demoDoctorUser = await db.user.create({
    data: {
      email: 'doctor@test.com',
      name: 'Dr. Meera Sharma',
      password,
      role: UserRole.DOCTOR,
      doctorProfile: {
        create: {
          specialization: ConsultationType.HOMEOPATHY,
          licenseNumber: 'MH-DOC-1001',
          licenseExpiry: new Date('2030-12-31'),
          qualifications: ['BHMS', 'MD Homeopathy'],
          experience: 12,
          bio: 'Integrative homeopathy and womens wellness specialist.',
          consultationFee: 1200,
          currency: 'INR',
          rating: 4.8,
          totalConsultations: 420,
          isVerified: true,
          verificationDate: new Date(),
        },
      },
    },
    include: { doctorProfile: true },
  });

  await db.user.create({
    data: { email: 'admin@test.com', name: 'Platform Admin', password, role: UserRole.ADMIN },
  });

  console.log('Generating 50 doctors…');
  const doctorProfiles: { id: string; userId: string }[] = [
    { id: demoDoctorUser.doctorProfile!.id, userId: demoDoctorUser.id },
  ];

  for (let i = 2; i <= 50; i++) {
    const spec = pick(SPECIALTIES, i);
    const user = await db.user.create({
      data: {
        email: `doctor${i}@veridian-clinical.demo`,
        name: `Dr. ${pick(FIRST, i)} ${pick(LAST, i + 3)}`,
        password,
        role: UserRole.DOCTOR,
        doctorProfile: {
          create: {
            specialization: spec,
            licenseNumber: `VCL-DOC-${1000 + i}`,
            licenseExpiry: new Date('2030-12-31'),
            qualifications: ['MBBS', 'MD'],
            experience: 3 + (i % 20),
            bio: `${spec.replaceAll('_', ' ')} specialist at Veridian Clinical network.`,
            consultationFee: 800 + (i % 10) * 100,
            currency: 'INR',
            rating: 3.8 + (i % 12) * 0.1,
            totalConsultations: 50 + i * 17,
            isVerified: true,
            verificationDate: new Date(),
          },
        },
      },
      include: { doctorProfile: true },
    });
    doctorProfiles.push({ id: user.doctorProfile!.id, userId: user.id });
  }

  console.log('Generating 2,000 patients (batch)…');
  const patientRows: { id: string; userId: string }[] = [
    { id: demoPatient.patientProfile!.id, userId: demoPatient.id },
  ];

  const patientBatchSize = 200;
  for (let batch = 0; batch < 10; batch++) {
    await Promise.all(
      Array.from({ length: patientBatchSize }).map(async (_, j) => {
        const i = batch * patientBatchSize + j + 2;
        const user = await db.user.create({
          data: {
            email: `patient${i}@veridian-clinical.demo`,
            name: `${pick(FIRST, i)} ${pick(LAST, i)}`,
            password,
            role: UserRole.PATIENT,
            patientProfile: {
              create: {
                age: 18 + (i % 62),
                gender: pick([Gender.MALE, Gender.FEMALE, Gender.OTHER], i),
                country: pick(['India', 'UAE', 'Singapore', 'UK', 'USA'], i),
                phone: `+91 9${String(i).padStart(9, '0').slice(-9)}`,
              },
            },
          },
          include: { patientProfile: true },
        });
        patientRows.push({ id: user.patientProfile!.id, userId: user.id });
      }),
    );
    console.log(`  patients ${patientRows.length} / 2001`);
  }

  console.log('Generating 10,000 appointments (createMany batches)…');
  const APPOINTMENT_TARGET = 10_000;
  const appointmentPayloads: Parameters<typeof db.appointment.createMany>[0]['data'] = [];

  for (let i = 0; i < APPOINTMENT_TARGET; i++) {
    const patient = pick(patientRows, i);
    const doctor = pick(doctorProfiles, i);
    const scheduledAt = new Date();
    scheduledAt.setDate(scheduledAt.getDate() - 180 + (i % 360));
    scheduledAt.setHours(8 + (i % 10), (i * 7) % 60, 0, 0);

    appointmentPayloads.push({
      patientId: patient.id,
      doctorId: doctor.id,
      userId: patient.userId,
      consultationType: pick(SPECIALTIES, i),
      status: pick(STATUSES, i),
      scheduledAt,
      concern: pick(
        [
          'Seasonal allergies',
          'Sleep disruption',
          'Anxiety and fatigue',
          'Fertility planning',
          'Pediatric wellness check',
          'Chronic pain management',
          'Preventive screening',
        ],
        i,
      ),
      notes: i % 5 === 0 ? 'Enterprise seed record' : undefined,
      attachments: [],
      duration: 20 + (i % 3) * 10,
    });
  }

  for (const [idx, batch] of chunk(appointmentPayloads, 500).entries()) {
    await db.appointment.createMany({ data: batch });
    console.log(`  appointments batch ${idx + 1} — ${Math.min((idx + 1) * 500, APPOINTMENT_TARGET)}`);
  }

  console.log('Generating audit logs + notifications…');
  const sampleAppointments = await db.appointment.findMany({ take: 500, select: { id: true, userId: true } });

  await db.auditLog.createMany({
    data: sampleAppointments.map((a, i) => ({
      userId: a.userId,
      appointmentId: a.id,
      action: pick(['VIEW', 'CREATE', 'UPDATE', 'BOOK'], i),
      entity: 'Appointment',
      entityId: a.id,
      changes: JSON.stringify({ source: 'enterprise-seed' }),
    })),
  });

  await db.notification.createMany({
    data: sampleAppointments.slice(0, 500).map((a, i) => ({
      userId: a.userId,
      appointmentId: a.id,
      type: pick(['APPOINTMENT_REMINDER', 'APPOINTMENT_CONFIRMATION', 'MESSAGE'], i) as never,
      title: 'Appointment update',
      message: 'Your Veridian Clinical appointment has been updated.',
    })),
  });

  const counts = {
    users: await db.user.count(),
    appointments: await db.appointment.count(),
    auditLogs: await db.auditLog.count(),
    notifications: await db.notification.count(),
  };

  console.log('\nEnterprise seed complete:');
  console.log(JSON.stringify(counts, null, 2));
  console.log('Demo logins: patient@test.com · doctor@test.com · admin@test.com — password123');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await db.$disconnect();
  });
