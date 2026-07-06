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

    const prescriptions = await db.prescription.findMany({
      where: {
        patientId: user.patientProfile.id,
      },
      include: {
        doctor: {
          select: {
            user: {
              select: { name: true },
            },
          },
        },
      },
      orderBy: { issuedAt: "desc" },
    });

    const formattedPrescriptions = prescriptions.map((rx) => ({
      id: rx.id,
      medicine: rx.medicine,
      potency: rx.potency,
      dosage: rx.dosage,
      frequency: rx.frequency,
      duration: rx.duration,
      status: rx.status,
      startedAt: rx.startedAt,
      doctorName: rx.doctor.user.name,
      instructions: rx.instructions,
    }));

    return NextResponse.json(formattedPrescriptions);
  } catch (error) {
    console.error("Prescriptions fetch error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
