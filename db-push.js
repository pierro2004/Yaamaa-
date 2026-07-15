import { execSync } from "child_process";

const dbUrl = process.env.DATABASE_URL || "";
const isRealDb = dbUrl && !dbUrl.includes("cool-butterfly-123456") && dbUrl !== "";

if (isRealDb) {
  try {
    console.log("[Database Sync] Real DATABASE_URL detected. Running prisma db push...");
    execSync("npx prisma db push --accept-data-loss", { stdio: "inherit" });
    console.log("[Database Sync] Database schema pushed successfully!");
  } catch (err) {
    console.error("[Database Sync] Warning: Failed to push database schema:", err);
    // Do not crash the build
  }
} else {
  console.log("[Database Sync] No real DATABASE_URL detected. Skipping database schema push.");
}
