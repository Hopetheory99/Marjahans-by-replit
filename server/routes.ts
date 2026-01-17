import type { Express } from "express";
import type { Server } from "http";
import { storage } from "./storage";
import { api } from "@shared/routes";
import { z } from "zod";
import { setupAuth, registerAuthRoutes, isAuthenticated } from "./replit_integrations/auth";
import Stripe from "stripe";
import { securityHeadersMiddleware } from "./middleware/securityHeaders";
import { rateLimiters } from "./middleware/rateLimit";
import { handleStripeWebhook, rawBodyParser } from "./webhooks/stripe";
import { 
  cookieParserMiddleware, 
  validateCsrfToken, 
  generateCsrfToken 
} from "./middleware/csrf";

// Initialize Stripe if key is available
// Using stable API version compatible with stripe@20.1.2
const stripe = process.env.STRIPE_SECRET_KEY 
  ? new Stripe(process.env.STRIPE_SECRET_KEY, { apiVersion: "2025-12-15.clover" })
  : null;

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  // Apply security headers middleware to all routes
  app.use(securityHeadersMiddleware);

  // Apply CSRF protection middleware (must be after express.json() in main app setup)
  app.use(cookieParserMiddleware);
  app.use(validateCsrfToken);

  // Setup authentication
  await setupAuth(app);
  registerAuthRoutes(app);

  // ===== CSRF PROTECTION =====
  // Generate CSRF token endpoint (must be accessible before state-changing requests)
  app.get("/api/csrf-token", (req, res) => {
    generateCsrfToken(req, res);
  });

  // ===== CATEGORIES =====
  app.get(api.categories.list.path, async (req, res) => {
    try {
      const categories = await storage.getCategories();
      res.json(categories);
    } catch (error) {
      console.error("Error fetching categories:", error);
      res.status(500).json({ message: "Failed to fetch categories" });
    }
  });

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

  // ===== PRODUCTS =====
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

  // ===== CART =====
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

  app.post(api.cart.add.path, rateLimiters.cart, isAuthenticated, async (req: any, res) => {
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
  });

  app.patch(api.cart.update.path, isAuthenticated, async (req: any, res) => {
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
  });

  app.delete(api.cart.remove.path, isAuthenticated, async (req: any, res) => {
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
  });

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

  // ===== WISHLIST =====
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

  app.delete(api.wishlist.remove.path, isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const productId = Number(req.params.productId);
      
      await storage.removeFromWishlist(userId, productId);
      res.status(204).send();
    } catch (error) {
      console.error("Error removing from wishlist:", error);
      res.status(500).json({ message: "Failed to remove from wishlist" });
    }
  });

  // ===== CHECKOUT =====
  app.post(api.checkout.create.path, rateLimiters.checkout, isAuthenticated, async (req: any, res) => {
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
  });

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

  // ===== ORDERS =====
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

  // ===== WEBHOOKS =====
  // Stripe webhook endpoint (must come before body parser in middleware chain)
  app.post("/api/webhooks/stripe", rawBodyParser, handleStripeWebhook);

  // Seed database on startup
  await seedDatabase();

  return httpServer;
}

