"use client";

/**
 * CAARD - Article Client Component
 * Vista de artículo individual con diseño bonito
 */

import Link from "next/link";
import Image from "next/image";
import {
  Calendar,
  Clock,
  User,
  Tag,
  Eye,
  Share2,
  ArrowLeft,
  ChevronRight,
  BookOpen,
  Facebook,
  Twitter,
  Linkedin,
  Link2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { useTranslation } from "@/lib/i18n/use-translation";

interface Article {
  id: string;
  slug: string;
  title: string;
  excerpt: string | null;
  content: string;
  coverImage: string | null;
  category: string | null;
  tags: string[];
  publishedAt: string;
  viewCount: number;
  author: {
    name: string | null;
    image: string | null;
  } | null;
}

interface RelatedArticle {
  id: string;
  slug: string;
  title: string;
  excerpt: string | null;
  coverImage: string | null;
  publishedAt: string;
  author: {
    name: string | null;
    image: string | null;
  } | null;
}

interface ArticleClientProps {
  data: {
    article: Article;
    related: RelatedArticle[];
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

function ShareButtons({ url, title }: { url: string; title: string }) {
  const shareUrl = typeof window !== "undefined" ? window.location.href : url;
  const encodedUrl = encodeURIComponent(shareUrl);
  const encodedTitle = encodeURIComponent(title);

  const copyToClipboard = () => {
    navigator.clipboard.writeText(shareUrl);
  };

  return (
    <div className="flex items-center gap-2">
      <span className="text-sm text-muted-foreground mr-2">Compartir:</span>
      <Button
        variant="outline"
        size="icon"
        className="h-8 w-8"
        onClick={() =>
          window.open(
            `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`,
            "_blank"
          )
        }
      >
        <Facebook className="h-4 w-4" />
      </Button>
      <Button
        variant="outline"
        size="icon"
        className="h-8 w-8"
        onClick={() =>
          window.open(
            `https://twitter.com/intent/tweet?url=${encodedUrl}&text=${encodedTitle}`,
            "_blank"
          )
        }
      >
        <Twitter className="h-4 w-4" />
      </Button>
      <Button
        variant="outline"
        size="icon"
        className="h-8 w-8"
        onClick={() =>
          window.open(
            `https://www.linkedin.com/sharing/share-offsite/?url=${encodedUrl}`,
            "_blank"
          )
        }
      >
        <Linkedin className="h-4 w-4" />
      </Button>
      <Button variant="outline" size="icon" className="h-8 w-8" onClick={copyToClipboard}>
        <Link2 className="h-4 w-4" />
      </Button>
    </div>
  );
}

function RelatedArticleCard({
  article,
  locale,
}: {
  article: RelatedArticle;
  locale: string;
}) {
  return (
    <Link href={`/blog/${article.slug}`}>
      <Card className="overflow-hidden h-full group hover:shadow-lg transition-all">
        <div className="relative h-40">
          {article.coverImage ? (
            <Image
              src={article.coverImage}
              alt={article.title}
              fill
              className="object-cover group-hover:scale-105 transition-transform duration-500"
            />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-slate-200 to-slate-300 flex items-center justify-center">
              <BookOpen className="h-10 w-10 text-slate-400" />
            </div>
          )}
        </div>
        <CardContent className="p-4">
          <p className="text-xs text-muted-foreground mb-2">
            {formatDate(article.publishedAt, locale)}
          </p>
          <h4 className="font-bold line-clamp-2 group-hover:text-[#D66829] transition-colors">
            {article.title}
          </h4>
        </CardContent>
      </Card>
    </Link>
  );
}

export function ArticleClient({ data }: ArticleClientProps) {
  const { t, locale } = useTranslation();
  const { article, related } = data;
  const readTime = estimateReadTime(article.content);

  return (
    <>
      {/* Hero con imagen de fondo */}
      <section className="relative">
        {article.coverImage ? (
          <div className="relative h-[50vh] min-h-[400px]">
            <Image
              src={article.coverImage}
              alt={article.title}
              fill
              className="object-cover"
              priority
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent" />
          </div>
        ) : (
          <div className="h-[30vh] min-h-[300px] bg-gradient-to-br from-[#0B2A5B] to-[#D66829]" />
        )}

        {/* Contenido superpuesto */}
        <div className="absolute inset-x-0 bottom-0">
          <div className="container mx-auto px-4 pb-8">
            <div className="max-w-3xl">
              <Link
                href="/blog"
                className="inline-flex items-center gap-1 text-white/80 hover:text-white text-sm mb-4"
              >
                <ArrowLeft className="h-4 w-4" />
                {t.common.back} al blog
              </Link>

              {article.category && (
                <Badge className="bg-[#D66829] mb-4">{article.category}</Badge>
              )}

              <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold text-white mb-4">
                {article.title}
              </h1>

              <div className="flex flex-wrap items-center gap-4 text-white/80 text-sm">
                {article.author && (
                  <div className="flex items-center gap-2">
                    {article.author.image ? (
                      <Image
                        src={article.author.image}
                        alt={article.author.name || ""}
                        width={32}
                        height={32}
                        className="rounded-full"
                      />
                    ) : (
                      <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center">
                        <User className="h-4 w-4" />
                      </div>
                    )}
                    <span>{article.author.name}</span>
                  </div>
                )}
                <span className="flex items-center gap-1">
                  <Calendar className="h-4 w-4" />
                  {formatDate(article.publishedAt, locale)}
                </span>
                <span className="flex items-center gap-1">
                  <Clock className="h-4 w-4" />
                  {readTime} {t.website.minRead}
                </span>
                <span className="flex items-center gap-1">
                  <Eye className="h-4 w-4" />
                  {article.viewCount} vistas
                </span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Contenido del artículo */}
      <section className="py-[6vh] md:py-[8vh]">
        <div className="container mx-auto px-4">
          <div className="grid gap-8 lg:grid-cols-4">
            {/* Contenido principal */}
            <div className="lg:col-span-3">
              <Card>
                <CardContent className="p-6 md:p-10">
                  {/* Extracto */}
                  {article.excerpt && (
                    <div className="text-xl text-muted-foreground mb-8 pb-8 border-b italic">
                      {article.excerpt}
                    </div>
                  )}

                  {/* Contenido HTML */}
                  <div
                    className="prose prose-slate max-w-none
                      prose-headings:font-bold prose-headings:text-slate-900
                      prose-h2:text-2xl prose-h2:mt-8 prose-h2:mb-4
                      prose-h3:text-xl prose-h3:mt-6 prose-h3:mb-3
                      prose-p:text-slate-600 prose-p:leading-relaxed
                      prose-a:text-[#D66829] prose-a:no-underline hover:prose-a:underline
                      prose-strong:text-slate-900
                      prose-ul:my-4 prose-li:text-slate-600
                      prose-blockquote:border-l-[#D66829] prose-blockquote:bg-slate-50 prose-blockquote:py-2 prose-blockquote:px-4 prose-blockquote:italic
                      prose-img:rounded-lg prose-img:shadow-lg"
                    dangerouslySetInnerHTML={{ __html: article.content }}
                  />

                  {/* Tags */}
                  {article.tags.length > 0 && (
                    <div className="mt-8 pt-8 border-t">
                      <div className="flex items-center gap-2 flex-wrap">
                        <Tag className="h-4 w-4 text-muted-foreground" />
                        {article.tags.map((tag) => (
                          <Badge key={tag} variant="secondary">
                            {tag}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Compartir */}
                  <div className="mt-8 pt-8 border-t">
                    <ShareButtons url={`/blog/${article.slug}`} title={article.title} />
                  </div>
                </CardContent>
              </Card>

              {/* Autor */}
              {article.author && (
                <Card className="mt-6">
                  <CardContent className="p-6 flex items-center gap-4">
                    {article.author.image ? (
                      <Image
                        src={article.author.image}
                        alt={article.author.name || ""}
                        width={64}
                        height={64}
                        className="rounded-full"
                      />
                    ) : (
                      <div className="w-16 h-16 rounded-full bg-[#D66829]/20 flex items-center justify-center">
                        <User className="h-8 w-8 text-[#D66829]" />
                      </div>
                    )}
                    <div>
                      <p className="text-sm text-muted-foreground">
                        {t.website.byAuthor}
                      </p>
                      <h3 className="font-bold text-lg">{article.author.name}</h3>
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>

            {/* Sidebar */}
            <aside className="space-y-6">
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

              {/* Artículos relacionados */}
              {related.length > 0 && (
                <div>
                  <h3 className="font-bold mb-4">{t.website.recentPosts}</h3>
                  <div className="space-y-4">
                    {related.map((relatedArticle) => (
                      <RelatedArticleCard
                        key={relatedArticle.id}
                        article={relatedArticle}
                        locale={locale}
                      />
                    ))}
                  </div>
                </div>
              )}

              {/* Volver al blog */}
              <Link href="/blog">
                <Button variant="outline" className="w-full">
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  {t.common.back} al blog
                </Button>
              </Link>
            </aside>
          </div>
        </div>
      </section>
    </>
  );
}
