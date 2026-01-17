import { Request, Response, NextFunction } from "express";
import Stripe from "stripe";
import { storage } from "../storage";

/**
 * Stripe Webhook Handler
 * Handles payment events from Stripe
 * - payment_intent.succeeded: Update order status to paid
 * - payment_intent.payment_failed: Update order status to failed
 * - charge.dispute.created: Log dispute event for fraud analysis
 */

const stripe = process.env.STRIPE_SECRET_KEY
  ? new Stripe(process.env.STRIPE_SECRET_KEY, { apiVersion: "2025-12-15.clover" })
  : null;

const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

/**
 * Verify webhook signature
 * Ensures the webhook came from Stripe and hasn't been tampered with
 */
export function verifyWebhookSignature(
  rawBody: Buffer | string,
  signature: string | undefined
): Stripe.Event | null {
  if (!webhookSecret) {
    console.error("STRIPE_WEBHOOK_SECRET not configured");
    return null;
  }

  if (!signature) {
    console.warn("Webhook signature missing");
    return null;
  }

  try {
    const event = stripe!.webhooks.constructEvent(
      rawBody,
      signature,
      webhookSecret
    );
    return event;
  } catch (err) {
    const error = err as Error;
    console.error(`Webhook signature verification failed: ${error.message}`);
    return null;
  }
}

/**
 * Handle payment_intent.succeeded event
 * Updates order status to "paid" and clears cart
 */
async function handlePaymentIntentSucceeded(
  event: Stripe.PaymentIntentSucceededEvent
): Promise<void> {
  const paymentIntent = event.data.object as Stripe.PaymentIntent;
  const orderId = parseInt(paymentIntent.metadata?.orderId || "0");
  const userId = paymentIntent.metadata?.userId;

  if (!orderId || !userId) {
    console.warn("Payment intent missing orderId or userId in metadata");
    return;
  }

  try {
    // Get order to verify it exists
    const order = await storage.getOrderById(orderId, userId);
    if (!order) {
      console.warn(
        `Payment succeeded for non-existent order: orderId=${orderId}, userId=${userId}`
      );
      return;
    }

    // Prevent double-processing
    if (order.status === "paid") {
      console.info(
        `Order already paid, skipping duplicate webhook: orderId=${orderId}`
      );
      return;
    }

    // Update order status to paid
    await storage.updateOrderStatus(orderId, "paid", paymentIntent.id);

    // Clear user's cart
    try {
      const cartItems = await storage.getCartItems(userId);
      for (const item of cartItems) {
        await storage.removeFromCart(item.id, userId);
      }
    } catch (cartError) {
      console.error("Error clearing cart after payment:", cartError);
      // Don't fail the webhook handler for cart clearing errors
    }

    console.info(
      `Order payment completed: orderId=${orderId}, amount=${paymentIntent.amount / 100}${paymentIntent.currency.toUpperCase()}`
    );
  } catch (error) {
    console.error("Error processing payment_intent.succeeded:", error);
    throw error;
  }
}

/**
 * Handle payment_intent.payment_failed event
 * Updates order status to "failed"
 */
async function handlePaymentIntentPaymentFailed(
  event: Stripe.PaymentIntentPaymentFailedEvent
): Promise<void> {
  const paymentIntent = event.data.object as Stripe.PaymentIntent;
  const orderId = parseInt(paymentIntent.metadata?.orderId || "0");
  const userId = paymentIntent.metadata?.userId;

  if (!orderId || !userId) {
    console.warn("Payment intent missing orderId or userId in metadata");
    return;
  }

  try {
    const order = await storage.getOrderById(orderId, userId);
    if (!order) {
      console.warn(
        `Payment failed for non-existent order: orderId=${orderId}, userId=${userId}`
      );
      return;
    }

    // Update order status to failed
    await storage.updateOrderStatus(orderId, "failed", undefined);

    console.warn(
      `Order payment failed: orderId=${orderId}, lastError=${paymentIntent.last_payment_error?.message}`
    );
  } catch (error) {
    console.error("Error processing payment_intent.payment_failed:", error);
    throw error;
  }
}

/**
 * Handle charge.dispute.created event
 * Logs dispute for fraud analysis
 */
async function handleChargeDisputeCreated(
  event: Stripe.ChargeDisputeCreatedEvent
): Promise<void> {
  const dispute = event.data.object as Stripe.Dispute;
  const chargeId = dispute.charge as string;

  try {
    // Log dispute event - in production, you might send this to a fraud detection service
    console.warn(
      `Payment dispute created: chargeId=${chargeId}, reason=${dispute.reason}, amount=${dispute.amount / 100}${dispute.currency.toUpperCase()}`
    );

    // TODO: In production, integrate with fraud detection/analysis system
    // - Store dispute in database for review
    // - Alert fraud team
    // - Implement dispute response workflow
  } catch (error) {
    console.error("Error processing charge.dispute.created:", error);
    // Don't throw - logging failures shouldn't block webhook
  }
}

/**
 * Main webhook handler
 * Verifies signature and routes to appropriate event handler
 */
export async function handleStripeWebhook(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    // Get raw body and signature from request
    const rawBody = (req as any).rawBody || Buffer.from(req.body);
    const signature = req.headers["stripe-signature"] as string | undefined;

    // Verify webhook signature
    const event = verifyWebhookSignature(rawBody, signature);

    if (!event) {
      res.status(400).json({ error: "Invalid webhook signature" });
      return;
    }

    // Log webhook receipt
    console.info(`Received Stripe webhook: type=${event.type}, id=${event.id}`);

    // Handle event based on type
    switch (event.type) {
      case "payment_intent.succeeded":
        await handlePaymentIntentSucceeded(
          event as Stripe.PaymentIntentSucceededEvent
        );
        break;

      case "payment_intent.payment_failed":
        await handlePaymentIntentPaymentFailed(
          event as Stripe.PaymentIntentPaymentFailedEvent
        );
        break;

      case "charge.dispute.created":
        await handleChargeDisputeCreated(
          event as Stripe.ChargeDisputeCreatedEvent
        );
        break;

      default:
        console.info(`Unhandled webhook event type: ${event.type}`);
    }

    // Return 200 to acknowledge receipt to Stripe
    res.json({ received: true });
  } catch (error) {
    console.error("Webhook handler error:", error);
    // Return 500 - Stripe will retry
    res.status(500).json({ error: "Webhook processing failed" });
  }
}

/**
 * Middleware to capture raw body for webhook signature verification
 * Stripe webhook signature verification requires the raw request body
 * This middleware must be applied BEFORE body parsing
 */
export function rawBodyParser(
  req: Request,
  res: Response,
  next: NextFunction
): void {
  if (req.path === "/api/webhooks/stripe") {
    let rawBody = "";
    req.setEncoding("utf8");

    req.on("data", (chunk) => {
      rawBody += chunk;
    });

    req.on("end", () => {
      (req as any).rawBody = Buffer.from(rawBody);
      next();
    });
  } else {
    next();
  }
}
