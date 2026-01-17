import { useParams, Link } from "wouter";
import { ChevronLeft } from "lucide-react";
import { ProductGrid } from "@/components/products/ProductGrid";
import { Skeleton } from "@/components/ui/skeleton";
import { useQuery } from "@tanstack/react-query";
import type { Product, Category as CategoryType } from "@shared/schema";

export default function Category() {
  const { slug } = useParams<{ slug: string }>();

  const { data: category, isLoading: categoryLoading } = useQuery<CategoryType>({
    queryKey: ["/api/categories", slug],
    queryFn: async () => {
      const response = await fetch(`/api/categories/${slug}`);
      if (!response.ok) throw new Error("Category not found");
      return response.json();
    },
    enabled: !!slug,
  });

  const { data: products = [], isLoading: productsLoading } = useQuery<Product[]>({
    queryKey: ["/api/products", "category", slug],
    queryFn: async () => {
      const response = await fetch(`/api/products?categorySlug=${slug}`);
      if (!response.ok) return [];
      return response.json();
    },
    enabled: !!slug,
  });

  if (categoryLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Skeleton className="h-6 w-32 mb-6" />
        <Skeleton className="h-64 w-full rounded-lg mb-8" />
        <Skeleton className="h-8 w-48 mb-4" />
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="space-y-4">
              <Skeleton className="aspect-square rounded-lg" />
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-4 w-1/2" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (!category) {
    return (
      <div className="container mx-auto px-4 py-16 text-center">
        <h1 className="text-2xl font-semibold mb-4">Category Not Found</h1>
        <p className="text-muted-foreground mb-8">
          The category you're looking for doesn't exist.
        </p>
        <Link href="/shop">
          <button className="text-primary hover:underline">Browse All Products</button>
        </Link>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <Link href="/shop" className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground mb-6">
        <ChevronLeft className="h-4 w-4 mr-1" />
        Back to Shop
      </Link>

      {category.imageUrl && (
        <div className="relative h-64 md:h-80 rounded-lg overflow-hidden mb-8">
          <img
            src={category.imageUrl}
            alt={category.name}
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
            <div className="text-center text-white">
              <h1 className="font-serif text-4xl md:text-5xl mb-2" data-testid="category-title">
                {category.name}
              </h1>
              {category.description && (
                <p className="text-white/90 max-w-xl mx-auto" data-testid="category-description">
                  {category.description}
                </p>
              )}
            </div>
          </div>
        </div>
      )}

      <div className="mb-6">
        <p className="text-sm text-muted-foreground" data-testid="product-count">
          {products.length} {products.length === 1 ? "product" : "products"}
        </p>
      </div>

      <ProductGrid products={products} isLoading={productsLoading} />
    </div>
  );
}
