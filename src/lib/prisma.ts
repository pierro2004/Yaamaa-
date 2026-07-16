import { PrismaClient } from "@prisma/client";
import path from "path";
import fs from "fs";

let prismaClient: PrismaClient | null = null;

function getPrismaClient(): PrismaClient {
  if (!prismaClient) {
    // Fix for Prisma Client unable to locate query engine on Vercel
    const isVercel = process.env.VERCEL === "1" || process.env.VERCEL === "true" || process.env.NODE_ENV === "production";
    if (isVercel && !process.env.PRISMA_QUERY_ENGINE_LIBRARY) {
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

    prismaClient = new PrismaClient({
      log: ["error", "warn"],
    });
  }
  return prismaClient;
}

declare global {
  // eslint-disable-next-line no-var
  var prisma: PrismaClient | undefined;
}

// Export a Proxy that lazy-loads and binds Prisma Client properties when accessed
export const prisma = new Proxy({} as PrismaClient, {
  get(target, prop, receiver) {
    // If the global prisma is defined (in non-production), use it, otherwise get/create the client
    const client = globalThis.prisma || getPrismaClient();
    
    // Save to global in development
    if (process.env.NODE_ENV !== "production" && !globalThis.prisma) {
      globalThis.prisma = client;
    }

    const value = Reflect.get(client, prop, receiver);
    if (typeof value === "function") {
      return value.bind(client);
    }
    return value;
  }
});

