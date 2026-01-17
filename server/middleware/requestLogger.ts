import type { RequestHandler, Request, Response, NextFunction } from "express";

/**
 * Request Logging and Monitoring Middleware
 * Tracks request metrics, performance, and provides analytics
 */

export interface RequestLog {
  id: string;
  method: string;
  path: string;
  statusCode: number;
  duration: number;
  timestamp: Date;
  userId?: string;
  userAgent?: string;
  ipAddress?: string;
  errorMessage?: string;
  responseSize?: number;
}

export interface RequestMetrics {
  totalRequests: number;
  avgResponseTime: number;
  successRate: number;
  errorRate: number;
  totalErrors: number;
  mostCommonPaths: Array<{ path: string; count: number }>;
  slowestEndpoints: Array<{ path: string; avgDuration: number }>;
}

class RequestLogger {
  private logs: RequestLog[] = [];
  private maxStoredLogs = 50000;
  private pathMetrics = new Map<string, { count: number; totalTime: number }>();
  private errorsByPath = new Map<string, number>();

  /**
   * Middleware for logging requests
   */
  middleware(): RequestHandler {
    return (req: Request, res: Response, next: NextFunction) => {
      const startTime = Date.now();
      const requestId = `req-${startTime}-${Math.random().toString(36).substr(2, 9)}`;

      // Capture response
      const originalJson = res.json;
      let responseSize = 0;

      res.json = function (data: any) {
        responseSize = JSON.stringify(data).length;
        return originalJson.call(this, data);
      };

      // Log when response is finished
      res.on("finish", () => {
        const duration = Date.now() - startTime;
        const log = this.createRequestLog(req, res, duration, requestId, responseSize);
        this.recordLog(log);
        this.updateMetrics(log);
      });

      next();
    };
  }

  /**
   * Create request log entry
   */
  private createRequestLog(
    req: any,
    res: Response,
    duration: number,
    requestId: string,
    responseSize: number
  ): RequestLog {
    return {
      id: requestId,
      method: req.method,
      path: req.path,
      statusCode: res.statusCode,
      duration,
      timestamp: new Date(),
      userId: req.user?.claims?.sub,
      userAgent: req.get("user-agent"),
      ipAddress: this.getClientIp(req),
      errorMessage:
        res.statusCode >= 400
          ? `HTTP ${res.statusCode}`
          : undefined,
      responseSize,
    };
  }

  /**
   * Get client IP address
   */
  private getClientIp(req: any): string {
    return (
      req.headers["x-forwarded-for"]?.split(",")[0] ||
      req.socket?.remoteAddress ||
      "unknown"
    );
  }

  /**
   * Record log entry
   */
  private recordLog(log: RequestLog): void {
    this.logs.push(log);

    // Trim if too many
    if (this.logs.length > this.maxStoredLogs) {
      this.logs = this.logs.slice(-this.maxStoredLogs);
    }

    // Log slow requests
    if (log.duration > 1000) {
      console.warn(
        `[SLOW REQUEST] ${log.method} ${log.path} took ${log.duration}ms`
      );
    }

    // Log errors
    if (log.statusCode >= 400) {
      console.error(
        `[REQUEST ERROR] ${log.statusCode} ${log.method} ${log.path}`
      );
    }
  }

  /**
   * Update path metrics
   */
  private updateMetrics(log: RequestLog): void {
    const existing = this.pathMetrics.get(log.path) || {
      count: 0,
      totalTime: 0,
    };
    existing.count++;
    existing.totalTime += log.duration;
    this.pathMetrics.set(log.path, existing);

    // Track errors by path
    if (log.statusCode >= 400) {
      const errorCount = this.errorsByPath.get(log.path) || 0;
      this.errorsByPath.set(log.path, errorCount + 1);
    }
  }

  /**
   * Get requests by path
   */
  getRequestsByPath(path: string, limit: number = 100): RequestLog[] {
    return this.logs
      .filter((log) => log.path === path)
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
      .slice(0, limit);
  }

  /**
   * Get slow requests
   */
  getSlowRequests(minDuration: number = 1000, limit: number = 50): RequestLog[] {
    return this.logs
      .filter((log) => log.duration > minDuration)
      .sort((a, b) => b.duration - a.duration)
      .slice(0, limit);
  }

