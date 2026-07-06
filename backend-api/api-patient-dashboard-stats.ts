import { auth } from "@/auth";
import { db } from "@/lib/db";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const session = await auth();

    if (!session || !session.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = await db.user.findUnique({
      where: { email: session.user.email },
      include: { patientProfile: true },
    });

    if (!user || !user.patientProfile) {
      return NextResponse.json({ error: "Patient not found" }, { status: 404 });
    }

    // Get upcoming appointments
    const upcomingAppointments = await db.appointment.count({
      where: {
        patientId: user.patientProfile.id,
        status: { in: ["SCHEDULED", "CONFIRMED"] },
        scheduledAt: { gt: new Date() },
      },
    });

    // Get active prescriptions
    const activePrescriptions = await db.prescription.count({
      where: {
        patientId: user.patientProfile.id,
        status: "ACTIVE",
      },
    });

    // Get medical reports
    const medicalReports = await db.medicalReport.count({
      where: {
        patientId: user.patientProfile.id,
      },
    });

    // Get average doctor rating from completed consultations
    const consultations = await db.consultation.findMany({
      where: {
        patientId: user.patientProfile.id,
      },
      select: {
        doctor: {
          select: {
            rating: true,
          },
        },
      },
      take: 10,
    });

    const avgRating =
      consultations.length > 0
        ? consultations.reduce((sum, c) => sum + c.doctor.rating, 0) /
          consultations.length
        : 4.5;

    return NextResponse.json({
      upcomingAppointments,
      activePrescriptions,
      medicalReports,
      doctorRating: avgRating,
    });
  } catch (error) {
    console.error("Dashboard stats error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
