import type { Express } from "express";
import type { Server } from "http";
import { storage } from "./storage";
import { api } from "@shared/routes";
import { z } from "zod";
import { isAuthenticated } from "./replit_integrations/auth";
import Stripe from "stripe";
import { securityHeadersMiddleware } from "./middleware/securityHeaders";
import { rateLimiters } from "./middleware/rateLimit";
import { handleStripeWebhook, rawBodyParser } from "./webhooks/stripe";
import { 
  cookieParserMiddleware, 
  validateCsrfToken, 
  generateCsrfToken 
} from "./middleware/csrf";
import {
  registerAuthModuleRoutes,
  registerProductRoutes,
  registerCartRoutes,
  registerOrderRoutes,
  registerCheckoutRoutes,
  registerFavoritesRoutes,
} from "./routes/index";

// Initialize Stripe if key is available
// Using stable API version compatible with stripe@20.1.2
// Valid Stripe API versions follow YYYY-MM-DD format
// We use 2024-12-15 which is a valid stable version with all features we need
const stripe = process.env.STRIPE_SECRET_KEY 
  ? new Stripe(process.env.STRIPE_SECRET_KEY, { apiVersion: "2024-12-15" as any })
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
  await registerAuthModuleRoutes(app);

  // ===== CSRF PROTECTION =====
  // Generate CSRF token endpoint (must be accessible before state-changing requests)
  app.get("/api/csrf-token", (req, res) => {
    generateCsrfToken(req, res);
  });

  // ===== PRODUCTS =====
  await registerProductRoutes(app);

  // ===== CART =====
  await registerCartRoutes(app);

  // ===== ORDERS =====
  await registerOrderRoutes(app);

  // ===== CHECKOUT =====
  registerCheckoutRoutes(app, stripe);

  // ===== FAVORITES =====
  await registerFavoritesRoutes(app);

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
