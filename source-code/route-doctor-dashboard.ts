import { auth } from "@/auth";
import { db } from "@/lib/db";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const session = await auth();

    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = await db.user.findUnique({
      where: { email: session.user.email },
      include: { doctorProfile: true },
    });

    if (!user || !user.doctorProfile) {
      return NextResponse.json({ error: "Doctor not found" }, { status: 404 });
    }

    const doctorId = user.doctorProfile.id;

    // Get appointments
    const appointments = await db.appointment.findMany({
      where: { doctorId },
      include: { patient: true },
      orderBy: { scheduledAt: "desc" },
    });

    // Calculate stats
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const todayAppointments = appointments.filter(
      (a) =>
        new Date(a.scheduledAt) >= today &&
        new Date(a.scheduledAt) < tomorrow
    );

    const stats = {
      totalPatients: await db.patientProfile.count({
        where: {
          appointments: {
            some: { doctorId },
          },
        },
      }),
      todayAppointments: todayAppointments.length,
      completedConsultations: appointments.filter(
        (a) => a.status === "COMPLETED"
      ).length,
      averageRating: user.doctorProfile.rating,
    };

    return NextResponse.json({
      stats,
      appointments: appointments.slice(0, 5).map((apt) => ({
        id: apt.id,
        patientName: apt.patient.name,
        consultationType: apt.consultationType,
        status: apt.status,
        scheduledAt: apt.scheduledAt,
      })),
    });
  } catch (error) {
    console.error("Doctor dashboard error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
