"use client";

/**
 * CAARD - Product Card
 * Card component for the public store catalog.
 */

import Image from "next/image";
import Link from "next/link";
import { ShoppingCart, Package } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useCart } from "@/components/commerce/cart-provider";

export interface ProductCardData {
  id: string;
  slug: string;
  title: string;
  description: string | null;
  coverImage: string | null;
  type: "DIGITAL" | "PHYSICAL" | "SERVICE";
  priceCents: number;
  comparePriceCents: number | null;
  currency: string;
  categoryName: string | null;
}

const typeLabels: Record<string, string> = {
  DIGITAL: "Digital",
  PHYSICAL: "Físico",
  SERVICE: "Servicio",
};

const typeColors: Record<string, string> = {
  DIGITAL: "bg-indigo-600",
  PHYSICAL: "bg-amber-600",
  SERVICE: "bg-teal-600",
};

function formatPrice(cents: number, currency: string) {
  return new Intl.NumberFormat("es-PE", {
    style: "currency",
    currency,
  }).format(cents / 100);
}

export function ProductCard({ product }: { product: ProductCardData }) {
  const { addItem } = useCart();

  const handleAddToCart = async () => {
    await addItem({
      itemType: "CART_PRODUCT",
      productId: product.id,
      quantity: 1,
      priceCents: product.priceCents,
      currency: product.currency,
      title: product.title,
      image: product.coverImage,
      slug: product.slug,
    });
  };

  const hasDiscount =
    product.comparePriceCents &&
    product.comparePriceCents > product.priceCents;

  return (
    <Card className="overflow-hidden hover:shadow-lg transition-shadow group py-0">
      {/* Cover image */}
      <Link href={`/tienda/${product.slug}`}>
        <div className="relative h-48 w-full">
          {product.coverImage ? (
            <Image
              src={product.coverImage}
              alt={product.title}
              fill
              className="object-cover group-hover:scale-105 transition-transform duration-300"
            />
          ) : (
            <div className="h-full w-full bg-gradient-to-br from-[#0B2A5B] to-[#D66829]/70 flex items-center justify-center">
              <Package className="h-16 w-16 text-white/40" />
            </div>
          )}
          <div className="absolute top-3 left-3">
            <Badge
              className={`${typeColors[product.type] ?? "bg-gray-600"} text-white border-0`}
            >
              {typeLabels[product.type] ?? product.type}
            </Badge>
          </div>
          {hasDiscount && (
            <div className="absolute top-3 right-3">
              <Badge className="bg-red-600 text-white border-0">Oferta</Badge>
            </div>
          )}
        </div>
      </Link>

      <CardContent className="p-5 space-y-3">
        <Link href={`/tienda/${product.slug}`}>
          <h3 className="font-bold text-lg line-clamp-2 group-hover:text-[#0B2A5B] transition-colors">
            {product.title}
          </h3>
        </Link>

        {product.description && (
          <p className="text-sm text-muted-foreground line-clamp-2">
            {product.description}
          </p>
        )}

        <div className="flex items-center gap-2">
          <span className="font-bold text-lg text-[#D66829]">
            {formatPrice(product.priceCents, product.currency)}
          </span>
          {hasDiscount && (
            <span className="text-sm text-muted-foreground line-through">
              {formatPrice(product.comparePriceCents!, product.currency)}
            </span>
          )}
        </div>

        <div className="flex items-center gap-2 pt-3 border-t">
          <Button
            size="sm"
            className="flex-1 bg-[#D66829] hover:bg-[#D66829]/90"
            onClick={handleAddToCart}
          >
            <ShoppingCart className="h-4 w-4 mr-1" />
            Agregar al carrito
          </Button>
          <Button size="sm" variant="outline" asChild>
            <Link href={`/tienda/${product.slug}`}>Ver más</Link>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
