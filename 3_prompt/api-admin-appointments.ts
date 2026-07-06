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

    // Get all appointments
    const appointments = await db.appointment.findMany({
      include: {
        patient: {
          include: {
            user: true,
          },
        },
        doctor: {
          include: {
            user: true,
          },
        },
      },
      orderBy: { scheduledAt: "desc" },
      take: 100,
    });

    // Calculate stats
    const totalAppointments = await db.appointment.count();
    const completedCount = appointments.filter(
      (a) => a.status === "COMPLETED"
    ).length;
    const totalRevenue = appointments
      .filter((a) => a.status === "COMPLETED")
      .reduce((sum, a) => sum + a.doctor.consultationFee, 0);

    const avgDuration = appointments
      .filter((a) => a.duration)
      .reduce((sum, a) => sum + (a.duration || 0), 0) / 
      (appointments.filter((a) => a.duration).length || 1);

    // Format appointments
    const formattedAppointments = appointments.map((apt) => ({
      id: apt.id,
      patientName: apt.patient.user.name,
      doctorName: apt.doctor.user.name,
      scheduledAt: apt.scheduledAt,
      status: apt.status,
      consultationType: apt.consultationType,
      revenue: apt.status === "COMPLETED" ? apt.doctor.consultationFee : 0,
    }));

    return NextResponse.json({
      appointments: formattedAppointments,
      stats: {
        total: totalAppointments,
        completed: completedCount,
        revenue: totalRevenue,
        avgDuration: Math.round(avgDuration),
      },
    });
  } catch (error) {
    console.error("Admin appointments fetch error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
