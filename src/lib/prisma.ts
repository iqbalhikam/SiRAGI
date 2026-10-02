/**
 * lib/prisma.ts
 * Singleton Prisma Client untuk Next.js
 *
 * Pattern ini mencegah multiple instance di hot-reload development.
 * Di production, setiap Lambda/Edge invocation mendapatkan instance baru.
 */

import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log:
      process.env.NODE_ENV === "development"
        ? ["query", "error", "warn"]
        : ["error"],
  });

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}
