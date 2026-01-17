import { z } from 'zod';
import { 
  insertProductSchema, 
  insertCartItemSchema, 
  shippingAddressSchema,
  products,
  categories,
  cartItems,
  orders,
  wishlistItems
} from './schema';

// ============================================
// SHARED ERROR SCHEMAS
// ============================================
export const errorSchemas = {
  validation: z.object({
    message: z.string(),
    field: z.string().optional(),
  }),
  notFound: z.object({
    message: z.string(),
  }),
  internal: z.object({
    message: z.string(),
  }),
  unauthorized: z.object({
    message: z.string(),
  }),
};

// ============================================
// API CONTRACT
// ============================================
export const api = {
  // Categories
  categories: {
    list: {
      method: 'GET' as const,
      path: '/api/categories',
      responses: {
        200: z.array(z.custom<typeof categories.$inferSelect>()),
      },
    },
    get: {
      method: 'GET' as const,
      path: '/api/categories/:slug',
      responses: {
        200: z.custom<typeof categories.$inferSelect>(),
        404: errorSchemas.notFound,
      },
    },
  },

  // Products
  products: {
    list: {
      method: 'GET' as const,
      path: '/api/products',
      input: z.object({
        search: z.string().optional(),
        categorySlug: z.string().optional(),
        minPrice: z.coerce.number().optional(),
        maxPrice: z.coerce.number().optional(),
        material: z.string().optional(),
        inStock: z.coerce.boolean().optional(),
        isFeatured: z.coerce.boolean().optional(),
        isNewArrival: z.coerce.boolean().optional(),
        sortBy: z.enum(['price-asc', 'price-desc', 'newest', 'name']).optional(),
        limit: z.coerce.number().optional(),
        offset: z.coerce.number().optional(),
      }).optional(),
      responses: {
        200: z.array(z.custom<typeof products.$inferSelect>()),
      },
    },
    get: {
      method: 'GET' as const,
      path: '/api/products/:slug',
      responses: {
        200: z.custom<typeof products.$inferSelect>(),
        404: errorSchemas.notFound,
      },
    },
    featured: {
      method: 'GET' as const,
      path: '/api/products/featured',
      responses: {
        200: z.array(z.custom<typeof products.$inferSelect>()),
      },
    },
    newArrivals: {
      method: 'GET' as const,
      path: '/api/products/new-arrivals',
      responses: {
        200: z.array(z.custom<typeof products.$inferSelect>()),
      },
    },
    search: {
      method: 'GET' as const,
      path: '/api/products/search',
      input: z.object({
        q: z.string(),
        limit: z.coerce.number().optional(),
      }),
      responses: {
        200: z.array(z.custom<typeof products.$inferSelect>()),
      },
    },
  },

  // Cart
  cart: {
    get: {
      method: 'GET' as const,
      path: '/api/cart',
      responses: {
        200: z.array(z.object({
          id: z.number(),
          userId: z.string(),
          productId: z.number(),
          quantity: z.number(),
          createdAt: z.date().nullable(),
          product: z.custom<typeof products.$inferSelect>(),
        })),
        401: errorSchemas.unauthorized,
      },
    },
    add: {
      method: 'POST' as const,
      path: '/api/cart',
      input: z.object({
        productId: z.coerce.number(),
        quantity: z.coerce.number().optional().default(1),
      }),
      responses: {
        201: z.custom<typeof cartItems.$inferSelect>(),
        400: errorSchemas.validation,
        401: errorSchemas.unauthorized,
      },
    },
    update: {
      method: 'PATCH' as const,
      path: '/api/cart/:id',
      input: z.object({
        quantity: z.coerce.number().min(1),
      }),
      responses: {
        200: z.custom<typeof cartItems.$inferSelect>(),
        400: errorSchemas.validation,
        401: errorSchemas.unauthorized,
        404: errorSchemas.notFound,
      },
    },
    remove: {
      method: 'DELETE' as const,
      path: '/api/cart/:id',
      responses: {
        204: z.void(),
        401: errorSchemas.unauthorized,
        404: errorSchemas.notFound,
      },
    },
    clear: {
      method: 'DELETE' as const,
      path: '/api/cart',
      responses: {
        204: z.void(),
        401: errorSchemas.unauthorized,
      },
    },
  },

  // Wishlist
  wishlist: {
    get: {
      method: 'GET' as const,
      path: '/api/wishlist',
      responses: {
        200: z.array(z.object({
          id: z.number(),
          userId: z.string(),
          productId: z.number(),
          createdAt: z.date().nullable(),
          product: z.custom<typeof products.$inferSelect>(),
        })),
        401: errorSchemas.unauthorized,
      },
    },
    add: {
      method: 'POST' as const,
      path: '/api/wishlist',
      input: z.object({
        productId: z.coerce.number(),
      }),
      responses: {
        201: z.custom<typeof wishlistItems.$inferSelect>(),
        400: errorSchemas.validation,
        401: errorSchemas.unauthorized,
      },
    },
    remove: {
      method: 'DELETE' as const,
      path: '/api/wishlist/:productId',
      responses: {
        204: z.void(),
        401: errorSchemas.unauthorized,
        404: errorSchemas.notFound,
      },
    },
  },

  // Checkout
  checkout: {
    create: {
      method: 'POST' as const,
      path: '/api/checkout',
      input: z.object({
        shippingAddress: shippingAddressSchema,
      }),
      responses: {
        200: z.object({
          url: z.string(),
          sessionId: z.string(),
        }),
        400: errorSchemas.validation,
        401: errorSchemas.unauthorized,
      },
    },
    success: {
      method: 'GET' as const,
      path: '/api/checkout/success',
      responses: {
        200: z.object({
          order: z.custom<typeof orders.$inferSelect>(),
        }),
        400: errorSchemas.validation,
      },
    },
  },

  // Orders
  orders: {
    list: {
      method: 'GET' as const,
      path: '/api/orders',
      responses: {
        200: z.array(z.custom<typeof orders.$inferSelect>()),
        401: errorSchemas.unauthorized,
      },
    },
    get: {
      method: 'GET' as const,
      path: '/api/orders/:id',
      responses: {
        200: z.custom<typeof orders.$inferSelect>(),
        401: errorSchemas.unauthorized,
        404: errorSchemas.notFound,
      },
    },
  },
};

// ============================================
// REQUIRED: buildUrl helper
// ============================================
export function buildUrl(path: string, params?: Record<string, string | number>): string {
  let url = path;
  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      if (url.includes(`:${key}`)) {
        url = url.replace(`:${key}`, String(value));
      }
    });
  }
  return url;
}

// ============================================
// TYPE HELPERS
// ============================================
export type CategoryResponse = z.infer<typeof api.categories.list.responses[200]>[number];
export type ProductResponse = z.infer<typeof api.products.list.responses[200]>[number];
export type CartItemResponse = z.infer<typeof api.cart.get.responses[200]>[number];
export type WishlistItemResponse = z.infer<typeof api.wishlist.get.responses[200]>[number];
export type CheckoutResponse = z.infer<typeof api.checkout.create.responses[200]>;
export type OrderResponse = z.infer<typeof api.orders.list.responses[200]>[number];
export type ValidationError = z.infer<typeof errorSchemas.validation>;
export type NotFoundError = z.infer<typeof errorSchemas.notFound>;
