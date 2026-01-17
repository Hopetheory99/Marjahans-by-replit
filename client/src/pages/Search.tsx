import { useState, useEffect, useCallback } from "react";
import { useSearch as useSearchParams, useLocation } from "wouter";
import { Search as SearchIcon, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ProductGrid } from "@/components/products/ProductGrid";
import { useQuery } from "@tanstack/react-query";
import type { Product } from "@shared/schema";

export default function Search() {
  const searchString = useSearchParams();
  const [, navigate] = useLocation();
  const searchParams = new URLSearchParams(searchString);
  const initialQuery = searchParams.get("q") || "";
  
  const [searchTerm, setSearchTerm] = useState(initialQuery);
  const [debouncedTerm, setDebouncedTerm] = useState(initialQuery);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedTerm(searchTerm);
      if (searchTerm) {
        navigate(`/search?q=${encodeURIComponent(searchTerm)}`, { replace: true });
      } else {
        navigate("/search", { replace: true });
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [searchTerm, navigate]);

  const { data: products = [], isLoading } = useQuery<Product[]>({
    queryKey: ["/api/products/search", debouncedTerm],
    queryFn: async () => {
      if (!debouncedTerm.trim()) return [];
      const response = await fetch(`/api/products/search?q=${encodeURIComponent(debouncedTerm)}`);
      if (!response.ok) return [];
      return response.json();
    },
    enabled: debouncedTerm.length > 0,
  });

  const clearSearch = () => {
    setSearchTerm("");
    setDebouncedTerm("");
    navigate("/search", { replace: true });
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-2xl mx-auto mb-12">
        <h1 className="font-serif text-4xl text-center mb-8" data-testid="page-title">
          Search Our Collection
        </h1>
        <div className="relative">
          <SearchIcon className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Search for rings, necklaces, diamonds..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-12 pr-12 h-14 text-lg"
            autoFocus
            data-testid="input-search"
          />
          {searchTerm && (
            <Button
              variant="ghost"
              size="icon"
              className="absolute right-2 top-1/2 -translate-y-1/2"
              onClick={clearSearch}
              data-testid="button-clear-search"
            >
              <X className="h-5 w-5" />
            </Button>
          )}
        </div>
      </div>

      {debouncedTerm ? (
        <>
          <div className="mb-6">
            <p className="text-muted-foreground" data-testid="search-results-count">
              {isLoading ? (
                "Searching..."
              ) : products.length === 0 ? (
                `No results found for "${debouncedTerm}"`
              ) : (
                `${products.length} ${products.length === 1 ? "result" : "results"} for "${debouncedTerm}"`
              )}
            </p>
          </div>
          <ProductGrid products={products} isLoading={isLoading} />
        </>
      ) : (
        <div className="text-center py-12">
          <SearchIcon className="h-16 w-16 mx-auto mb-4 text-muted-foreground/50" />
          <p className="text-muted-foreground">
            Enter a search term to find jewelry pieces
          </p>
        </div>
      )}
    </div>
  );
}
