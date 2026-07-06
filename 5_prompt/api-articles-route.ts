import { db } from "@/lib/db";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const categoryId = searchParams.get("categoryId");
    const search = searchParams.get("search");
    const page = parseInt(searchParams.get("page") || "1");
    const limit = 12;
    const skip = (page - 1) * limit;

    const [articles, total] = await Promise.all([
      db.article.findMany({
        where: {
          published: true,
          ...(categoryId && { categoryId }),
          ...(search && {
            OR: [
              { title: { contains: search, mode: "insensitive" } },
              { excerpt: { contains: search, mode: "insensitive" } },
            ],
          }),
        },
        include: {
          doctor: { include: { user: true } },
          category: true,
        },
        orderBy: { publishedAt: "desc" },
        skip,
        take: limit,
      }),
      db.article.count({
        where: {
          published: true,
          ...(categoryId && { categoryId }),
          ...(search && {
            OR: [
              { title: { contains: search, mode: "insensitive" } },
              { excerpt: { contains: search, mode: "insensitive" } },
            ],
          }),
        },
      }),
    ]);

    return NextResponse.json({
      articles,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("Error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