  /**
   * Get error requests
   */
  getErrorRequests(limit: number = 100): RequestLog[] {
    return this.logs
      .filter((log) => log.statusCode >= 400)
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
      .slice(0, limit);
  }

  /**
   * Get requests for user
   */
  getRequestsByUser(userId: string, limit: number = 100): RequestLog[] {
    return this.logs
      .filter((log) => log.userId === userId)
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
      .slice(0, limit);
  }

  /**
   * Get recent requests
   */
  getRecentRequests(minutes: number = 60, limit: number = 100): RequestLog[] {
    const cutoff = new Date(Date.now() - minutes * 60 * 1000);

    return this.logs
      .filter((log) => log.timestamp > cutoff)
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
      .slice(0, limit);
  }

  /**
   * Get request metrics
   */
  getMetrics(): RequestMetrics {
    if (this.logs.length === 0) {
      return {
        totalRequests: 0,
        avgResponseTime: 0,
        successRate: 0,
        errorRate: 0,
        totalErrors: 0,
        mostCommonPaths: [],
        slowestEndpoints: [],
      };
    }

    const successfulRequests = this.logs.filter((log) => log.statusCode < 400);
    const failedRequests = this.logs.filter((log) => log.statusCode >= 400);
    const avgDuration =
      this.logs.reduce((sum, log) => sum + log.duration, 0) / this.logs.length;

    // Most common paths
    const pathCounts = Array.from(this.pathMetrics.entries())
      .map(([path, metrics]) => ({
        path,
        count: metrics.count,
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);

    // Slowest endpoints
    const slowestPaths = Array.from(this.pathMetrics.entries())
      .map(([path, metrics]) => ({
        path,
        avgDuration: metrics.totalTime / metrics.count,
      }))
      .sort((a, b) => b.avgDuration - a.avgDuration)
      .slice(0, 10);

    return {
      totalRequests: this.logs.length,
      avgResponseTime: avgDuration,
      successRate: ((successfulRequests.length / this.logs.length) * 100),
      errorRate: ((failedRequests.length / this.logs.length) * 100),
      totalErrors: failedRequests.length,
      mostCommonPaths: pathCounts,
      slowestEndpoints: slowestPaths,
    };
  }

  /**
   * Get dashboard data
   */
  getDashboardData() {
    const metrics = this.getMetrics();
    const recentRequests = this.getRecentRequests(60, 20);
    const slowRequests = this.getSlowRequests(1000, 10);
    const errorRequests = this.getErrorRequests(10);

    return {
      metrics,
      recentRequests,
      slowRequests,
      errorRequests,
      timestamp: new Date(),
    };
  }

  /**
   * Clear old logs
   */
  clearOldLogs(daysOld: number = 7): number {
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - daysOld);

    const beforeCount = this.logs.length;
    this.logs = this.logs.filter((log) => log.timestamp > cutoff);

    return beforeCount - this.logs.length;
  }

  /**
   * Get statistics by method
   */
  getStatsByMethod() {
    const methods = new Map<string, { count: number; errors: number }>();

    this.logs.forEach((log) => {
      const existing = methods.get(log.method) || { count: 0, errors: 0 };
      existing.count++;
      if (log.statusCode >= 400) {
        existing.errors++;
      }
      methods.set(log.method, existing);
    });

    return Array.from(methods.entries()).map(([method, stats]) => ({
      method,
      ...stats,
      errorRate: ((stats.errors / stats.count) * 100).toFixed(2),
    }));
  }

  /**
   * Export logs for analysis
   */
  exportLogs(format: "json" | "csv" = "json") {
    if (format === "json") {
      return {
        exported: new Date(),
        logCount: this.logs.length,
        logs: this.logs,
        metrics: this.getMetrics(),
      };
    } else {
      // CSV format
      let csv =
        "ID,Method,Path,Status,Duration,Timestamp,UserId\n";
      this.logs.forEach((log) => {
        csv += `"${log.id}","${log.method}","${log.path}","${log.statusCode}","${log.duration}","${log.timestamp.toISOString()}","${log.userId || ""}"\n`;
      });
      return csv;
    }
  }
}

export default RequestLogger;
