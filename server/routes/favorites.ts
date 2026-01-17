import type { Express } from "express";
import { storage } from "../storage";
import { api } from "@shared/routes";
import { z } from "zod";
import { isAuthenticated } from "../replit_integrations/auth";

/**
 * Favorites Routes Module
 * Handles wishlist/favorites endpoints
 */
export async function registerFavoritesRoutes(app: Express): Promise<void> {
  // Get wishlist
  app.get(api.wishlist.get.path, isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const items = await storage.getWishlistItems(userId);
      res.json(items);
    } catch (error) {
      console.error("Error fetching wishlist:", error);
      res.status(500).json({ message: "Failed to fetch wishlist" });
    }
  });

  // Add to wishlist
  app.post(api.wishlist.add.path, isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const input = api.wishlist.add.input.parse(req.body);
      
      const product = await storage.getProductById(input.productId);
      if (!product) {
        return res.status(400).json({ message: "Product not found" });
      }
      
      const item = await storage.addToWishlist(userId, input.productId);
      res.status(201).json(item);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: error.errors[0].message, field: error.errors[0].path.join('.') });
      }
      console.error("Error adding to wishlist:", error);
      res.status(500).json({ message: "Failed to add to wishlist" });
    }
  });

  // Remove from wishlist
  app.delete(
    api.wishlist.remove.path,
    isAuthenticated,
    async (req: any, res) => {
      try {
        const userId = req.user.claims.sub;
        const productId = Number(req.params.productId);
        
        await storage.removeFromWishlist(userId, productId);
        res.status(204).send();
      } catch (error) {
        console.error("Error removing from wishlist:", error);
        res.status(500).json({ message: "Failed to remove from wishlist" });
      }
    }
  );
}
