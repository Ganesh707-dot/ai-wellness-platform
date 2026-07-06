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

    const appointments = await db.appointment.findMany({
      where: {
        doctorId: user.doctorProfile.id,
      },
      include: {
        patient: {
          select: {
            user: {
              select: {
                name: true,
                email: true,
              },
            },
          },
        },
      },
      orderBy: { scheduledAt: "desc" },
    });

    const formattedAppointments = appointments.map((apt) => ({
      id: apt.id,
      patientName: apt.patient.user.name,
      patientEmail: apt.patient.user.email,
      consultationType: apt.consultationType,
      scheduledAt: apt.scheduledAt,
      status: apt.status,
      concern: apt.concern,
      notes: apt.notes,
    }));

    return NextResponse.json(formattedAppointments);
  } catch (error) {
    console.error("Doctor appointments fetch error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
