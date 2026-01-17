import { Response } from "express";
import {
  formatErrorResponse,
  sendErrorResponse,
  logError,
  isSafeErrorMessage,
  extractSafeMessage,
  ErrorCode,
} from "../../server/utils/errorHandler";

/**
 * Unit tests for error handling utilities
 * Ensures errors are logged server-side but never leak to clients
 */

describe("Error Handler Utility", () => {
  let mockResponse: any;
  let jsonResponse: any;
  let statusCode: number;

  beforeEach(() => {
    jsonResponse = null;
    statusCode = 200;

    mockResponse = {
      status: jest.fn(function (code) {
        statusCode = code;
        return this;
      }),
      json: jest.fn((data) => {
        jsonResponse = data;
        return mockResponse;
      }),
      headersSent: false,
    };

    // Mock console.error to prevent test output pollution
    jest.spyOn(console, "error").mockImplementation();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe("Error Code Constants", () => {
    it("should define all expected error codes", () => {
      expect(ErrorCode.VALIDATION_ERROR).toBe("VALIDATION_ERROR");
      expect(ErrorCode.UNAUTHORIZED).toBe("UNAUTHORIZED");
      expect(ErrorCode.INTERNAL_SERVER_ERROR).toBe("INTERNAL_SERVER_ERROR");
      expect(ErrorCode.DATABASE_ERROR).toBe("DATABASE_ERROR");
      expect(ErrorCode.PAYMENT_ERROR).toBe("PAYMENT_ERROR");
    });

    it("should have unique error codes", () => {
      const codes = Object.values(ErrorCode);
      const uniqueCodes = new Set(codes);
      expect(uniqueCodes.size).toBe(codes.length);
    });
  });

  describe("formatErrorResponse", () => {
    it("should format validation error", () => {
      const response = formatErrorResponse(ErrorCode.VALIDATION_ERROR);
      expect(response.code).toBe("VALIDATION_ERROR");
      expect(response.statusCode).toBe(400);
      expect(response.message).toBeTruthy();
      expect(response.timestamp).toBeTruthy();
    });

    it("should format unauthorized error", () => {
      const response = formatErrorResponse(ErrorCode.UNAUTHORIZED);
      expect(response.statusCode).toBe(401);
    });

    it("should format forbidden error", () => {
      const response = formatErrorResponse(ErrorCode.FORBIDDEN);
      expect(response.statusCode).toBe(403);
    });

    it("should format not found error", () => {
      const response = formatErrorResponse(ErrorCode.NOT_FOUND);
      expect(response.statusCode).toBe(404);
    });

    it("should format internal server error", () => {
      const response = formatErrorResponse(ErrorCode.INTERNAL_SERVER_ERROR);
      expect(response.statusCode).toBe(500);
    });

    it("should format database error", () => {
      const response = formatErrorResponse(ErrorCode.DATABASE_ERROR);
      expect(response.statusCode).toBe(500);
    });

    it("should format payment error", () => {
      const response = formatErrorResponse(ErrorCode.PAYMENT_ERROR);
      expect(response.statusCode).toBe(402);
    });

    it("should use custom message if provided", () => {
      const customMessage = "Custom error message";
      const response = formatErrorResponse(
        ErrorCode.VALIDATION_ERROR,
        customMessage
      );
      expect(response.message).toBe(customMessage);
    });

    it("should never include stack trace in error response", () => {
      const response = formatErrorResponse(ErrorCode.INTERNAL_SERVER_ERROR);
      expect(response.message).not.toContain("at ");
      expect(response.message).not.toContain("Error:");
    });

    it("should never include file paths in error response", () => {
      const response = formatErrorResponse(ErrorCode.DATABASE_ERROR);
      expect(response.message).not.toMatch(/\/\w+/);
    });
  });

  describe("sendErrorResponse", () => {
    it("should send error response with correct status code", () => {
      sendErrorResponse(mockResponse, ErrorCode.VALIDATION_ERROR);
      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect(mockResponse.json).toHaveBeenCalled();
    });

    it("should include error code in response", () => {
      sendErrorResponse(mockResponse, ErrorCode.UNAUTHORIZED);
      expect(jsonResponse.code).toBe("UNAUTHORIZED");
    });

    it("should include user-friendly message in response", () => {
      sendErrorResponse(mockResponse, ErrorCode.UNAUTHORIZED);
      expect(jsonResponse.message).toBeTruthy();
      expect(jsonResponse.message).not.toContain("password");
      expect(jsonResponse.message).not.toContain("secret");
    });

    it("should include timestamp in response", () => {
      sendErrorResponse(mockResponse, ErrorCode.VALIDATION_ERROR);
      expect(jsonResponse.timestamp).toBeTruthy();
    });

    it("should override status code if provided", () => {
      sendErrorResponse(mockResponse, ErrorCode.VALIDATION_ERROR, 422);
      expect(mockResponse.status).toHaveBeenCalledWith(422);
    });

    it("should log error when exception provided", () => {
      const error = new Error("Test error");
      sendErrorResponse(mockResponse, ErrorCode.INTERNAL_SERVER_ERROR, 500, undefined, error);
      expect(console.error).toHaveBeenCalled();
    });

    it("should never send stack trace to client", () => {
      const error = new Error("Test error with stack");
      sendErrorResponse(mockResponse, ErrorCode.INTERNAL_SERVER_ERROR, 500, undefined, error);
      
      const responseJson = JSON.stringify(jsonResponse);
      expect(responseJson).not.toContain("at ");
      expect(responseJson).not.toContain("stack");
    });
  });

  describe("isSafeErrorMessage", () => {
    it("should allow safe messages", () => {
      expect(isSafeErrorMessage("Invalid input provided")).toBe(true);
      expect(isSafeErrorMessage("Resource not found")).toBe(true);
      expect(isSafeErrorMessage("Request validation failed")).toBe(true);
    });

    it("should reject messages with password", () => {
      expect(isSafeErrorMessage("Invalid password")).toBe(false);
      expect(isSafeErrorMessage("Password expired")).toBe(false);
    });

    it("should reject messages with secret", () => {
      expect(isSafeErrorMessage("Secret key invalid")).toBe(false);
    });

    it("should reject messages with token details", () => {
      expect(isSafeErrorMessage("Token abc123xyz invalid")).toBe(false);
    });

    it("should reject messages with file paths", () => {
      expect(isSafeErrorMessage("Error at /server/storage.ts")).toBe(false);
    });

    it("should reject messages with IP addresses", () => {
      expect(isSafeErrorMessage("Connection from 192.168.1.1 failed")).toBe(false);
    });

    it("should reject messages with SQL", () => {
      expect(isSafeErrorMessage("SQL query syntax error")).toBe(false);
    });

    it("should reject messages with connection strings", () => {
      expect(isSafeErrorMessage("Connection string missing")).toBe(false);
    });

    it("should reject stack traces", () => {
      expect(isSafeErrorMessage("at Function.create (stripe.ts:45:20)")).toBe(false);
    });
  });

  describe("extractSafeMessage", () => {
    it("should extract safe error message from Error object", () => {
      const error = new Error("Invalid input");
      const message = extractSafeMessage(error);
      expect(message).toBe("Invalid input");
    });

    it("should return generic message for unsafe error messages", () => {
      const error = new Error("Database connection string invalid at /db/index.ts");
      const message = extractSafeMessage(error);
      expect(message).toBe("An unexpected error occurred");
    });

    it("should return generic message for non-Error objects", () => {
      const message = extractSafeMessage("Some string error");
      expect(message).toBe("An unexpected error occurred");
    });

    it("should return generic message for null/undefined", () => {
      expect(extractSafeMessage(null)).toBe("An unexpected error occurred");
      expect(extractSafeMessage(undefined)).toBe("An unexpected error occurred");
    });

    it("should never return stack trace", () => {
      const error = new Error("Test at server/routes.ts:123:45");
      const message = extractSafeMessage(error);
      expect(message).not.toContain("at ");
    });
  });

  describe("No Information Leakage", () => {
    it("should not leak database URLs", () => {
      const error = new Error("postgresql://user:pass@localhost:5432/db");
      sendErrorResponse(mockResponse, ErrorCode.DATABASE_ERROR, 500, undefined, error);
      
      const responseJson = JSON.stringify(jsonResponse);
      expect(responseJson).not.toContain("postgresql://");
      expect(responseJson).not.toContain("@localhost");
    });

    it("should not leak API keys", () => {
      const error = new Error("STRIPE_SECRET_KEY=sk_live_123abc");
      sendErrorResponse(mockResponse, ErrorCode.PAYMENT_ERROR, 402, undefined, error);
      
      const responseJson = JSON.stringify(jsonResponse);
      expect(responseJson).not.toContain("sk_live_");
      expect(responseJson).not.toContain("STRIPE_SECRET_KEY");
    });

    it("should not leak file system paths", () => {
      const error = new Error("Error in /home/user/project/server/storage.ts:123");
      sendErrorResponse(mockResponse, ErrorCode.INTERNAL_SERVER_ERROR, 500, undefined, error);
      
      const responseJson = JSON.stringify(jsonResponse);
      expect(responseJson).not.toContain("/home/user/project");
      expect(responseJson).not.toContain(".ts:");
    });

    it("should not leak system information", () => {
      const error = new Error("OS: Linux, Node: v18.0.0, Memory: 4GB");
      sendErrorResponse(mockResponse, ErrorCode.INTERNAL_SERVER_ERROR, 500, undefined, error);
      
      expect(jsonResponse.message).not.toContain("Linux");
      expect(jsonResponse.message).not.toContain("v18.0.0");
    });
  });

  describe("Specific Error Handlers", () => {
    it("should handle validation errors", () => {
      const { handleValidationError } = require("../../server/utils/errorHandler");
      handleValidationError(mockResponse, "email", "Invalid email format");
      
      expect(statusCode).toBe(400);
      expect(jsonResponse.code).toBe("VALIDATION_ERROR");
      expect(jsonResponse.field).toBe("email");
    });

    it("should handle not found errors", () => {
      const { handleNotFoundError } = require("../../server/utils/errorHandler");
      handleNotFoundError(mockResponse, "Order");
      
      expect(statusCode).toBe(404);
      expect(jsonResponse.code).toBe("NOT_FOUND");
    });

    it("should handle unauthorized errors", () => {
      const { handleUnauthorizedError } = require("../../server/utils/errorHandler");
      handleUnauthorizedError(mockResponse);
      
      expect(statusCode).toBe(401);
      expect(jsonResponse.code).toBe("UNAUTHORIZED");
    });

    it("should handle forbidden errors", () => {
      const { handleForbiddenError } = require("../../server/utils/errorHandler");
      handleForbiddenError(mockResponse);
      
      expect(statusCode).toBe(403);
      expect(jsonResponse.code).toBe("FORBIDDEN");
    });

    it("should handle payment errors", () => {
      const { handlePaymentError } = require("../../server/utils/errorHandler");
      const error = new Error("Card declined");
      handlePaymentError(mockResponse, error);
      
      expect(statusCode).toBe(402);
      expect(jsonResponse.code).toBe("PAYMENT_ERROR");
    });
  });

  describe("Error Logging", () => {
    it("should log errors server-side", () => {
      const error = new Error("Test error");
      logError(ErrorCode.DATABASE_ERROR, error, "Database connection failed");
      
      expect(console.error).toHaveBeenCalled();
    });

    it("should include stack trace in server logs", () => {
      const error = new Error("Test error with stack");
      logError(ErrorCode.INTERNAL_SERVER_ERROR, error);
      
      const logCall = (console.error as jest.Mock).mock.calls[0][0];
      expect(logCall).toContain("stack");
    });

    it("should log non-Error objects", () => {
      logError(ErrorCode.INTERNAL_SERVER_ERROR, "String error message");
      expect(console.error).toHaveBeenCalled();
    });
  });

  describe("Status Codes", () => {
    const testCases = [
      [ErrorCode.VALIDATION_ERROR, 400],
      [ErrorCode.UNAUTHORIZED, 401],
      [ErrorCode.PAYMENT_ERROR, 402],
      [ErrorCode.FORBIDDEN, 403],
      [ErrorCode.NOT_FOUND, 404],
      [ErrorCode.CONFLICT, 409],
      [ErrorCode.INTERNAL_SERVER_ERROR, 500],
      [ErrorCode.DATABASE_ERROR, 500],
      [ErrorCode.SERVICE_UNAVAILABLE, 503],
    ];

    testCases.forEach(([errorCode, expectedStatus]) => {
      it(`should use status ${expectedStatus} for ${errorCode}`, () => {
        sendErrorResponse(mockResponse, errorCode as string);
        expect(mockResponse.status).toHaveBeenCalledWith(expectedStatus);
      });
    });
  });
});
