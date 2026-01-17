import { useState, useMemo } from "react";
import { useLocation, useSearch } from "wouter";
import { Filter, SlidersHorizontal, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { ProductGrid } from "@/components/products/ProductGrid";
import { useQuery } from "@tanstack/react-query";
import type { Product, Category } from "@shared/schema";

export default function Shop() {
  const searchString = useSearch();
  const searchParams = new URLSearchParams(searchString);
  
  const [priceRange, setPriceRange] = useState([0, 20000]);
  const [selectedCategory, setSelectedCategory] = useState(searchParams.get("category") || "all");
  const [selectedMaterial, setSelectedMaterial] = useState("all");
  const [inStockOnly, setInStockOnly] = useState(false);
  const [sortBy, setSortBy] = useState<string>("newest");
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);

  const { data: categories = [] } = useQuery<Category[]>({
    queryKey: ["/api/categories"],
  });

  const queryParams = useMemo(() => {
    const params: Record<string, string> = {};
    if (selectedCategory !== "all") params.categorySlug = selectedCategory;
    if (priceRange[0] > 0) params.minPrice = priceRange[0].toString();
    if (priceRange[1] < 20000) params.maxPrice = priceRange[1].toString();
    if (selectedMaterial !== "all") params.material = selectedMaterial;
    if (inStockOnly) params.inStock = "true";
    if (sortBy) params.sortBy = sortBy;
    if (searchParams.get("featured")) params.isFeatured = "true";
    if (searchParams.get("newArrivals")) params.isNewArrival = "true";
    return new URLSearchParams(params).toString();
  }, [selectedCategory, priceRange, selectedMaterial, inStockOnly, sortBy, searchParams]);

  const { data: products = [], isLoading } = useQuery<Product[]>({
    queryKey: ["/api/products", queryParams],
    queryFn: async () => {
      const response = await fetch(`/api/products?${queryParams}`);
      if (!response.ok) throw new Error("Failed to fetch products");
      return response.json();
    },
  });

  const materials = ["18k White Gold", "18k Yellow Gold", "18k Rose Gold", "Platinum", "14k White Gold"];

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      maximumFractionDigits: 0,
    }).format(price);
  };

  const clearFilters = () => {
    setPriceRange([0, 20000]);
    setSelectedCategory("all");
    setSelectedMaterial("all");
    setInStockOnly(false);
  };

  const FilterContent = () => (
    <div className="space-y-6">
      <div>
        <Label className="text-sm font-medium mb-3 block">Category</Label>
        <Select value={selectedCategory} onValueChange={setSelectedCategory}>
          <SelectTrigger data-testid="filter-category">
            <SelectValue placeholder="All Categories" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Categories</SelectItem>
            {categories.map((cat) => (
              <SelectItem key={cat.id} value={cat.slug}>
                {cat.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div>
        <Label className="text-sm font-medium mb-3 block">
          Price Range: {formatPrice(priceRange[0])} - {formatPrice(priceRange[1])}
        </Label>
        <Slider
          value={priceRange}
          onValueChange={setPriceRange}
          min={0}
          max={20000}
          step={500}
          className="mt-2"
          data-testid="filter-price-range"
        />
      </div>

      <div>
        <Label className="text-sm font-medium mb-3 block">Material</Label>
        <Select value={selectedMaterial} onValueChange={setSelectedMaterial}>
          <SelectTrigger data-testid="filter-material">
            <SelectValue placeholder="All Materials" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Materials</SelectItem>
            {materials.map((material) => (
              <SelectItem key={material} value={material}>
                {material}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="flex items-center space-x-2">
        <Checkbox
          id="inStock"
          checked={inStockOnly}
          onCheckedChange={(checked) => setInStockOnly(checked as boolean)}
          data-testid="filter-in-stock"
        />
        <Label htmlFor="inStock" className="text-sm font-medium cursor-pointer">
          In Stock Only
        </Label>
      </div>

      <Button variant="outline" className="w-full" onClick={clearFilters} data-testid="button-clear-filters">
        <X className="mr-2 h-4 w-4" />
        Clear Filters
      </Button>
    </div>
  );

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="font-serif text-4xl mb-2" data-testid="page-title">Shop All</h1>
        <p className="text-muted-foreground">
          Discover our complete collection of luxury jewelry
        </p>
      </div>

      <div className="flex flex-col lg:flex-row gap-8">
        <aside className="hidden lg:block w-64 flex-shrink-0">
          <div className="sticky top-24">
            <h2 className="font-semibold mb-4 flex items-center gap-2">
              <Filter className="h-4 w-4" />
              Filters
            </h2>
            <FilterContent />
          </div>
        </aside>

        <div className="flex-1">
          <div className="flex items-center justify-between mb-6 gap-4">
            <p className="text-sm text-muted-foreground" data-testid="product-count">
              {products.length} products
            </p>

            <div className="flex items-center gap-2">
              <Sheet open={mobileFiltersOpen} onOpenChange={setMobileFiltersOpen}>
                <SheetTrigger asChild>
                  <Button variant="outline" size="sm" className="lg:hidden" data-testid="button-mobile-filters">
                    <SlidersHorizontal className="mr-2 h-4 w-4" />
                    Filters
                  </Button>
                </SheetTrigger>
                <SheetContent side="left">
                  <SheetHeader>
                    <SheetTitle>Filters</SheetTitle>
                  </SheetHeader>
                  <div className="mt-6">
                    <FilterContent />
                  </div>
                </SheetContent>
              </Sheet>

              <Select value={sortBy} onValueChange={setSortBy}>
                <SelectTrigger className="w-[180px]" data-testid="sort-select">
                  <SelectValue placeholder="Sort by" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="newest">Newest</SelectItem>
                  <SelectItem value="price-asc">Price: Low to High</SelectItem>
                  <SelectItem value="price-desc">Price: High to Low</SelectItem>
                  <SelectItem value="name">Name</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <ProductGrid products={products} isLoading={isLoading} />
        </div>
      </div>
    </div>
  );
}
