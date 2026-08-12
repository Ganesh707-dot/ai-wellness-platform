import { hash } from "bcryptjs";
import { PrismaClient } from "@prisma/client";

const db = new PrismaClient();

async function main() {
  const password = await hash("password123", 12);

  await db.auditLog.deleteMany();
  await db.notification.deleteMany();
  await db.prescription.deleteMany();
  await db.consultation.deleteMany();
  await db.appointment.deleteMany();
  await db.article.deleteMany();
  await db.category.deleteMany();
  await db.testimonial.deleteMany();
  await db.patientProfile.deleteMany();
  await db.doctorProfile.deleteMany();
  await db.consentLog.deleteMany();
  await db.user.deleteMany();

  const patient = await db.user.create({
    data: {
      email: "patient@test.com",
      name: "Asha Patient",
      password,
      role: "PATIENT",
      patientProfile: {
        create: {
          age: 32,
          gender: "FEMALE",
          country: "India",
          phone: "+91 98765 43210",
        },
      },
    },
    include: { patientProfile: true },
  });

  const doctorUser = await db.user.create({
    data: {
      email: "doctor@test.com",
      name: "Dr. Meera Sharma",
      password,
      role: "DOCTOR",
      doctorProfile: {
        create: {
          specialization: "HOMEOPATHY",
          licenseNumber: "MH-DOC-1001",
          licenseExpiry: new Date("2030-12-31"),
          qualifications: ["BHMS", "MD Homeopathy"],
          experience: 12,
          bio: "Integrative homeopathy and women's wellness specialist.",
          consultationFee: 1200,
          currency: "INR",
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
    data: {
      email: "admin@test.com",
      name: "Platform Admin",
      password,
      role: "ADMIN",
    },
  });

  const category = await db.category.create({
    data: {
      name: "Holistic Wellness",
      slug: "holistic-wellness",
      description: "Evidence-informed lifestyle and integrative care.",
    },
  });

  await db.article.create({
    data: {
      doctorId: doctorUser.doctorProfile!.id,
      categoryId: category.id,
      title: "Building daily resilience with integrative care",
      slug: "building-daily-resilience",
      excerpt:
        "Simple clinical habits that support long-term emotional and physical wellness.",
      content:
        "Resilience is built through consistent routines — sleep, nutrition, movement, and reflective care with your clinician.\n\nThis article outlines a practical weekly plan patients can follow between consultations.",
      author: "Dr. Meera Sharma",
      published: true,
      publishedAt: new Date(),
      seoTitle: "Daily resilience with integrative care",
      seoDescription: "Practical wellness habits between doctor visits.",
      seoKeywords: ["wellness", "homeopathy", "resilience"],
    },
  });

  const scheduledAt = new Date();
  scheduledAt.setDate(scheduledAt.getDate() + 3);
  scheduledAt.setHours(10, 0, 0, 0);

  const appointment = await db.appointment.create({
    data: {
      patientId: patient.patientProfile!.id,
      doctorId: doctorUser.doctorProfile!.id,
      userId: patient.id,
      consultationType: "HOMEOPATHY",
      status: "CONFIRMED",
      scheduledAt,
      concern: "Seasonal allergies and sleep disruption",
      notes: "Seeded demo appointment",
      attachments: [],
      videoCallUrl: "https://meet.wellness-platform.com/demo",
      meetingCode: "VCLN-DEMO",
      duration: 30,
    },
  });

  const consultation = await db.consultation.create({
    data: {
      appointmentId: appointment.id,
      patientId: patient.patientProfile!.id,
      doctorId: doctorUser.doctorProfile!.id,
      notes: "Initial assessment completed",
      diagnosis: "Allergic rhinitis with sleep strain",
      recommendations: "Hydration, sleep hygiene, follow-up in 2 weeks",
      symptoms: ["sneezing", "fatigue"],
      startedAt: new Date(),
      endedAt: new Date(),
      duration: 25,
    },
  });

  await db.prescription.create({
    data: {
      consultationId: consultation.id,
      patientId: patient.patientProfile!.id,
      doctorId: doctorUser.doctorProfile!.id,
      medicine: "Allium Cepa",
      potency: "30C",
      dosage: "4 drops",
      frequency: "Twice daily",
      duration: "7 days",
      instructions: "Take away from meals",
      status: "ACTIVE",
      startedAt: new Date(),
      issuedAt: new Date(),
      attachments: [],
    },
  });

  console.log("Seed complete:");
  console.log("- patient@test.com / password123");
  console.log("- doctor@test.com / password123");
  console.log("- admin@test.com / password123");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await db.$disconnect();
  });
