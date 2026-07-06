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
      include: { doctorProfile: true },
    });

    if (!user || !user.doctorProfile) {
      return NextResponse.json({ error: "Doctor not found" }, { status: 404 });
    }

    // Get total unique patients
    const totalPatients = await db.appointment.findMany({
      where: {
        doctorId: user.doctorProfile.id,
      },
      distinct: ["patientId"],
      select: { patientId: true },
    });

    // Get today's consultations
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const todayConsultations = await db.appointment.count({
      where: {
        doctorId: user.doctorProfile.id,
        scheduledAt: {
          gte: today,
          lt: tomorrow,
        },
      },
    });

    // Get pending appointments
    const pendingAppointments = await db.appointment.count({
      where: {
        doctorId: user.doctorProfile.id,
        status: { in: ["SCHEDULED", "CONFIRMED"] },
        scheduledAt: { gt: new Date() },
      },
    });

    // Get total consultations
    const totalConsultations = await db.consultation.count({
      where: {
        doctorId: user.doctorProfile.id,
      },
    });

    // Calculate monthly earnings
    const monthStart = new Date();
    monthStart.setDate(1);
    monthStart.setHours(0, 0, 0, 0);

    const completedThisMonth = await db.appointment.count({
      where: {
        doctorId: user.doctorProfile.id,
        status: "COMPLETED",
        endedAt: { gte: monthStart },
      },
    });

    const monthlyEarnings = completedThisMonth * user.doctorProfile.consultationFee;

    return NextResponse.json({
      totalPatients: totalPatients.length,
      todayConsultations,
      pendingAppointments,
      averageRating: user.doctorProfile.rating,
      totalConsultations,
      monthlyEarnings,
    });
  } catch (error) {
    console.error("Doctor dashboard stats error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
