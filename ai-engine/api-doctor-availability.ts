import { db } from "@/lib/db";
import { NextResponse } from "next/server";
import { generateTimeSlots } from "@/lib/appointment-utils";

export async function GET(
  request: Request,
  { params }: { params: { doctorId: string } }
) {
  try {
    const { searchParams } = new URL(request.url);
    const date = searchParams.get("date");

    if (!date) {
      return NextResponse.json(
        { error: "Date is required" },
        { status: 400 }
      );
    }

    // Validate date format
    const selectedDate = new Date(date + "T00:00:00");
    if (isNaN(selectedDate.getTime())) {
      return NextResponse.json(
        { error: "Invalid date format" },
        { status: 400 }
      );
    }

    // Check if doctor exists
    const doctor = await db.doctorProfile.findUnique({
      where: { id: params.doctorId },
    });

    if (!doctor) {
      return NextResponse.json(
        { error: "Doctor not found" },
        { status: 404 }
      );
    }

    // Get all appointments for this doctor on this date
    const startOfDay = new Date(date + "T00:00:00");
    const endOfDay = new Date(date + "T23:59:59");

    const existingAppointments = await db.appointment.findMany({
      where: {
        doctorId: params.doctorId,
        scheduledAt: {
          gte: startOfDay,
          lte: endOfDay,
        },
        status: { in: ["SCHEDULED", "CONFIRMED", "IN_PROGRESS"] },
      },
      select: {
        scheduledAt: true,
      },
    });

    // Generate all available time slots
    const allSlots = generateTimeSlots(9, 18, 30);

    // Convert existing appointment times to slot format
    const bookedTimes = new Set(
      existingAppointments.map((apt) => {
        const hours = apt.scheduledAt.getHours();
        const minutes = apt.scheduledAt.getMinutes();
        return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}`;
      })
    );

    // Mark slots as available or unavailable
    const slots = allSlots.map((time) => ({
      time,
      available: !bookedTimes.has(time),
    }));

    return NextResponse.json({
      date,
      doctorId: params.doctorId,
      slots,
      availableCount: slots.filter((s) => s.available).length,
      totalSlots: slots.length,
    });
  } catch (error) {
    console.error("Availability check error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
