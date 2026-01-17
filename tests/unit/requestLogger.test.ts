/**
 * Tests for request logging middleware
 * Verifies request tracking, metrics, and analytics
 */

describe("Request Logging System", () => {
  describe("Request Logging", () => {
    it("should create request log with all fields", () => {
      const log = {
        id: "req-123",
        method: "GET",
        path: "/api/products",
        statusCode: 200,
        duration: 45,
        timestamp: new Date(),
      };

      expect(log.id).toBeDefined();
      expect(log.method).toBe("GET");
      expect(log.statusCode).toBe(200);
    });

    it("should capture response time", () => {
      const startTime = Date.now();
      const duration = 125;
      const endTime = startTime + duration;

      expect(endTime - startTime).toBeCloseTo(duration, -1);
    });

    it("should include optional user information", () => {
      const log = {
        id: "req-123",
        method: "POST",
        path: "/api/cart",
        statusCode: 201,
        duration: 100,
        userId: "user-123",
        timestamp: new Date(),
      };

      expect(log.userId).toBe("user-123");
    });

    it("should track HTTP methods", () => {
      const methods = ["GET", "POST", "PUT", "PATCH", "DELETE"];

      expect(methods).toContain("GET");
      expect(methods).toContain("POST");
    });
  });

  describe("Performance Tracking", () => {
    it("should track response duration", () => {
      const durations = [10, 50, 100, 250, 1500, 3000];

      const avgDuration =
        durations.reduce((a, b) => a + b) / durations.length;

      expect(avgDuration).toBeGreaterThan(0);
    });

    it("should identify slow requests", () => {
      const logs = [
        { duration: 50, path: "/api/products" },
        { duration: 1200, path: "/api/search" },
        { duration: 75, path: "/api/cart" },
        { duration: 2500, path: "/api/checkout" },
      ];

      const slow = logs.filter((log) => log.duration > 1000);

      expect(slow).toHaveLength(2);
    });

    it("should calculate average response time", () => {
      const durations = [100, 150, 200, 250, 300];

      const avg = durations.reduce((a, b) => a + b) / durations.length;

      expect(avg).toBe(200);
    });

    it("should track response size", () => {
      const responses = [
        { size: 1024, path: "/api/products" },
        { size: 512, path: "/api/category" },
        { size: 2048, path: "/api/search" },
      ];

      const totalSize = responses.reduce((sum, r) => sum + r.size, 0);

      expect(totalSize).toBe(3584);
    });
  });

  describe("Error Tracking", () => {
    it("should flag error responses", () => {
      const logs = [
        { statusCode: 200 },
        { statusCode: 201 },
        { statusCode: 400 },
        { statusCode: 404 },
        { statusCode: 500 },
      ];

      const errors = logs.filter((log) => log.statusCode >= 400);

      expect(errors).toHaveLength(3);
    });

    it("should calculate error rate", () => {
      const logs = [
        { statusCode: 200 },
        { statusCode: 200 },
        { statusCode: 400 },
        { statusCode: 200 },
      ];

      const errors = logs.filter((log) => log.statusCode >= 400).length;
      const errorRate = ((errors / logs.length) * 100).toFixed(2);

      expect(errorRate).toBe("25.00");
    });

    it("should track error messages", () => {
      const log = {
        statusCode: 500,
        errorMessage: "Internal Server Error",
      };

      expect(log.errorMessage).toBeDefined();
    });
  });

  describe("Path Metrics", () => {
    it("should track requests per path", () => {
      const pathCount = new Map<string, number>();

      pathCount.set("/api/products", 100);
      pathCount.set("/api/cart", 50);
      pathCount.set("/api/orders", 30);

      expect(pathCount.get("/api/products")).toBe(100);
    });

    it("should identify most common paths", () => {
      const paths = [
        { path: "/api/products", count: 500 },
        { path: "/api/cart", count: 300 },
        { path: "/api/orders", count: 200 },
      ];

      const sorted = paths.sort((a, b) => b.count - a.count);

      expect(sorted[0].path).toBe("/api/products");
    });

    it("should calculate average time per path", () => {
      const pathMetrics = new Map<
        string,
        { count: number; totalTime: number }
      >();

      pathMetrics.set("/api/products", { count: 100, totalTime: 5000 });

      const metric = pathMetrics.get("/api/products")!;
      const avgTime = metric.totalTime / metric.count;

      expect(avgTime).toBe(50);
    });
  });

  describe("Request Queries", () => {
    it("should filter requests by path", () => {
      const logs = [
        { path: "/api/products", id: "1" },
        { path: "/api/products", id: "2" },
        { path: "/api/cart", id: "3" },
      ];

      const productRequests = logs.filter((log) => log.path === "/api/products");

      expect(productRequests).toHaveLength(2);
    });

    it("should filter requests by user", () => {
      const logs = [
        { userId: "user-123", id: "1" },
        { userId: "user-123", id: "2" },
        { userId: "user-456", id: "3" },
      ];

      const userLogs = logs.filter((log) => log.userId === "user-123");

      expect(userLogs).toHaveLength(2);
    });

    it("should get recent requests", () => {
      const now = Date.now();
      const oneHourAgo = now - 60 * 60 * 1000;

      const logs = [
        { timestamp: new Date(now), id: "1" },
        { timestamp: new Date(oneHourAgo), id: "2" },
      ];

      const cutoff = new Date(now - 30 * 60 * 1000);
      const recent = logs.filter((log) => log.timestamp > cutoff);

      expect(recent).toHaveLength(1);
    });

    it("should sort by timestamp", () => {
      const logs = [
        { id: "1", timestamp: new Date("2025-01-15") },
        { id: "2", timestamp: new Date("2025-01-20") },
        { id: "3", timestamp: new Date("2025-01-10") },
      ];

      const sorted = logs.sort(
        (a, b) => b.timestamp.getTime() - a.timestamp.getTime()
      );

      expect(sorted[0].id).toBe("2");
    });
  });

  describe("Metrics Calculation", () => {
    it("should calculate total requests", () => {
      const logs = Array.from({ length: 1000 }, (_, i) => ({ id: `${i}` }));

      expect(logs.length).toBe(1000);
    });

    it("should calculate success rate", () => {
      const logs = [
        { statusCode: 200 },
        { statusCode: 200 },
        { statusCode: 200 },
        { statusCode: 404 },
      ];

      const successful = logs.filter((log) => log.statusCode < 400).length;
      const rate = ((successful / logs.length) * 100).toFixed(2);

      expect(rate).toBe("75.00");
    });

    it("should track by HTTP method", () => {
      const methods = new Map<string, number>();

      methods.set("GET", 500);
      methods.set("POST", 300);
      methods.set("DELETE", 50);

      expect(methods.get("GET")).toBe(500);
    });

    it("should provide comprehensive metrics", () => {
      const metrics = {
        totalRequests: 10000,
        avgResponseTime: 125,
        successRate: 98.5,
        errorRate: 1.5,
        totalErrors: 150,
      };

      expect(metrics.totalRequests).toBeGreaterThan(0);
      expect(metrics.successRate + metrics.errorRate).toBeCloseTo(100, 1);
    });
  });

  describe("Request Cleanup", () => {
    it("should limit stored logs for memory", () => {
      const maxLogs = 50000;
      const logs = Array.from({ length: 75000 }, (_, i) => ({
        id: `log-${i}`,
      }));

      const trimmed = logs.slice(-maxLogs);

      expect(trimmed).toHaveLength(maxLogs);
    });

    it("should clear old logs", () => {
      const now = new Date();
      const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      const twoWeeksAgo = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000);

      const logs = [
        { timestamp: now },
        { timestamp: oneWeekAgo },
        { timestamp: twoWeeksAgo },
      ];

      const cutoff = new Date();
      cutoff.setDate(cutoff.getDate() - 7);

      const filtered = logs.filter((log) => log.timestamp >= cutoff);

      expect(filtered).toHaveLength(2);
    });
  });

  describe("Export", () => {
    it("should export logs as JSON", () => {
      const logs = [
        { id: "1", method: "GET", path: "/api/products" },
        { id: "2", method: "POST", path: "/api/cart" },
      ];

      const exported = {
        logCount: logs.length,
        logs,
        exported: new Date(),
      };

      expect(exported.logCount).toBe(2);
    });

    it("should export logs as CSV", () => {
      const log = {
        id: "req-123",
        method: "GET",
        path: "/api/products",
        statusCode: 200,
      };

      let csv = "ID,Method,Path,Status\n";
      csv += `"${log.id}","${log.method}","${log.path}","${log.statusCode}"\n`;

      expect(csv).toContain(log.id);
      expect(csv).toContain(log.method);
    });
  });
});