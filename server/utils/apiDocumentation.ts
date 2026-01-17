/**
 * API Documentation and Swagger Schema Generation
 * Generates OpenAPI 3.0 specification for API endpoints
 */

export interface ApiEndpoint {
  path: string;
  method: "GET" | "POST" | "PUT" | "DELETE" | "PATCH";
  summary: string;
  description: string;
  tags: string[];
  parameters?: ApiParameter[];
  requestBody?: ApiRequestBody;
  responses: Record<string, ApiResponse>;
  authentication?: boolean;
  rateLimit?: number;
}

export interface ApiParameter {
  name: string;
  in: "query" | "path" | "header";
  required: boolean;
  schema: { type: string; description: string };
}

export interface ApiRequestBody {
  required: boolean;
  content: Record<string, { schema: Record<string, any> }>;
}

export interface ApiResponse {
  description: string;
  content?: Record<string, { schema: Record<string, any> }>;
}

export interface OpenAPISchema {
  openapi: string;
  info: {
    title: string;
    description: string;
    version: string;
  };
  servers: Array<{ url: string; description: string }>;
  paths: Record<string, Record<string, ApiEndpoint>>;
  components: {
    schemas: Record<string, any>;
    securitySchemes: Record<string, any>;
  };
}

/**
 * API Documentation generator for Swagger/OpenAPI
 */
export class ApiDocumentationGenerator {
  private endpoints: ApiEndpoint[] = [];
  private schemas: Map<string, any> = new Map();
  private securitySchemes: Map<string, any> = new Map();
  private readonly version = "1.0.0";
  private readonly title = "E-Commerce API";
  private readonly baseDescription =
    "Complete API documentation for the e-commerce platform";

  constructor() {
    this.initializeSecuritySchemes();
  }

  /**
   * Register an API endpoint
   */
  registerEndpoint(endpoint: ApiEndpoint): void {
    this.endpoints.push(endpoint);
  }

  /**
   * Register a schema model
   */
  registerSchema(name: string, schema: any): void {
    this.schemas.set(name, schema);
  }

