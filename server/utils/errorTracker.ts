/**
 * Error Tracking and Monitoring System
 * Tracks application errors, aggregates them, and provides analytics
 */

export interface TrackedError {
  id: string;
  message: string;
  stack?: string;
  context: string;
  userId?: string;
  timestamp: Date;
  severity: "low" | "medium" | "high" | "critical";
  resolved: boolean;
  metadata?: Record<string, any>;
}

export interface ErrorGroup {
  message: string;
  count: number;
  lastOccurrence: Date;
  severity: "low" | "medium" | "high" | "critical";
  examples: TrackedError[];
}

class ErrorTracker {
  private errors: TrackedError[] = [];
  private maxStoredErrors = 10000;
  private errorGroups = new Map<string, ErrorGroup>();

  /**
   * Track an error
   */
  trackError(
    message: string,
    context: string,
    options: {
      stack?: string;
      userId?: string;
      severity?: "low" | "medium" | "high" | "critical";
      metadata?: Record<string, any>;
    } = {}
  ): string {
    const errorId = `err-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

    const error: TrackedError = {
      id: errorId,
      message,
      stack: options.stack,
      context,
      userId: options.userId,
      timestamp: new Date(),
      severity: options.severity || "medium",
      resolved: false,
      metadata: options.metadata,
    };

    this.errors.push(error);

    // Trim if too many
    if (this.errors.length > this.maxStoredErrors) {
      this.errors = this.errors.slice(-this.maxStoredErrors);
    }

    // Group errors
    this.addToErrorGroup(error);

    console.error(
      `[ERROR TRACKED] ${error.severity.toUpperCase()}: ${message} (ID: ${errorId})`
    );

    return errorId;
  }

  /**
   * Add error to group
   */
  private addToErrorGroup(error: TrackedError): void {
    const groupKey = this.generateGroupKey(error.message, error.context);
    const existing = this.errorGroups.get(groupKey);

    if (existing) {
      existing.count++;
      existing.lastOccurrence = error.timestamp;
      if (existing.examples.length < 5) {
        existing.examples.push(error);
      }
    } else {
      this.errorGroups.set(groupKey, {
        message: error.message,
        count: 1,
        lastOccurrence: error.timestamp,
        severity: error.severity,
        examples: [error],
      });
    }
  }

  /**
   * Generate unique group key for similar errors
   */
  private generateGroupKey(message: string, context: string): string {
    // Remove dynamic parts (IDs, timestamps) from message
    const cleanMessage = message.replace(/\d+/g, "X");
    return `${context}::${cleanMessage}`;
  }

  /**
   * Mark error as resolved
   */
  markAsResolved(errorId: string): boolean {
    const error = this.errors.find((e) => e.id === errorId);
    if (error) {
      error.resolved = true;
      return true;
    }
    return false;
  }

  /**
   * Get errors by severity
   */
  getErrorsBySeverity(
    severity: "low" | "medium" | "high" | "critical",
    limit: number = 100
  ): TrackedError[] {
    return this.errors
      .filter((e) => e.severity === severity && !e.resolved)
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
      .slice(0, limit);
  }

  /**
   * Get error groups sorted by frequency
   */
  getErrorGroups(limit: number = 20): ErrorGroup[] {
    return Array.from(this.errorGroups.values())
      .sort((a, b) => b.count - a.count)
      .slice(0, limit);
  }

  /**
   * Get errors for specific context
   */
  getErrorsByContext(context: string, limit: number = 50): TrackedError[] {
    return this.errors
      .filter((e) => e.context === context && !e.resolved)
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
      .slice(0, limit);
  }

  /**
   * Get errors for specific user
   */
  getErrorsByUser(userId: string, limit: number = 50): TrackedError[] {
    return this.errors
      .filter((e) => e.userId === userId && !e.resolved)
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
      .slice(0, limit);
  }

  /**
   * Get recent errors
   */
  getRecentErrors(minutes: number = 60, limit: number = 100): TrackedError[] {
    const cutoff = new Date(Date.now() - minutes * 60 * 1000);

    return this.errors
      .filter((e) => e.timestamp > cutoff && !e.resolved)
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
      .slice(0, limit);
  }

  /**
   * Get error statistics
   */
  getStats() {
    const critical = this.errors.filter((e) => e.severity === "critical")
      .length;
    const high = this.errors.filter((e) => e.severity === "high").length;
    const medium = this.errors.filter((e) => e.severity === "medium").length;
    const low = this.errors.filter((e) => e.severity === "low").length;
    const resolved = this.errors.filter((e) => e.resolved).length;
    const unresolved = this.errors.filter((e) => !e.resolved).length;

    return {
      total: this.errors.length,
      critical,
      high,
      medium,
      low,
      resolved,
      unresolved,
      groupCount: this.errorGroups.size,
      resolutionRate: this.errors.length > 0
        ? ((resolved / this.errors.length) * 100).toFixed(2)
        : "0",
    };
  }

  /**
   * Get error dashboard data
   */
  getDashboardData() {
    const stats = this.getStats();
    const recentErrors = this.getRecentErrors(60, 10);
    const topGroups = this.getErrorGroups(10);
    const criticalErrors = this.getErrorsBySeverity("critical", 5);

    return {
      stats,
      recentErrors,
      topGroups,
      criticalErrors,
      timestamp: new Date(),
    };
  }

  /**
   * Clear resolved errors older than n days
   */
  clearResolvedErrors(daysOld: number = 7): number {
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - daysOld);

    const beforeCount = this.errors.length;
    this.errors = this.errors.filter(
      (e) => !(e.resolved && e.timestamp < cutoff)
    );

    return beforeCount - this.errors.length;
  }

  /**
   * Clear all errors
   */
  clearAll(): void {
    this.errors = [];
    this.errorGroups.clear();
    console.log("[ERROR TRACKER] All errors cleared");
  }

  /**
   * Export errors for analysis
   */
  exportErrors(format: "json" | "csv" = "json") {
    if (format === "json") {
      return {
        exported: new Date(),
        errorCount: this.errors.length,
        groupCount: this.errorGroups.size,
        errors: this.errors,
        groups: Array.from(this.errorGroups.values()),
      };
    } else {
      // CSV format
      let csv = "ID,Message,Context,Severity,Timestamp,Resolved\n";
      this.errors.forEach((e) => {
        csv += `"${e.id}","${e.message}","${e.context}","${e.severity}","${e.timestamp.toISOString()}","${e.resolved}"\n`;
      });
      return csv;
    }
  }
}

export default ErrorTracker;
