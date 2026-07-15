import { PrismaPg } from "@prisma/adapter-pg"

import { PrismaClient } from "@/app/generated/prisma/client"

// Preserve one Prisma client across Next.js development hot reloads.
const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
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

const prismaInstance = globalForPrisma.prisma ?? createPrismaClient()

// Production processes create their own client; development reuses this one.
if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prismaInstance
}

// Export a self-healing proxy to handle hot-reloads when models are dynamically added to the schema.
export const prisma = new Proxy({} as PrismaClient, {
  get(_, prop) {
    let current = globalForPrisma.prisma

    if (!current) {
      current = createPrismaClient()
      if (process.env.NODE_ENV !== "production") {
        globalForPrisma.prisma = current
      }
    }

    // Self-healing check: if the code accesses "projectSpec" but the cached database client
    // doesn't have it initialized yet, recreate the Prisma client to reload schemas.
    if (prop === "projectSpec" && !("projectSpec" in current)) {
      console.warn(
        "Recreating cached PrismaClient instance because 'projectSpec' model metadata is missing.",
      )
      current = createPrismaClient()
      globalForPrisma.prisma = current
    }

    const value = Reflect.get(current, prop)
    if (typeof value === "function") {
      return value.bind(current)
    }
    return value
  },
})

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
    message.includes("connection ended unexpectedly") ||
    message.includes("failed to connect to upstream database")
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
