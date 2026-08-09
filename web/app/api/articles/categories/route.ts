import { NextResponse } from "next/server";

export async function GET() {
  const categories = [
    { id: "holistic-wellness", name: "Holistic Wellness", slug: "holistic-wellness" },
    { id: "pediatrics", name: "Pediatrics", slug: "pediatrics" },
    { id: "fertility", name: "Fertility", slug: "fertility" },
    { id: "homeopathy", name: "Homeopathy", slug: "homeopathy" },
    { id: "womens-wellness", name: "Women's Wellness", slug: "womens-wellness" },
    { id: "preventive-care", name: "Preventive Care", slug: "preventive-care" },
  ];
  // Support both shapes used across the app
  return NextResponse.json(categories);
}
