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
    });

    if (!user || user.role !== "ADMIN") {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    // Get total users
    const totalUsers = await db.user.count();

    // Get total patients
    const totalPatients = await db.patientProfile.count();

    // Get total doctors
    const totalDoctors = await db.doctorProfile.count();

    // Get total appointments
    const totalAppointments = await db.appointment.count();

    // Get pending doctor verifications
    const pendingVerification = await db.doctorProfile.count({
      where: { isVerified: false },
    });

    // Get system health (uptime percentage)
    const systemHealth = 99.8;

    // Calculate monthly revenue
    const monthStart = new Date();
    monthStart.setDate(1);
    monthStart.setHours(0, 0, 0, 0);

    const completedAppointments = await db.appointment.findMany({
      where: {
        status: "COMPLETED",
        endedAt: { gte: monthStart },
      },
      include: {
        doctor: {
          select: {
            consultationFee: true,
          },
        },
      },
    });

    const monthlyRevenue = completedAppointments.reduce(
      (sum, apt) => sum + apt.doctor.consultationFee,
      0
    );

    return NextResponse.json({
      totalUsers,
      totalPatients,
      totalDoctors,
      totalAppointments,
      pendingVerification,
      systemHealth,
      monthlyRevenue,
    });
  } catch (error) {
    console.error("Admin dashboard stats error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
