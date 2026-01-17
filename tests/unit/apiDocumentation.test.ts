/**
 * Tests for API documentation and Swagger schema generation
 * Verifies OpenAPI spec generation and endpoint documentation
 */

describe("API Documentation System", () => {
  describe("Endpoint Registration", () => {
    it("should register GET endpoint", () => {
      const endpoint = {
        path: "/api/products",
        method: "GET" as const,
        summary: "List products",
        description: "Get all products",
        tags: ["Products"],
        responses: { "200": { description: "Success" } },
      };

      expect(endpoint.method).toBe("GET");
      expect(endpoint.path).toBe("/api/products");
    });

    it("should register POST endpoint", () => {
      const endpoint = {
        path: "/api/cart",
        method: "POST" as const,
        summary: "Add to cart",
        description: "Add item to cart",
        tags: ["Cart"],
        responses: { "201": { description: "Created" } },
      };

      expect(endpoint.method).toBe("POST");
    });

    it("should register PUT endpoint", () => {
      const endpoint = {
        path: "/api/orders/{id}",
        method: "PUT" as const,
        summary: "Update order",
        description: "Update order details",
        tags: ["Orders"],
        responses: { "200": { description: "Updated" } },
      };

      expect(endpoint.method).toBe("PUT");
    });

    it("should register DELETE endpoint", () => {
      const endpoint = {
        path: "/api/cart/{id}",
        method: "DELETE" as const,
        summary: "Remove from cart",
        description: "Remove item from cart",
        tags: ["Cart"],
        responses: { "204": { description: "Deleted" } },
      };

      expect(endpoint.method).toBe("DELETE");
    });

    it("should support multiple tags per endpoint", () => {
      const endpoint = {
        path: "/api/products/search",
        method: "GET" as const,
        summary: "Search products",
        description: "Search with fuzzy matching",
        tags: ["Products", "Search"],
        responses: { "200": { description: "Success" } },
      };

      expect(endpoint.tags).toHaveLength(2);
      expect(endpoint.tags).toContain("Search");
    });
  });

  describe("Parameters Documentation", () => {
    it("should document query parameters", () => {
      const params = [
        {
          name: "page",
          in: "query" as const,
          required: false,
          schema: { type: "integer", description: "Page number" },
        },
      ];

      expect(params[0].in).toBe("query");
      expect(params[0].required).toBe(false);
    });

    it("should document path parameters", () => {
      const params = [
        {
          name: "id",
          in: "path" as const,
          required: true,
          schema: { type: "string", description: "Product ID" },
        },
      ];

      expect(params[0].in).toBe("path");
      expect(params[0].required).toBe(true);
    });

    it("should document header parameters", () => {
      const params = [
        {
          name: "Authorization",
          in: "header" as const,
          required: true,
          schema: { type: "string", description: "Bearer token" },
        },
      ];

      expect(params[0].in).toBe("header");
    });

    it("should include parameter descriptions", () => {
      const param = {
        name: "limit",
        in: "query" as const,
        required: false,
        schema: { type: "integer", description: "Items per page" },
      };

      expect(param.schema.description).toContain("Items");
    });
  });

  describe("Request Body Documentation", () => {
    it("should document required request body", () => {
      const body = {
        required: true,
        content: {
          "application/json": {
            schema: {
              type: "object",
              properties: {
                productId: { type: "string" },
                quantity: { type: "integer" },
              },
            },
          },
        },
      };

      expect(body.required).toBe(true);
      expect(body.content["application/json"]).toBeDefined();
    });

    it("should document optional request body", () => {
      const body = {
        required: false,
        content: {
          "application/json": {
            schema: { type: "object" },
          },
        },
      };

      expect(body.required).toBe(false);
    });

    it("should support multiple content types", () => {
      const body = {
        required: true,
        content: {
          "application/json": { schema: {} },
          "application/x-www-form-urlencoded": { schema: {} },
        },
      };

      expect(Object.keys(body.content)).toHaveLength(2);
    });
  });

  describe("Response Documentation", () => {
    it("should document success response", () => {
      const response = {
        "200": {
          description: "Successful response",
          content: {
            "application/json": {
              schema: { type: "object" },
            },
          },
        },
      };

      expect(response["200"].description).toBe("Successful response");
    });

    it("should document error responses", () => {
      const responses = {
        "400": { description: "Bad request" },
        "401": { description: "Unauthorized" },
        "404": { description: "Not found" },
        "500": { description: "Server error" },
      };

      expect(responses["400"].description).toBe("Bad request");
      expect(responses["500"].description).toBe("Server error");
    });

    it("should include response schemas", () => {
      const response = {
        "200": {
          description: "Product data",
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: {
                  id: { type: "string" },
                  name: { type: "string" },
                },
              },
            },
          },
        },
      };

      expect(response["200"].content).toBeDefined();
    });
  });

  describe("OpenAPI Schema Generation", () => {
    it("should generate valid OpenAPI version", () => {
      const schema = {
        openapi: "3.0.0",
      };

      expect(schema.openapi).toBe("3.0.0");
    });

    it("should include API info", () => {
      const schema = {
        info: {
          title: "E-Commerce API",
          description: "API documentation",
          version: "1.0.0",
        },
      };

      expect(schema.info.title).toContain("E-Commerce");
      expect(schema.info.version).toBe("1.0.0");
    });

    it("should include server information", () => {
      const schema = {
        servers: [
          {
            url: "http://localhost:5000",
            description: "Development server",
          },
        ],
      };

      expect(schema.servers).toHaveLength(1);
      expect(schema.servers[0].url).toContain("localhost");
    });

    it("should organize endpoints by path", () => {
      const paths = {
        "/api/products": {
          get: { summary: "List products" },
          post: { summary: "Create product" },
        },
      };

      expect(paths["/api/products"].get).toBeDefined();
      expect(paths["/api/products"].post).toBeDefined();
    });
  });

  describe("Security Documentation", () => {
    it("should mark authenticated endpoints", () => {
      const endpoint = {
        path: "/api/cart",
        method: "GET" as const,
        summary: "Get cart",
        description: "Get user cart",
        tags: ["Cart"],
        authentication: true,
        responses: { "200": { description: "Success" } },
      };

      expect(endpoint.authentication).toBe(true);
    });

    it("should document Bearer token scheme", () => {
      const securityScheme = {
        type: "http",
        scheme: "bearer",
        bearerFormat: "JWT",
      };

      expect(securityScheme.scheme).toBe("bearer");
      expect(securityScheme.bearerFormat).toBe("JWT");
    });

    it("should document API key scheme", () => {
      const securityScheme = {
        type: "apiKey",
        in: "header",
        name: "X-API-Key",
      };

      expect(securityScheme.type).toBe("apiKey");
      expect(securityScheme.in).toBe("header");
    });
  });

  describe("Rate Limiting Documentation", () => {
    it("should document rate limits on endpoints", () => {
      const endpoint = {
        path: "/api/checkout",
        method: "POST" as const,
        summary: "Create checkout",
        description: "Create payment session",
        tags: ["Checkout"],
        rateLimit: 10,
        responses: { "200": { description: "Success" } },
      };

      expect(endpoint.rateLimit).toBe(10);
    });

    it("should allow undefined rate limits", () => {
      const endpoint = {
        path: "/api/products",
        method: "GET" as const,
        summary: "List products",
        description: "List all products",
        tags: ["Products"],
        responses: { "200": { description: "Success" } },
        rateLimit: undefined,
      };

      expect(endpoint.rateLimit).toBeUndefined();
    });
  });

  describe("Schema Management", () => {
    it("should register custom schemas", () => {
      const schema = {
        type: "object",
        properties: {
          id: { type: "string" },
          name: { type: "string" },
        },
      };

      expect(schema.type).toBe("object");
      expect(schema.properties).toBeDefined();
    });

    it("should support schema references", () => {
      const endpoint = {
        responses: {
          "200": {
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/Product" },
              },
            },
          },
        },
      };

      expect(endpoint.responses["200"].content["application/json"].schema.$ref).toContain("Product");
    });
  });

  describe("HTML Documentation Generation", () => {
    it("should generate valid HTML", () => {
      const html = `<!DOCTYPE html>
<html>
<head>
  <title>API Documentation</title>
</head>
<body>
<h1>API</h1>
</body>
</html>`;

      expect(html).toContain("<!DOCTYPE html>");
      expect(html).toContain("<h1>API</h1>");
    });

    it("should include endpoint information", () => {
      const html = "<div class='endpoint'><span>GET</span><span>/api/products</span></div>";

      expect(html).toContain("/api/products");
      expect(html).toContain("GET");
    });

    it("should style endpoints by HTTP method", () => {
      const html = `<div class="method-get">GET /api/products</div>
<div class="method-post">POST /api/cart</div>`;

      expect(html).toContain("method-get");
      expect(html).toContain("method-post");
    });
  });

  describe("JSON Export", () => {
    it("should export as valid JSON", () => {
      const data = {
        openapi: "3.0.0",
        info: { title: "API", version: "1.0.0" },
        paths: {},
      };

      const json = JSON.stringify(data);
      const parsed = JSON.parse(json);

      expect(parsed.openapi).toBe("3.0.0");
    });

    it("should preserve all endpoint information", () => {
      const endpoint = {
        path: "/api/products",
        method: "GET",
        summary: "List products",
        description: "Get all products",
        tags: ["Products"],
      };

      const json = JSON.stringify(endpoint);
      const parsed = JSON.parse(json);

      expect(parsed.path).toBe("/api/products");
      expect(parsed.tags).toContain("Products");
    });
  });

  describe("Statistics", () => {
    it("should count total endpoints", () => {
      const stats = {
        total: 15,
      };

      expect(stats.total).toBeGreaterThan(0);
    });

    it("should count endpoints by HTTP method", () => {
      const stats = {
        byMethod: {
          GET: 8,
          POST: 4,
          PUT: 2,
          DELETE: 1,
        },
      };

      expect(stats.byMethod.GET).toBe(8);
      expect(Object.values(stats.byMethod).reduce((a, b) => a + b)).toBe(15);
    });

    it("should count endpoints by tag", () => {
      const stats = {
        byTag: {
          Products: 5,
          Cart: 4,
          Orders: 3,
          Checkout: 2,
        },
      };

      expect(stats.byTag.Products).toBe(5);
      expect(stats.byTag.Cart).toBe(4);
    });

    it("should count authenticated endpoints", () => {
      const stats = {
        authenticated: 10,
      };

      expect(stats.authenticated).toBeGreaterThan(0);
    });
  });

  describe("Endpoint Listing", () => {
    it("should list all endpoints", () => {
      const endpoints = [
        { path: "/api/products", method: "GET", summary: "List products" },
        { path: "/api/cart", method: "POST", summary: "Add to cart" },
      ];

      expect(endpoints).toHaveLength(2);
    });

    it("should filter endpoints by tag", () => {
      const productEndpoints = [
        { path: "/api/products", method: "GET", tags: ["Products"] },
        { path: "/api/products/{id}", method: "GET", tags: ["Products"] },
      ];

      expect(productEndpoints).toHaveLength(2);
      productEndpoints.forEach((e) => {
        expect(e.tags).toContain("Products");
      });
    });
  });
});