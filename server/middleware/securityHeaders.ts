import { Response, Request, NextFunction } from "express";

/**
 * Security Headers Middleware
 * Adds critical security headers to prevent XSS, clickjacking, MIME-sniffing, etc.
 *
 * Headers added:
 * - Content-Security-Policy: Prevents XSS and data injection attacks
 * - X-Frame-Options: Prevents clickjacking attacks
 * - X-Content-Type-Options: Prevents MIME-sniffing attacks
 * - X-XSS-Protection: Legacy XSS protection (for older browsers)
 * - Strict-Transport-Security: Enforces HTTPS
 */

export function securityHeadersMiddleware(
  req: Request,
  res: Response,
  next: NextFunction
): void {
  // Content Security Policy: Restrict where resources can be loaded from
  res.setHeader(
    "Content-Security-Policy",
    "default-src 'self'; " +
      "script-src 'self' 'unsafe-inline' 'unsafe-eval'; " + // For development; tighten in production
      "style-src 'self' 'unsafe-inline'; " +
      "img-src 'self' data: https:; " +
      "font-src 'self' data:; " +
      "connect-src 'self' https: wss:; " +
      "frame-ancestors 'none'; " +
      "form-action 'self'; " +
      "base-uri 'self'; " +
      "upgrade-insecure-requests"
  );

  // Prevent clickjacking: Disallow embedding in frames
  res.setHeader("X-Frame-Options", "DENY");

  // Prevent MIME-sniffing: Force browser to respect Content-Type
  res.setHeader("X-Content-Type-Options", "nosniff");

  // XSS Protection (legacy, but useful for older browsers)
  res.setHeader("X-XSS-Protection", "1; mode=block");

  // Enforce HTTPS and prevent downgrade attacks
  // Note: Set to a long duration like 1 year in production
  res.setHeader(
    "Strict-Transport-Security",
    "max-age=31536000; includeSubDomains; preload"
  );

  // Prevent referrer leakage
  res.setHeader("Referrer-Policy", "strict-origin-when-cross-origin");

  // Restrict feature permissions
  res.setHeader(
    "Permissions-Policy",
    "accelerometer=(), camera=(), geolocation=(), gyroscope=(), " +
      "magnetometer=(), microphone=(), payment=(), usb=(), vr=(), xr=()"
  );

  next();
}
