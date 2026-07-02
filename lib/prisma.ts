import { PrismaPg } from "@prisma/adapter-pg"

import { PrismaClient } from "@/app/generated/prisma/client"

// Preserve one Prisma client across Next.js development hot reloads.
const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

// Prisma 7 connects to PostgreSQL through its driver adapter.
const adapter = new PrismaPg({
  connectionString: process.env.DATABASE_URL,
})

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    adapter,
  })

// Production processes create their own client; development reuses this one.
if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma
}
