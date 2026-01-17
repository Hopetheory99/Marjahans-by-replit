#!/usr/bin/env node

/**
 * Simple static server to preview the Marjahans e-commerce site
 * This serves the built frontend without requiring a database connection
 */

import express from "express";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();
const PORT = process.env.PORT || 5000;

// Serve static files from the dist/public directory
app.use(express.static(path.join(__dirname, "dist", "public")));

// Serve the index.html for all routes (SPA routing)
app.get("*", (req, res) => {
  res.sendFile(path.join(__dirname, "dist", "public", "index.html"));
});

app.listen(PORT, () => {
  console.log(`\n🎉 Marjahans Luxury Jewelry E-Commerce Site`);
  console.log(`📍 Preview running at: http://localhost:${PORT}`);
  console.log(`\n✨ Frontend built and ready to view`);
  console.log(`\n📝 Note: Backend API is not connected (requires database setup)`);
  console.log(`   To use full features, configure PostgreSQL and set DATABASE_URL\n`);
});
