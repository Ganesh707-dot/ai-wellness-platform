"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { ArticleCard } from "@/components/article-card";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { LoadingSpinner } from "@/components/common/loading-spinner";

interface Article {
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
}

interface FeaturedArticlesProps {
  limit?: number;
  title?: string;
  showViewAll?: boolean;
}

export function FeaturedArticles({
  limit = 3,
  title = "Latest Wellness Articles",
  showViewAll = true,
}: FeaturedArticlesProps) {
  const [articles, setArticles] = useState<Article[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchArticles = async () => {
      try {
        const response = await fetch("/api/articles?page=1&limit=" + limit);
        if (response.ok) {
          const data = await response.json();
          setArticles(data.articles);
        }
      } catch (error) {
        console.error("Error fetching articles:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchArticles();
  }, [limit]);

  if (loading) {
    return <LoadingSpinner />;
  }

  return (
    <section className="py-12">
      <div className="max-w-6xl mx-auto px-4">
        <div className="flex items-center justify-between mb-8">
          <h2 className="text-3xl font-bold text-gray-900">{title}</h2>
          {showViewAll && (
            <Button asChild variant="outline">
              <Link href="/articles">View All Articles</Link>
            </Button>
          )}
        </div>

        {articles.length === 0 ? (
          <Card className="p-8 text-center">
            <p className="text-gray-600">No articles available yet</p>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {articles.map((article) => (
              <ArticleCard
                key={article.id}
                {...article}
                variant="default"
              />
            ))}
          </div>
        )}
      </div>
    </section>
  );
}

export function FeaturedArticleHero({
  limit = 1,
}: {
  limit?: number;
}) {
  const [article, setArticle] = useState<Article | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetch = async () => {
      try {
        const response = await fetch("/api/articles?page=1&limit=1");
        if (response.ok) {
          const data = await response.json();
          if (data.articles.length > 0) {
            setArticle(data.articles[0]);
          }
        }
      } catch (error) {
        console.error("Error:", error);
      } finally {
        setLoading(false);
      }
    };

    fetch();
  }, []);

  if (loading || !article) {
    return null;
  }

  return (
    <section className="py-8">
      <div className="max-w-6xl mx-auto px-4">
        <ArticleCard {...article} variant="featured" />
      </div>
    </section>
  );
}
