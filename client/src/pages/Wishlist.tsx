import { useEffect } from "react";
import { Link } from "wouter";
import { Heart, ShoppingBag, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuth } from "@/hooks/use-auth";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import type { WishlistItem, Product } from "@shared/schema";

type WishlistItemWithProduct = WishlistItem & { product: Product };

export default function Wishlist() {
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const { data: wishlistItems = [], isLoading } = useQuery<WishlistItemWithProduct[]>({
    queryKey: ["/api/wishlist"],
    enabled: isAuthenticated,
  });

  const removeFromWishlistMutation = useMutation({
    mutationFn: async (productId: number) => {
      return apiRequest(`/api/wishlist/${productId}`, { method: "DELETE" });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/wishlist"] });
      toast({ title: "Removed from wishlist" });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to remove item.",
        variant: "destructive",
      });
    },
  });

  const addToCartMutation = useMutation({
    mutationFn: async (productId: number) => {
      return apiRequest("/api/cart", {
        method: "POST",
        body: JSON.stringify({ productId, quantity: 1 }),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/cart"] });
      toast({ title: "Added to cart" });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to add to cart.",
        variant: "destructive",
      });
    },
  });

  const formatPrice = (price: string | number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(Number(price));
  };

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      toast({
        title: "Sign in required",
        description: "Please sign in to view your wishlist.",
        variant: "destructive",
      });
      window.location.href = "/api/login";
    }
  }, [authLoading, isAuthenticated, toast]);

  if (authLoading || isLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <h1 className="font-serif text-4xl mb-8">My Wishlist</h1>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {[1, 2, 3, 4].map((i) => (
            <Card key={i}>
              <Skeleton className="aspect-square" />
              <CardContent className="p-4 space-y-2">
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-4 w-1/2" />
                <Skeleton className="h-10 w-full" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  if (wishlistItems.length === 0) {
    return (
      <div className="container mx-auto px-4 py-16 text-center">
        <Heart className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
        <h1 className="font-serif text-3xl mb-4">Your Wishlist is Empty</h1>
        <p className="text-muted-foreground mb-8">
          Save your favorite pieces to your wishlist for easy access later.
        </p>
        <Link href="/shop">
          <Button size="lg" data-testid="button-browse-products">Browse Products</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="font-serif text-4xl mb-8" data-testid="page-title">My Wishlist</h1>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {wishlistItems.map((item) => (
          <Card key={item.id} className="group" data-testid={`wishlist-item-${item.id}`}>
            <Link href={`/product/${item.product.slug}`}>
              <div className="aspect-square overflow-hidden bg-muted">
                {item.product.images?.[0] ? (
                  <img
                    src={item.product.images[0]}
                    alt={item.product.name}
                    className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-muted-foreground">
                    No Image
                  </div>
                )}
              </div>
            </Link>
            <CardContent className="p-4">
              <Link href={`/product/${item.product.slug}`}>
                <h3 className="font-medium text-sm mb-1 line-clamp-2 hover:text-primary transition-colors">
                  {item.product.name}
                </h3>
              </Link>
              <p className="font-semibold text-primary mb-4">
                {formatPrice(item.product.price)}
              </p>
              <div className="flex gap-2">
                <Button
                  className="flex-1"
                  size="sm"
                  onClick={() => addToCartMutation.mutate(item.product.id)}
                  disabled={!item.product.inStock || addToCartMutation.isPending}
                  data-testid={`button-add-to-cart-${item.id}`}
                >
                  <ShoppingBag className="h-4 w-4 mr-2" />
                  {item.product.inStock ? "Add to Cart" : "Out of Stock"}
                </Button>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => removeFromWishlistMutation.mutate(item.product.id)}
                  disabled={removeFromWishlistMutation.isPending}
                  data-testid={`button-remove-${item.id}`}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
