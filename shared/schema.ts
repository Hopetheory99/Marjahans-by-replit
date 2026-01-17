import { sql } from "drizzle-orm";
import { pgTable, text, varchar, serial, integer, boolean, timestamp, decimal, jsonb, index } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Re-export auth models
export * from "./models/auth";

// === PRODUCT CATEGORIES ===
export const categories = pgTable("categories", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  slug: text("slug").notNull().unique(),
  description: text("description"),
  imageUrl: text("image_url"),
  createdAt: timestamp("created_at").defaultNow(),
});

// === PRODUCTS ===
export const products = pgTable("products", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  slug: text("slug").notNull().unique(),
  description: text("description").notNull(),
  price: decimal("price", { precision: 10, scale: 2 }).notNull(),
  compareAtPrice: decimal("compare_at_price", { precision: 10, scale: 2 }),
  categoryId: integer("category_id").references(() => categories.id),
  images: text("images").array().notNull().default(sql`ARRAY[]::text[]`),
  material: text("material"),
  gemstone: text("gemstone"),
  weight: text("weight"),
  dimensions: text("dimensions"),
  inStock: boolean("in_stock").default(true),
  stockQuantity: integer("stock_quantity").default(0),
  isFeatured: boolean("is_featured").default(false),
  isNewArrival: boolean("is_new_arrival").default(false),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => [
  // Index for sorting and filtering by creation date
  index("idx_products_created_at").on(table.createdAt),
  // Index for featured products query
  index("idx_products_is_featured").on(table.isFeatured),
  // Index for new arrivals query
  index("idx_products_is_new_arrival").on(table.isNewArrival),
  // Index for category lookups
  index("idx_products_category_id").on(table.categoryId),
]);

// === CART ITEMS ===
export const cartItems = pgTable("cart_items", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").notNull(),
  productId: integer("product_id").references(() => products.id).notNull(),
  quantity: integer("quantity").notNull().default(1),
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => [
  // Index for user's cart lookup
  index("idx_cart_items_user_id").on(table.userId),
  // Index for product lookups in cart
  index("idx_cart_items_product_id").on(table.productId),
]);

// === ORDERS ===
export const orders = pgTable("orders", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").notNull(),
  status: text("status").notNull().default("pending"),
  totalAmount: decimal("total_amount", { precision: 10, scale: 2 }).notNull(),
  shippingAddress: jsonb("shipping_address"),
  stripeSessionId: text("stripe_session_id"),
  stripePaymentIntentId: text("stripe_payment_intent_id"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => [
  // Index for user's order lookup
  index("idx_orders_user_id").on(table.userId),
  // Index for order status filtering
  index("idx_orders_status").on(table.status),
  // Index for sorting orders by creation date
  index("idx_orders_created_at").on(table.createdAt),
]);

// === ORDER ITEMS ===
export const orderItems = pgTable("order_items", {
  id: serial("id").primaryKey(),
  orderId: integer("order_id").references(() => orders.id).notNull(),
  productId: integer("product_id").references(() => products.id).notNull(),
  quantity: integer("quantity").notNull(),
  priceAtPurchase: decimal("price_at_purchase", { precision: 10, scale: 2 }).notNull(),
});

// === WISHLIST ===
export const wishlistItems = pgTable("wishlist_items", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").notNull(),
  productId: integer("product_id").references(() => products.id).notNull(),
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => [
  // Index for user's wishlist lookup
  index("idx_wishlist_items_user_id").on(table.userId),
  // Index for product lookups in wishlist
  index("idx_wishlist_items_product_id").on(table.productId),
]);

// === RELATIONS ===
export const categoriesRelations = relations(categories, ({ many }) => ({
  products: many(products),
}));

export const productsRelations = relations(products, ({ one }) => ({
  category: one(categories, {
    fields: [products.categoryId],
    references: [categories.id],
  }),
}));

export const cartItemsRelations = relations(cartItems, ({ one }) => ({
  product: one(products, {
    fields: [cartItems.productId],
    references: [products.id],
  }),
}));

export const ordersRelations = relations(orders, ({ many }) => ({
  items: many(orderItems),
}));

export const orderItemsRelations = relations(orderItems, ({ one }) => ({
  order: one(orders, {
    fields: [orderItems.orderId],
    references: [orders.id],
  }),
  product: one(products, {
    fields: [orderItems.productId],
    references: [products.id],
  }),
}));

// === BASE SCHEMAS ===
export const insertCategorySchema = createInsertSchema(categories).omit({ id: true, createdAt: true });
export const insertProductSchema = createInsertSchema(products).omit({ id: true, createdAt: true, updatedAt: true });
export const insertCartItemSchema = createInsertSchema(cartItems).omit({ id: true, createdAt: true });
export const insertOrderSchema = createInsertSchema(orders).omit({ id: true, createdAt: true, updatedAt: true });
export const insertOrderItemSchema = createInsertSchema(orderItems).omit({ id: true });
export const insertWishlistItemSchema = createInsertSchema(wishlistItems).omit({ id: true, createdAt: true });

// === EXPLICIT API CONTRACT TYPES ===
export type Category = typeof categories.$inferSelect;
export type InsertCategory = z.infer<typeof insertCategorySchema>;
export type Product = typeof products.$inferSelect;
export type InsertProduct = z.infer<typeof insertProductSchema>;
export type CartItem = typeof cartItems.$inferSelect;
export type InsertCartItem = z.infer<typeof insertCartItemSchema>;
export type Order = typeof orders.$inferSelect;
export type InsertOrder = z.infer<typeof insertOrderSchema>;
export type OrderItem = typeof orderItems.$inferSelect;
export type InsertOrderItem = z.infer<typeof insertOrderItemSchema>;
export type WishlistItem = typeof wishlistItems.$inferSelect;
export type InsertWishlistItem = z.infer<typeof insertWishlistItemSchema>;

// Request/Response types
export type CreateCartItemRequest = { productId: number; quantity?: number };
export type UpdateCartItemRequest = { quantity: number };
export type ProductWithCategory = Product & { category?: Category | null };
export type CartItemWithProduct = CartItem & { product: Product };
export type OrderWithItems = Order & { items: (OrderItem & { product: Product })[] };

// Search/filter types
export interface ProductsQueryParams {
  search?: string;
  categorySlug?: string;
  minPrice?: number;
  maxPrice?: number;
  material?: string;
  inStock?: boolean;
  isFeatured?: boolean;
  isNewArrival?: boolean;
  sortBy?: 'price-asc' | 'price-desc' | 'newest' | 'name';
  limit?: number;
  offset?: number;
}

// Shipping address schema
export const shippingAddressSchema = z.object({
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().min(1, "Last name is required"),
  email: z.string().email("Valid email is required"),
  phone: z.string().min(10, "Valid phone number is required"),
  address: z.string().min(5, "Address is required"),
  city: z.string().min(2, "City is required"),
  state: z.string().min(2, "State is required"),
  zipCode: z.string().min(5, "ZIP code is required"),
  country: z.string().min(2, "Country is required"),
});

export type ShippingAddress = z.infer<typeof shippingAddressSchema>;

// Checkout request
export const checkoutRequestSchema = z.object({
  shippingAddress: shippingAddressSchema,
});

export type CheckoutRequest = z.infer<typeof checkoutRequestSchema>;
