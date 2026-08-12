"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { LoadingSpinner } from "@/components/common/loading-spinner";

interface Article {
  id: string;
  title: string;
  slug: string;
  excerpt: string;
  coverImage?: string;
  author: string;
  publishedAt: string;
  category: { name: string; slug: string };
}

interface Category {
  id: string;
  name: string;
  slug: string;
}

export default function ArticlesListPage() {
  const [articles, setArticles] = useState<Article[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  useEffect(() => {
    fetch("/api/articles/categories")
      .then((r) => r.json())
      .then((data) => setCategories(Array.isArray(data) ? data : data.categories || []))
      .catch(() => setCategories([]));
  }, []);

  useEffect(() => {
    const run = async () => {
      setLoading(true);
      try {
        const params = new URLSearchParams();
        if (selectedCategory !== "all") params.set("categoryId", selectedCategory);
        if (searchQuery) params.set("search", searchQuery);
        params.set("page", String(currentPage));
        params.set("limit", "9");
        const res = await fetch(`/api/articles?${params}`);
        const data = await res.json();
        setArticles(Array.isArray(data.articles) ? data.articles : []);
        setTotalPages(data.pagination?.pages || data.pagination?.totalPages || 1);
      } catch (e) {
        console.error("Error fetching articles:", e);
        setArticles([]);
      } finally {
        setLoading(false);
      }
    };
    run();
  }, [selectedCategory, currentPage, searchQuery]);

  return (
    <div className="min-h-screen">
      <div className="border-b border-teal-900/10 bg-[linear-gradient(120deg,#0f3d38_0%,#1c5c52_45%,#2a2118_100%)] px-4 py-14 text-white">
        <div className="mx-auto max-w-6xl">
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-teal-100">
            Clinical knowledge
          </p>
          <h1 className="mt-2 font-serif text-4xl md:text-5xl">Wellness library</h1>
          <p className="mt-3 max-w-2xl text-teal-50/90">
            Clinician-authored pathways used across Veridian consult prep and AI handoff.
          </p>
        </div>
      </div>

      <div className="mx-auto max-w-6xl px-4 py-10">
        <div className="mb-8 flex flex-col gap-3 md:flex-row">
          <Input
            placeholder="Search articles..."
            value={searchQuery}
            onChange={(e) => {
              setCurrentPage(1);
              setSearchQuery(e.target.value);
            }}
            className="max-w-md bg-white"
          />
          <Select
            value={selectedCategory}
            onValueChange={(v) => {
              setCurrentPage(1);
              setSelectedCategory(v);
            }}
          >
            <SelectTrigger className="max-w-xs bg-white">
              <SelectValue placeholder="All Categories" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Categories</SelectItem>
              {categories.map((cat) => (
                <SelectItem key={cat.id} value={cat.slug || cat.id}>
                  {cat.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {loading ? (
          <LoadingSpinner />
        ) : articles.length === 0 ? (
          <Card className="p-12 text-center text-stone-600">No articles found</Card>
        ) : (
          <>
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
              {articles.map((article) => (
                <Card
                  key={article.id}
                  className="overflow-hidden border-stone-200/80 bg-white/90 shadow-sm transition hover:-translate-y-0.5 hover:shadow-lg"
                >
                  <div className="h-44 overflow-hidden bg-stone-200">
                    {article.coverImage ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={article.coverImage}
                        alt={article.title}
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <div className="h-full w-full bg-gradient-to-br from-teal-800 to-stone-800" />
                    )}
                  </div>
                  <div className="p-5">
                    <p className="text-xs font-semibold uppercase tracking-wide text-teal-800">
                      {article.category?.name}
                    </p>
                    <h3 className="mt-2 font-serif text-xl text-stone-900">
                      {article.title}
                    </h3>
                    <p className="mt-2 line-clamp-2 text-sm text-stone-600">
                      {article.excerpt}
                    </p>
                    <div className="mt-4 flex items-center justify-between">
                      <span className="text-xs text-stone-500">By {article.author}</span>
                      <Button asChild size="sm" variant="outline">
                        <Link href={`/articles/${article.slug}`}>Read</Link>
                      </Button>
                    </div>
                  </div>
                </Card>
              ))}
            </div>

            {totalPages > 1 && (
              <div className="mt-8 flex justify-center gap-2">
                <Button
                  variant="outline"
                  disabled={currentPage === 1}
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                >
                  Previous
                </Button>
                <Button
                  variant="outline"
                  disabled={currentPage === totalPages}
                  onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                >
                  Next
                </Button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
