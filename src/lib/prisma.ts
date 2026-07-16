import { PrismaClient } from "@prisma/client";
import path from "path";
import fs from "fs";

// Fix for Prisma Client unable to locate query engine on Vercel
const isVercel = process.env.VERCEL === "1" || process.env.VERCEL === "true" || process.env.NODE_ENV === "production";
if (isVercel) {
  const possibleEngineDirs = [
    path.join(process.cwd(), "node_modules/.prisma/client"),
    path.join(process.cwd(), "..", "node_modules/.prisma/client"),
    path.join(process.cwd(), "node_modules/@prisma/client"),
    path.join(process.cwd(), "../node_modules/.prisma/client"),
  ];

  let foundEnginePath: string | null = null;
  for (const dir of possibleEngineDirs) {
    if (fs.existsSync(dir)) {
      try {
        const files = fs.readdirSync(dir);
        const engineFile = files.find(f => f.startsWith("libquery_engine-") && f.endsWith(".node"));
        if (engineFile) {
          foundEnginePath = path.join(dir, engineFile);
          break;
        }
      } catch (e) {
        console.error(`[Prisma Setup] Error reading dir ${dir}:`, e);
      }
    }
  }

  if (foundEnginePath) {
    console.log(`[Prisma Setup] Dynamically located query engine: ${foundEnginePath}`);
    process.env.PRISMA_QUERY_ENGINE_LIBRARY = foundEnginePath;
  } else {
    console.warn(`[Prisma Setup] Warning: Could not locate query engine library in candidate dirs:`, possibleEngineDirs);
  }
}

declare global {
  // eslint-disable-next-line no-var
  var prisma: PrismaClient | undefined;
}

export const prisma = globalThis.prisma || new PrismaClient({
  log: ["error", "warn"],
});

if (process.env.NODE_ENV !== "production") {
  globalThis.prisma = prisma;
}
