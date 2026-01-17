import type { RequestHandler } from "express";
import { db } from "../db";
import { sessions } from "@shared/schema";
import { eq } from "drizzle-orm";

/**
 * Session Invalidation Service
 * Provides methods for managing session lifecycle and invalidation
 */

/**
 * Invalidate a specific session
 */
export async function invalidateSession(sessionId: string): Promise<void> {
  try {
    await db.delete(sessions).where(eq(sessions.sid, sessionId));
    console.log(`[AUDIT] Session invalidated: ${sessionId}`);
  } catch (error) {
    console.error("Error invalidating session:", error);
    throw error;
  }
}

/**
 * Invalidate all sessions for a user
 */
export async function invalidateUserSessions(userId: string): Promise<void> {
  try {
    // The sessions table stores serialized passport user object
    // We need to delete all sessions for this user
    // Note: sessions table stores data as JSON, so we need to be careful with queries
    const allSessions = await db.select().from(sessions);
    
    const sessionsToDelete = allSessions.filter((session: any) => {
      try {
        const data = JSON.parse(session.sess);
        return data?.passport?.user?.claims?.sub === userId;
      } catch {
        return false;
      }
    });

    for (const session of sessionsToDelete) {
      await db.delete(sessions).where(eq(sessions.sid, session.sid));
    }

    console.log(
      `[AUDIT] Invalidated ${sessionsToDelete.length} sessions for user: ${userId}`
    );
  } catch (error) {
    console.error("Error invalidating user sessions:", error);
    throw error;
  }
}

/**
 * Clear expired sessions (cleanup task)
 */
export async function clearExpiredSessions(): Promise<number> {
  try {
    // Get all sessions
    const allSessions = await db.select().from(sessions);
    
    // Filter expired sessions
    const now = new Date();
    const expiredSessions = allSessions.filter(
      (session: any) => session.expire < now
    );

    // Delete expired sessions
    for (const session of expiredSessions) {
      await db.delete(sessions).where(eq(sessions.sid, session.sid));
    }

    if (expiredSessions.length > 0) {
      console.log(`[MAINTENANCE] Cleared ${expiredSessions.length} expired sessions`);
    }

    return expiredSessions.length;
  } catch (error) {
    console.error("Error clearing expired sessions:", error);
    throw error;
  }
}

/**
 * Middleware for enhanced logout with session cleanup
 */
export const logoutMiddleware: RequestHandler = async (req, res) => {
  try {
    const userId = (req.user as any)?.claims?.sub;

    if (userId) {
      // Invalidate all sessions for this user
      await invalidateUserSessions(userId);
      console.log(`[AUDIT] User logout: ${userId}`);
    }

    // Also destroy the current session
    req.logout((err) => {
      if (err) {
        console.error("Error during logout:", err);
        return res.status(500).json({ message: "Failed to logout" });
      }

      // Clear session cookie
      res.clearCookie("connect.sid");
      
      res.json({ message: "Logged out successfully" });
    });
  } catch (error) {
    console.error("Error in logout middleware:", error);
    res.status(500).json({ message: "Failed to logout" });
  }
};

/**
 * Middleware to refresh session on each request
 * This helps keep active sessions alive while invalidating idle ones
 */
export const refreshSessionMiddleware: RequestHandler = (req, res, next) => {
  if (req.user) {
    // Regenerate session to update the session timestamp
    req.session.touch();
  }
  next();
};

/**
 * Initialize session cleanup task
 * Runs every hour to clear expired sessions
 */
export function initSessionCleanup(): void {
  const CLEANUP_INTERVAL = 60 * 60 * 1000; // 1 hour

  setInterval(async () => {
    try {
      await clearExpiredSessions();
    } catch (error) {
      console.error("Session cleanup task failed:", error);
    }
  }, CLEANUP_INTERVAL);

  console.log("Session cleanup task initialized");
}
