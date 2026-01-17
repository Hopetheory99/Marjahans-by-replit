import { Response } from "express";

/**
 * Error Response Utility
 * Handles formatting of error responses to clients without leaking sensitive information
 * All stack traces are logged server-side only, never sent to clients
 */

export interface ErrorResponse {
  message: string;
  code: string;
  statusCode: number;
  timestamp?: string;
  details?: string;
}

/**
 * Error code definitions
 * Used for consistent error categorization
 */
export const ErrorCode = {
  // Validation errors (4xx)
  VALIDATION_ERROR: "VALIDATION_ERROR",
  INVALID_INPUT: "INVALID_INPUT",
  MISSING_REQUIRED_FIELD: "MISSING_REQUIRED_FIELD",
  INVALID_CSRF_TOKEN: "INVALID_CSRF_TOKEN",
  UNAUTHORIZED: "UNAUTHORIZED",
  FORBIDDEN: "FORBIDDEN",
  NOT_FOUND: "NOT_FOUND",
  CONFLICT: "CONFLICT",

  // Server errors (5xx)
  INTERNAL_SERVER_ERROR: "INTERNAL_SERVER_ERROR",
  SERVICE_UNAVAILABLE: "SERVICE_UNAVAILABLE",
  DATABASE_ERROR: "DATABASE_ERROR",
  PAYMENT_ERROR: "PAYMENT_ERROR",
  WEBHOOK_ERROR: "WEBHOOK_ERROR",

  // Business logic errors
  CART_EMPTY: "CART_EMPTY",
  ORDER_NOT_FOUND: "ORDER_NOT_FOUND",
  INSUFFICIENT_INVENTORY: "INSUFFICIENT_INVENTORY",
  PAYMENT_FAILED: "PAYMENT_FAILED",
  SESSION_EXPIRED: "SESSION_EXPIRED",
} as const;

/**
 * User-friendly error messages
 * Never expose implementation details
 */
const errorMessages: Record<string, string> = {
  VALIDATION_ERROR: "Invalid input provided",
  INVALID_INPUT: "One or more fields contain invalid data",
  MISSING_REQUIRED_FIELD: "Required field is missing",
  INVALID_CSRF_TOKEN: "Request validation failed",
  UNAUTHORIZED: "Authentication required",
  FORBIDDEN: "You do not have permission to perform this action",
  NOT_FOUND: "Resource not found",
  CONFLICT: "Request conflicts with existing resource",
  INTERNAL_SERVER_ERROR: "An unexpected error occurred. Please try again later.",
  SERVICE_UNAVAILABLE: "Service temporarily unavailable. Please try again later.",
  DATABASE_ERROR: "Database operation failed. Please try again later.",
  PAYMENT_ERROR: "Payment processing failed. Please try again or contact support.",
  WEBHOOK_ERROR: "Webhook processing failed",
  CART_EMPTY: "Your cart is empty",
  ORDER_NOT_FOUND: "Order not found",
  INSUFFICIENT_INVENTORY: "Item not available in requested quantity",
  PAYMENT_FAILED: "Payment could not be processed",
  SESSION_EXPIRED: "Your session has expired. Please refresh and try again.",
};

/**
 * Get HTTP status code for error code
 */
function getStatusCode(code: string): number {
  const statusMap: Record<string, number> = {
    VALIDATION_ERROR: 400,
    INVALID_INPUT: 400,
    MISSING_REQUIRED_FIELD: 400,
    INVALID_CSRF_TOKEN: 403,
    UNAUTHORIZED: 401,
    FORBIDDEN: 403,
    NOT_FOUND: 404,
    CONFLICT: 409,
    INTERNAL_SERVER_ERROR: 500,
    SERVICE_UNAVAILABLE: 503,
    DATABASE_ERROR: 500,
    PAYMENT_ERROR: 402,
    WEBHOOK_ERROR: 500,
    CART_EMPTY: 400,
    ORDER_NOT_FOUND: 404,
    INSUFFICIENT_INVENTORY: 400,
    PAYMENT_FAILED: 402,
    SESSION_EXPIRED: 401,
  };

  return statusMap[code] || 500;
}

/**
 * Format error response for client
 * NEVER includes stack traces or internal implementation details
 */
export function formatErrorResponse(
  code: string,
  customMessage?: string
): ErrorResponse {
  const message = customMessage || errorMessages[code] || "An error occurred";
  const statusCode = getStatusCode(code);

  return {
    message,
    code,
    statusCode,
    timestamp: new Date().toISOString(),
  };
}

