import { demoArticles } from "@/lib/demo-data";

export async function getArticles(opts?: { limit?: number }) {
  return demoArticles.slice(0, opts?.limit || 20);
}

export async function getArticleBySlug(slug: string) {
  return demoArticles.find((a) => a.slug === slug) || null;
}

export async function getFeaturedArticles(limit = 3) {
  return demoArticles.slice(0, limit);
}

export async function getCategories() {
  return [
    { id: "cat_1", name: "Holistic Wellness", slug: "holistic-wellness" },
    { id: "cat_2", name: "Pediatrics", slug: "pediatrics" },
    { id: "cat_3", name: "Fertility", slug: "fertility" },
  ];
}

export async function searchArticles(query: string, limit = 10) {
  const q = query.toLowerCase();
  return demoArticles
    .filter(
      (a) =>
        a.title.toLowerCase().includes(q) ||
        a.excerpt.toLowerCase().includes(q) ||
        a.seoKeywords.some((k) => k.includes(q))
    )
    .slice(0, limit);
}

export async function createArticle() {
  throw new Error("Demo mode: article creation disabled");
}
