"use client";

/**
 * CAARD - Blog Client Component
 * Diseño moderno con imagen lateral y filtros
 */

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import {
  Calendar,
  Clock,
  User,
  Tag,
  Search,
  ChevronRight,
  BookOpen,
  ArrowRight,
  Eye,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { useTranslation } from "@/lib/i18n/use-translation";

interface Article {
  id: string;
  slug: string;
  title: string;
  excerpt: string | null;
  coverImage: string | null;
  content: string;
  category: string | null;
  categorySlug: string | null;
  tags: string[];
  isFeatured: boolean;
  publishedAt: string;
  viewCount: number;
  author: {
    name: string | null;
    image: string | null;
  } | null;
}

interface Category {
  id: string;
  name: string;
  slug: string;
  color: string | null;
  count: number;
}

interface BlogClientProps {
  data: {
    articles: Article[];
    featured: Article[];
    categories: Category[];
  };
}

function formatDate(dateStr: string, locale: string = "es") {
  const date = new Date(dateStr);
  return date.toLocaleDateString(locale === "es" ? "es-PE" : "en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

function estimateReadTime(content: string): number {
  const wordsPerMinute = 200;
  const words = content.split(/\s+/).length;
  return Math.ceil(words / wordsPerMinute);
}

// Artículo destacado grande
function FeaturedArticle({ article, locale, t }: { article: Article; locale: string; t: any }) {
  const readTime = estimateReadTime(article.content);

  return (
    <Link href={`/blog/${article.slug}`}>
      <Card className="overflow-hidden group hover:shadow-xl transition-all duration-300">
        <div className="grid md:grid-cols-2">
          <div className="relative h-64 md:h-full min-h-[300px]">
            {article.coverImage ? (
              <Image
                src={article.coverImage}
                alt={article.title}
                fill
                className="object-cover group-hover:scale-105 transition-transform duration-500"
              />
            ) : (
              <div className="w-full h-full bg-gradient-to-br from-[#0B2A5B] to-[#D66829] flex items-center justify-center">
                <BookOpen className="h-20 w-20 text-white/30" />
              </div>
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
            {article.category && (
              <Badge className="absolute top-4 left-4 bg-[#D66829]">
                {article.category}
              </Badge>
            )}
          </div>

          <CardContent className="p-6 md:p-8 flex flex-col justify-center">
            <div className="flex items-center gap-4 text-sm text-muted-foreground mb-4">
              <span className="flex items-center gap-1">
                <Calendar className="h-4 w-4" />
                {formatDate(article.publishedAt, locale)}
              </span>
              <span className="flex items-center gap-1">
                <Clock className="h-4 w-4" />
                {readTime} {t.website.minRead}
              </span>
            </div>

            <h2 className="text-2xl md:text-3xl font-bold mb-4 group-hover:text-[#D66829] transition-colors">
              {article.title}
            </h2>

            {article.excerpt && (
              <p className="text-muted-foreground mb-6 line-clamp-3">
                {article.excerpt}
              </p>
            )}

            {article.author && (
              <div className="flex items-center gap-3 pt-4 border-t">
                {article.author.image ? (
                  <Image
                    src={article.author.image}
                    alt={article.author.name || ""}
                    width={40}
                    height={40}
                    className="rounded-full"
                  />
                ) : (
                  <div className="w-10 h-10 rounded-full bg-[#D66829]/20 flex items-center justify-center">
                    <User className="h-5 w-5 text-[#D66829]" />
                  </div>
                )}
                <div>
                  <p className="font-medium">{article.author.name}</p>
                  <p className="text-xs text-muted-foreground">{t.website.byAuthor}</p>
                </div>
              </div>
            )}

            <div className="mt-6">
              <Button className="group/btn">
                {t.website.readMore}
                <ArrowRight className="ml-2 h-4 w-4 group-hover/btn:translate-x-1 transition-transform" />
              </Button>
            </div>
          </CardContent>
        </div>
      </Card>
    </Link>
  );
}

// Artículo en tarjeta
function ArticleCard({ article, locale, t }: { article: Article; locale: string; t: any }) {
  const readTime = estimateReadTime(article.content);

  return (
    <Link href={`/blog/${article.slug}`}>
      <Card className="overflow-hidden h-full group hover:shadow-lg transition-all">
        <div className="relative h-48">
          {article.coverImage ? (
            <Image
              src={article.coverImage}
              alt={article.title}
              fill
              className="object-cover group-hover:scale-105 transition-transform duration-500"
            />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-slate-200 to-slate-300 flex items-center justify-center">
              <BookOpen className="h-12 w-12 text-slate-400" />
            </div>
          )}
          {article.category && (
            <Badge className="absolute top-3 left-3 bg-[#D66829]">
              {article.category}
            </Badge>
          )}
        </div>

        <CardContent className="p-5">
          <div className="flex items-center gap-3 text-xs text-muted-foreground mb-3">
            <span className="flex items-center gap-1">
              <Calendar className="h-3 w-3" />
              {formatDate(article.publishedAt, locale)}
            </span>
            <span className="flex items-center gap-1">
              <Clock className="h-3 w-3" />
              {readTime} min
            </span>
            {article.viewCount > 0 && (
              <span className="flex items-center gap-1">
                <Eye className="h-3 w-3" />
                {article.viewCount}
              </span>
            )}
          </div>

          <h3 className="font-bold text-lg mb-2 line-clamp-2 group-hover:text-[#D66829] transition-colors">
            {article.title}
          </h3>

          {article.excerpt && (
            <p className="text-sm text-muted-foreground line-clamp-2 mb-4">
              {article.excerpt}
            </p>
          )}

          {article.author && (
            <div className="flex items-center gap-2 pt-3 border-t">
              {article.author.image ? (
                <Image
                  src={article.author.image}
                  alt={article.author.name || ""}
                  width={24}
                  height={24}
                  className="rounded-full"
                />
              ) : (
                <div className="w-6 h-6 rounded-full bg-[#D66829]/20 flex items-center justify-center">
                  <User className="h-3 w-3 text-[#D66829]" />
                </div>
              )}
              <span className="text-sm">{article.author.name}</span>
            </div>
          )}
        </CardContent>
      </Card>
    </Link>
  );
}

// Artículo en lista lateral
function ArticleListItem({ article, locale }: { article: Article; locale: string }) {
  return (
    <Link href={`/blog/${article.slug}`} className="group flex gap-3">
      <div className="relative w-20 h-20 rounded-lg overflow-hidden shrink-0">
        {article.coverImage ? (
          <Image
            src={article.coverImage}
            alt={article.title}
            fill
            className="object-cover"
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-slate-200 to-slate-300 flex items-center justify-center">
            <BookOpen className="h-6 w-6 text-slate-400" />
          </div>
        )}
      </div>
      <div className="flex-1 min-w-0">
        <h4 className="font-medium text-sm line-clamp-2 group-hover:text-[#D66829] transition-colors">
          {article.title}
        </h4>
        <p className="text-xs text-muted-foreground mt-1">
          {formatDate(article.publishedAt, locale)}
        </p>
      </div>
    </Link>
  );
}

export function BlogClient({ data }: BlogClientProps) {
  const { t, locale } = useTranslation();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  // Filtrar artículos
  const filteredArticles = data.articles.filter((article) => {
    const matchesSearch =
      !searchQuery ||
      article.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      article.excerpt?.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesCategory =
      !selectedCategory || article.categorySlug === selectedCategory;

    return matchesSearch && matchesCategory;
  });

  // Separar artículos destacados y regulares
  const featuredArticle = data.featured[0];
  const regularArticles = filteredArticles.filter((a) => a.id !== featuredArticle?.id);
  const recentArticles = data.articles.slice(0, 5);

  return (
    <>
      {/* Hero */}
      <section className="relative bg-gradient-to-br from-[#0B2A5B] via-[#0d3a7a] to-[#D66829] py-[10vh] md:py-[12vh] overflow-hidden">
        <div className="absolute inset-0 bg-[url('/patterns/grid.svg')] opacity-10" />
        <div className="container mx-auto px-4 relative z-10">
          <div className="max-w-3xl mx-auto text-center text-white">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 backdrop-blur-sm text-sm mb-6">
              <BookOpen className="h-4 w-4" />
              CAARD
            </div>
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6">
              {t.website.blogPageTitle}
            </h1>
            <p className="text-lg md:text-xl text-white/90 leading-relaxed">
              {t.website.blogPageSubtitle}
            </p>
          </div>
        </div>
      </section>

      {/* Contenido principal */}
      <section className="py-[6vh] md:py-[8vh]">
        <div className="container mx-auto px-4">
          {/* Artículo destacado */}
          {featuredArticle && (
            <div className="mb-12">
              <div className="flex items-center gap-2 mb-6">
                <Badge variant="secondary">{t.website.featuredArticles}</Badge>
              </div>
              <FeaturedArticle article={featuredArticle} locale={locale} t={t} />
            </div>
          )}

          {/* Grid principal con sidebar */}
          <div className="grid gap-8 lg:grid-cols-4">
            {/* Contenido principal */}
            <div className="lg:col-span-3">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold">{t.website.allArticles}</h2>

                {/* Buscador */}
                <div className="relative w-64">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder={t.website.searchArticles}
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>

              {/* Filtros de categoría */}
              {data.categories.length > 0 && (
                <div className="flex flex-wrap gap-2 mb-8">
                  <Button
                    variant={selectedCategory === null ? "default" : "outline"}
                    size="sm"
                    onClick={() => setSelectedCategory(null)}
                  >
                    {t.website.allEvents}
                  </Button>
                  {data.categories.map((category) => (
                    <Button
                      key={category.id}
                      variant={selectedCategory === category.slug ? "default" : "outline"}
                      size="sm"
                      onClick={() => setSelectedCategory(category.slug)}
                    >
                      {category.name}
                      <Badge variant="secondary" className="ml-2">
                        {category.count}
                      </Badge>
                    </Button>
                  ))}
                </div>
              )}

              {/* Grid de artículos */}
              {regularArticles.length > 0 ? (
                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                  {regularArticles.map((article) => (
                    <ArticleCard key={article.id} article={article} locale={locale} t={t} />
                  ))}
                </div>
              ) : (
                <Card className="border-dashed">
                  <CardContent className="py-16 text-center">
                    <BookOpen className="h-16 w-16 mx-auto text-muted-foreground/50 mb-4" />
                    <h3 className="text-lg font-semibold mb-2">
                      {t.website.noArticlesYet}
                    </h3>
                    <p className="text-muted-foreground">
                      {t.website.checkBackLater}
                    </p>
                  </CardContent>
                </Card>
              )}
            </div>

            {/* Sidebar */}
            <aside className="space-y-8">
              {/* Categorías */}
              {data.categories.length > 0 && (
                <Card>
                  <CardContent className="p-6">
                    <h3 className="font-bold mb-4 flex items-center gap-2">
                      <Tag className="h-4 w-4" />
                      {t.website.categories}
                    </h3>
                    <div className="space-y-2">
                      {data.categories.map((category) => (
                        <button
                          key={category.id}
                          onClick={() =>
                            setSelectedCategory(
                              selectedCategory === category.slug ? null : category.slug
                            )
                          }
                          className={`w-full flex items-center justify-between p-2 rounded-lg text-sm transition-colors ${
                            selectedCategory === category.slug
                              ? "bg-[#D66829]/10 text-[#D66829]"
                              : "hover:bg-muted"
                          }`}
                        >
                          <span
                            className="flex items-center gap-2"
                            style={{ color: category.color || undefined }}
                          >
                            <span
                              className="w-2 h-2 rounded-full"
                              style={{ backgroundColor: category.color || "#D66829" }}
                            />
                            {category.name}
                          </span>
                          <Badge variant="outline">{category.count}</Badge>
                        </button>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Posts recientes */}
              {recentArticles.length > 0 && (
                <Card>
                  <CardContent className="p-6">
                    <h3 className="font-bold mb-4 flex items-center gap-2">
                      <Clock className="h-4 w-4" />
                      {t.website.recentPosts}
                    </h3>
                    <div className="space-y-4">
                      {recentArticles.map((article) => (
                        <ArticleListItem
                          key={article.id}
                          article={article}
                          locale={locale}
                        />
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* CTA */}
              <Card className="bg-gradient-to-br from-[#0B2A5B] to-[#0d3a7a] text-white">
                <CardContent className="p-6">
                  <h3 className="font-bold text-lg mb-2">
                    {t.website.needMoreInfo}
                  </h3>
                  <p className="text-white/80 text-sm mb-4">
                    {t.website.visitServicesPages}
                  </p>
                  <Link href="/contacto">
                    <Button variant="secondary" className="w-full">
                      {t.website.contactUs}
                      <ChevronRight className="ml-1 h-4 w-4" />
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            </aside>
          </div>
        </div>
      </section>
    </>
  );
}
