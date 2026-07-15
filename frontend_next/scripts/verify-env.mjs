#!/usr/bin/env node
/**
 * Runtime environment verification script for Step 3
 * Checks that required environment variables are loaded without exposing secrets
 */

import { config } from "dotenv";
import { fileURLToPath } from "url";
import { dirname, join } from "path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load .env from project root
config({ path: join(__dirname, "..", ".env") });

let hasErrors = false;

console.log("🔍 Verifying environment variables...\n");

// Check DATABASE_URL
if (!process.env.DATABASE_URL) {
  console.error("❌ DATABASE_URL is not set");
  hasErrors = true;
} else if (!process.env.DATABASE_URL.startsWith("postgresql://")) {
  console.error(
    "❌ DATABASE_URL does not appear to be a PostgreSQL connection string"
  );
  hasErrors = true;
} else {
  console.log("✅ DATABASE_URL is set and appears valid");
}

// Check AUTH_SECRET
if (!process.env.AUTH_SECRET) {
  console.error("❌ AUTH_SECRET is not set");
  hasErrors = true;
} else if (process.env.AUTH_SECRET.length < 32) {
  console.error(
    "❌ AUTH_SECRET is too short (should be at least 32 characters)"
  );
  hasErrors = true;
} else {
  console.log("✅ AUTH_SECRET is set with sufficient length");
}

// Check NEXTAUTH_URL (optional for development, required for production)
if (!process.env.NEXTAUTH_URL) {
  console.warn(
    "⚠️  NEXTAUTH_URL is not set (optional for development, required for production)"
  );
  console.warn("   Set to: http://localhost:3000 for development");
} else {
  console.log("✅ NEXTAUTH_URL is set");
}

console.log("");

if (hasErrors) {
  console.error("❌ Environment verification FAILED");
  process.exit(1);
} else {
  console.log("✅ All environment variables are properly configured");
  process.exit(0);
}
