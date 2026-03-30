"use client";

/**
 * CAARD - Cart Icon
 * Header component showing shopping cart icon with item count badge.
 */

import { useState } from "react";
import { ShoppingCart } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useCart } from "./cart-provider";
import { CartDrawer } from "./cart-drawer";

export function CartIcon() {
  const { itemCount } = useCart();
  const [drawerOpen, setDrawerOpen] = useState(false);

  return (
    <>
      <Button
        variant="ghost"
        size="icon"
        className="relative"
        onClick={() => setDrawerOpen(true)}
        aria-label={`Carrito (${itemCount} artículos)`}
      >
        <ShoppingCart className="h-5 w-5" />
        {itemCount > 0 && (
          <Badge className="absolute -top-1 -right-1 h-5 w-5 p-0 flex items-center justify-center text-[10px] bg-[#D66829] hover:bg-[#D66829]">
            {itemCount > 99 ? "99+" : itemCount}
          </Badge>
        )}
      </Button>

      <CartDrawer open={drawerOpen} onOpenChange={setDrawerOpen} />
    </>
  );
}
