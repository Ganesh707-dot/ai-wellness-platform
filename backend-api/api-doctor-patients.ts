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

    // Get unique patients for this doctor
    const patientAppointments = await db.appointment.findMany({
      where: {
        doctorId: user.doctorProfile.id,
      },
      include: {
        patient: {
          include: {
            user: true,
          },
        },
      },
      orderBy: { scheduledAt: "desc" },
      distinct: ["patientId"],
    });

    // Format and add additional stats
    const patients = await Promise.all(
      patientAppointments.map(async (apt) => {
        const totalVisits = await db.appointment.count({
          where: {
            patientId: apt.patient.id,
            doctorId: user.doctorProfile.id,
          },
        });

        const lastAppointment = await db.appointment.findFirst({
          where: {
            patientId: apt.patient.id,
            doctorId: user.doctorProfile.id,
          },
          orderBy: { scheduledAt: "desc" },
        });

        return {
          id: apt.patient.id,
          name: apt.patient.user.name,
          email: apt.patient.user.email,
          phone: apt.patient.phone,
          age: apt.patient.age,
          lastVisit: lastAppointment?.scheduledAt || apt.patient.createdAt,
          totalVisits,
          status: "active",
        };
      })
    );

    return NextResponse.json(patients);
  } catch (error) {
    console.error("Doctor patients fetch error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