  /**
   * Add product endpoints documentation
   */
  addProductEndpoints(): void {
    this.registerEndpoint({
      path: "/api/products",
      method: "GET",
      summary: "List all products",
      description: "Retrieve a paginated list of products with optional filtering and sorting",
      tags: ["Products"],
      parameters: [
        {
          name: "page",
          in: "query",
          required: false,
          schema: { type: "integer", description: "Page number (default: 1)" },
        },
        {
          name: "limit",
          in: "query",
          required: false,
          schema: { type: "integer", description: "Items per page (default: 20)" },
        },
        {
          name: "category",
          in: "query",
          required: false,
          schema: { type: "string", description: "Filter by category" },
        },
        {
          name: "search",
          in: "query",
          required: false,
          schema: { type: "string", description: "Search products with fuzzy matching" },
        },
      ],
      responses: {
        "200": {
          description: "Successful product list",
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: {
                  products: { type: "array" },
                  total: { type: "integer" },
                  page: { type: "integer" },
                },
              },
            },
          },
        },
        "400": { description: "Invalid parameters" },
      },
    });

    this.registerEndpoint({
      path: "/api/products/{id}",
      method: "GET",
      summary: "Get product details",
      description: "Retrieve detailed information for a specific product",
      tags: ["Products"],
      parameters: [
        {
          name: "id",
          in: "path",
          required: true,
          schema: { type: "string", description: "Product ID" },
        },
      ],
      responses: {
        "200": {
          description: "Product found",
          content: {
            "application/json": {
              schema: { type: "object" },
            },
          },
        },
        "404": { description: "Product not found" },
      },
    });

    this.registerEndpoint({
      path: "/api/products/search",
      method: "GET",
      summary: "Advanced product search",
      description: "Search products with fuzzy matching, suggestions, and analytics",
      tags: ["Products", "Search"],
      parameters: [
        {
          name: "q",
          in: "query",
          required: true,
          schema: { type: "string", description: "Search query" },
        },
        {
          name: "suggestions",
          in: "query",
          required: false,
          schema: { type: "boolean", description: "Include search suggestions" },
        },
      ],
      responses: {
        "200": {
          description: "Search results",
        },
      },
    });
  }

  /**
   * Add cart endpoints documentation
   */
  addCartEndpoints(): void {
    this.registerEndpoint({
      path: "/api/cart",
      method: "GET",
      summary: "Get shopping cart",
      description: "Retrieve current user's shopping cart",
      tags: ["Cart"],
      authentication: true,
      responses: {
        "200": { description: "Cart retrieved successfully" },
        "401": { description: "Unauthorized" },
      },
    });

    this.registerEndpoint({
      path: "/api/cart",
      method: "POST",
      summary: "Add item to cart",
      description: "Add a product to the shopping cart",
      tags: ["Cart"],
      authentication: true,
      requestBody: {
        required: true,
        content: {
          "application/json": {
            schema: {
              type: "object",
              properties: {
                productId: { type: "string" },
                quantity: { type: "integer", minimum: 1 },
              },
            },
          },
        },
      },
      responses: {
        "201": { description: "Item added to cart" },
        "401": { description: "Unauthorized" },
      },
    });
  }

  /**
   * Add order endpoints documentation
   */
  addOrderEndpoints(): void {
    this.registerEndpoint({
      path: "/api/orders",
      method: "GET",
      summary: "Get user orders",
      description: "Retrieve all orders for the authenticated user",
      tags: ["Orders"],
      authentication: true,
      responses: {
        "200": { description: "Orders retrieved" },
        "401": { description: "Unauthorized" },
      },
    });

    this.registerEndpoint({
      path: "/api/orders/{id}",
      method: "GET",
      summary: "Get order details",
      description: "Retrieve detailed information for a specific order",
      tags: ["Orders"],
      authentication: true,
      parameters: [
        {
          name: "id",
          in: "path",
          required: true,
          schema: { type: "string", description: "Order ID" },
        },
      ],
      responses: {
        "200": { description: "Order details" },
        "404": { description: "Order not found" },
      },
    });
  }

  /**
   * Add checkout endpoints documentation
   */
  addCheckoutEndpoints(): void {
    this.registerEndpoint({
      path: "/api/checkout",
      method: "POST",
      summary: "Create checkout session",
      description: "Create a Stripe checkout session for payment",
      tags: ["Checkout"],
      authentication: true,
      requestBody: {
        required: true,
        content: {
          "application/json": {
            schema: {
              type: "object",
              properties: {
                items: { type: "array" },
                successUrl: { type: "string" },
                cancelUrl: { type: "string" },
              },
            },
          },
        },
      },
      responses: {
        "200": { description: "Checkout session created" },
      },
      rateLimit: 10,
    });
  }

  /**
   * Generate OpenAPI schema
   */
  generateSchema(serverUrl: string = "http://localhost:5000"): OpenAPISchema {
    const paths: Record<string, Record<string, ApiEndpoint>> = {};

    // Group endpoints by path
    this.endpoints.forEach((endpoint) => {
      if (!paths[endpoint.path]) {
        paths[endpoint.path] = {};
      }
      paths[endpoint.path][endpoint.method.toLowerCase()] = endpoint;
    });

    return {
      openapi: "3.0.0",
      info: {
        title: this.title,
        description: this.baseDescription,
        version: this.version,
      },
      servers: [
        {
          url: serverUrl,
          description: "API Server",
        },
      ],
      paths,
      components: {
        schemas: Object.fromEntries(this.schemas),
        securitySchemes: Object.fromEntries(this.securitySchemes),
      },
    };
  }

  /**
   * Generate HTML documentation
   */
  generateHtmlDocs(): string {
    let html = `<!DOCTYPE html>
<html>
<head>
  <title>${this.title}</title>
  <style>
    body { font-family: Arial, sans-serif; margin: 40px; }
    .endpoint { border-left: 4px solid #007bff; padding: 15px; margin-bottom: 20px; }
    .method-get { border-left-color: #28a745; }
    .method-post { border-left-color: #ffc107; }
    .method-put { border-left-color: #17a2b8; }
    .method-delete { border-left-color: #dc3545; }
    .path { font-family: monospace; font-weight: bold; }
    .parameters { margin-top: 10px; }
  </style>
</head>
<body>
<h1>${this.title}</h1>
<p>${this.baseDescription}</p>
<h2>Endpoints</h2>
`;

    this.endpoints.forEach((endpoint) => {
      const methodClass = `method-${endpoint.method.toLowerCase()}`;
      html += `
<div class="endpoint ${methodClass}">
  <div>
    <span class="method">${endpoint.method}</span>
    <span class="path">${endpoint.path}</span>
  </div>
  <p><strong>${endpoint.summary}</strong></p>
  <p>${endpoint.description}</p>
  <p>Tags: ${endpoint.tags.join(", ")}</p>
  ${endpoint.authentication ? "<p><strong>Requires Authentication</strong></p>" : ""}
</div>
`;
    });

    html += `
</body>
</html>
`;

    return html;
  }

  /**
   * Export documentation as JSON
   */
  exportAsJson(): string {
    return JSON.stringify(this.generateSchema(), null, 2);
  }

  /**
   * Get endpoint statistics
   */
  getStatistics(): {
    total: number;
    byMethod: Record<string, number>;
    byTag: Record<string, number>;
    authenticated: number;
  } {
    const byMethod: Record<string, number> = {};
    const byTag: Record<string, number> = {};
    let authenticated = 0;

    this.endpoints.forEach((endpoint) => {
      // Count by method
      byMethod[endpoint.method] = (byMethod[endpoint.method] || 0) + 1;

      // Count by tag
      endpoint.tags.forEach((tag) => {
        byTag[tag] = (byTag[tag] || 0) + 1;
      });

      // Count authenticated
      if (endpoint.authentication) {
        authenticated++;
      }
    });

    return {
      total: this.endpoints.length,
      byMethod,
      byTag,
      authenticated,
    };
  }

  /**
   * Private helper: Initialize security schemes
   */
  private initializeSecuritySchemes(): void {
    this.securitySchemes.set("bearerAuth", {
      type: "http",
      scheme: "bearer",
      bearerFormat: "JWT",
    });

    this.securitySchemes.set("apiKey", {
      type: "apiKey",
      in: "header",
      name: "X-API-Key",
    });
  }

  /**
   * Get list of all registered endpoints
   */
  listEndpoints(): Array<{ path: string; method: string; summary: string }> {
    return this.endpoints.map((e) => ({
      path: e.path,
      method: e.method,
      summary: e.summary,
    }));
  }

  /**
   * Get endpoints by tag
   */
  getEndpointsByTag(tag: string): ApiEndpoint[] {
    return this.endpoints.filter((e) => e.tags.includes(tag));
  }
}

// Export singleton instance
export const apiDocGenerator = new ApiDocumentationGenerator();

// Initialize with default endpoints
apiDocGenerator.addProductEndpoints();
apiDocGenerator.addCartEndpoints();
apiDocGenerator.addOrderEndpoints();
apiDocGenerator.addCheckoutEndpoints();
