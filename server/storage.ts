import { db } from "./db";
import {
  categories,
  products,
  cartItems,
  orders,
  orderItems,
  wishlistItems,
  type Category,
  type InsertCategory,
  type Product,
  type InsertProduct,
  type CartItem,
  type Order,
  type InsertOrder,
  type OrderItem,
  type InsertOrderItem,
  type WishlistItem,
  type ProductsQueryParams,
  type CartItemWithProduct,
  type ProductWithCategory,
} from "@shared/schema";
import { eq, and, ilike, gte, lte, desc, asc, or, sql } from "drizzle-orm";

export interface IStorage {
  // Categories
  getCategories(): Promise<Category[]>;
  getCategoryBySlug(slug: string): Promise<Category | undefined>;
  createCategory(category: InsertCategory): Promise<Category>;
  
  // Products
  getProducts(params?: ProductsQueryParams): Promise<Product[]>;
  getProductBySlug(slug: string): Promise<ProductWithCategory | undefined>;
  getProductById(id: number): Promise<Product | undefined>;
  getFeaturedProducts(limit?: number): Promise<Product[]>;
  getNewArrivals(limit?: number): Promise<Product[]>;
  searchProducts(query: string, limit?: number): Promise<Product[]>;
  createProduct(product: InsertProduct): Promise<Product>;
  
  // Cart
  getCartItems(userId: string): Promise<CartItemWithProduct[]>;
  getCartItem(id: number, userId: string): Promise<CartItem | undefined>;
  getCartItemByProduct(userId: string, productId: number): Promise<CartItem | undefined>;
  addToCart(userId: string, productId: number, quantity: number): Promise<CartItem>;
  updateCartItem(id: number, userId: string, quantity: number): Promise<CartItem | undefined>;
  removeFromCart(id: number, userId: string): Promise<void>;
  clearCart(userId: string): Promise<void>;
  
  // Wishlist
  getWishlistItems(userId: string): Promise<(WishlistItem & { product: Product })[]>;
  addToWishlist(userId: string, productId: number): Promise<WishlistItem>;
  removeFromWishlist(userId: string, productId: number): Promise<void>;
  isInWishlist(userId: string, productId: number): Promise<boolean>;
  
  // Orders
  getOrders(userId: string): Promise<Order[]>;
  getOrderById(id: number, userId: string): Promise<Order | undefined>;
  createOrder(order: InsertOrder): Promise<Order>;
  updateOrderStatus(id: number, status: string, paymentIntentId?: string): Promise<Order | undefined>;
  createOrderItem(item: InsertOrderItem): Promise<OrderItem>;
}

export class DatabaseStorage implements IStorage {
  // Categories
  async getCategories(): Promise<Category[]> {
    return await db.select().from(categories).orderBy(categories.name);
  }

  async getCategoryBySlug(slug: string): Promise<Category | undefined> {
    const [category] = await db.select().from(categories).where(eq(categories.slug, slug));
    return category;
  }

  async createCategory(category: InsertCategory): Promise<Category> {
    const [created] = await db.insert(categories).values(category).returning();
    return created;
  }

  // Products
  async getProducts(params?: ProductsQueryParams): Promise<Product[]> {
    let query = db.select().from(products).$dynamic();
    
    const conditions = [];
    
    if (params?.categorySlug) {
      const category = await this.getCategoryBySlug(params.categorySlug);
      if (category) {
        conditions.push(eq(products.categoryId, category.id));
      }
    }
    
    if (params?.search) {
      conditions.push(
        or(
          ilike(products.name, `%${params.search}%`),
          ilike(products.description, `%${params.search}%`)
        )
      );
    }
    
    if (params?.minPrice !== undefined) {
      conditions.push(gte(products.price, params.minPrice.toString()));
    }
    
    if (params?.maxPrice !== undefined) {
      conditions.push(lte(products.price, params.maxPrice.toString()));
    }
    
    if (params?.material) {
      conditions.push(eq(products.material, params.material));
    }
    
    if (params?.inStock !== undefined) {
      conditions.push(eq(products.inStock, params.inStock));
    }
    
    if (params?.isFeatured !== undefined) {
      conditions.push(eq(products.isFeatured, params.isFeatured));
    }
    
    if (params?.isNewArrival !== undefined) {
      conditions.push(eq(products.isNewArrival, params.isNewArrival));
    }
    
    if (conditions.length > 0) {
      query = query.where(and(...conditions));
    }
    
    // Sorting
    switch (params?.sortBy) {
      case 'price-asc':
        query = query.orderBy(asc(products.price));
        break;
      case 'price-desc':
        query = query.orderBy(desc(products.price));
        break;
      case 'newest':
        query = query.orderBy(desc(products.createdAt));
        break;
      case 'name':
        query = query.orderBy(asc(products.name));
        break;
      default:
        query = query.orderBy(desc(products.createdAt));
    }
    
    if (params?.limit) {
      query = query.limit(params.limit);
    }
    
    if (params?.offset) {
      query = query.offset(params.offset);
    }
    
    return await query;
  }

  async getProductBySlug(slug: string): Promise<ProductWithCategory | undefined> {
    const result = await db
      .select({
        product: products,
        category: categories,
      })
      .from(products)
      .leftJoin(categories, eq(products.categoryId, categories.id))
      .where(eq(products.slug, slug));
    
    if (result.length === 0) return undefined;
    
    return {
      ...result[0].product,
      category: result[0].category,
    };
  }

  async getProductById(id: number): Promise<Product | undefined> {
    const [product] = await db.select().from(products).where(eq(products.id, id));
    return product;
  }

