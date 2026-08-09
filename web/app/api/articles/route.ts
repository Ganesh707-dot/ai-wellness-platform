import { NextResponse } from "next/server";
import { demoArticles } from "@/lib/demo-data";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const page = Math.max(1, Number(searchParams.get("page") || 1));
  const limit = Math.max(1, Number(searchParams.get("limit") || 9));
  const search = (searchParams.get("search") || "").toLowerCase();
  const categoryId = searchParams.get("categoryId");
  const featured = searchParams.get("featured");

  let filtered = [...demoArticles];

  if (search) {
    filtered = filtered.filter(
      (a) =>
        a.title.toLowerCase().includes(search) ||
        a.excerpt.toLowerCase().includes(search)
    );
  }

  if (categoryId && categoryId !== "all") {
    filtered = filtered.filter(
      (a) => a.category.slug === categoryId || a.id === categoryId
    );
  }

  const total = filtered.length;
  const pages = Math.max(1, Math.ceil(total / limit));
  const start = (page - 1) * limit;
  const articles = filtered.slice(start, start + limit);

  return NextResponse.json({
    articles,
    pagination: {
      page,
      limit,
      total,
      pages,
      totalPages: pages,
    },
    featured: featured === "true" ? demoArticles.slice(0, 3) : undefined,
  });
}
