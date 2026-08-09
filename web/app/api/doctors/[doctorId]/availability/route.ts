import { NextResponse } from "next/server";
import { generateTimeSlots } from "@/lib/appointment-utils";

export async function GET(
  request: Request,
  context: { params: Promise<{ doctorId: string }> }
) {
  const { doctorId } = await context.params;
  const { searchParams } = new URL(request.url);
  const date = searchParams.get("date");

  const slots = generateTimeSlots(9, 18, 30).map((time, idx) => ({
    time,
    available: idx % 3 !== 0,
  }));

  if (date) {
    return NextResponse.json({ doctorId, date, slots });
  }

  const days = Array.from({ length: 14 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() + i + 1);
    return d.toISOString().slice(0, 10);
  });

  return NextResponse.json({
    doctorId,
    availability: days.map((d) => ({
      date: d,
      slots: generateTimeSlots(9, 17, 30).slice(0, 8),
    })),
  });
}
