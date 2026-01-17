/**
 * Database Migration Management Tools
 * Handles schema versioning, migrations, and rollback functionality
 */

export interface Migration {
  id: string;
  version: string;
  name: string;
  description: string;
  up: () => Promise<void>;
  down: () => Promise<void>;
  timestamp: number;
  applied: boolean;
}

export interface MigrationHistory {
  id: string;
  version: string;
  name: string;
  appliedAt: number;
  appliedBy: string;
  status: "pending" | "applied" | "failed" | "rolled_back";
  duration: number;
  changes: string[];
}

export interface MigrationStats {
  total: number;
  applied: number;
  pending: number;
  failed: number;
  lastApplied: number;
}

/**
 * Database Migration Manager
 */
export class MigrationManager {
  private migrations: Map<string, Migration> = new Map();
  private history: MigrationHistory[] = [];
  private readonly maxMigrations = 1000;

  /**
   * Register a new migration
   */
  registerMigration(migration: Migration): void {
    const key = `${migration.version}-${migration.name}`;
    this.migrations.set(key, migration);
  }

  /**
   * Create a new migration file
   */
  createMigration(name: string, description: string): Migration {
    const timestamp = Date.now();
    const version = new Date(timestamp).toISOString().split("T")[0].replace(/-/g, "");
    const id = `${version}-${Math.random().toString(36).substr(2, 9)}`;

    const migration: Migration = {
      id,
      version,
      name,
      description,
      up: async () => {
        console.log(`Running up migration: ${name}`);
      },
      down: async () => {
        console.log(`Running down migration: ${name}`);
      },
      timestamp,
      applied: false,
    };

    this.registerMigration(migration);
    return migration;
  }

  /**
   * Apply pending migrations
   */
  async applyMigrations(): Promise<MigrationHistory[]> {
    const applied: MigrationHistory[] = [];

    const migrationArray = Array.from(this.migrations.values());
    for (const migration of migrationArray) {
      if (!migration.applied) {
        const startTime = Date.now();
        try {
          await migration.up();
          const duration = Date.now() - startTime;

          const record: MigrationHistory = {
            id: migration.id,
            version: migration.version,
            name: migration.name,
            appliedAt: startTime,
            appliedBy: "system",
            status: "applied",
            duration,
            changes: ["schema_created", "indexes_added"],
          };

          this.history.push(record);
          migration.applied = true;
          applied.push(record);

          // Implement history limit
          if (this.history.length > this.maxMigrations) {
            this.history.shift();
          }
        } catch (error) {
          const record: MigrationHistory = {
            id: migration.id,
            version: migration.version,
            name: migration.name,
            appliedAt: Date.now(),
            appliedBy: "system",
            status: "failed",
            duration: Date.now() - startTime,
            changes: [],
          };
          this.history.push(record);
        }
      }
    }

    return applied;
  }

  /**
   * Rollback the last migration
   */
  async rollbackLast(): Promise<MigrationHistory | null> {
    if (this.history.length === 0) {
      return null;
    }

    const lastApplied = this.history.filter((h) => h.status === "applied").pop();
    if (!lastApplied) {
      return null;
    }

    const key = Array.from(this.migrations.keys()).find((k) => {
      const m = this.migrations.get(k)!;
      return m.id === lastApplied.id;
    });

    if (!key) {
      return null;
    }

    const migration = this.migrations.get(key)!;
    const startTime = Date.now();

    try {
      await migration.down();
      const duration = Date.now() - startTime;

      const record: MigrationHistory = {
        id: migration.id,
        version: migration.version,
        name: migration.name,
        appliedAt: startTime,
        appliedBy: "system",
        status: "rolled_back",
        duration,
        changes: [],
      };

      this.history.push(record);
      migration.applied = false;

      return record;
    } catch (error) {
      const record: MigrationHistory = {
        id: migration.id,
        version: migration.version,
        name: migration.name,
        appliedAt: Date.now(),
        appliedBy: "system",
        status: "failed",
        duration: Date.now() - startTime,
        changes: [],
      };
      this.history.push(record);
      return record;
    }
  }

