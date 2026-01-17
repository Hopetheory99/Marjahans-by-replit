import { securityHeadersMiddleware } from "../../server/middleware/securityHeaders";
import { Request, Response, NextFunction } from "express";

describe("Security Headers Middleware", () => {
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;
  let mockNext: NextFunction;

  beforeEach(() => {
    mockRequest = {};
    mockResponse = {
      setHeader: jest.fn(),
    };
    mockNext = jest.fn();
  });

  it("should set Content-Security-Policy header", () => {
    securityHeadersMiddleware(
      mockRequest as Request,
      mockResponse as Response,
      mockNext
    );

    expect(mockResponse.setHeader).toHaveBeenCalledWith(
      "Content-Security-Policy",
      expect.any(String)
    );
  });

  it("should set X-Frame-Options to DENY", () => {
    securityHeadersMiddleware(
      mockRequest as Request,
      mockResponse as Response,
      mockNext
    );

    expect(mockResponse.setHeader).toHaveBeenCalledWith("X-Frame-Options", "DENY");
  });

  it("should set X-Content-Type-Options to nosniff", () => {
    securityHeadersMiddleware(
      mockRequest as Request,
      mockResponse as Response,
      mockNext
    );

    expect(mockResponse.setHeader).toHaveBeenCalledWith(
      "X-Content-Type-Options",
      "nosniff"
    );
  });

  it("should set X-XSS-Protection header", () => {
    securityHeadersMiddleware(
      mockRequest as Request,
      mockResponse as Response,
      mockNext
    );

    expect(mockResponse.setHeader).toHaveBeenCalledWith(
      "X-XSS-Protection",
      "1; mode=block"
    );
  });

  it("should set Strict-Transport-Security header", () => {
    securityHeadersMiddleware(
      mockRequest as Request,
      mockResponse as Response,
      mockNext
    );

    expect(mockResponse.setHeader).toHaveBeenCalledWith(
      "Strict-Transport-Security",
      expect.stringContaining("max-age=31536000")
    );
  });

  it("should set Referrer-Policy header", () => {
    securityHeadersMiddleware(
      mockRequest as Request,
      mockResponse as Response,
      mockNext
    );

    expect(mockResponse.setHeader).toHaveBeenCalledWith(
      "Referrer-Policy",
      "strict-origin-when-cross-origin"
    );
  });

  it("should set Permissions-Policy header", () => {
    securityHeadersMiddleware(
      mockRequest as Request,
      mockResponse as Response,
      mockNext
    );

    expect(mockResponse.setHeader).toHaveBeenCalledWith(
      "Permissions-Policy",
      expect.any(String)
    );
  });

  it("should call next() to pass control to next middleware", () => {
    securityHeadersMiddleware(
      mockRequest as Request,
      mockResponse as Response,
      mockNext
    );

    expect(mockNext).toHaveBeenCalled();
  });
});