  async getFeaturedProducts(limit = 8): Promise<Product[]> {
    return await db
      .select()
      .from(products)
      .where(eq(products.isFeatured, true))
      .limit(limit);
  }

  async getNewArrivals(limit = 8): Promise<Product[]> {
    return await db
      .select()
      .from(products)
      .where(eq(products.isNewArrival, true))
      .orderBy(desc(products.createdAt))
      .limit(limit);
  }

  async searchProducts(query: string, limit = 20): Promise<Product[]> {
    return await db
      .select()
      .from(products)
      .where(
        or(
          ilike(products.name, `%${query}%`),
          ilike(products.description, `%${query}%`),
          ilike(products.material, `%${query}%`),
          ilike(products.gemstone, `%${query}%`)
        )
      )
      .limit(limit);
  }

  async createProduct(product: InsertProduct): Promise<Product> {
    const [created] = await db.insert(products).values(product).returning();
    return created;
  }

  // Cart
  async getCartItems(userId: string): Promise<CartItemWithProduct[]> {
    const result = await db
      .select({
        cartItem: cartItems,
        product: products,
      })
      .from(cartItems)
      .innerJoin(products, eq(cartItems.productId, products.id))
      .where(eq(cartItems.userId, userId));
    
    return result.map(r => ({
      ...r.cartItem,
      product: r.product,
    }));
  }

  async getCartItem(id: number, userId: string): Promise<CartItem | undefined> {
    const [item] = await db
      .select()
      .from(cartItems)
      .where(and(eq(cartItems.id, id), eq(cartItems.userId, userId)));
    return item;
  }

  async getCartItemByProduct(userId: string, productId: number): Promise<CartItem | undefined> {
    const [item] = await db
      .select()
      .from(cartItems)
      .where(and(eq(cartItems.userId, userId), eq(cartItems.productId, productId)));
    return item;
  }

  async addToCart(userId: string, productId: number, quantity: number): Promise<CartItem> {
    // Check if item already in cart
    const existing = await this.getCartItemByProduct(userId, productId);
    if (existing) {
      const [updated] = await db
        .update(cartItems)
        .set({ quantity: existing.quantity + quantity })
        .where(eq(cartItems.id, existing.id))
        .returning();
      return updated;
    }
    
    const [created] = await db
      .insert(cartItems)
      .values({ userId, productId, quantity })
      .returning();
    return created;
  }

  async updateCartItem(id: number, userId: string, quantity: number): Promise<CartItem | undefined> {
    const [updated] = await db
      .update(cartItems)
      .set({ quantity })
      .where(and(eq(cartItems.id, id), eq(cartItems.userId, userId)))
      .returning();
    return updated;
  }

  async removeFromCart(id: number, userId: string): Promise<void> {
    await db
      .delete(cartItems)
      .where(and(eq(cartItems.id, id), eq(cartItems.userId, userId)));
  }

  async clearCart(userId: string): Promise<void> {
    await db.delete(cartItems).where(eq(cartItems.userId, userId));
  }

  // Wishlist
  async getWishlistItems(userId: string): Promise<(WishlistItem & { product: Product })[]> {
    const result = await db
      .select({
        wishlistItem: wishlistItems,
        product: products,
      })
      .from(wishlistItems)
      .innerJoin(products, eq(wishlistItems.productId, products.id))
      .where(eq(wishlistItems.userId, userId));
    
    return result.map(r => ({
      ...r.wishlistItem,
      product: r.product,
    }));
  }

  async addToWishlist(userId: string, productId: number): Promise<WishlistItem> {
    // Check if already in wishlist
    const existing = await this.isInWishlist(userId, productId);
    if (existing) {
      const [item] = await db
        .select()
        .from(wishlistItems)
        .where(and(eq(wishlistItems.userId, userId), eq(wishlistItems.productId, productId)));
      return item;
    }
    
    const [created] = await db
      .insert(wishlistItems)
      .values({ userId, productId })
      .returning();
    return created;
  }

  async removeFromWishlist(userId: string, productId: number): Promise<void> {
    await db
      .delete(wishlistItems)
      .where(and(eq(wishlistItems.userId, userId), eq(wishlistItems.productId, productId)));
  }

  async isInWishlist(userId: string, productId: number): Promise<boolean> {
    const [item] = await db
      .select()
      .from(wishlistItems)
      .where(and(eq(wishlistItems.userId, userId), eq(wishlistItems.productId, productId)));
    return !!item;
  }

  // Orders
  async getOrders(userId: string): Promise<Order[]> {
    return await db
      .select()
      .from(orders)
      .where(eq(orders.userId, userId))
      .orderBy(desc(orders.createdAt));
  }

  async getOrderById(id: number, userId: string): Promise<Order | undefined> {
    const [order] = await db
      .select()
      .from(orders)
      .where(and(eq(orders.id, id), eq(orders.userId, userId)));
    return order;
  }

  async createOrder(order: InsertOrder): Promise<Order> {
    const [created] = await db.insert(orders).values(order).returning();
    return created;
  }

  async updateOrderStatus(id: number, status: string, paymentIntentId?: string): Promise<Order | undefined> {
    const updates: any = { status, updatedAt: new Date() };
    if (paymentIntentId) {
      updates.stripePaymentIntentId = paymentIntentId;
    }
    const [updated] = await db
      .update(orders)
      .set(updates)
      .where(eq(orders.id, id))
      .returning();
    return updated;
  }

  async createOrderItem(item: InsertOrderItem): Promise<OrderItem> {
    const [created] = await db.insert(orderItems).values(item).returning();
    return created;
  }
}

export const storage = new DatabaseStorage();