async function seedDatabase() {
  try {
    const existingCategories = await storage.getCategories();
    if (existingCategories.length > 0) {
      return; // Already seeded
    }

    console.log("Seeding database with luxury jewelry...");

    // Create categories
    const rings = await storage.createCategory({
      name: "Rings",
      slug: "rings",
      description: "Exquisite diamond and gemstone rings crafted to perfection",
      imageUrl: "https://images.unsplash.com/photo-1605100804763-247f67b3557e?w=800",
    });

    const necklaces = await storage.createCategory({
      name: "Necklaces",
      slug: "necklaces",
      description: "Elegant necklaces and pendants for every occasion",
      imageUrl: "https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?w=800",
    });

    const bracelets = await storage.createCategory({
      name: "Bracelets",
      slug: "bracelets",
      description: "Stunning bracelets in gold, silver, and platinum",
      imageUrl: "https://images.unsplash.com/photo-1611591437281-460bfbe1220a?w=800",
    });

    const earrings = await storage.createCategory({
      name: "Earrings",
      slug: "earrings",
      description: "Beautiful earrings from studs to statement pieces",
      imageUrl: "https://images.unsplash.com/photo-1535632066927-ab7c9ab60908?w=800",
    });

    // Create products
    const productsData = [
      {
        name: "Eternal Diamond Solitaire Ring",
        slug: "eternal-diamond-solitaire-ring",
        description: "A breathtaking 1.5 carat round brilliant diamond set in 18k white gold. This timeless solitaire ring features exceptional clarity and fire, perfect for marking life's most precious moments.",
        price: "8950.00",
        compareAtPrice: "10500.00",
        categoryId: rings.id,
        images: ["https://images.unsplash.com/photo-1605100804763-247f67b3557e?w=800", "https://images.unsplash.com/photo-1602751584552-8ba73aad10e1?w=800"],
        material: "18k White Gold",
        gemstone: "Diamond",
        weight: "3.2g",
        dimensions: "Band width: 2mm",
        inStock: true,
        stockQuantity: 5,
        isFeatured: true,
        isNewArrival: false,
      },
      {
        name: "Sapphire Halo Engagement Ring",
        slug: "sapphire-halo-engagement-ring",
        description: "A stunning 2 carat Ceylon blue sapphire surrounded by brilliant cut diamonds in a delicate halo setting. Set in 18k rose gold for a romantic touch.",
        price: "12500.00",
        categoryId: rings.id,
        images: ["https://images.unsplash.com/photo-1551122087-f99a4ade5734?w=800"],
        material: "18k Rose Gold",
        gemstone: "Sapphire & Diamonds",
        weight: "4.1g",
        inStock: true,
        stockQuantity: 3,
        isFeatured: true,
        isNewArrival: true,
      },
      {
        name: "Vintage Pearl Strand Necklace",
        slug: "vintage-pearl-strand-necklace",
        description: "An exquisite strand of 45 perfectly matched Akoya pearls with exceptional luster. Features a 14k white gold clasp adorned with diamonds.",
        price: "4200.00",
        categoryId: necklaces.id,
        images: ["https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?w=800"],
        material: "14k White Gold",
        gemstone: "Akoya Pearls",
        weight: "28g",
        dimensions: "Length: 18 inches",
        inStock: true,
        stockQuantity: 8,
        isFeatured: true,
        isNewArrival: false,
      },
      {
        name: "Emerald Drop Pendant",
        slug: "emerald-drop-pendant",
        description: "A magnificent 3 carat Colombian emerald pendant with diamond accents, suspended from an 18k yellow gold chain. The rich green color is truly captivating.",
        price: "15800.00",
        categoryId: necklaces.id,
        images: ["https://images.unsplash.com/photo-1515562141207-7a88fb7ce338?w=800"],
        material: "18k Yellow Gold",
        gemstone: "Colombian Emerald",
        weight: "8.5g",
        dimensions: "Chain: 16 inches",
        inStock: true,
        stockQuantity: 2,
        isFeatured: true,
        isNewArrival: true,
      },
      {
        name: "Diamond Tennis Bracelet",
        slug: "diamond-tennis-bracelet",
        description: "Classic elegance redefined with 5 carats of round brilliant diamonds set in 18k white gold. Each diamond is hand-selected for exceptional brilliance.",
        price: "9800.00",
        compareAtPrice: "12000.00",
        categoryId: bracelets.id,
        images: ["https://images.unsplash.com/photo-1611591437281-460bfbe1220a?w=800"],
        material: "18k White Gold",
        gemstone: "Diamonds",
        weight: "12g",
        dimensions: "Length: 7 inches",
        inStock: true,
        stockQuantity: 4,
        isFeatured: true,
        isNewArrival: false,
      },
      {
        name: "Gold Chain Link Bracelet",
        slug: "gold-chain-link-bracelet",
        description: "A bold statement piece featuring interlocking oval links in polished 18k yellow gold. Modern design meets timeless craftsmanship.",
        price: "3400.00",
        categoryId: bracelets.id,
        images: ["https://images.unsplash.com/photo-1573408301185-9146fe634ad0?w=800"],
        material: "18k Yellow Gold",
        weight: "18g",
        dimensions: "Length: 7.5 inches",
        inStock: true,
        stockQuantity: 6,
        isFeatured: false,
        isNewArrival: true,
      },
      {
        name: "Diamond Stud Earrings",
        slug: "diamond-stud-earrings",
        description: "Timeless 1 carat total weight diamond studs in platinum four-prong settings. Perfect for everyday elegance or special occasions.",
        price: "4500.00",
        categoryId: earrings.id,
        images: ["https://images.unsplash.com/photo-1535632066927-ab7c9ab60908?w=800"],
        material: "Platinum",
        gemstone: "Diamonds",
        weight: "2.4g",
        inStock: true,
        stockQuantity: 10,
        isFeatured: true,
        isNewArrival: false,
      },
      {
        name: "Ruby Drop Earrings",
        slug: "ruby-drop-earrings",
        description: "Stunning 2 carat total weight Burmese rubies with diamond halos, elegantly suspended in 18k white gold. The deep red color is mesmerizing.",
        price: "8200.00",
        categoryId: earrings.id,
        images: ["https://images.unsplash.com/photo-1629224316810-9d8805b95e76?w=800"],
        material: "18k White Gold",
        gemstone: "Burmese Ruby & Diamonds",
        weight: "5.8g",
        inStock: true,
        stockQuantity: 3,
        isFeatured: true,
        isNewArrival: true,
      },
      {
        name: "Platinum Wedding Band",
        slug: "platinum-wedding-band",
        description: "A refined platinum band with a brushed center and polished edges. Comfort-fit design for everyday wear. Symbol of eternal love.",
        price: "1850.00",
        categoryId: rings.id,
        images: ["https://images.unsplash.com/photo-1611652022419-a9419f74343d?w=800"],
        material: "Platinum",
        weight: "6.5g",
        dimensions: "Width: 5mm",
        inStock: true,
        stockQuantity: 15,
        isFeatured: false,
        isNewArrival: false,
      },
      {
        name: "Art Deco Diamond Pendant",
        slug: "art-deco-diamond-pendant",
        description: "Inspired by 1920s glamour, this geometric pendant features baguette and round diamonds totaling 1.8 carats in 18k white gold.",
        price: "6700.00",
        categoryId: necklaces.id,
        images: ["https://images.unsplash.com/photo-1611107683227-e9060eccd846?w=800"],
        material: "18k White Gold",
        gemstone: "Diamonds",
        weight: "5.2g",
        dimensions: "Chain: 18 inches",
        inStock: true,
        stockQuantity: 4,
        isFeatured: false,
        isNewArrival: true,
      },
    ];

    for (const product of productsData) {
      await storage.createProduct(product);
    }

    console.log("Database seeded successfully with luxury jewelry!");
  } catch (error) {
    console.error("Error seeding database:", error);
  }
}
