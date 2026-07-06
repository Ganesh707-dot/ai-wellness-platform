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

    const appointments = await db.appointment.findMany({
      where: {
        patientId: user.patientProfile.id,
      },
      include: {
        doctor: {
          select: {
            user: {
              select: { name: true },
            },
            specialization: true,
          },
        },
      },
      orderBy: { scheduledAt: "desc" },
    });

    const formattedAppointments = appointments.map((apt) => ({
      id: apt.id,
      doctorName: apt.doctor.user.name,
      consultationType: apt.consultationType,
      scheduledAt: apt.scheduledAt,
      status: apt.status,
      concern: apt.concern,
    }));

    return NextResponse.json(formattedAppointments);
  } catch (error) {
    console.error("Appointments fetch error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