/**
 * Send error response to client
 * Handles logging and response formatting
 */
export function sendErrorResponse(
  res: Response,
  code: string,
  statusCode?: number,
  customMessage?: string,
  error?: Error | unknown
): void {
  // Log error server-side (with full details including stack trace)
  logError(code, error, customMessage);

  // Format error response (without sensitive details)
  const errorResponse = formatErrorResponse(code, customMessage);
  const responseStatusCode = statusCode || errorResponse.statusCode;

  res.status(responseStatusCode).json({
    message: errorResponse.message,
    code: errorResponse.code,
    timestamp: errorResponse.timestamp,
  });
}

/**
 * Log error server-side with full details
 * Includes stack traces and sensitive information (not sent to client)
 */
export function logError(
  code: string,
  error: Error | unknown,
  context?: string
): void {
  const timestamp = new Date().toISOString();
  const errorStack = error instanceof Error ? error.stack : String(error);

  console.error(
    JSON.stringify(
      {
        level: "ERROR",
        timestamp,
        code,
        context,
        message: error instanceof Error ? error.message : String(error),
        stack: errorStack,
      },
      null,
      2
    )
  );
}

/**
 * Validate error is safe to send to client
 * Returns false if error contains sensitive info that shouldn't be exposed
 */
export function isSafeErrorMessage(message: string): boolean {
  // Check for patterns that indicate sensitive information
  const dangerousPatterns = [
    /password/i,
    /secret/i,
    /key/i,
    /token/i,
    /\/\w+/i, // File paths
    /\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}/, // IP addresses
    /database|sql|query/i,
    /connection string/i,
    /at \w+/, // Stack traces
  ];

  return !dangerousPatterns.some((pattern) => pattern.test(message));
}

/**
 * Extract safe error message from error object
 * If error message contains sensitive data, returns generic message
 */
export function extractSafeMessage(error: Error | unknown): string {
  if (!(error instanceof Error)) {
    return "An unexpected error occurred";
  }

  if (isSafeErrorMessage(error.message)) {
    return error.message;
  }

  return "An unexpected error occurred";
}

/**
 * Validation error handler
 * Used for input validation failures
 */
export function handleValidationError(
  res: Response,
  fieldName: string,
  message: string
): void {
  res.status(400).json({
    message: message || `Invalid ${fieldName}`,
    code: ErrorCode.VALIDATION_ERROR,
    field: fieldName,
    timestamp: new Date().toISOString(),
  });
}

/**
 * Not found error handler
 */
export function handleNotFoundError(
  res: Response,
  resourceType: string = "Resource"
): void {
  sendErrorResponse(
    res,
    ErrorCode.NOT_FOUND,
    404,
    `${resourceType} not found`
  );
}

/**
 * Unauthorized error handler
 */
export function handleUnauthorizedError(res: Response): void {
  sendErrorResponse(res, ErrorCode.UNAUTHORIZED, 401);
}

/**
 * Forbidden error handler
 */
export function handleForbiddenError(res: Response): void {
  sendErrorResponse(res, ErrorCode.FORBIDDEN, 403);
}

/**
 * Internal server error handler
 * Used as fallback for unexpected errors
 */
export function handleInternalServerError(
  res: Response,
  error: Error | unknown,
  context?: string
): void {
  sendErrorResponse(
    res,
    ErrorCode.INTERNAL_SERVER_ERROR,
    500,
    undefined,
    error
  );
}

/**
 * Database error handler
 */
export function handleDatabaseError(
  res: Response,
  error: Error | unknown
): void {
  logError(ErrorCode.DATABASE_ERROR, error);
  sendErrorResponse(res, ErrorCode.DATABASE_ERROR, 500);
}

/**
 * Payment error handler
 */
export function handlePaymentError(
  res: Response,
  error: Error | unknown,
  customMessage?: string
): void {
  sendErrorResponse(
    res,
    ErrorCode.PAYMENT_ERROR,
    402,
    customMessage,
    error
  );
}

/**
 * Middleware for catching unhandled errors
 * Should be placed at the end of middleware chain
 */
export function errorHandlingMiddleware(
  error: Error | unknown,
  _req: any,
  res: any,
  _next: any
): void {
  console.error("Unhandled error:", error);

  if (res.headersSent) {
    return; // Headers already sent, can't send response
  }

  sendErrorResponse(
    res,
    ErrorCode.INTERNAL_SERVER_ERROR,
    500,
    undefined,
    error
  );
}
