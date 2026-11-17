import { neon } from "@neondatabase/serverless";

/**
 * Neon's HTTP driver - no connection pool to manage, which suits Vercel's
 * serverless functions. DATABASE_URL comes from the Neon integration.
 */
if (!process.env.DATABASE_URL) {
  // Surfaced at import time rather than as a confusing query error later.
  console.error("DATABASE_URL is not set - Northstar cannot authorise anyone.");
}

export const sql = neon(process.env.DATABASE_URL ?? "");
