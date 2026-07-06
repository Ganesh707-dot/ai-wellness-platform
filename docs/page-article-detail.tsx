import { Metadata, ResolvingMetadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getArticleBySlug } from "@/services/articles";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

interface ArticleDetailPageProps {
  params: {
    slug: string;
  };
}

export async function generateMetadata(
  { params }: ArticleDetailPageProps,
  parent: ResolvingMetadata
): Promise<Metadata> {
  const result = await getArticleBySlug(params.slug);

  if (!result || !result.article) {
    return {
      title: "Article Not Found",
    };
  }

  const article = result.article;

  return {
    title: article.seoTitle || article.title,
    description: article.seoDescription || article.excerpt,
    keywords: article.seoKeywords || [],
    openGraph: {
      title: article.title,
      description: article.excerpt,
      type: "article",
      publishedTime: article.publishedAt,
      images: article.coverImage ? [{ url: article.coverImage }] : [],
    },
    twitter: {
      card: "summary_large_image",
      title: article.title,
      description: article.excerpt,
      images: article.coverImage ? [article.coverImage] : [],
    },
  };
}

export default async function ArticleDetailPage({
  params,
}: ArticleDetailPageProps) {
  const result = await getArticleBySlug(params.slug);

  if (!result || !result.article) {
    notFound();
  }

  const article = result.article;
  const publishedDate = new Date(article.publishedAt).toLocaleDateString(
    "en-US",
    { year: "numeric", month: "long", day: "numeric" }
  );

  // Calculate reading time
  const wordCount = article.content.split(" ").length;
  const readingTime = Math.ceil(wordCount / 200);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-gradient-to-r from-indigo-600 to-blue-600 text-white py-12">
        <div className="max-w-3xl mx-auto px-4">
          <Link href="/articles" className="text-indigo-100 hover:text-white mb-4 inline-block">
            ← Back to Articles
          </Link>
          <h1 className="text-4xl font-bold mb-4">{article.title}</h1>

          <div className="flex items-center gap-6 text-indigo-100 text-sm">
            <span>By Dr. {article.doctor.user.name}</span>
            <span>{publishedDate}</span>
            <span>{readingTime} min read</span>
            <span>{article.viewCount} views</span>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-3xl mx-auto px-4 py-12">
        {/* Featured Image */}
        {article.coverImage && (
          <div className="mb-8 rounded-lg overflow-hidden h-96">
            <img
              src={article.coverImage}
              alt={article.title}
              className="w-full h-full object-cover"
            />
          </div>
        )}

        {/* Article Metadata */}
        <div className="mb-8 pb-8 border-b border-gray-200">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div className="flex gap-2">
              <span className="px-3 py-1 bg-indigo-100 text-indigo-700 rounded-full text-xs font-medium">
                {article.category.name}
              </span>
            </div>
            <div className="flex gap-4 text-sm text-gray-600">
              <button className="flex items-center gap-2 hover:text-indigo-600">
                ❤️ {article.likes} Likes
              </button>
            </div>
          </div>
        </div>

        {/* Article Content */}
        <Card className="p-8 mb-12 prose prose-sm max-w-none">
          <div
            className="text-gray-700 leading-relaxed"
            dangerouslySetInnerHTML={{ __html: article.content }}
          />
        </Card>

        {/* Author Card */}
        <Card className="p-8 mb-12 bg-indigo-50 border border-indigo-200">
          <div className="flex items-start gap-4">
            <div className="w-16 h-16 rounded-full bg-indigo-200 flex items-center justify-center text-2xl flex-shrink-0">
              👨‍⚕️
            </div>
            <div className="flex-1">
              <h3 className="text-lg font-bold text-gray-900">
                Dr. {article.doctor.user.name}
              </h3>
              <p className="text-gray-600 mt-2">
                {article.doctor.bio || "Expert wellness practitioner"}
              </p>
              <Button asChild variant="outline" className="mt-4" size="sm">
                <Link href={`/doctor/${article.doctorId}`}>View Profile</Link>
              </Button>
            </div>
          </div>
        </Card>

        {/* Related Articles Section */}
        <div className="mb-12">
          <h3 className="text-2xl font-bold text-gray-900 mb-6">
            More from this doctor
          </h3>
          <p className="text-gray-600">
            Explore other articles and insights from Dr. {article.doctor.user.name}
          </p>
          <Button asChild className="mt-4 bg-indigo-600 hover:bg-indigo-700">
            <Link href={`/articles?doctorId=${article.doctorId}`}>
              View More Articles
            </Link>
          </Button>
        </div>

        {/* CTA */}
        <Card className="p-8 bg-gradient-to-r from-indigo-600 to-blue-600 text-white text-center">
          <h3 className="text-2xl font-bold mb-2">Ready to improve your wellness?</h3>
          <p className="text-indigo-100 mb-6">
            Book a consultation with Dr. {article.doctor.user.name}
          </p>
          <Button asChild className="bg-white text-indigo-600 hover:bg-gray-100">
            <Link href="/book-appointment">Schedule Consultation</Link>
          </Button>
        </Card>
      </div>
    </div>
  );
}

// Generate static params for popular articles
export async function generateStaticParams() {
  // This would fetch the most popular articles
  return [];
}
