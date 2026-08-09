import Link from "next/link";
import { notFound } from "next/navigation";
import { getArticleBySlug } from "@/services/articles";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const article = await getArticleBySlug(slug);
  if (!article) return { title: "Article Not Found" };
  return {
    title: article.title,
    description: article.excerpt,
  };
}

export default async function ArticleDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const article = await getArticleBySlug(slug);
  if (!article) notFound();

  return (
    <div className="mx-auto max-w-3xl px-4 py-12">
      <p className="text-sm font-medium text-teal-800">{article.category.name}</p>
      <h1 className="mt-2 font-serif text-4xl text-stone-900">{article.title}</h1>
      <p className="mt-3 text-sm text-stone-500">
        {article.author} · {new Date(article.publishedAt).toLocaleDateString()}
      </p>
      <Card className="mt-8 space-y-4 border-0 bg-transparent p-0 shadow-none">
        {article.content.split("\n\n").map((para) => (
          <p key={para.slice(0, 24)} className="leading-relaxed text-stone-700">
            {para}
          </p>
        ))}
      </Card>
      <Button asChild className="mt-8" variant="outline">
        <Link href="/articles">Back to articles</Link>
      </Button>
    </div>
  );
}
