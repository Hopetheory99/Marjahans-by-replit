import { useState } from "react";
import { useParams, Link } from "wouter";
import { ChevronLeft, Heart, Minus, Plus, ShoppingBag, Truck, Shield, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { ProductGrid } from "@/components/products/ProductGrid";
import { useAuth } from "@/hooks/use-auth";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import type { Product, ProductWithCategory } from "@shared/schema";

export default function ProductDetail() {
  const { slug } = useParams<{ slug: string }>();
  const [quantity, setQuantity] = useState(1);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const { isAuthenticated } = useAuth();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const { data: product, isLoading } = useQuery<ProductWithCategory>({
    queryKey: ["/api/products", slug],
    queryFn: async () => {
      const response = await fetch(`/api/products/${slug}`);
      if (!response.ok) throw new Error("Product not found");
      return response.json();
    },
    enabled: !!slug,
  });

  const { data: wishlistItems = [] } = useQuery<any[]>({
    queryKey: ["/api/wishlist"],
    enabled: isAuthenticated,
  });

  const { data: relatedProducts = [] } = useQuery<Product[]>({
    queryKey: ["/api/products", "related", product?.categoryId],
    queryFn: async () => {
      if (!product?.category?.slug) return [];
      const response = await fetch(`/api/products?categorySlug=${product.category.slug}&limit=4`);
      if (!response.ok) return [];
      const products = await response.json();
      return products.filter((p: Product) => p.id !== product.id);
    },
    enabled: !!product?.category?.slug,
  });

  const isInWishlist = wishlistItems.some((item) => item.productId === product?.id);

  const addToCartMutation = useMutation({
    mutationFn: async () => {
      return apiRequest("/api/cart", {
        method: "POST",
        body: JSON.stringify({ productId: product!.id, quantity }),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/cart"] });
      toast({
        title: "Added to cart",
        description: `${product!.name} has been added to your cart.`,
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
        return apiRequest(`/api/wishlist/${product!.id}`, { method: "DELETE" });
      }
      return apiRequest("/api/wishlist", {
        method: "POST",
        body: JSON.stringify({ productId: product!.id }),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/wishlist"] });
      toast({
        title: isInWishlist ? "Removed from wishlist" : "Added to wishlist",
      });
    },
    onError: (error: any) => {
      if (error.message?.includes("401")) {
        window.location.href = "/api/login";
        return;
      }
      toast({
        title: "Error",
        description: "Failed to update wishlist.",
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

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="grid lg:grid-cols-2 gap-12">
          <div className="space-y-4">
            <Skeleton className="aspect-square rounded-lg" />
            <div className="flex gap-2">
              {[1, 2, 3].map((i) => (
                <Skeleton key={i} className="w-20 h-20 rounded-md" />
              ))}
            </div>
          </div>
          <div className="space-y-4">
            <Skeleton className="h-8 w-3/4" />
            <Skeleton className="h-6 w-1/4" />
            <Skeleton className="h-24 w-full" />
            <Skeleton className="h-12 w-full" />
          </div>
        </div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="container mx-auto px-4 py-16 text-center">
        <h1 className="text-2xl font-semibold mb-4">Product Not Found</h1>
        <p className="text-muted-foreground mb-8">
          The product you're looking for doesn't exist or has been removed.
        </p>
        <Link href="/shop">
          <Button>Continue Shopping</Button>
        </Link>
      </div>
    );
  }

  const hasDiscount = product.compareAtPrice && Number(product.compareAtPrice) > Number(product.price);
  const discountPercent = hasDiscount
    ? Math.round((1 - Number(product.price) / Number(product.compareAtPrice)) * 100)
    : 0;

  return (
    <div className="container mx-auto px-4 py-8">
      <Link href="/shop" className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground mb-6">
        <ChevronLeft className="h-4 w-4 mr-1" />
        Back to Shop
      </Link>

      <div className="grid lg:grid-cols-2 gap-12 mb-16">
        <div className="space-y-4">
          <div className="aspect-square overflow-hidden rounded-lg bg-muted">
            {product.images?.[selectedImageIndex] ? (
              <img
                src={product.images[selectedImageIndex]}
                alt={product.name}
                className="w-full h-full object-cover"
                data-testid="product-main-image"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-muted-foreground">
                No Image
              </div>
            )}
          </div>
          {product.images && product.images.length > 1 && (
            <div className="flex gap-2 overflow-x-auto">
              {product.images.map((image, index) => (
                <button
                  key={index}
                  onClick={() => setSelectedImageIndex(index)}
                  className={`w-20 h-20 flex-shrink-0 rounded-md overflow-hidden border-2 transition-colors ${
                    selectedImageIndex === index ? "border-primary" : "border-transparent"
                  }`}
                  data-testid={`product-thumbnail-${index}`}
                >
                  <img src={image} alt={`${product.name} ${index + 1}`} className="w-full h-full object-cover" />
                </button>
              ))}
            </div>
          )}
        </div>

        <div>
          {product.category && (
            <Link href={`/category/${product.category.slug}`}>
              <Badge variant="secondary" className="mb-2" data-testid="product-category">
                {product.category.name}
              </Badge>
            </Link>
          )}
          
          <h1 className="font-serif text-3xl md:text-4xl mb-4" data-testid="product-name">
            {product.name}
          </h1>

          <div className="flex items-center gap-3 mb-6">
            <span className="text-2xl font-semibold text-primary" data-testid="product-price">
              {formatPrice(product.price)}
            </span>
            {hasDiscount && (
              <>
                <span className="text-lg text-muted-foreground line-through">
                  {formatPrice(product.compareAtPrice!)}
                </span>
                <Badge variant="destructive">-{discountPercent}%</Badge>
              </>
            )}
          </div>

          <p className="text-muted-foreground mb-6 leading-relaxed" data-testid="product-description">
            {product.description}
          </p>

          <Separator className="my-6" />

          <div className="grid grid-cols-2 gap-4 mb-6 text-sm">
            {product.material && (
              <div>
                <span className="text-muted-foreground">Material:</span>
                <p className="font-medium" data-testid="product-material">{product.material}</p>
              </div>
            )}
            {product.gemstone && (
              <div>
                <span className="text-muted-foreground">Gemstone:</span>
                <p className="font-medium" data-testid="product-gemstone">{product.gemstone}</p>
              </div>
            )}
            {product.weight && (
              <div>
                <span className="text-muted-foreground">Weight:</span>
                <p className="font-medium">{product.weight}</p>
              </div>
            )}
            {product.dimensions && (
              <div>
                <span className="text-muted-foreground">Dimensions:</span>
                <p className="font-medium">{product.dimensions}</p>
              </div>
            )}
          </div>

          <Separator className="my-6" />

          <div className="space-y-4">
            <div className="flex items-center gap-4">
              <span className="text-sm font-medium">Quantity:</span>
              <div className="flex items-center border rounded-md">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setQuantity(Math.max(1, quantity - 1))}
                  disabled={quantity <= 1}
                  data-testid="button-decrease-quantity"
                >
                  <Minus className="h-4 w-4" />
                </Button>
                <span className="w-12 text-center" data-testid="quantity-value">{quantity}</span>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setQuantity(quantity + 1)}
                  disabled={quantity >= (product.stockQuantity || 10)}
                  data-testid="button-increase-quantity"
                >
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
              {product.stockQuantity && product.stockQuantity < 10 && (
                <span className="text-sm text-muted-foreground">
                  Only {product.stockQuantity} left
                </span>
              )}
            </div>

            <div className="flex gap-3">
              <Button
                size="lg"
                className="flex-1"
                onClick={() => {
                  if (!isAuthenticated) {
                    window.location.href = "/api/login";
                    return;
                  }
                  addToCartMutation.mutate();
                }}
                disabled={!product.inStock || addToCartMutation.isPending}
                data-testid="button-add-to-cart"
              >
                <ShoppingBag className="mr-2 h-5 w-5" />
                {product.inStock ? "Add to Cart" : "Out of Stock"}
              </Button>
              {isAuthenticated && (
                <Button
                  size="lg"
                  variant="outline"
                  onClick={() => toggleWishlistMutation.mutate()}
                  disabled={toggleWishlistMutation.isPending}
                  data-testid="button-wishlist"
                >
                  <Heart className={`h-5 w-5 ${isInWishlist ? "fill-destructive text-destructive" : ""}`} />
                </Button>
              )}
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4 mt-8 pt-8 border-t">
            <div className="text-center">
              <Truck className="h-6 w-6 mx-auto mb-2 text-primary" />
              <p className="text-xs text-muted-foreground">Free Shipping</p>
            </div>
            <div className="text-center">
              <Shield className="h-6 w-6 mx-auto mb-2 text-primary" />
              <p className="text-xs text-muted-foreground">Lifetime Warranty</p>
            </div>
            <div className="text-center">
              <RotateCcw className="h-6 w-6 mx-auto mb-2 text-primary" />
              <p className="text-xs text-muted-foreground">30-Day Returns</p>
            </div>
          </div>
        </div>
      </div>

      {relatedProducts.length > 0 && (
        <section>
          <h2 className="font-serif text-2xl mb-6">You May Also Like</h2>
          <ProductGrid products={relatedProducts.slice(0, 4)} />
        </section>
      )}
    </div>
  );
}
