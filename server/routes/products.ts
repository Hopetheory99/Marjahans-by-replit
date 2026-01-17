import type { Express } from "express";
import { storage } from "../storage";
import { api } from "@shared/routes";
import { rateLimiters } from "../middleware/rateLimit";

/**
 * Product Routes Module
 * Handles all product-related endpoints
 */
export async function registerProductRoutes(app: Express): Promise<void> {
  // Get all categories
  app.get(api.categories.list.path, async (req, res) => {
    try {
      const categories = await storage.getCategories();
      res.json(categories);
    } catch (error) {
      console.error("Error fetching categories:", error);
      res.status(500).json({ message: "Failed to fetch categories" });
    }
  });

  // Get category by slug
  app.get(api.categories.get.path, async (req, res) => {
    try {
      const category = await storage.getCategoryBySlug(req.params.slug);
      if (!category) {
        return res.status(404).json({ message: "Category not found" });
      }
      res.json(category);
    } catch (error) {
      console.error("Error fetching category:", error);
      res.status(500).json({ message: "Failed to fetch category" });
    }
  });

  // Featured products (must be before :slug route)
  app.get("/api/products/featured", async (req, res) => {
    try {
      const products = await storage.getFeaturedProducts();
      res.json(products);
    } catch (error) {
      console.error("Error fetching featured products:", error);
      res.status(500).json({ message: "Failed to fetch featured products" });
    }
  });

  // New arrivals (must be before :slug route)
  app.get("/api/products/new-arrivals", async (req, res) => {
    try {
      const products = await storage.getNewArrivals();
      res.json(products);
    } catch (error) {
      console.error("Error fetching new arrivals:", error);
      res.status(500).json({ message: "Failed to fetch new arrivals" });
    }
  });

  // Search products
  app.get("/api/products/search", rateLimiters.search, async (req, res) => {
    try {
      const q = req.query.q as string;
      const limit = req.query.limit ? Number(req.query.limit) : 20;
      
      if (!q) {
        return res.json([]);
      }
      
      const products = await storage.searchProducts(q, limit);
      res.json(products);
    } catch (error) {
      console.error("Error searching products:", error);
      res.status(500).json({ message: "Failed to search products" });
    }
  });

  // List products with filters
  app.get(api.products.list.path, async (req, res) => {
    try {
      const params = {
        search: req.query.search as string | undefined,
        categorySlug: req.query.categorySlug as string | undefined,
        minPrice: req.query.minPrice ? Number(req.query.minPrice) : undefined,
        maxPrice: req.query.maxPrice ? Number(req.query.maxPrice) : undefined,
        material: req.query.material as string | undefined,
        inStock: req.query.inStock === 'true' ? true : req.query.inStock === 'false' ? false : undefined,
        isFeatured: req.query.isFeatured === 'true' ? true : undefined,
        isNewArrival: req.query.isNewArrival === 'true' ? true : undefined,
        sortBy: req.query.sortBy as any,
        limit: req.query.limit ? Number(req.query.limit) : undefined,
        offset: req.query.offset ? Number(req.query.offset) : undefined,
      };
      
      const products = await storage.getProducts(params);
      res.json(products);
    } catch (error) {
      console.error("Error fetching products:", error);
      res.status(500).json({ message: "Failed to fetch products" });
    }
  });

  // Get single product by slug
  app.get(api.products.get.path, async (req, res) => {
    try {
      const product = await storage.getProductBySlug(req.params.slug);
      if (!product) {
        return res.status(404).json({ message: "Product not found" });
      }
      res.json(product);
    } catch (error) {
      console.error("Error fetching product:", error);
      res.status(500).json({ message: "Failed to fetch product" });
    }
  });
}
