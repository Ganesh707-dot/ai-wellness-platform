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
      include: { patientProfile: true },
    });

    if (!user || !user.patientProfile) {
      return NextResponse.json({ error: "Patient not found" }, { status: 404 });
    }

    // Get appointment stats
    const appointments = await db.appointment.findMany({
      where: { patientId: user.patientProfile.id },
    });

    const appointmentStats = {
      upcoming: appointments.filter(
        (a) =>
          a.status === "SCHEDULED" &&
          new Date(a.scheduledAt) > new Date()
      ).length,
      completed: appointments.filter((a) => a.status === "COMPLETED").length,
      cancelled: appointments.filter((a) => a.status === "CANCELLED").length,
    };

    // Get prescriptions
    const prescriptions = await db.prescription.findMany({
      where: { patientId: user.patientProfile.id },
    });

    const healthData = {
      age: user.patientProfile.age,
      gender: user.patientProfile.gender,
      medicalHistory: user.patientProfile.medicalHistory,
      lastConsultation: appointments
        .filter((a) => a.status === "COMPLETED")
        .sort(
          (a, b) =>
            new Date(b.endedAt || 0).getTime() -
            new Date(a.endedAt || 0).getTime()
        )[0]?.endedAt,
      activePrescriptions: prescriptions.filter(
        (p) => p.status === "ACTIVE"
      ).length,
    };

    return NextResponse.json({
      appointmentStats,
      healthData,
    });
  } catch (error) {
    console.error("Dashboard error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
