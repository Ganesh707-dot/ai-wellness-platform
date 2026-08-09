"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

interface ArticleCardProps {
  id: string;
  title: string;
  slug: string;
  excerpt: string;
  coverImage?: string;
  author: string;
  publishedAt: string;
  viewCount: number;
  likes: number;
  category: {
    name: string;
    slug: string;
  };
  variant?: "default" | "compact" | "featured";
}

export function ArticleCard({
  title,
  slug,
  excerpt,
  coverImage,
  author,
  publishedAt,
  viewCount,
  likes,
  category,
  variant = "default",
}: ArticleCardProps) {
  const publishedDate = new Date(publishedAt).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });

  if (variant === "compact") {
    return (
      <div className="flex gap-4 py-4 border-b border-gray-200 last:border-0">
        {coverImage && (
          <div className="w-24 h-24 flex-shrink-0 rounded-lg overflow-hidden bg-gray-200">
            <img
              src={coverImage}
              alt={title}
              className="w-full h-full object-cover"
            />
          </div>
        )}
        <div className="flex-1 min-w-0">
          <Link href={`/articles/${slug}`}>
            <h3 className="font-semibold text-gray-900 hover:text-indigo-600 line-clamp-2">
              {title}
            </h3>
          </Link>
          <p className="text-xs text-gray-500 mt-1">
            {publishedDate} • By {author}
          </p>
        </div>
      </div>
    );
  }

  if (variant === "featured") {
    return (
      <Card className="overflow-hidden hover:shadow-lg transition-shadow">
        {coverImage && (
          <div className="h-64 overflow-hidden bg-gray-200">
            <img
              src={coverImage}
              alt={title}
              className="w-full h-full object-cover hover:scale-105 transition-transform"
            />
          </div>
        )}
        <div className="p-6">
          <span className="text-sm font-bold text-indigo-600 uppercase">
            {category.name}
          </span>
          <h2 className="text-2xl font-bold text-gray-900 mt-2 mb-3 line-clamp-2">
            {title}
          </h2>
          <p className="text-gray-600 mb-4 line-clamp-3">{excerpt}</p>

          <div className="flex items-center justify-between mb-4 pb-4 border-b border-gray-200">
            <span className="text-sm text-gray-500">By {author}</span>
            <div className="flex gap-3 text-sm text-gray-500">
              <span>👁️ {viewCount}</span>
              <span>❤️ {likes}</span>
            </div>
          </div>

          <Button asChild className="w-full bg-indigo-600 hover:bg-indigo-700">
            <Link href={`/articles/${slug}`}>Read Full Article</Link>
          </Button>
        </div>
      </Card>
    );
  }

  return (
    <Card className="overflow-hidden hover:shadow-lg transition-shadow h-full flex flex-col">
      {coverImage && (
        <div className="h-48 overflow-hidden bg-gray-200">
          <img
            src={coverImage}
            alt={title}
            className="w-full h-full object-cover hover:scale-105 transition-transform"
          />
        </div>
      )}

      <div className="p-6 flex flex-col flex-1">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-medium text-indigo-600 uppercase">
            {category.name}
          </span>
          <span className="text-xs text-gray-500">{publishedDate}</span>
        </div>

        <h3 className="text-lg font-bold text-gray-900 mb-2 line-clamp-2">
          {title}
        </h3>

        <p className="text-gray-600 text-sm mb-4 line-clamp-3 flex-1">
          {excerpt}
        </p>

        <div className="flex items-center justify-between mb-4 pb-4 border-b border-gray-200 text-xs text-gray-500">
          <span>By {author}</span>
          <div className="flex gap-2">
            <span>👁️ {viewCount}</span>
            <span>❤️ {likes}</span>
          </div>
        </div>

        <Button asChild variant="outline" className="w-full">
          <Link href={`/articles/${slug}`}>Read More</Link>
        </Button>
      </div>
    </Card>
  );
}
