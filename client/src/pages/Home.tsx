import { Link } from "wouter";
import { ArrowRight, Gem, Shield, Truck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ProductGrid } from "@/components/products/ProductGrid";
import { useQuery } from "@tanstack/react-query";
import type { Product, Category } from "@shared/schema";

export default function Home() {
  const { data: featuredProducts = [], isLoading: featuredLoading } = useQuery<Product[]>({
    queryKey: ["/api/products/featured"],
  });

  const { data: newArrivals = [], isLoading: arrivalsLoading } = useQuery<Product[]>({
    queryKey: ["/api/products/new-arrivals"],
  });

  const { data: categories = [] } = useQuery<Category[]>({
    queryKey: ["/api/categories"],
  });

  return (
    <div className="min-h-screen">
      <section className="relative h-[70vh] min-h-[500px] flex items-center justify-center overflow-hidden">
        <div
          className="absolute inset-0 bg-cover bg-center"
          style={{
            backgroundImage: "url('https://images.unsplash.com/photo-1515562141207-7a88fb7ce338?w=1920&q=80')",
          }}
        >
          <div className="absolute inset-0 bg-black/50" />
        </div>
        
        <div className="relative z-10 text-center px-4 max-w-4xl mx-auto">
          <h1 className="font-serif text-4xl md:text-6xl lg:text-7xl text-white mb-6 animate-fade-in">
            Timeless Elegance,
            <br />
            <span className="text-primary">Crafted for You</span>
          </h1>
          <p className="text-lg md:text-xl text-white/90 mb-8 max-w-2xl mx-auto animate-fade-in" style={{ animationDelay: "0.2s" }}>
            Discover our exquisite collection of handcrafted jewelry, where each piece tells a story of exceptional artistry and enduring beauty.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center animate-fade-in" style={{ animationDelay: "0.4s" }}>
            <Link href="/shop">
              <Button size="lg" className="min-w-[200px]" data-testid="button-shop-now">
                Shop Collection
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </Link>
            <Link href="/category/rings">
              <Button size="lg" variant="outline" className="min-w-[200px] bg-white/10 backdrop-blur border-white/30 text-white hover:bg-white/20" data-testid="button-view-rings">
                Explore Rings
              </Button>
            </Link>
          </div>
        </div>
      </section>

      <section className="py-16 bg-card">
        <div className="container mx-auto px-4">
          <h2 className="font-serif text-3xl md:text-4xl text-center mb-12" data-testid="section-collections">
            Shop by Collection
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
            {categories.map((category, index) => (
              <Link key={category.id} href={`/category/${category.slug}`}>
                <Card className="group relative aspect-square overflow-hidden cursor-pointer hover-elevate" data-testid={`category-card-${category.slug}`}>
                  {category.imageUrl && (
                    <img
                      src={category.imageUrl}
                      alt={category.name}
                      className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                    />
                  )}
                  <div className="absolute inset-0 bg-black/40 group-hover:bg-black/50 transition-colors" />
                  <CardContent className="relative h-full flex items-end p-4 md:p-6">
                    <div>
                      <h3 className="font-serif text-xl md:text-2xl text-white mb-1">{category.name}</h3>
                      <p className="text-white/80 text-sm hidden md:block">{category.description}</p>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <section className="py-16">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between mb-8">
            <h2 className="font-serif text-3xl md:text-4xl" data-testid="section-featured">
              Featured Pieces
            </h2>
            <Link href="/shop?featured=true">
              <Button variant="ghost" className="gap-2" data-testid="link-view-all-featured">
                View All
                <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
          </div>
          <ProductGrid
            products={featuredProducts.slice(0, 4)}
            isLoading={featuredLoading}
          />
        </div>
      </section>

      <section className="py-16 bg-primary/5">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between mb-8">
            <h2 className="font-serif text-3xl md:text-4xl" data-testid="section-new-arrivals">
              New Arrivals
            </h2>
            <Link href="/shop?newArrivals=true">
              <Button variant="ghost" className="gap-2" data-testid="link-view-all-new">
                View All
                <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
          </div>
          <ProductGrid
            products={newArrivals.slice(0, 4)}
            isLoading={arrivalsLoading}
          />
        </div>
      </section>

      <section className="py-16">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-3 gap-8">
            <Card className="text-center p-8">
              <CardContent className="pt-6">
                <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-primary/10 flex items-center justify-center">
                  <Gem className="h-8 w-8 text-primary" />
                </div>
                <h3 className="font-serif text-xl mb-2">Authentic Quality</h3>
                <p className="text-muted-foreground text-sm">
                  Every piece is crafted with premium materials and certified gemstones, ensuring lasting beauty.
                </p>
              </CardContent>
            </Card>
            <Card className="text-center p-8">
              <CardContent className="pt-6">
                <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-primary/10 flex items-center justify-center">
                  <Truck className="h-8 w-8 text-primary" />
                </div>
                <h3 className="font-serif text-xl mb-2">Free Shipping</h3>
                <p className="text-muted-foreground text-sm">
                  Complimentary insured shipping on all orders, with secure packaging and tracking.
                </p>
              </CardContent>
            </Card>
            <Card className="text-center p-8">
              <CardContent className="pt-6">
                <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-primary/10 flex items-center justify-center">
                  <Shield className="h-8 w-8 text-primary" />
                </div>
                <h3 className="font-serif text-xl mb-2">Lifetime Warranty</h3>
                <p className="text-muted-foreground text-sm">
                  Our commitment to quality includes a lifetime warranty on all craftsmanship.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      <section className="py-16 bg-card">
        <div className="container mx-auto px-4 text-center max-w-3xl">
          <h2 className="font-serif text-3xl md:text-4xl mb-6">Our Story</h2>
          <p className="text-muted-foreground mb-8 leading-relaxed">
            Since 1985, Marjahan's has been synonymous with exceptional jewelry craftsmanship. 
            Our artisans combine time-honored techniques with contemporary design, creating pieces 
            that capture moments and celebrate life's most precious occasions. Each creation is 
            a testament to our unwavering commitment to quality, beauty, and the art of fine jewelry.
          </p>
          <Link href="/shop">
            <Button variant="outline" size="lg" data-testid="button-discover-collection">
              Discover Our Collection
            </Button>
          </Link>
        </div>
      </section>
    </div>
  );
}
