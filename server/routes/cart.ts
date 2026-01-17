import type { Express } from "express";
import { storage } from "../storage";
import { api } from "@shared/routes";
import { z } from "zod";
import { rateLimiters } from "../middleware/rateLimit";
import { isAuthenticated } from "../replit_integrations/auth";

/**
 * Cart Routes Module
 * Handles all shopping cart endpoints
 */
export async function registerCartRoutes(app: Express): Promise<void> {
  // Get cart
  app.get(api.cart.get.path, rateLimiters.cart, isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const items = await storage.getCartItems(userId);
      res.json(items);
    } catch (error) {
      console.error("Error fetching cart:", error);
      res.status(500).json({ message: "Failed to fetch cart" });
    }
  });

  // Add to cart
  app.post(
    api.cart.add.path,
    rateLimiters.cart,
    isAuthenticated,
    async (req: any, res) => {
      try {
        const userId = req.user.claims.sub;
        const input = api.cart.add.input.parse(req.body);
        
        const product = await storage.getProductById(input.productId);
        if (!product) {
          return res.status(400).json({ message: "Product not found" });
        }
        
        const cartItem = await storage.addToCart(userId, input.productId, input.quantity || 1);
        res.status(201).json(cartItem);
      } catch (error) {
        if (error instanceof z.ZodError) {
          return res.status(400).json({ message: error.errors[0].message, field: error.errors[0].path.join('.') });
        }
        console.error("Error adding to cart:", error);
        res.status(500).json({ message: "Failed to add to cart" });
      }
    }
  );

  // Update cart item
  app.patch(
    api.cart.update.path,
    isAuthenticated,
    async (req: any, res) => {
      try {
        const userId = req.user.claims.sub;
        const id = Number(req.params.id);
        const input = api.cart.update.input.parse(req.body);
        
        const item = await storage.getCartItem(id, userId);
        if (!item) {
          return res.status(404).json({ message: "Cart item not found" });
        }
        
        const updated = await storage.updateCartItem(id, userId, input.quantity);
        res.json(updated);
      } catch (error) {
        if (error instanceof z.ZodError) {
          return res.status(400).json({ message: error.errors[0].message, field: error.errors[0].path.join('.') });
        }
        console.error("Error updating cart:", error);
        res.status(500).json({ message: "Failed to update cart" });
      }
    }
  );

  // Remove from cart
  app.delete(
    api.cart.remove.path,
    isAuthenticated,
    async (req: any, res) => {
      try {
        const userId = req.user.claims.sub;
        const id = Number(req.params.id);
        
        const item = await storage.getCartItem(id, userId);
        if (!item) {
          return res.status(404).json({ message: "Cart item not found" });
        }
        
        await storage.removeFromCart(id, userId);
        res.status(204).send();
      } catch (error) {
        console.error("Error removing from cart:", error);
        res.status(500).json({ message: "Failed to remove from cart" });
      }
    }
  );

  // Clear cart
  app.delete(api.cart.clear.path, isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      await storage.clearCart(userId);
      res.status(204).send();
    } catch (error) {
      console.error("Error clearing cart:", error);
      res.status(500).json({ message: "Failed to clear cart" });
    }
  });
}
