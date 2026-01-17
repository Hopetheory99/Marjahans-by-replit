import type { Express } from "express";
import { storage } from "../storage";
import { api } from "@shared/routes";
import { isAuthenticated } from "../replit_integrations/auth";

/**
 * Orders Routes Module
 * Handles all order-related endpoints
 */
export async function registerOrderRoutes(app: Express): Promise<void> {
  // Get all orders for user
  app.get(api.orders.list.path, isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const orders = await storage.getOrders(userId);
      res.json(orders);
    } catch (error) {
      console.error("Error fetching orders:", error);
      res.status(500).json({ message: "Failed to fetch orders" });
    }
  });

  // Get single order
  app.get(api.orders.get.path, isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const id = Number(req.params.id);
      
      const order = await storage.getOrderById(id, userId);
      if (!order) {
        return res.status(404).json({ message: "Order not found" });
      }
      res.json(order);
    } catch (error) {
      console.error("Error fetching order:", error);
      res.status(500).json({ message: "Failed to fetch order" });
    }
  });
}
