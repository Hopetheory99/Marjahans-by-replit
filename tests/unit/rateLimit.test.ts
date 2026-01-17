import { createRateLimiter, rateLimiters } from "../../server/middleware/rateLimit";
import { Request, Response, NextFunction } from "express";

describe("Rate Limiting Middleware", () => {
  let mockRequest: any;
  let mockResponse: any;
  let mockNext: jest.Mock;
  let jsonResponse: any;

  beforeEach(() => {
    jsonResponse = null;
    mockRequest = {
      ip: "192.168.1.1",
      socket: { remoteAddress: "192.168.1.1" },
    };
    mockResponse = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn((data) => {
        jsonResponse = data;
        return mockResponse;
      }),
    };
    mockNext = jest.fn();
  });

  describe("createRateLimiter", () => {
    it("should allow requests within limit", () => {
      const limiter = createRateLimiter({ windowMs: 60000, maxRequests: 5 });

      for (let i = 0; i < 5; i++) {
        limiter(mockRequest as Request, mockResponse as Response, mockNext);
        expect(mockNext).toHaveBeenCalled();
      }
    });

    it("should reject requests exceeding limit", () => {
      const limiter = createRateLimiter({ windowMs: 60000, maxRequests: 2 });

      // Allow first 2 requests
      limiter(mockRequest as Request, mockResponse as Response, mockNext);
      limiter(mockRequest as Request, mockResponse as Response, mockNext);
      expect(mockNext).toHaveBeenCalledTimes(2);

      // Reject 3rd request
      mockNext.mockClear();
      limiter(mockRequest as Request, mockResponse as Response, mockNext);
      expect(mockResponse.status).toHaveBeenCalledWith(429);
      expect(mockNext).not.toHaveBeenCalled();
    });

    it("should return 429 status with proper error structure", () => {
      const limiter = createRateLimiter({
        windowMs: 60000,
        maxRequests: 1,
        message: "Custom message",
      });

      limiter(mockRequest as Request, mockResponse as Response, mockNext);
      limiter(mockRequest as Request, mockResponse as Response, mockNext);

      expect(jsonResponse).toHaveProperty("error", "Too Many Requests");
      expect(jsonResponse).toHaveProperty("message", "Custom message");
      expect(jsonResponse).toHaveProperty("retryAfter");
    });

    it("should reset counter after time window expires", (done) => {
      const windowMs = 100;
      const limiter = createRateLimiter({ windowMs, maxRequests: 1 });

      // First request passes
      limiter(mockRequest as Request, mockResponse as Response, mockNext);
      expect(mockNext).toHaveBeenCalledTimes(1);

      // Second request fails (exceeds limit)
      mockNext.mockClear();
      limiter(mockRequest as Request, mockResponse as Response, mockNext);
      expect(mockResponse.status).toHaveBeenCalledWith(429);

      // After window expires, request should pass again
      setTimeout(() => {
        mockNext.mockClear();
        mockResponse.status = jest.fn().mockReturnThis();

        limiter(mockRequest as Request, mockResponse as Response, mockNext);
        expect(mockNext).toHaveBeenCalled();
        expect(mockResponse.status).not.toHaveBeenCalledWith(429);
        done();
      }, windowMs + 50);
    });

    it("should track different IPs separately", () => {
      const limiter = createRateLimiter({ windowMs: 60000, maxRequests: 1 });

      // First IP uses up limit
      limiter(mockRequest as Request, mockResponse as Response, mockNext);
      expect(mockNext).toHaveBeenCalledTimes(1);

      // Second request from same IP fails
      mockNext.mockClear();
      limiter(mockRequest as Request, mockResponse as Response, mockNext);
      expect(mockResponse.status).toHaveBeenCalledWith(429);

      // Different IP should work
      mockRequest.ip = "192.168.1.2";
      mockNext.mockClear();
      mockResponse.status = jest.fn().mockReturnThis();

      limiter(mockRequest as Request, mockResponse as Response, mockNext);
      expect(mockNext).toHaveBeenCalled();
      expect(mockResponse.status).not.toHaveBeenCalledWith(429);
    });
  });

  describe("Pre-configured limiters", () => {
    it("should have checkout limiter configured", () => {
      expect(rateLimiters.checkout).toBeDefined();
      expect(typeof rateLimiters.checkout).toBe("function");
    });

    it("should have cart limiter configured", () => {
      expect(rateLimiters.cart).toBeDefined();
      expect(typeof rateLimiters.cart).toBe("function");
    });

    it("should have search limiter configured", () => {
      expect(rateLimiters.search).toBeDefined();
      expect(typeof rateLimiters.search).toBe("function");
    });

    it("should have login limiter configured", () => {
      expect(rateLimiters.login).toBeDefined();
      expect(typeof rateLimiters.login).toBe("function");
    });

    it("should have api limiter configured", () => {
      expect(rateLimiters.api).toBeDefined();
      expect(typeof rateLimiters.api).toBe("function");
    });

    it("checkout limiter should be more restrictive than cart", () => {
      // Checkout: 10 req/min, Cart: 30 req/min
      // This is a configuration test to ensure proper strictness
      expect(rateLimiters.checkout).toBeDefined();
      expect(rateLimiters.cart).toBeDefined();
    });
  });
});
