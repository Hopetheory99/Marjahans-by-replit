import { Request, Response, NextFunction } from "express";
import csrf from "csurf";
import cookieParser from "cookie-parser";

/**
 * CSRF Protection Middleware
 * Prevents cross-site request forgery attacks by validating CSRF tokens
 * on state-changing requests (POST, PUT, DELETE, PATCH)
 */

// Initialize csurf with session-based token storage (no cookies)
const csrfProtection = csrf({ cookie: false });

/**
 * Middleware to parse cookies (required by csurf)
 */
export const cookieParserMiddleware = cookieParser();

/**
 * Endpoint to generate a new CSRF token for the client
 * Clients should call this before making state-changing requests
 */
export function generateCsrfToken(req: Request, res: Response): void {
  // Generate token and send to client
  const token = req.csrfToken();
  res.json({ csrfToken: token });
}

/**
 * Middleware to validate CSRF token on state-changing requests
 * Applies CSRF protection to POST, PUT, DELETE, PATCH requests
 */
export const validateCsrfToken = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  // Only validate CSRF on state-changing methods
  if (["POST", "PUT", "DELETE", "PATCH"].includes(req.method)) {
    csrfProtection(req, res, (err) => {
      if (err) {
        console.warn(
          `CSRF validation failed: ${err.message}, IP: ${req.ip}, Method: ${req.method}, Path: ${req.path}`
        );
        res.status(403).json({
          message: "Invalid CSRF token",
          error: err.message,
        });
      } else {
        next();
      }
    });
  } else {
    // Skip CSRF validation for safe methods (GET, HEAD, OPTIONS)
    next();
  }
};

/**
 * Middleware to attach CSRF token to response locals
 * Makes token available in views or can be sent to client
 */
export const attachCsrfToken = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  try {
    res.locals.csrfToken = req.csrfToken();
    next();
  } catch (error) {
    console.error("Error attaching CSRF token:", error);
    next();
  }
};

/**
 * Initialize CSRF protection
 * Should be called early in middleware chain, after body parser and cookie parser
 */
export function initializeCsrfProtection(
  app: any
): {
  cookieParser: any;
  validateCsrf: any;
  generateToken: any;
} {
  return {
    cookieParser: cookieParserMiddleware,
    validateCsrf: validateCsrfToken,
    generateToken: generateCsrfToken,
  };
}
