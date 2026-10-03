import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

function isCurrentClient(client: PrismaClient | undefined): client is PrismaClient {
  return typeof client?.sealPurchase?.findUnique === "function";
}

function createClient() {
  return new PrismaClient();
}

export const prisma = isCurrentClient(globalForPrisma.prisma)
  ? globalForPrisma.prisma
  : createClient();

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}
