import type { Express } from "express";
import Stripe from "stripe";
import { storage } from "../storage";
import { api } from "@shared/routes";
import { z } from "zod";
import { rateLimiters } from "../middleware/rateLimit";
import { isAuthenticated } from "../replit_integrations/auth";

/**
 * Checkout Routes Module
 * Handles checkout flow and Stripe webhook processing
 */
export function registerCheckoutRoutes(
  app: Express,
  stripe: Stripe | null
): void {
  // Create checkout session
  app.post(
    api.checkout.create.path,
    rateLimiters.checkout,
    isAuthenticated,
    async (req: any, res) => {
      try {
        if (!stripe) {
          return res.status(400).json({ message: "Payment system not configured. Please contact support." });
        }
        
        const userId = req.user.claims.sub;
        const input = api.checkout.create.input.parse(req.body);
        
        // Get cart items
        const cartItems = await storage.getCartItems(userId);
        if (cartItems.length === 0) {
          return res.status(400).json({ message: "Cart is empty" });
        }
        
        // Calculate total
        const total = cartItems.reduce((sum, item) => {
          return sum + (Number(item.product.price) * item.quantity);
        }, 0);
        
        // Create order
        const order = await storage.createOrder({
          userId,
          status: "pending",
          totalAmount: total.toFixed(2),
          shippingAddress: input.shippingAddress,
        });
        
        // Create order items
        for (const item of cartItems) {
          await storage.createOrderItem({
            orderId: order.id,
            productId: item.productId,
            quantity: item.quantity,
            priceAtPurchase: item.product.price,
          });
        }
        
        // Create Stripe checkout session
        const session = await stripe.checkout.sessions.create({
          payment_method_types: ["card"],
          line_items: cartItems.map(item => ({
            price_data: {
              currency: "usd",
              product_data: {
                name: item.product.name,
                description: item.product.description,
                images: item.product.images?.length ? [item.product.images[0]] : [],
              },
              unit_amount: Math.round(Number(item.product.price) * 100),
            },
            quantity: item.quantity,
          })),
          mode: "payment",
          success_url: `${req.protocol}://${req.get('host')}/checkout/success?session_id={CHECKOUT_SESSION_ID}`,
          cancel_url: `${req.protocol}://${req.get('host')}/cart`,
          metadata: {
            orderId: order.id.toString(),
            userId: userId,
          },
        });
        
        // Update order with session ID
        await storage.updateOrderStatus(order.id, "pending", undefined);
        
        res.json({ url: session.url, sessionId: session.id });
      } catch (error) {
        if (error instanceof z.ZodError) {
          return res.status(400).json({ message: error.errors[0].message, field: error.errors[0].path.join('.') });
        }
        console.error("Error creating checkout:", error);
        res.status(500).json({ message: "Failed to create checkout session" });
      }
    }
  );

  // Checkout success
  app.get(api.checkout.success.path, isAuthenticated, async (req: any, res) => {
    try {
      if (!stripe) {
        return res.status(400).json({ message: "Payment system not configured" });
      }
      
      const userId = req.user.claims.sub;
      const sessionId = req.query.session_id as string;
      if (!sessionId) {
        return res.status(400).json({ message: "Session ID required" });
      }
      
      const session = await stripe.checkout.sessions.retrieve(sessionId);
      
      if (session.payment_status === "paid" && session.metadata?.orderId) {
        const orderId = Number(session.metadata.orderId);
        
        // Verify order ownership before updating status (prevent cross-user order fraud)
        const order = await storage.getOrderById(orderId, userId);
        if (!order) {
          console.warn(`Security: Unauthorized checkout success attempt - userId=${userId}, orderId=${orderId}`);
          return res.status(404).json({ message: "Order not found" });
        }
        
        // Prevent double-payment fraud
        if (order.status === "paid") {
          console.warn(`Security: Duplicate payment confirmation - userId=${userId}, orderId=${orderId}`);
          return res.status(400).json({ message: "Payment already processed" });
        }
        
        await storage.updateOrderStatus(orderId, "paid", session.payment_intent as string);
        await storage.clearCart(userId);
        
        console.log(`[AUDIT] Payment confirmed: orderId=${orderId}, userId=${userId}, amount=${order.totalAmount}`);
        res.json({ order: { id: orderId, status: "paid" } });
      } else {
        res.status(400).json({ message: "Payment not completed" });
      }
    } catch (error) {
      console.error("Error processing checkout success:", error);
      res.status(500).json({ message: "Failed to process payment confirmation" });
    }
  });
}
