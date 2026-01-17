import { Request, Response, NextFunction } from "express";

interface RateLimitStore {
  [ip: string]: {
    count: number;
    resetTime: number;
  };
}

interface RateLimitConfig {
  windowMs: number; // Time window in milliseconds
  maxRequests: number; // Max requests per window
  message?: string;
}

const stores: { [key: string]: RateLimitStore } = {};

/**
 * Create a rate limiting middleware
 * Prevents brute force and DoS attacks by limiting requests per IP
 *
 * @param config - Configuration object with windowMs and maxRequests
 * @returns Express middleware function
 */
export function createRateLimiter(config: RateLimitConfig) {
  const { windowMs, maxRequests, message = "Too many requests, please try again later" } = config;
  const store: RateLimitStore = {};

  return (req: Request, res: Response, next: NextFunction) => {
    const ip = req.ip || req.socket.remoteAddress || "unknown";
    const now = Date.now();

    // Initialize or get the rate limit entry for this IP
    if (!store[ip]) {
      store[ip] = { count: 1, resetTime: now + windowMs };
      next();
      return;
    }

    // Check if the window has expired
    if (now > store[ip].resetTime) {
      store[ip] = { count: 1, resetTime: now + windowMs };
      next();
      return;
    }

    // Increment the request count
    store[ip].count++;

    // Check if limit exceeded
    if (store[ip].count > maxRequests) {
      res.status(429).json({
        error: "Too Many Requests",
        message,
        retryAfter: Math.ceil((store[ip].resetTime - now) / 1000),
      });
      return;
    }

    next();
  };
}

/**
 * Pre-configured rate limiters for different endpoints
 */
export const rateLimiters = {
  // Strict limit for checkout (prevent payment fraud)
  checkout: createRateLimiter({
    windowMs: 60 * 1000, // 1 minute
    maxRequests: 10,
    message: "Too many checkout attempts. Please wait before trying again.",
  }),

  // Moderate limit for cart operations
  cart: createRateLimiter({
    windowMs: 60 * 1000, // 1 minute
    maxRequests: 30,
    message: "Too many cart operations. Please wait before trying again.",
  }),

  // Moderate limit for search (prevent scraping)
  search: createRateLimiter({
    windowMs: 60 * 1000, // 1 minute
    maxRequests: 30,
    message: "Too many search requests. Please wait before trying again.",
  }),

  // Moderate limit for login (prevent brute force)
  login: createRateLimiter({
    windowMs: 15 * 60 * 1000, // 15 minutes
    maxRequests: 5,
    message: "Too many login attempts. Please wait before trying again.",
  }),

  // General API limit (default)
  api: createRateLimiter({
    windowMs: 60 * 1000, // 1 minute
    maxRequests: 100,
    message: "Too many API requests. Please wait before trying again.",
  }),
};
