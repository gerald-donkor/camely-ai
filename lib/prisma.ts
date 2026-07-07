import { PrismaPg } from "@prisma/adapter-pg"

import { PrismaClient } from "@/app/generated/prisma/client"

// Preserve one Prisma client across Next.js development hot reloads.
const globalForPrisma = globalThis as unknown as {
  prisma: ReturnType<typeof createPrismaClient> | undefined
}

function getDatabaseUrl() {
  const databaseUrl = process.env.DATABASE_URL

  if (!databaseUrl) {
    throw new Error("DATABASE_URL is not configured")
  }

  return databaseUrl
}

function createPrismaClient() {
  // Prisma 7 connects to PostgreSQL through its driver adapter. Keep the
  // adapter scoped to the client instance so hot reloads do not mix a cached
  // Prisma client with a separately recreated adapter/pool.
  const adapter = new PrismaPg(
    { connectionString: getDatabaseUrl() },
    {
      onPoolError(error) {
        console.warn("Prisma PostgreSQL pool error", error.message)
      },
      onConnectionError(error) {
        console.warn("Prisma PostgreSQL connection error", error.message)
      },
    },
  )

  return new PrismaClient({
    adapter,
  })
}

export const prisma = globalForPrisma.prisma ?? createPrismaClient()

// Production processes create their own client; development reuses this one.
if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma
}

function getErrorDetails(error: unknown) {
  if (!error || typeof error !== "object") {
    return { code: "", message: "" }
  }

  const candidate = error as {
    cause?: unknown
    code?: unknown
    message?: unknown
  }
  const cause =
    candidate.cause && typeof candidate.cause === "object"
      ? (candidate.cause as { code?: unknown; message?: unknown })
      : null

  return {
    code:
      typeof candidate.code === "string"
        ? candidate.code
        : typeof cause?.code === "string"
          ? cause.code
          : "",
    message: [
      typeof candidate.message === "string" ? candidate.message : "",
      typeof cause?.message === "string" ? cause.message : "",
    ]
      .join(" ")
      .toLowerCase(),
  }
}

function isClosedConnectionError(error: unknown) {
  const { code, message } = getErrorDetails(error)

  return (
    code === "P1017" ||
    code === "ECONNRESET" ||
    code === "EPIPE" ||
    message.includes("server has closed the connection") ||
    message.includes("connection terminated unexpectedly") ||
    message.includes("connection ended unexpectedly")
  )
}

export async function withPrismaConnectionRetry<T>(
  operation: () => Promise<T>,
): Promise<T> {
  try {
    return await operation()
  } catch (error) {
    if (!isClosedConnectionError(error)) {
      throw error
    }

    console.warn("Retrying Prisma query after a closed database connection")
    return operation()
  }
}
