"use client";

/**
 * CAARD - Articles Page Client Component
 * Maneja traducciones para la página de artículos
 */

import { Newspaper, Plus, Eye, Star } from "lucide-react";
import { format } from "date-fns";
import { es, enUS } from "date-fns/locale";
import Link from "next/link";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useTranslation, useI18n } from "@/lib/i18n";

interface Article {
  id: string;
  title: string;
  slug: string;
  isPublished: boolean;
  isFeatured: boolean;
  viewCount: number;
  createdAt: Date;
  author: { name: string | null; email: string } | null;
  category: { name: string; color: string | null } | null;
}

interface ArticlesClientProps {
  articles: Article[];
  total: number;
  published: number;
  featured: number;
}

export function ArticlesClient({ articles, total, published, featured }: ArticlesClientProps) {
  const { t } = useTranslation();
  const { locale } = useI18n();
  const dateLocale = locale === "es" ? es : enUS;

  return (
    <div className="container mx-auto py-4 px-4 sm:px-6 lg:px-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6 lg:mb-8">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-lg bg-blue-100 flex items-center justify-center flex-shrink-0">
            <Newspaper className="h-5 w-5 sm:h-6 sm:w-6 text-blue-600" />
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-[#D66829]">{t.cms.articles}</h1>
            <p className="text-sm text-muted-foreground">
              {total} {total !== 1 ? t.cms.articles.toLowerCase() : t.cms.articles.toLowerCase().slice(0, -1)} {t.cms.total.toLowerCase()}
            </p>
          </div>
        </div>

        <Link href="/admin/cms/articles/new">
          <Button className="w-full sm:w-auto bg-[#D66829] hover:bg-[#c45a22]">
            <Plus className="h-4 w-4 mr-2" />
            {t.cms.newArticle}
          </Button>
        </Link>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-6 lg:mb-8">
        <Card>
          <CardHeader className="pb-2 p-3 sm:p-6 sm:pb-2">
            <CardTitle className="text-xs sm:text-sm text-muted-foreground">{t.cms.total}</CardTitle>
          </CardHeader>
          <CardContent className="p-3 pt-0 sm:p-6 sm:pt-0">
            <p className="text-xl sm:text-2xl font-bold">{total}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2 p-3 sm:p-6 sm:pb-2">
            <CardTitle className="text-xs sm:text-sm text-muted-foreground">{t.cms.published}</CardTitle>
          </CardHeader>
          <CardContent className="p-3 pt-0 sm:p-6 sm:pt-0">
            <p className="text-xl sm:text-2xl font-bold text-green-600">{published}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2 p-3 sm:p-6 sm:pb-2">
            <CardTitle className="text-xs sm:text-sm text-muted-foreground">{t.cms.drafts}</CardTitle>
          </CardHeader>
          <CardContent className="p-3 pt-0 sm:p-6 sm:pt-0">
            <p className="text-xl sm:text-2xl font-bold text-yellow-600">{total - published}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2 p-3 sm:p-6 sm:pb-2">
            <CardTitle className="text-xs sm:text-sm text-muted-foreground">{t.cms.featured}</CardTitle>
          </CardHeader>
          <CardContent className="p-3 pt-0 sm:p-6 sm:pt-0">
            <p className="text-xl sm:text-2xl font-bold text-orange-600">{featured}</p>
          </CardContent>
        </Card>
      </div>

      {/* Articles List */}
      <Card>
        <CardHeader className="p-4 sm:p-6">
          <CardTitle className="text-base sm:text-lg">{t.cms.articlesList}</CardTitle>
          <CardDescription className="text-sm">
            {t.cms.manageContent}
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0 sm:p-6 sm:pt-0">
          {articles.length === 0 ? (
            <div className="text-center py-8 sm:py-12 px-4">
              <Newspaper className="h-10 w-10 sm:h-12 sm:w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
              <p className="text-muted-foreground">{t.cms.noArticles}</p>
              <p className="text-sm text-muted-foreground">{t.cms.createFirstArticle}</p>
            </div>
          ) : (
            <>
              {/* Mobile View - Cards */}
              <div className="block lg:hidden space-y-3 p-4">
                {articles.map((article) => (
                  <Card key={article.id} className="p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          {article.isFeatured && (
                            <Star className="h-4 w-4 text-yellow-500 fill-yellow-500 flex-shrink-0" />
                          )}
                          <h3 className="font-medium truncate">{article.title}</h3>
                        </div>
                        <p className="text-sm text-muted-foreground truncate">/{article.slug}</p>
                        <div className="flex flex-wrap items-center gap-2 mt-2">
                          <Badge variant={article.isPublished ? "default" : "secondary"} className="text-xs">
                            {article.isPublished ? t.cms.published : t.cms.draft}
                          </Badge>
                          {article.category && (
                            <Badge variant="outline" className="text-xs">
                              {article.category.name}
                            </Badge>
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground mt-2">
                          {format(new Date(article.createdAt), "dd MMM yyyy", { locale: dateLocale })}
                          {article.author?.name && ` • ${article.author.name}`}
                        </p>
                      </div>
                      <div className="flex items-center gap-1 text-sm text-muted-foreground">
                        <Eye className="h-4 w-4" />
                        {article.viewCount}
                      </div>
                    </div>
                  </Card>
                ))}
              </div>

              {/* Desktop View - Table */}
              <div className="hidden lg:block rounded-lg border mx-6 mb-6">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>{t.cms.title}</TableHead>
                      <TableHead>{t.cms.category}</TableHead>
                      <TableHead>{t.cms.author}</TableHead>
                      <TableHead className="text-center">{t.cms.views}</TableHead>
                      <TableHead className="text-center">{t.cases.status}</TableHead>
                      <TableHead>{t.cms.date}</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {articles.map((article) => (
                      <TableRow key={article.id}>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            {article.isFeatured && (
                              <Star className="h-4 w-4 text-yellow-500 fill-yellow-500" />
                            )}
                            <div>
                              <div className="font-medium">{article.title}</div>
                              <div className="text-sm text-muted-foreground">/{article.slug}</div>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          {article.category ? (
                            <Badge variant="outline">{article.category.name}</Badge>
                          ) : (
                            <span className="text-muted-foreground">-</span>
                          )}
                        </TableCell>
                        <TableCell>
                          <span className="text-sm">{article.author?.name || "-"}</span>
                        </TableCell>
                        <TableCell className="text-center">
                          <div className="flex items-center justify-center gap-1">
                            <Eye className="h-4 w-4 text-muted-foreground" />
                            {article.viewCount}
                          </div>
                        </TableCell>
                        <TableCell className="text-center">
                          <Badge variant={article.isPublished ? "default" : "secondary"}>
                            {article.isPublished ? t.cms.published : t.cms.draft}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-muted-foreground">
                          {format(new Date(article.createdAt), "dd MMM yyyy", { locale: dateLocale })}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
