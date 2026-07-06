import { auth } from "@/auth";
import { db } from "@/lib/db";
import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/rbac";

export async function GET() {
  try {
    await requireAdmin();

    // Get stats
    const totalUsers = await db.user.count();
    const totalDoctors = await db.user.count({ where: { role: "DOCTOR" } });
    const totalPatients = await db.user.count({ where: { role: "PATIENT" } });
    const totalAppointments = await db.appointment.count();

    // Get recent users
    const recentUsers = await db.user.findMany({
      take: 5,
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
      },
    });

    // Calculate revenue (mock data - replace with real calculation)
    const platformRevenue = totalAppointments * 30; // Average $30 per appointment

    // Get average rating
    const doctors = await db.doctorProfile.findMany({
      select: { rating: true },
    });

    const avgRating =
      doctors.length > 0
        ? doctors.reduce((sum, doc) => sum + doc.rating, 0) / doctors.length
        : 0;

    return NextResponse.json({
      stats: {
        totalUsers,
        totalDoctors,
        totalPatients,
        totalAppointments,
        platformRevenue,
        avgRating,
      },
      recentUsers,
    });
  } catch (error) {
    console.error("Admin dashboard error:", error);
    return NextResponse.json(
      { error: "Unauthorized or internal error" },
      { status: 401 }
    );
  }
}