  /**
   * Get migration status
   */
  getStatus(): MigrationStats {
    const applied = Array.from(this.migrations.values()).filter((m) => m.applied).length;
    const total = this.migrations.size;

    const appliedHistory = this.history.filter((h) => h.status === "applied");
    const lastApplied =
      appliedHistory.length > 0
        ? Math.max(...appliedHistory.map((h) => h.appliedAt))
        : 0;

    return {
      total,
      applied,
      pending: total - applied,
      failed: this.history.filter((h) => h.status === "failed").length,
      lastApplied,
    };
  }

  /**
   * Get migration history
   */
  getHistory(limit: number = 100): MigrationHistory[] {
    return this.history.slice(-limit).reverse();
  }

  /**
   * Get list of all migrations
   */
  listMigrations(): Array<{ version: string; name: string; applied: boolean }> {
    return Array.from(this.migrations.values())
      .sort((a, b) => a.timestamp - b.timestamp)
      .map((m) => ({
        version: m.version,
        name: m.name,
        applied: m.applied,
      }));
  }

  /**
   * Generate schema migration SQL
   */
  generateMigrationSQL(tableName: string, fields: Record<string, string>): string {
    let sql = `CREATE TABLE IF NOT EXISTS ${tableName} (\n`;
    sql += `  id SERIAL PRIMARY KEY,\n`;

    const fieldLines = Object.entries(fields).map(([name, type]) => `  ${name} ${type}`);
    sql += fieldLines.join(",\n");

    sql += `,\n  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,\n`;
    sql += `  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP\n`;
    sql += `);`;

    return sql;
  }

  /**
   * Validate migration consistency
   */
  validateMigrations(): {
    valid: boolean;
    errors: string[];
    warnings: string[];
  } {
    const errors: string[] = [];
    const warnings: string[] = [];

    // Check for duplicate versions
    const versions = new Set<string>();
    Array.from(this.migrations.values()).forEach((m) => {
      if (versions.has(m.version)) {
        errors.push(`Duplicate migration version: ${m.version}`);
      }
      versions.add(m.version);
    });

    // Check for broken order
    const sortedMigrations = Array.from(this.migrations.values()).sort(
      (a, b) => a.timestamp - b.timestamp
    );

    sortedMigrations.forEach((m, i) => {
      if (i > 0) {
        const prev = sortedMigrations[i - 1];
        const diff = m.timestamp - prev.timestamp;
        if (diff > 24 * 60 * 60 * 1000) {
          warnings.push(
            `Large gap between ${prev.name} and ${m.name}: ${(diff / (60 * 60 * 1000)).toFixed(1)} hours`
          );
        }
      }
    });

    return {
      valid: errors.length === 0,
      errors,
      warnings,
    };
  }

  /**
   * Export migration history as JSON
   */
  exportHistory(): string {
    return JSON.stringify(
      {
        exported: new Date(),
        stats: this.getStatus(),
        history: this.getHistory(),
      },
      null,
      2
    );
  }

  /**
   * Clear all migration history (for testing only)
   */
  clearHistory(): number {
    const count = this.history.length;
    this.history = [];
    return count;
  }

  /**
   * Get migration details
   */
  getMigrationDetails(id: string): Migration | null {
    const migrations = Array.from(this.migrations.values());
    for (const migration of migrations) {
      if (migration.id === id) {
        return migration;
      }
    }
    return null;
  }

  /**
   * Check if migration needs execution
   */
  needsExecution(): boolean {
    return Array.from(this.migrations.values()).some((m) => !m.applied);
  }

  /**
   * Get failed migrations
   */
  getFailedMigrations(): MigrationHistory[] {
    return this.history.filter((h) => h.status === "failed");
  }
}

// Export singleton instance
export const migrationManager = new MigrationManager();
