import { db } from "@/lib/db";

export interface GetArticlesFilter {
  categoryId?: string;
  doctorId?: string;
  published?: boolean;
  page?: number;
  limit?: number;
}

export async function createArticle(data: {
  title: string;
  slug: string;
  excerpt: string;
  content: string;
  doctorId: string;
  categoryId: string;
  coverImage?: string;
  seoTitle?: string;
  seoDescription?: string;
  seoKeywords?: string[];
}) {
  return await db.article.create({
    data: {
      ...data,
      author: "Doctor",
      seoTitle: data.seoTitle || data.title,
      seoDescription: data.seoDescription || data.excerpt,
      seoKeywords: data.seoKeywords || [],
    },
    include: { doctor: { include: { user: true } }, category: true },
  });
}

export async function updateArticle(id: string, data: Partial<any>) {
  return await db.article.update({
    where: { id },
    data,
    include: { doctor: { include: { user: true } }, category: true },
  });
}

export async function getArticleBySlug(slug: string) {
  const article = await db.article.findUnique({
    where: { slug },
    include: {
      doctor: { include: { user: true } },
      category: true,
    },
  });

  if (article) {
    await db.article.update({
      where: { id: article.id },
      data: { viewCount: { increment: 1 } },
    });
  }

  return article;
}

export async function getPublishedArticles(
  categoryId?: string,
  page: number = 1,
  limit: number = 12
) {
  const skip = (page - 1) * limit;

  const [articles, total] = await Promise.all([
    db.article.findMany({
      where: {
        published: true,
        ...(categoryId && { categoryId }),
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
      },
    }),
  ]);

  return {
    articles,
    pagination: {
      page,
      limit,
      total,
      pages: Math.ceil(total / limit),
    },
  };
}

export async function getArticlesByDoctor(doctorId: string, limit: number = 5) {
  return await db.article.findMany({
    where: {
      doctorId,
      published: true,
    },
    include: {
      doctor: { include: { user: true } },
      category: true,
    },
    orderBy: { publishedAt: "desc" },
    take: limit,
  });
}

export async function searchArticles(query: string, limit: number = 10) {
  return await db.article.findMany({
    where: {
      published: true,
      OR: [
        { title: { contains: query, mode: "insensitive" } },
        { excerpt: { contains: query, mode: "insensitive" } },
        { seoKeywords: { hasSome: [query] } },
      ],
    },
    include: {
      doctor: { include: { user: true } },
      category: true,
    },
    orderBy: { publishedAt: "desc" },
    take: limit,
  });
}

export async function getFeaturedArticles(limit: number = 3) {
  return await db.article.findMany({
    where: { published: true },
    include: {
      doctor: { include: { user: true } },
      category: true,
    },
    orderBy: [{ viewCount: "desc" }, { publishedAt: "desc" }],
    take: limit,
  });
}

export async function getCategories() {
  return await db.category.findMany({
    include: {
      articles: {
        where: { published: true },
        select: { id: true },
      },
    },
  });
}

export async function deleteArticle(id: string) {
  return await db.article.delete({ where: { id } });
}

export async function likeArticle(id: string) {
  return await db.article.update({
    where: { id },
    data: { likes: { increment: 1 } },
  });
}
