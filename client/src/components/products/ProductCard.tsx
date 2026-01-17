import { Link } from "wouter";
import { Heart, ShoppingBag } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/hooks/use-auth";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import type { Product } from "@shared/schema";

interface ProductCardProps {
  product: Product;
  isInWishlist?: boolean;
}

export function ProductCard({ product, isInWishlist = false }: ProductCardProps) {
  const { isAuthenticated } = useAuth();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const formatPrice = (price: string | number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(Number(price));
  };

  const addToCartMutation = useMutation({
    mutationFn: async () => {
      return apiRequest("/api/cart", {
        method: "POST",
        body: JSON.stringify({ productId: product.id, quantity: 1 }),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/cart"] });
      toast({
        title: "Added to cart",
        description: `${product.name} has been added to your cart.`,
      });
    },
    onError: (error: any) => {
      if (error.message?.includes("401")) {
        window.location.href = "/api/login";
        return;
      }
      toast({
        title: "Error",
        description: "Failed to add to cart. Please try again.",
        variant: "destructive",
      });
    },
  });

  const toggleWishlistMutation = useMutation({
    mutationFn: async () => {
      if (isInWishlist) {
        return apiRequest(`/api/wishlist/${product.id}`, { method: "DELETE" });
      }
      return apiRequest("/api/wishlist", {
        method: "POST",
        body: JSON.stringify({ productId: product.id }),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/wishlist"] });
      toast({
        title: isInWishlist ? "Removed from wishlist" : "Added to wishlist",
        description: isInWishlist
          ? `${product.name} has been removed from your wishlist.`
          : `${product.name} has been added to your wishlist.`,
      });
    },
    onError: (error: any) => {
      if (error.message?.includes("401")) {
        window.location.href = "/api/login";
        return;
      }
      toast({
        title: "Error",
        description: "Failed to update wishlist. Please try again.",
        variant: "destructive",
      });
    },
  });

  const hasDiscount = product.compareAtPrice && Number(product.compareAtPrice) > Number(product.price);
  const discountPercent = hasDiscount
    ? Math.round((1 - Number(product.price) / Number(product.compareAtPrice)) * 100)
    : 0;

  return (
    <Card className="group relative overflow-visible border-0 shadow-none bg-transparent" data-testid={`product-card-${product.id}`}>
      <Link href={`/product/${product.slug}`}>
        <div className="relative aspect-square overflow-hidden rounded-lg bg-muted mb-4">
          {product.images?.[0] ? (
            <img
              src={product.images[0]}
              alt={product.name}
              className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
              loading="lazy"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-muted-foreground">
              No Image
            </div>
          )}
          
          <div className="absolute top-2 left-2 flex flex-col gap-1">
            {product.isNewArrival && (
              <Badge variant="secondary" className="bg-primary text-primary-foreground">
                New
              </Badge>
            )}
            {hasDiscount && (
              <Badge variant="destructive">
                -{discountPercent}%
              </Badge>
            )}
          </div>
        </div>
      </Link>

      <div className="absolute top-2 right-2 flex flex-col gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
        {isAuthenticated && (
          <Button
            variant="secondary"
            size="icon"
            className="rounded-full bg-background/80 backdrop-blur"
            onClick={(e) => {
              e.preventDefault();
              toggleWishlistMutation.mutate();
            }}
            disabled={toggleWishlistMutation.isPending}
            data-testid={`button-wishlist-${product.id}`}
          >
            <Heart
              className={`h-4 w-4 ${isInWishlist ? "fill-destructive text-destructive" : ""}`}
            />
          </Button>
        )}
        <Button
          variant="secondary"
          size="icon"
          className="rounded-full bg-background/80 backdrop-blur"
          onClick={(e) => {
            e.preventDefault();
            if (!isAuthenticated) {
              window.location.href = "/api/login";
              return;
            }
            addToCartMutation.mutate();
          }}
          disabled={addToCartMutation.isPending || !product.inStock}
          data-testid={`button-add-to-cart-${product.id}`}
        >
          <ShoppingBag className="h-4 w-4" />
        </Button>
      </div>

      <CardContent className="p-0">
        <Link href={`/product/${product.slug}`}>
          <h3 className="font-medium text-sm mb-1 line-clamp-2 group-hover:text-primary transition-colors" data-testid={`product-name-${product.id}`}>
            {product.name}
          </h3>
        </Link>
        {product.material && (
          <p className="text-xs text-muted-foreground mb-2">{product.material}</p>
        )}
        <div className="flex items-center gap-2">
          <span className="font-semibold text-primary" data-testid={`product-price-${product.id}`}>
            {formatPrice(product.price)}
          </span>
          {hasDiscount && (
            <span className="text-sm text-muted-foreground line-through">
              {formatPrice(product.compareAtPrice!)}
            </span>
          )}
        </div>
        {!product.inStock && (
          <Badge variant="outline" className="mt-2">
            Out of Stock
          </Badge>
        )}
      </CardContent>
    </Card>
  );
}
