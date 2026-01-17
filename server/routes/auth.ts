import type { Express } from "express";
import { setupAuth, registerAuthRoutes } from "../replit_integrations/auth";

/**
 * Auth Routes Module
 * Handles user authentication endpoints
 */
export async function registerAuthModuleRoutes(app: Express): Promise<void> {
  // Setup authentication
  await setupAuth(app);
  registerAuthRoutes(app);
}
