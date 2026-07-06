import { db } from "@/lib/db";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const specialization = searchParams.get("specialization");

    if (!specialization) {
      return NextResponse.json(
        { error: "Specialization is required" },
        { status: 400 }
      );
    }

    const doctors = await db.doctorProfile.findMany({
      where: {
        specialization: specialization,
        isVerified: true,
        user: {
          isActive: true,
        },
      },
      include: {
        user: {
          select: {
            name: true,
            image: true,
          },
        },
      },
      orderBy: {
        rating: "desc",
      },
      take: 20,
    });

    const formatted = doctors.map((doctor) => ({
      id: doctor.id,
      name: doctor.user.name,
      specialization: doctor.specialization,
      experience: doctor.experience,
      rating: doctor.rating,
      consultationFee: doctor.consultationFee,
      bio: doctor.bio,
      image: doctor.profileImage || doctor.user.image,
    }));

    return NextResponse.json(formatted);
  } catch (error) {
    console.error("Doctors fetch error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
